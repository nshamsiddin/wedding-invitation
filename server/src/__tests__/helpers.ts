/**
 * Test helpers.
 *
 * Environment variables are pre-set in setup.ts (loaded by vitest before any
 * module is imported). Each test FILE runs in an isolated Vitest worker, giving
 * it its own module registry and therefore its own fresh :memory: database.
 */
import { vi, beforeEach } from 'vitest';
import { randomUUID } from 'crypto';
import express from 'express';
import cookieParser from 'cookie-parser';

// Stub pino so tests don't emit log noise
vi.mock('../lib/logger.js', () => ({
  default: {
    info:  vi.fn(),
    warn:  vi.fn(),
    error: vi.fn(),
    fatal: vi.fn(),
    debug: vi.fn(),
  },
}));

// Import the shared module-level DB — same instance the routes use
export { sqlite, db } from '../db/index.js';
import { sqlite } from '../db/index.js';
import { clearRateLimitStore } from '../middleware/rateLimit.js';

// Reset rate-limit counters before each test so individual tests don't
// bleed into one another when the same in-process IP counter is exhausted.
beforeEach(() => {
  clearRateLimitStore();
});

// Bootstrap schema on the shared in-memory DB (idempotent — IF NOT EXISTS)
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    venue_name TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    dress_code TEXT,
    maps_url TEXT
  );
  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    phone TEXT,
    partner_name TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );
  CREATE TABLE IF NOT EXISTS guest_invitations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    token TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending'
                CHECK(status IN ('attending','declined','maybe','pending')),
    guest_count INTEGER NOT NULL DEFAULT 1,
    dietary TEXT,
    message TEXT,
    partner_dietary TEXT,
    source TEXT NOT NULL DEFAULT 'admin',
    is_open INTEGER NOT NULL DEFAULT 0,
    is_public INTEGER NOT NULL DEFAULT 0,
    table_number INTEGER,
    language TEXT NOT NULL DEFAULT 'en',
    claimed_at TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(guest_id, event_id)
  );
  CREATE INDEX IF NOT EXISTS inv_event_id_idx ON guest_invitations (event_id);
  CREATE INDEX IF NOT EXISTS inv_status_idx   ON guest_invitations (status);
`);

// Seed reference events (once per worker — INSERT OR IGNORE is idempotent)
sqlite.exec(`
  INSERT OR IGNORE INTO events (slug, name, date, time, venue_name, venue_address)
  VALUES
    ('future-event', 'Future Event', '2099-12-31', '18:00', 'Test Venue', 'Test Address'),
    ('past-event',   'Past Event',   '2000-01-01', '18:00', 'Old Venue',  'Old Address');
`);

// ── App factory ───────────────────────────────────────────────────────────────

export function createTestApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json());
  app.use(cookieParser());
  return app;
}

// ── Seed helpers ──────────────────────────────────────────────────────────────

export function getFutureEventId(): number {
  const row = sqlite.prepare("SELECT id FROM events WHERE slug = 'future-event'").get() as { id: number };
  return row.id;
}

export function getPastEventId(): number {
  const row = sqlite.prepare("SELECT id FROM events WHERE slug = 'past-event'").get() as { id: number };
  return row.id;
}

export function insertPersonalInvitation(eventId: number, token = randomUUID()): string {
  const guest = sqlite
    .prepare("INSERT INTO guests (name) VALUES ('Test Guest') RETURNING id")
    .get() as { id: number };
  sqlite
    .prepare(
      `INSERT INTO guest_invitations (guest_id, event_id, token, status) VALUES (?, ?, ?, 'pending')`
    )
    .run(guest.id, eventId, token);
  return token;
}

export function insertOpenInvitation(eventId: number, token = randomUUID()): string {
  sqlite
    .prepare(
      `INSERT INTO guest_invitations (guest_id, event_id, token, status, is_open) VALUES (NULL, ?, ?, 'pending', 1)`
    )
    .run(eventId, token);
  return token;
}

/** Extracts the token= value from a Set-Cookie header. */
export function extractCookie(headers: Record<string, string | string[]>): string {
  const raw = headers['set-cookie'];
  if (!raw) return '';
  const first = Array.isArray(raw) ? raw[0] : raw;
  return first.split(';')[0] ?? '';
}
