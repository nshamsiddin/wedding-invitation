import dotenv from 'dotenv';
import logger from './lib/logger.js';
// Do NOT use override:true — PM2-injected environment variables (set via env_file
// and env_production in ecosystem.config.cjs) are the canonical source of truth
// in production. override:true would silently let .env edits win over the
// deployment pipeline, which is both surprising and a security risk on a
// compromised host. dotenv.config() without override only fills in vars that
// are not already set, which is the correct behaviour for every environment.
dotenv.config();
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { db, sqlite } from './db/index.js';
import { sql } from 'drizzle-orm';
import rsvpRouter from './routes/rsvp.js';
import adminRouter from './routes/admin.js';
import eventsRouter from './routes/events.js';
import notificationsRouter from './routes/notifications.js';
import { clearRateLimitStore } from './middleware/rateLimit.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Environment validation ───────────────────────────────────────────────────
// Fail fast at startup if any required variable is missing.
// Never use hardcoded fallbacks for secrets (JWT_SECRET, ADMIN_PASSWORD, etc.).
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'NODE_ENV'] as const;
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    logger.fatal({ missingVar: key }, '[startup] Missing required environment variable');
    process.exit(1);
  }
}

// BASE_URL is required in production to construct valid invitation links.
if (process.env.NODE_ENV === 'production' && !process.env.BASE_URL) {
  logger.fatal('[startup] BASE_URL is required in production (e.g. https://wedding.example.com)');
  process.exit(1);
}

// Validate BASE_URL is a well-formed URL so misconfiguration surfaces at startup
// rather than silently producing malformed invite links sent to guests.
if (process.env.BASE_URL) {
  try {
    new URL(process.env.BASE_URL);
  } catch {
    logger.fatal({ baseUrl: process.env.BASE_URL }, '[startup] BASE_URL is not a valid URL');
    process.exit(1);
  }
}

// ─── Weak credential guard (production only) ──────────────────────────────────
// In production, refuse to start if secrets are still set to the well-known
// default values shipped in .env.example — a common misconfiguration.
// Dev environments are intentionally exempt so local development is not disrupted.
if (process.env.NODE_ENV === 'production') {
  const KNOWN_WEAK_SECRETS = new Set([
    'your-super-secret-key-change-in-production',
    'changeme',
    'password',
    'secret',
  ]);
  if (KNOWN_WEAK_SECRETS.has(process.env.JWT_SECRET!)) {
    logger.fatal('[startup] JWT_SECRET must not use the default example value — generate a strong random secret');
    process.exit(1);
  }
  if (KNOWN_WEAK_SECRETS.has(process.env.ADMIN_PASSWORD!)) {
    logger.fatal('[startup] ADMIN_PASSWORD must not use the default example value — set a strong bcrypt hash');
    process.exit(1);
  }
  if (!process.env.ADMIN_PASSWORD!.startsWith('$2b$')) {
    logger.fatal('[startup] ADMIN_PASSWORD must be a bcrypt hash in production (prefix $2b$)');
    process.exit(1);
  }
}

// ─── DATABASE_PATH guard ──────────────────────────────────────────────────────
// In production, a missing DATABASE_PATH would silently place guests.db in
// whatever the current working directory happens to be, which changes between
// deployments and leads to data loss.  Fail fast here rather than discover the
// problem after guests have already RSVP'd.
if (!process.env['DATABASE_PATH']) {
  if (process.env.NODE_ENV === 'production') {
    logger.fatal('[startup] DATABASE_PATH must be set to an absolute path in production (e.g. /opt/invitation/data/guests.db)');
    process.exit(1);
  } else {
    logger.warn('[startup] DATABASE_PATH is not set — using fallback ./guests.db relative to cwd. Set DATABASE_PATH to suppress this warning.');
  }
}

const app = express();

// Trust the immediately upstream reverse proxy (Nginx) so that req.ip is
// resolved from X-Forwarded-For rather than the proxy's loopback address.
// Without this, all clients appear as the same IP and IP-based rate limiting
// is broken. Set to 1 because there is exactly one trusted proxy in front.
app.set('trust proxy', 1);

