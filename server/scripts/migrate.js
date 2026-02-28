#!/usr/bin/env node
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import Database from 'better-sqlite3';

const __dirname = dirname(fileURLToPath(import.meta.url));

const envPath = resolve(__dirname, '../../.env');
try {
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const [key, ...rest] = line.split('=');
    if (key && rest.length > 0 && !key.startsWith('#')) {
      process.env[key.trim()] = rest.join('=').trim();
    }
  }
} catch {
  // .env not required
}

// Safety guard: this script must never be run against a production database.
// It is a schema initialisation tool for fresh installs only.
if (process.env.NODE_ENV === 'production') {
  console.error('[migrate] ERROR: This script must not be run in production.');
  console.error('[migrate] Use the server startup migration (index.ts) for live databases.');
  process.exit(1);
}

const dbPath = resolve(process.cwd(), process.env.DATABASE_PATH ?? './guests.db');
console.log(`Running migration on: ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Idempotent schema creation — no DROP TABLE statements.
// Safe to run multiple times on an existing database.
db.exec(`
  CREATE TABLE IF NOT EXISTS events (
    id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    slug        TEXT NOT NULL UNIQUE,
    name        TEXT NOT NULL,
    date        TEXT NOT NULL,
    time        TEXT NOT NULL,
    venue_name  TEXT NOT NULL,
    venue_address TEXT NOT NULL,
    dress_code  TEXT,
    maps_url    TEXT
  );

  CREATE TABLE IF NOT EXISTS guests (
    id         INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name       TEXT NOT NULL,
    email      TEXT NOT NULL UNIQUE,
    phone      TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  );

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
  );
`);

// Seed the two wedding events
const insertEvent = db.prepare(`
  INSERT OR IGNORE INTO events (slug, name, date, time, venue_name, venue_address, dress_code, maps_url)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

insertEvent.run(
  'tashkent',
  "Berfin & Shamsiddin — Toshkent",
  '2026-04-24',
  '18:00',
  'Ofarin Restaurant',
  'Toshkent, O\'zbekiston',
  'Rasmiy Kiyim',
  'https://maps.google.com/maps?q=Ofarin+Restaurant+Tashkent+Uzbekistan&output=embed'
);

insertEvent.run(
  'ankara',
  "Berfin & Şamsiddin — Ankara",
  '2026-05-19',
  '18:00',
  "Park L'Amore",
  'İncek, Turgut Özal Blv. No:48, 06830 Gölbaşı/Ankara, Türkiye',
  'Resmi Kıyafet',
  'https://maps.google.com/maps?q=Turgut+Ozal+Bulvari+No+48+Incek+Golbasi+Ankara+Turkey&output=embed'
);

db.close();
console.log('Migration completed successfully. Both events seeded.');
