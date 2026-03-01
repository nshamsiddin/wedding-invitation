import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { db, sqlite } from './db/index.js';
import { sql } from 'drizzle-orm';
import rsvpRouter from './routes/rsvp.js';
import adminRouter from './routes/admin.js';
import eventsRouter from './routes/events.js';
import { clearRateLimitStore } from './middleware/rateLimit.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ─── Environment validation ───────────────────────────────────────────────────
// Fail fast at startup if any required variable is missing.
// Never use hardcoded fallbacks for secrets (JWT_SECRET, ADMIN_PASSWORD, etc.).
const REQUIRED_ENV_VARS = ['JWT_SECRET', 'ADMIN_USERNAME', 'ADMIN_PASSWORD', 'NODE_ENV'] as const;
for (const key of REQUIRED_ENV_VARS) {
  if (!process.env[key]) {
    console.error(`[startup] Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

// BASE_URL is required in production to construct valid invitation links.
if (process.env.NODE_ENV === 'production' && !process.env.BASE_URL) {
  console.error('[startup] BASE_URL is required in production (e.g. https://wedding.example.com)');
  process.exit(1);
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
    console.error('[startup] JWT_SECRET must not use the default example value — generate a strong random secret');
    console.error('[startup] Run: node -e "console.log(require(\'crypto\').randomBytes(48).toString(\'hex\'))"');
    process.exit(1);
  }
  if (KNOWN_WEAK_SECRETS.has(process.env.ADMIN_PASSWORD!)) {
    console.error('[startup] ADMIN_PASSWORD must not use the default example value — set a strong bcrypt hash');
    process.exit(1);
  }
  // Require bcrypt hash format in production
  if (!process.env.ADMIN_PASSWORD!.startsWith('$2b$')) {
    console.error('[startup] ADMIN_PASSWORD must be a bcrypt hash in production (prefix $2b$)');
    console.error('[startup] Generate one with: node -e "require(\'bcryptjs\').hash(\'yourpassword\', 12).then(console.log)"');
    process.exit(1);
  }
}

// ─── DATABASE_PATH warning ────────────────────────────────────────────────────
if (!process.env['DATABASE_PATH'] && process.env.NODE_ENV === 'production') {
  console.warn('[startup] DATABASE_PATH is not set — using fallback ./guests.db in the current working directory.');
  console.warn('[startup] Set DATABASE_PATH to an absolute path to avoid data loss on container restarts.');
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
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        // Google Maps embed requires frame-src and connect-src allowlisting
        frameSrc: ["'self'", 'https://maps.google.com', 'https://www.google.com'],
        connectSrc: ["'self'", 'https://maps.googleapis.com'],
        fontSrc: ["'self'", 'https:', 'data:'],
        objectSrc: ["'none'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: isDev ? null : [],
      },
    },
    // HSTS only in production (breaks local HTTP dev)
    strictTransportSecurity: isDev ? false : { maxAge: 31536000, includeSubDomains: true },
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
    is_open         INTEGER NOT NULL DEFAULT 0,
    is_public       INTEGER NOT NULL DEFAULT 0,
    claimed_at  TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(guest_id, event_id)
  )
`);

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
    console.log('[migration] Recreating guest_invitations with nullable guest_id…');
    sqlite.pragma('foreign_keys = OFF');
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
    sqlite.pragma('foreign_keys = ON');
    console.log('[migration] guest_invitations migration complete.');
  } else {
    // Table exists with nullable guest_id — just add any missing columns
    if (!hasIsOpen) {
      console.log('[migration] Adding is_open column to guest_invitations…');
      sqlite.prepare('ALTER TABLE guest_invitations ADD COLUMN is_open INTEGER NOT NULL DEFAULT 0').run();
    }
    if (!hasClaimedAt) {
      console.log('[migration] Adding claimed_at column to guest_invitations…');
      sqlite.prepare('ALTER TABLE guest_invitations ADD COLUMN claimed_at TEXT').run();
    }
    const hasPartnerDietary = cols.some((c) => c.name === 'partner_dietary');
    if (!hasPartnerDietary) {
      console.log('[migration] Adding partner_dietary column to guest_invitations…');
      sqlite.prepare('ALTER TABLE guest_invitations ADD COLUMN partner_dietary TEXT').run();
    }
  }
})();