const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const isDev = process.env.NODE_ENV !== 'production';

// ─── Security headers ─────────────────────────────────────────────────────────
// Helmet sets sensible security headers: HSTS, X-Content-Type-Options,
// X-Frame-Options, Referrer-Policy, etc.
// CSP is configured to allowlist Google Maps (used for the embedded venue iframe).
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Vite's production build emits only external <script type="module"> tags —
        // no inline scripts. 'unsafe-inline' is therefore NOT required in production
        // and is intentionally omitted to preserve XSS protection.
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: ["'self'", 'data:', 'https:'],
        // Google Maps embed requires frame-src and connect-src allowlisting.
        // fonts.googleapis.com is needed so html-to-image can fetch and inline
        // the Google Fonts CSS when generating downloadable invitation cards.
        frameSrc: ["'self'", 'https://maps.google.com', 'https://www.google.com'],
        connectSrc: ["'self'", 'https://maps.googleapis.com', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
        fontSrc: ["'self'", 'https://fonts.gstatic.com', 'https:', 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        // upgradeInsecureRequests is intentionally omitted — it would force the
        // browser to load all sub-resources over HTTPS, which breaks the app
        // when running on plain HTTP (no TLS certificate configured yet).
        upgradeInsecureRequests: null,
      },
    },
    // HSTS intentionally disabled — only safe to enable once HTTPS/TLS is
    // configured; enabling it over plain HTTP permanently breaks the domain.
    strictTransportSecurity: false,
  })
);

// ─── Schema creation (fresh installs) ────────────────────────────────────────

db.run(sql`
  CREATE TABLE IF NOT EXISTS events (
    id            INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    slug          TEXT NOT NULL UNIQUE,
    name          TEXT NOT NULL,
    date          TEXT NOT NULL,
    time          TEXT NOT NULL,
    venue_name    TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    dress_code    TEXT,
    maps_url      TEXT
  )
`);

db.run(sql`
  CREATE TABLE IF NOT EXISTS guests (
    id           INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name         TEXT NOT NULL,
    email        TEXT UNIQUE,
    phone        TEXT,
    partner_name TEXT,
    created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`);

// guest_invitations: guest_id is nullable to support open (generic) invitation links.
db.run(sql`
  CREATE TABLE IF NOT EXISTS guest_invitations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    guest_id    INTEGER REFERENCES guests(id) ON DELETE CASCADE,
    event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    status      TEXT NOT NULL DEFAULT 'pending'
                CHECK(status IN ('attending','declined','maybe','pending')),
    guest_count INTEGER NOT NULL DEFAULT 1,
    dietary         TEXT,
    message         TEXT,
    partner_dietary TEXT,
    source      TEXT NOT NULL DEFAULT 'admin',
    is_open         INTEGER NOT NULL DEFAULT 0,
    is_public       INTEGER NOT NULL DEFAULT 0,
    claimed_at  TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(guest_id, event_id)
  )
`);

db.run(sql`
  CREATE TABLE IF NOT EXISTS notifications (
    id            INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    type          TEXT NOT NULL CHECK(type IN ('rsvp_new', 'rsvp_updated')),
    guest_name    TEXT NOT NULL,
    event_slug    TEXT NOT NULL,
    event_name    TEXT NOT NULL,
    status        TEXT NOT NULL,
    guest_count   INTEGER NOT NULL DEFAULT 1,
    message       TEXT,
    invitation_id INTEGER NOT NULL,
    guest_id      INTEGER,
    is_read       INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`);

sqlite.prepare(
  'CREATE INDEX IF NOT EXISTS notif_is_read_idx ON notifications (is_read)'
).run();

// ─── Schema migration (existing installs) ────────────────────────────────────

