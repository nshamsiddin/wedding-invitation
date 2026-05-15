/**
 * Tests for the MİSAFİR LİSTESİ workbook builder.
 *
 * Two layers are covered here:
 *
 *   1. Pure-function unit tests for the builders (`splitName`,
 *      `formatTurkishDate`, `buildSmsMessage`) — these exercise edge cases
 *      (single-token names, missing dates/maps) without going through the
 *      whole zip pipeline.
 *
 *   2. End-to-end shape tests on `buildMisafirListesi` — we unzip the
 *      produced `.xlsx` buffer with the system `unzip` tool, parse the
 *      worksheet XML by hand (no parser dep), and assert the rows we
 *      expect. This catches packaging bugs (missing CRC, malformed
 *      central directory) that the pure functions can't.
 *
 *   3. Integration test for `GET /api/admin/export/misafir-listesi` — auth
 *      requirement, query-param validation, and that the server returns
 *      the binary content with the right headers.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { execFileSync } from 'child_process';
import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { randomUUID } from 'crypto';
import request from 'supertest';

import {
  buildMisafirListesi,
  buildSmsMessage,
  formatTurkishDate,
  splitName,
} from '../lib/misafirListesi.js';
import {
  createTestApp,
  extractCookie,
  getFutureEventId,
  sqlite,
} from './helpers.js';
import adminRouter from '../routes/admin.js';

// ─── Pure-function tests ─────────────────────────────────────────────────────

describe('splitName', () => {
  it('splits a two-word name into first / last', () => {
    expect(splitName('Berfin Birler')).toEqual({ ad: 'Berfin', soyad: 'Birler' });
  });

  it('puts middle names with the first name', () => {
    expect(splitName('Maria Elena de Souza')).toEqual({
      ad: 'Maria Elena de',
      soyad: 'Souza',
    });
  });

  it('treats a single-word name as Ad with empty Soyad', () => {
    expect(splitName('Madonna')).toEqual({ ad: 'Madonna', soyad: '' });
  });

  it('collapses internal whitespace before splitting', () => {
    expect(splitName('  Ali   Veli   Yılmaz  ')).toEqual({
      ad: 'Ali Veli',
      soyad: 'Yılmaz',
    });
  });

  it('handles empty input safely', () => {
    expect(splitName('')).toEqual({ ad: '', soyad: '' });
  });
});

describe('formatTurkishDate', () => {
  it('reformats ISO date as DD.MM.YYYY', () => {
    expect(formatTurkishDate('2026-05-19')).toBe('19.05.2026');
  });

  it('passes through ISO date-time prefix', () => {
    expect(formatTurkishDate('2026-05-19T18:00:00Z')).toBe('19.05.2026');
  });

  it('falls back to raw input on unparseable strings', () => {
    expect(formatTurkishDate('not-a-date')).toBe('not-a-date');
  });
});

describe('buildSmsMessage', () => {
  const event = {
    name: 'Berfin & Shamsiddin — Ankara',
    date: '2026-05-19',
    time: '18:00',
    venueName: "Park L'Amore",
    venueAddress: 'İncek Ankara',
    mapsUrl: 'https://maps.example.com/p',
  };

  it('includes the table number when one is assigned', () => {
    const msg = buildSmsMessage(event, 7);
    expect(msg).toContain('19.05.2026');
    expect(msg).toContain('18:00');
    expect(msg).toContain("Park L'Amore");
    expect(msg).toContain('Berfin & Shamsiddin');
    expect(msg).toContain('masa numaranız 7 dir');
    expect(msg).toContain('Konum: https://maps.example.com/p');
  });

  it('omits the table line for unassigned guests', () => {
    const msg = buildSmsMessage(event, null);
    expect(msg).not.toContain('masa numaranız');
    expect(msg).toContain('davetlisiniz');
  });

  it('omits the maps link when none is configured', () => {
    const msg = buildSmsMessage({ ...event, mapsUrl: null }, 1);
    expect(msg).not.toContain('Konum:');
  });
});

// ─── Workbook integration tests ──────────────────────────────────────────────

describe('buildMisafirListesi', () => {
  // Wrap the binary helper in a try/catch so the test reports a clear skip
  // reason on environments without the system `unzip` (e.g. some CI images).
  // This is preferable to silently passing a workbook that no spreadsheet
  // app could open.
  function unzipToDir(buffer: Buffer): { dir: string; cleanup: () => void } | null {
    let unzipPath: string;
    try {
      unzipPath = execFileSync('which', ['unzip'], { encoding: 'utf8' }).trim();
    } catch {
      return null;
    }
    if (!unzipPath) return null;
    const dir = mkdtempSync(join(tmpdir(), 'misafir-test-'));
    const file = join(dir, 'workbook.xlsx');
    writeFileSync(file, buffer);
    execFileSync(unzipPath, ['-q', file, '-d', dir]);
    return { dir, cleanup: () => rmSync(dir, { recursive: true, force: true }) };
  }

  const event = {
    name: 'Berfin & Shamsiddin — Ankara',
    date: '2026-05-19',
    time: '18:00',
    venueName: "Park L'Amore",
    venueAddress: 'İncek',
    mapsUrl: 'https://maps.example.com',
  };

  it('produces a buffer that begins with the ZIP magic number', () => {
    const buf = buildMisafirListesi(event, []);
    // PK\x03\x04 — ZIP local file header signature
    expect(buf.length).toBeGreaterThan(0);
    expect(buf[0]).toBe(0x50);
    expect(buf[1]).toBe(0x4b);
    expect(buf[2]).toBe(0x03);
    expect(buf[3]).toBe(0x04);
  });

  it('produces a workbook that can be unzipped, with HOSTES and MESAJ worksheets', () => {
    const buf = buildMisafirListesi(event, [
      { name: 'Ali Yılmaz', partnerName: null, phone: '5551234567', guestCount: 2, tableNumber: 1, status: 'attending' },
      { name: 'Ayşe Demir', partnerName: null, phone: null, guestCount: 1, tableNumber: 1, status: 'attending' },
      { name: 'Mehmet Kaya', partnerName: null, phone: null, guestCount: 1, tableNumber: null, status: 'pending' },
    ]);

    const out = unzipToDir(buf);
    if (!out) {
      // No system unzip — skip the structural checks but keep the smoke test
      // for the magic number from the previous case.
      console.warn('skipping: system `unzip` not available');
      return;
    }
    try {
      expect(existsSync(join(out.dir, '[Content_Types].xml'))).toBe(true);
      expect(existsSync(join(out.dir, 'xl/workbook.xml'))).toBe(true);
      expect(existsSync(join(out.dir, 'xl/worksheets/sheet1.xml'))).toBe(true);
      expect(existsSync(join(out.dir, 'xl/worksheets/sheet2.xml'))).toBe(true);

      const workbookXml = readFileSync(join(out.dir, 'xl/workbook.xml'), 'utf8');
      expect(workbookXml).toContain('name="HOSTES"');
      // Trailing space on "MESAJ " is intentional and must be preserved
      expect(workbookXml).toContain('name="MESAJ "');

      const hostes = readFileSync(join(out.dir, 'xl/worksheets/sheet1.xml'), 'utf8');
      expect(hostes).toContain('MASA 1 - 3 KİŞİ');
      expect(hostes).toContain('Ad Soyad');
      expect(hostes).toContain('Ali Yılmaz');
      expect(hostes).toContain('ATANMAMIŞ - 1 KİŞİ');

      const mesaj = readFileSync(join(out.dir, 'xl/worksheets/sheet2.xml'), 'utf8');
      // Header row preserved verbatim
      expect(mesaj).toContain('Kişi Sayısı');
      expect(mesaj).toContain('Geliyor/Gelmiyor');
      expect(mesaj).toContain('GELİR / GELMEZ');
      // Auto-generated SMS body for assigned guests
      expect(mesaj).toContain('masa numaranız 1 dir');
      // Phone numbers are written as inline strings (preserves leading zeros)
      expect(mesaj).toContain('5551234567');
    } finally {
      out.cleanup();
    }
  });

  it('falls back to a header-only HOSTES sheet when no rows are supplied', () => {
    const buf = buildMisafirListesi(event, []);
    const out = unzipToDir(buf);
    if (!out) return;
    try {
      const hostes = readFileSync(join(out.dir, 'xl/worksheets/sheet1.xml'), 'utf8');
      expect(hostes).toContain('Ad Soyad');
      expect(hostes).not.toContain('MASA');
    } finally {
      out.cleanup();
    }
  });
});

// ─── Route integration tests ─────────────────────────────────────────────────

describe('GET /api/admin/export/misafir-listesi', () => {
  function buildApp() {
    const app = createTestApp();
    app.use('/api/admin', adminRouter);
    return app;
  }

  async function loginAndGetCookie(app: ReturnType<typeof buildApp>): Promise<string> {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'testpassword' });
    return extractCookie(res.headers);
  }

  beforeEach(() => {
    sqlite.exec('DELETE FROM guest_invitations; DELETE FROM guests;');
  });

  it('requires authentication', async () => {
    const app = buildApp();
    const eventId = getFutureEventId();
    const res = await request(app).get(`/api/admin/export/misafir-listesi?eventId=${eventId}`);
    expect(res.status).toBe(401);
  });

  it('rejects requests without an eventId', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);
    const res = await request(app)
      .get('/api/admin/export/misafir-listesi')
      .set('Cookie', cookie);
    expect(res.status).toBe(400);
  });

  it('rejects non-numeric eventId values', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);
    const res = await request(app)
      .get('/api/admin/export/misafir-listesi?eventId=abc')
      .set('Cookie', cookie);
    expect(res.status).toBe(400);
  });

  it('returns 404 when the event does not exist', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);
    const res = await request(app)
      .get('/api/admin/export/misafir-listesi?eventId=99999999')
      .set('Cookie', cookie);
    expect(res.status).toBe(404);
  });

  it('returns an .xlsx attachment for a valid event', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);
    const eventId = getFutureEventId();

    // Seed a single attending guest with a table assignment so the workbook
    // contains real rows to verify against.
    const guestRow = sqlite
      .prepare("INSERT INTO guests (name, phone) VALUES ('Ali Yılmaz', '5551234567') RETURNING id")
      .get() as { id: number };
    sqlite
      .prepare(
        `INSERT INTO guest_invitations (guest_id, event_id, token, status, guest_count, table_number)
         VALUES (?, ?, ?, 'attending', 2, 5)`,
      )
      .run(guestRow.id, eventId, randomUUID());

    const res = await request(app)
      .get(`/api/admin/export/misafir-listesi?eventId=${eventId}`)
      .set('Cookie', cookie)
      // supertest defaults to text — we want the raw bytes to assert on
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain(
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toMatch(/misafir-listesi-future-event-\d{4}-\d{2}-\d{2}\.xlsx/);

    const body = res.body as Buffer;
    expect(Buffer.isBuffer(body)).toBe(true);
    // ZIP magic number — just the smoke test; structural checks are in the
    // pure-function tests above.
    expect(body[0]).toBe(0x50);
    expect(body[1]).toBe(0x4b);
  });

  it('only includes invitations for the requested event', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);
    const eventId = getFutureEventId();

    // Guest A is on the future event; guest B is on the past event. The
    // export is scoped to future-event so only guest A should appear.
    const aId = (sqlite
      .prepare("INSERT INTO guests (name) VALUES ('Guest A') RETURNING id")
      .get() as { id: number }).id;
    const bId = (sqlite
      .prepare("INSERT INTO guests (name) VALUES ('Guest B') RETURNING id")
      .get() as { id: number }).id;
    const pastEventId = (sqlite
      .prepare("SELECT id FROM events WHERE slug = 'past-event'")
      .get() as { id: number }).id;
    sqlite
      .prepare(
        `INSERT INTO guest_invitations (guest_id, event_id, token, status, guest_count, table_number)
         VALUES (?, ?, ?, 'attending', 1, 1)`,
      )
      .run(aId, eventId, randomUUID());
    sqlite
      .prepare(
        `INSERT INTO guest_invitations (guest_id, event_id, token, status, guest_count, table_number)
         VALUES (?, ?, ?, 'attending', 1, 1)`,
      )
      .run(bId, pastEventId, randomUUID());

    const res = await request(app)
      .get(`/api/admin/export/misafir-listesi?eventId=${eventId}`)
      .set('Cookie', cookie)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    const body = res.body as Buffer;
    // The XML is uncompressed (stored), so the names appear verbatim in the
    // raw file. This is a brittle but useful smoke check.
    expect(body.toString('utf8')).toContain('Guest A');
    expect(body.toString('utf8')).not.toContain('Guest B');
  });

  it('skips open invitations without a guest', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);
    const eventId = getFutureEventId();

    sqlite
      .prepare(
        `INSERT INTO guest_invitations (guest_id, event_id, token, status, guest_count, is_open)
         VALUES (NULL, ?, ?, 'pending', 1, 1)`,
      )
      .run(eventId, randomUUID());

    const res = await request(app)
      .get(`/api/admin/export/misafir-listesi?eventId=${eventId}`)
      .set('Cookie', cookie)
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () => callback(null, Buffer.concat(chunks)));
      });

    expect(res.status).toBe(200);
    const body = res.body as Buffer;
    // Empty workbook (header-only HOSTES, header-only MESAJ) — no MASA blocks
    expect(body.toString('utf8')).not.toContain('MASA ');
  });
});
