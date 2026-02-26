import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { db } from './db/index.js';
import { sql } from 'drizzle-orm';
import rsvpRouter from './routes/rsvp.js';
import adminRouter from './routes/admin.js';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = parseInt(process.env['PORT'] ?? '3001', 10);
const isDev = process.env.NODE_ENV !== 'production';

db.run(sql`
  CREATE TABLE IF NOT EXISTS guests (
    id INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('attending','declined','maybe','pending')),
    guest_count INTEGER NOT NULL DEFAULT 1,
    dietary TEXT,
    message TEXT,
    created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
  )
`);

app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(
  cors({
    origin: isDev ? 'http://localhost:5173' : false,
    credentials: true,
  })
);

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