(function migrateGuestInvitations() {
  type ColInfo = { name: string; notnull: number };
  const cols = sqlite.prepare('PRAGMA table_info(guest_invitations)').all() as ColInfo[];

  if (cols.length === 0) return; // Table was just created above — already has correct schema

  const guestIdCol = cols.find((c) => c.name === 'guest_id');
  const hasIsOpen   = cols.some((c) => c.name === 'is_open');
  const hasClaimedAt = cols.some((c) => c.name === 'claimed_at');

  if (guestIdCol && guestIdCol.notnull === 1) {
    // Old schema: guest_id is NOT NULL — recreate table to allow NULL (open invitations).
    // The DROP + RENAME sequence is wrapped in a transaction so a crash between
    // those two steps cannot leave the database without a guest_invitations table.
    logger.info('[migration] Recreating guest_invitations with nullable guest_id…');
    sqlite.pragma('foreign_keys = OFF');
    sqlite.transaction(() => {
      sqlite.prepare(`
        CREATE TABLE IF NOT EXISTS guest_invitations_v2 (
          id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
          guest_id    INTEGER REFERENCES guests(id) ON DELETE CASCADE,
          event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
          token       TEXT NOT NULL UNIQUE,
          status      TEXT NOT NULL DEFAULT 'pending'
                      CHECK(status IN ('attending','declined','maybe','pending')),
          guest_count INTEGER NOT NULL DEFAULT 1,
          dietary     TEXT,
          message     TEXT,
          is_open     INTEGER NOT NULL DEFAULT 0,
          claimed_at  TEXT,
          created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
          UNIQUE(guest_id, event_id)
        )
      `).run();
      sqlite.prepare(`
        INSERT INTO guest_invitations_v2
          (id, guest_id, event_id, token, status, guest_count, dietary, message,
           is_open, claimed_at, created_at, updated_at)
        SELECT id, guest_id, event_id, token, status, guest_count, dietary, message,
               0, NULL, created_at, updated_at
        FROM guest_invitations
      `).run();
      sqlite.prepare('DROP TABLE guest_invitations').run();
      sqlite.prepare('ALTER TABLE guest_invitations_v2 RENAME TO guest_invitations').run();
    })();
    sqlite.pragma('foreign_keys = ON');
    logger.info('[migration] guest_invitations migration complete.');
  } else {
    // Table exists with nullable guest_id — just add any missing columns
    if (!hasIsOpen) {
      logger.info('[migration] Adding is_open column to guest_invitations…');
      sqlite.prepare('ALTER TABLE guest_invitations ADD COLUMN is_open INTEGER NOT NULL DEFAULT 0').run();
    }
    if (!hasClaimedAt) {
      logger.info('[migration] Adding claimed_at column to guest_invitations…');
      sqlite.prepare('ALTER TABLE guest_invitations ADD COLUMN claimed_at TEXT').run();
    }
    const hasPartnerDietary = cols.some((c) => c.name === 'partner_dietary');
    if (!hasPartnerDietary) {
      logger.info('[migration] Adding partner_dietary column to guest_invitations…');
      sqlite.prepare('ALTER TABLE guest_invitations ADD COLUMN partner_dietary TEXT').run();
    }
  }
})();

(function migrateGuestsPartnerName() {
  type ColInfo = { name: string };
  const cols = sqlite.prepare('PRAGMA table_info(guests)').all() as ColInfo[];
  if (cols.length === 0) return; // Table was just created — already has correct schema
  if (!cols.some((c) => c.name === 'partner_name')) {
    logger.info('[migration] Adding partner_name column to guests…');
    sqlite.prepare('ALTER TABLE guests ADD COLUMN partner_name TEXT').run();
  }
})();

