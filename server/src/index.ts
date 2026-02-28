import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { db, sqlite } from './db/index.js';
import { sql } from 'drizzle-orm';
import rsvpRouter from './routes/rsvp.js';
import adminRouter from './routes/admin.js';
import eventsRouter from './routes/events.js';
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

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const isDev = process.env.NODE_ENV !== 'production';

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
    id         INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    phone      TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
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
    dietary     TEXT,
    message     TEXT,
    is_open     INTEGER NOT NULL DEFAULT 0,
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
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
