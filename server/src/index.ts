import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { db } from './db/index.js';
import { sql } from 'drizzle-orm';
import rsvpRouter from './routes/rsvp.js';
import adminRouter from './routes/admin.js';
import eventsRouter from './routes/events.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const isDev = process.env.NODE_ENV !== 'production';

// Create schema and seed events on startup
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

db.run(sql`
  CREATE TABLE IF NOT EXISTS guest_invitations (
    id          INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    guest_id    INTEGER NOT NULL REFERENCES guests(id) ON DELETE CASCADE,
    event_id    INTEGER NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    token       TEXT NOT NULL UNIQUE,
    status      TEXT NOT NULL DEFAULT 'pending'
                CHECK(status IN ('attending','declined','maybe','pending')),
    guest_count INTEGER NOT NULL DEFAULT 1,
    dietary     TEXT,
    message     TEXT,
    created_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at  TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    UNIQUE(guest_id, event_id)
  )
`);

// Upsert wedding events — updates venue/date details on each restart without touching guest invitations
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

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: isDev ? 'http://localhost:5173' : false,
    credentials: true,
  })
);

app.use('/api/events', eventsRouter);
app.use('/api/rsvp', rsvpRouter);
app.use('/api/admin', adminRouter);

if (!isDev) {
  const clientDist = resolve(__dirname, '../../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (_req, res) => {
    res.sendFile(resolve(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

export default app;