// Drop email column from guests (table recreation — SQLite cannot drop UNIQUE columns directly)
(function migrateGuestsEmailNullable() {
  type ColInfo = { name: string; notnull: number };
  const cols = sqlite.prepare('PRAGMA table_info(guests)').all() as ColInfo[];
  if (cols.length === 0) return; // Just created above — already nullable
  const emailCol = cols.find((c) => c.name === 'email');
  if (!emailCol || emailCol.notnull === 0) return; // Already nullable
  logger.info('[migration] Recreating guests table to make email nullable…');
  sqlite.pragma('foreign_keys = OFF');
  // Wrapped in a transaction: a crash between DROP TABLE and RENAME TO would
  // otherwise leave the database without a guests table.
  sqlite.transaction(() => {
    sqlite.prepare(`
      CREATE TABLE IF NOT EXISTS guests_v2 (
        id           INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        name         TEXT NOT NULL,
        email        TEXT UNIQUE,
        phone        TEXT,
        partner_name TEXT,
        created_at   TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )
    `).run();
    sqlite.prepare(`
      INSERT INTO guests_v2 (id, name, email, phone, partner_name, created_at)
      SELECT id, name, email, phone, partner_name, created_at FROM guests
    `).run();
    sqlite.prepare('DROP TABLE guests').run();
    sqlite.prepare('ALTER TABLE guests_v2 RENAME TO guests').run();
  })();
  sqlite.pragma('foreign_keys = ON');
  logger.info('[migration] guests email-nullable migration complete.');
})();

(function migrateGuestInvitationsIsPublic() {
  type ColInfo = { name: string };
  const cols = sqlite.prepare('PRAGMA table_info(guest_invitations)').all() as ColInfo[];
  if (cols.length === 0) return; // Just created above
  if (!cols.some((c) => c.name === 'is_public')) {
    logger.info('[migration] Adding is_public column to guest_invitations…');
    sqlite.prepare('ALTER TABLE guest_invitations ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0').run();
  }
})();

// Add source column to track whether an invitation was created by an admin or by
// the public RSVP flow. This prevents public submissions from overwriting admin-curated rows.
(function migrateGuestInvitationsSource() {
  type ColInfo = { name: string };
  const cols = sqlite.prepare('PRAGMA table_info(guest_invitations)').all() as ColInfo[];
  if (cols.length === 0) return; // Just created above — already has the column
  if (!cols.some((c) => c.name === 'source')) {
    logger.info('[migration] Adding source column to guest_invitations…');
    sqlite.prepare("ALTER TABLE guest_invitations ADD COLUMN source TEXT NOT NULL DEFAULT 'admin'").run();
  }
  if (!cols.some((c) => c.name === 'table_number')) {
    logger.info('[migration] Adding table_number column to guest_invitations…');
    sqlite.prepare('ALTER TABLE guest_invitations ADD COLUMN table_number INTEGER').run();
  }
})();

// Add language column to store the invitation's predefined display language.
(function migrateGuestInvitationsLanguage() {
  type ColInfo = { name: string };
  const cols = sqlite.prepare('PRAGMA table_info(guest_invitations)').all() as ColInfo[];
  if (cols.length === 0) return; // Just created above — already has the column
  if (!cols.some((c) => c.name === 'language')) {
    logger.info('[migration] Adding language column to guest_invitations…');
    sqlite.prepare("ALTER TABLE guest_invitations ADD COLUMN language TEXT NOT NULL DEFAULT 'en'").run();
  }
})();

// Drop email column from guests (table recreation — SQLite cannot drop UNIQUE columns directly)
(function migrateRemoveEmail() {
  const cols = sqlite.prepare('PRAGMA table_info(guests)').all() as { name: string }[];
  if (!cols.some((c) => c.name === 'email')) return;
  logger.info('[migration] Removing email column from guests…');
  sqlite.transaction(() => {
    sqlite.prepare(`
      CREATE TABLE guests_new (
        id          INTEGER PRIMARY KEY AUTOINCREMENT,
        name        TEXT NOT NULL,
        phone       TEXT,
        partner_name TEXT,
        created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      )
    `).run();
    sqlite.prepare(
      'INSERT INTO guests_new (id, name, phone, partner_name, created_at) SELECT id, name, phone, partner_name, created_at FROM guests'
    ).run();
    sqlite.prepare('DROP TABLE guests').run();
    sqlite.prepare('ALTER TABLE guests_new RENAME TO guests').run();
  })();
})();

// ─── Performance indexes ──────────────────────────────────────────────────────
// SQLite does NOT auto-create indexes for foreign key columns.
// These CREATE INDEX IF NOT EXISTS statements are idempotent and safe to run on
// every startup. They cover the most frequent admin query patterns:
//   - per-event invitation listing / stats (event_id)
//   - status-based guest filtering (status)
//   - guest lookup by phone for public RSVP deduplication (phone)

