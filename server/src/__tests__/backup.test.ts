/**
 * Tests for the admin backup / restore endpoints.
 *
 * These exercise the round-trip: snapshot the current DB state, delete some
 * rows, restore the snapshot, and verify the deleted rows are back. They also
 * cover input-validation paths so a malformed file can never corrupt the DB.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import {
  createTestApp,
  extractCookie,
  getFutureEventId,
  insertPersonalInvitation,
  sqlite,
} from './helpers.js';
import adminRouter from '../routes/admin.js';

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

describe('GET /api/admin/backup', () => {
  beforeEach(() => {
    // Clean every backup-managed table so individual tests don't bleed into
    // one another. The seed events are recreated by helpers.ts on import, but
    // get wiped here — every test that needs them re-inserts what it needs.
    sqlite.exec('DELETE FROM guest_invitations; DELETE FROM guests;');
  });

  it('requires authentication', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/admin/backup');
    expect(res.status).toBe(401);
  });

  it('returns a JSON snapshot of every data table with the correct shape', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);

    const eventId = getFutureEventId();
    insertPersonalInvitation(eventId);

    const res = await request(app).get('/api/admin/backup').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('application/json');
    expect(res.headers['content-disposition']).toContain('attachment');
    expect(res.headers['content-disposition']).toContain('invitation-backup-');

    const payload = JSON.parse(res.text);
    expect(payload.app).toBe('invitation');
    expect(payload.version).toBe(1);
    expect(typeof payload.createdAt).toBe('string');
    expect(payload.data).toBeTruthy();
    expect(Array.isArray(payload.data.events)).toBe(true);
    expect(Array.isArray(payload.data.guests)).toBe(true);
    expect(Array.isArray(payload.data.guest_invitations)).toBe(true);
    // notifications table isn't created by the test fixture — should still be
    // present as an empty array so restore can validate the shape.
    expect(Array.isArray(payload.data.notifications)).toBe(true);

    expect(payload.data.guests.length).toBe(1);
    expect(payload.data.guest_invitations.length).toBe(1);
  });
});

describe('POST /api/admin/backup/restore', () => {
  beforeEach(() => {
    sqlite.exec('DELETE FROM guest_invitations; DELETE FROM guests;');
  });

  it('requires authentication', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/admin/backup/restore').send({});
    expect(res.status).toBe(401);
  });

  it('rejects payloads that are not invitation backups', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);

    const res = await request(app)
      .post('/api/admin/backup/restore')
      .set('Cookie', cookie)
      .send({ app: 'something-else', version: 1, data: {} });
    expect(res.status).toBe(400);
  });

  it('rejects backups with a future version', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);

    const res = await request(app)
      .post('/api/admin/backup/restore')
      .set('Cookie', cookie)
      .send({ app: 'invitation', version: 999, data: { events: [], guests: [], guest_invitations: [], notifications: [] } });
    expect(res.status).toBe(400);
  });

  it('rejects backups missing required tables', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);

    const res = await request(app)
      .post('/api/admin/backup/restore')
      .set('Cookie', cookie)
      .send({ app: 'invitation', version: 1, data: { events: [] } });
    expect(res.status).toBe(400);
  });

  it('round-trips: deleted rows are restored from a snapshot', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);

    const eventId = getFutureEventId();
    const tokenA = insertPersonalInvitation(eventId);
    const tokenB = insertPersonalInvitation(eventId);

    // Take a backup
    const backupRes = await request(app).get('/api/admin/backup').set('Cookie', cookie);
    expect(backupRes.status).toBe(200);
    const backup = JSON.parse(backupRes.text);

    // Delete everything
    sqlite.exec('DELETE FROM guest_invitations; DELETE FROM guests;');
    expect(
      (sqlite.prepare('SELECT COUNT(*) AS c FROM guests').get() as { c: number }).c,
    ).toBe(0);

    // Restore
    const restoreRes = await request(app)
      .post('/api/admin/backup/restore')
      .set('Cookie', cookie)
      .send(backup);
    expect(restoreRes.status).toBe(200);
    expect(restoreRes.body.ok).toBe(true);
    expect(restoreRes.body.counts.guests).toBe(2);
    expect(restoreRes.body.counts.guest_invitations).toBe(2);

    // Both invitations should be back with their original tokens
    const tokens = sqlite
      .prepare('SELECT token FROM guest_invitations ORDER BY token')
      .all() as { token: string }[];
    expect(tokens.map((r) => r.token).sort()).toEqual([tokenA, tokenB].sort());
  });

  it('replaces existing data — rows present before restore but not in the backup are removed', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);

    const eventId = getFutureEventId();

    // Snapshot an empty guest list
    const emptyBackup = await request(app).get('/api/admin/backup').set('Cookie', cookie);
    const empty = JSON.parse(emptyBackup.text);

    // Add a new guest after the snapshot was taken
    insertPersonalInvitation(eventId);
    expect(
      (sqlite.prepare('SELECT COUNT(*) AS c FROM guests').get() as { c: number }).c,
    ).toBe(1);

    // Restore the empty snapshot
    const restoreRes = await request(app)
      .post('/api/admin/backup/restore')
      .set('Cookie', cookie)
      .send(empty);
    expect(restoreRes.status).toBe(200);

    // The post-snapshot guest must be gone
    expect(
      (sqlite.prepare('SELECT COUNT(*) AS c FROM guests').get() as { c: number }).c,
    ).toBe(0);
  });

  it('ignores unknown columns in the backup payload', async () => {
    const app = buildApp();
    const cookie = await loginAndGetCookie(app);

    const eventId = getFutureEventId();
    const token = randomUUID();

    const payload = {
      app: 'invitation',
      version: 1,
      createdAt: new Date().toISOString(),
      data: {
        events: [],
        guests: [
          {
            id: 999,
            name: 'Restored Guest',
            phone: null,
            partner_name: null,
            created_at: '2024-01-01T00:00:00.000Z',
            // Unknown column from a hypothetical newer schema — must be ignored
            future_field: 'should not break the restore',
          },
        ],
        guest_invitations: [
          {
            id: 1,
            guest_id: 999,
            event_id: eventId,
            token,
            status: 'attending',
            guest_count: 1,
            language: 'en',
          },
        ],
        notifications: [],
      },
    };

    const res = await request(app)
      .post('/api/admin/backup/restore')
      .set('Cookie', cookie)
      .send(payload);
    expect(res.status).toBe(200);

    const guest = sqlite.prepare('SELECT name FROM guests WHERE id = 999').get() as { name: string };
    expect(guest.name).toBe('Restored Guest');
  });
});