(function migrateGuestsPartnerName() {
  type ColInfo = { name: string };
  const cols = sqlite.prepare('PRAGMA table_info(guests)').all() as ColInfo[];
  if (cols.length === 0) return; // Table was just created — already has correct schema
  if (!cols.some((c) => c.name === 'partner_name')) {
    console.log('[migration] Adding partner_name column to guests…');
    sqlite.prepare('ALTER TABLE guests ADD COLUMN partner_name TEXT').run();
  }
})();

// Make guests.email nullable — SQLite cannot ALTER COLUMN, so recreate the table if needed.
(function migrateGuestsEmailNullable() {
  type ColInfo = { name: string; notnull: number };
  const cols = sqlite.prepare('PRAGMA table_info(guests)').all() as ColInfo[];
  if (cols.length === 0) return; // Just created above — already nullable
  const emailCol = cols.find((c) => c.name === 'email');
  if (!emailCol || emailCol.notnull === 0) return; // Already nullable
  console.log('[migration] Recreating guests table to make email nullable…');
  sqlite.pragma('foreign_keys = OFF');
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
  sqlite.pragma('foreign_keys = ON');
  console.log('[migration] guests email-nullable migration complete.');
})();

(function migrateGuestInvitationsIsPublic() {
  type ColInfo = { name: string };
  const cols = sqlite.prepare('PRAGMA table_info(guest_invitations)').all() as ColInfo[];
  if (cols.length === 0) return; // Just created above
  if (!cols.some((c) => c.name === 'is_public')) {
    console.log('[migration] Adding is_public column to guest_invitations…');
    sqlite.prepare('ALTER TABLE guest_invitations ADD COLUMN is_public INTEGER NOT NULL DEFAULT 0').run();
  }
})();

// ─── Seed wedding events ─────────────────────────────────────────────────────

db.run(sql`
  INSERT INTO events (slug, name, date, time, venue_name, venue_address, dress_code, maps_url)
  VALUES
    ('tashkent', 'Berfin & Shamsiddin — Toshkent', '2026-04-24', '18:00',
     'Ofarin Restaurant', 'Toshkent, O''zbekiston',
     'Rasmiy Kiyim',
     'https://maps.google.com/maps?q=Ofarin+Restaurant+Tashkent+Uzbekistan&output=embed'),
    ('ankara', 'Berfin & Şamsiddin — Ankara', '2026-05-19', '18:00',
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

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: isDev ? 'http://localhost:5173' : false,
    credentials: true,
  })
);

// ─── Health check ─────────────────────────────────────────────────────────────
// Used by load balancers and uptime monitors; no auth required.
// Includes a live database ping so it reflects actual service health.
app.get('/api/health', (_req: Request, res: Response) => {
  try {
    sqlite.prepare('SELECT 1').get();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch (err) {
    console.error('[health] Database ping failed:', err);
    res.status(503).json({ status: 'degraded', timestamp: new Date().toISOString() });
  }
});

// ─── API routes ───────────────────────────────────────────────────────────────

app.use('/api/events', eventsRouter);
app.use('/api/rsvp', rsvpRouter);
app.use('/api/admin', adminRouter);

// ─── Static files (production) ────────────────────────────────────────────────

if (!isDev) {
  const clientDist = resolve(process.cwd(), '../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(resolve(clientDist, 'index.html'));
  });
}

// ─── Global error handler ─────────────────────────────────────────────────────
// Catches any unhandled errors thrown inside route handlers.
// In production, stack traces are never sent to the client to prevent information leakage.
app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[unhandled error]', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Server startup ───────────────────────────────────────────────────────────

const server = app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// ─── Graceful shutdown ────────────────────────────────────────────────────────
// Clear rate limit stores and close the HTTP server cleanly on SIGTERM / SIGINT.
// This allows the Node process to exit without hanging on open intervals or connections.
function gracefulShutdown(signal: string): void {
  console.log(`[shutdown] Received ${signal} — shutting down gracefully`);
  clearRateLimitStore();
  server.close(() => {
    console.log('[shutdown] HTTP server closed');
    process.exit(0);
  });
  // Force-exit after 10s if connections don't drain
  setTimeout(() => {
    console.error('[shutdown] Forced exit after timeout');
    process.exit(1);
  }, 10_000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT',  () => gracefulShutdown('SIGINT'));

export default app;