sqlite.prepare(
  'CREATE INDEX IF NOT EXISTS inv_event_id_idx ON guest_invitations (event_id)'
).run();

sqlite.prepare(
  'CREATE INDEX IF NOT EXISTS inv_status_idx ON guest_invitations (status)'
).run();

sqlite.prepare(
  'CREATE INDEX IF NOT EXISTS guests_phone_idx ON guests (phone)'
).run();

// ─── Seed wedding events ─────────────────────────────────────────────────────

db.run(sql`
  INSERT INTO events (slug, name, date, time, venue_name, venue_address, dress_code, maps_url)
  VALUES
    ('tashkent', 'Berfin & Shamsiddin — Toshkent', '2026-04-24', '18:00',
     'Ofarin Restaurant', 'Toshkent, O''zbekiston',
     'Rasmiy Kiyim',
     'https://maps.google.com/maps?q=Ofarin+Restaurant+Tashkent+Uzbekistan&output=embed'),
    ('ankara', 'Berfin & Shamsiddin — Ankara', '2026-05-19', '18:30',
     'Park L''Amore', 'İncek, Turgut Özal Blv. No:48, 06830 Gölbaşı/Ankara, Türkiye',
     'Resmi Kıyafet',
     'https://maps.google.com/maps?q=Turgut+Ozal+Bulvari+No+48+Incek+Golbasi+Ankara+Turkey&output=embed')
  ON CONFLICT(slug) DO UPDATE SET
    name          = excluded.name,
    date          = excluded.date,
    time          = excluded.time,
    venue_name    = excluded.venue_name,
    venue_address = excluded.venue_address,
    dress_code    = excluded.dress_code,
    maps_url      = excluded.maps_url
`);

// ─── Middleware ───────────────────────────────────────────────────────────────

app.use(compression());
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: isDev ? 'http://localhost:5173' : false,
    credentials: true,
  })
);

// ─── Public config ────────────────────────────────────────────────────────────
// Exposes the BASE_URL so the admin panel can construct shareable link cards
// without embedding the URL in the client bundle at build time.
app.get('/api/config', (_req: Request, res: Response) => {
  res.json({ baseUrl: process.env['BASE_URL'] ?? '' });
});

// ─── Health check ─────────────────────────────────────────────────────────────
// Used by load balancers and uptime monitors; no auth required.
// Returns { status, db, timestamp } so monitors can distinguish between an API
// process that is up but whose DB connection has failed (status: 'degraded').
app.get('/api/health', (_req: Request, res: Response) => {
  try {
    sqlite.prepare('SELECT 1').get();
    res.json({ status: 'ok', db: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    logger.error({ err }, '[health] Database ping failed');
    res.status(503).json({ status: 'degraded', db: 'error', timestamp: new Date().toISOString() });
  }
});

// ─── API routes ───────────────────────────────────────────────────────────────

app.use('/api/events', eventsRouter);
app.use('/api/rsvp', rsvpRouter);
app.use('/api/admin', adminRouter);
app.use('/api/admin/notifications', notificationsRouter);

// ─── Static files (production) ────────────────────────────────────────────────

// Escapes special HTML characters for safe injection into attribute values.
function escAttr(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

if (!isDev) {
  const clientDist = resolve(process.cwd(), 'client/dist');

  // Read and cache index.html once at startup for OG-tag injection.
  let indexHtml = '';
  try {
    indexHtml = readFileSync(resolve(clientDist, 'index.html'), 'utf8');
  } catch (err) {
    logger.warn({ err }, '[startup] Could not read client/dist/index.html — OG tag injection disabled');
  }

  // Browsers request /favicon.ico directly. Redirect to the SVG favicon so they
  // don't hit a 404 — the SVG is served as a static asset from the client dist.
  app.get('/favicon.ico', (_req, res) => {
    res.redirect(301, '/favicon.svg');
  });

  app.use(express.static(clientDist));

  // ── Dynamic OG meta injection for /invite/:token ──────────────────────────
  // WhatsApp and other link-preview bots fetch the page HTML before the
  // JavaScript runs. We intercept these routes server-side, look up the guest
  // name, and inject personalised og:title / og:description so that each
  // shared invite link shows the recipient's name in the preview card.
  app.get('/invite/:token', (req: Request, res: Response) => {
    const token = req.params['token'] ?? '';

    // Basic sanity check — real tokens are UUIDs (36 chars). Reject anything
    // obviously malformed without hitting the database.
    if (!token || token.length > 128) {
      res.sendFile(resolve(clientDist, 'index.html'));
      return;
    }

    if (!indexHtml) {
      res.sendFile(resolve(clientDist, 'index.html'));
      return;
    }

    // Synchronous prepared-statement lookup is intentional here: this is a
    // single indexed key-value read on SQLite, and keeping it sync avoids
    // turning the catch-all route into an async handler which would require
    // more careful error propagation.
    type GuestRow = { guestName: string | null };
    const row = sqlite.prepare(`
      SELECT g.name AS guestName
      FROM   guest_invitations gi
      LEFT JOIN guests g ON g.id = gi.guest_id
      WHERE  gi.token = ?
      LIMIT  1
    `).get(token) as GuestRow | undefined;

    const baseUrl    = process.env['BASE_URL'] ?? '';
    const guestName  = row?.guestName ?? null;

    const title = guestName
      ? `Sayın ${guestName}`
      : 'Berfin & Shamsiddin — Wedding Invitation';
    const description = guestName
      ? 'Berfin & Shamsiddin düğününe kişisel davetiyeniz.'
      : 'You are cordially invited to our wedding celebration';

    const ogTags = [
      `<meta property="og:title" content="${escAttr(title)}" />`,
      `<meta property="og:description" content="${escAttr(description)}" />`,
      `<meta property="og:type" content="website" />`,
      `<meta property="og:url" content="${escAttr(`${baseUrl}/invite/${token}`)}" />`,
      `<meta name="twitter:card" content="summary" />`,
      `<meta name="twitter:title" content="${escAttr(title)}" />`,
      `<meta name="twitter:description" content="${escAttr(description)}" />`,
    ].join('\n    ');

    const html = indexHtml
      // Update the <title> tag
      .replace(/<title>[^<]*<\/title>/, `<title>${escAttr(title)}</title>`)
      // Update the static description meta
      .replace(
        /<meta name="description"[^>]*>/,
        `<meta name="description" content="${escAttr(description)}" />`,
      )
      // Inject OG tags just before </head>
      .replace('</head>', `    ${ogTags}\n  </head>`);

    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });

  app.get('*', (_req, res) => {
    res.sendFile(resolve(clientDist, 'index.html'));
  });
}

// ─── Global error handler ─────────────────────────────────────────────────────
// Catches any unhandled errors thrown inside route handlers.
// In production, stack traces are never sent to the client to prevent information leakage.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  logger.error({ err }, '[unhandled error]');
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Server startup ───────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server started');
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
// Clear rate limit stores and close the HTTP server cleanly on SIGTERM / SIGINT.
// This allows the Node process to exit without hanging on open intervals or connections.
function gracefulShutdown(signal: string): void {
  logger.info({ signal }, '[shutdown] Shutting down gracefully');
  clearRateLimitStore();
  server.close(() => {
    logger.info('[shutdown] HTTP server closed');
    process.exit(0);
  });
  setTimeout(() => {
    logger.error('[shutdown] Forced exit after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

// ─── Fatal error handlers ─────────────────────────────────────────────────────
// Express only catches errors thrown synchronously or passed to next(err).
// Unhandled async rejections and uncaught exceptions outside route handlers
// (e.g. in startup migrations, intervals, or detached Promises) would otherwise
// terminate the process with no structured log entry. We catch them here, log
// with full context, then exit — PM2 will restart the process automatically.
process.on('unhandledRejection', (reason: unknown) => {
  logger.fatal({ reason }, '[fatal] Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err: Error) => {
  logger.fatal({ err }, '[fatal] Uncaught exception');
  process.exit(1);
});

export default app;
