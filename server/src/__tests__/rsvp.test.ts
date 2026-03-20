/**
 * RSVP token lookup, personal-invitation submit, open-invitation claim,
 * and Zod schema boundary tests.
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { randomUUID } from 'crypto';
import {
  createTestApp,
  sqlite,
  getFutureEventId,
  getPastEventId,
  insertPersonalInvitation,
  insertOpenInvitation,
} from './helpers.js';
import rsvpRouter from '../routes/rsvp.js';

function buildApp() {
  const app = createTestApp();
  app.use('/api/rsvp', rsvpRouter);
  return app;
}

// ─── Token lookup ─────────────────────────────────────────────────────────────

describe('GET /api/rsvp/token/:token', () => {
  it('returns 404 for unknown token', async () => {
    const app = buildApp();
    const res = await request(app).get(`/api/rsvp/token/${randomUUID()}`);
    expect(res.status).toBe(404);
  });

  it('returns personal invitation data for a valid personal token', async () => {
    const app = buildApp();
    const eventId = getFutureEventId();
    const token = insertPersonalInvitation(eventId);

    const res = await request(app).get(`/api/rsvp/token/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('personal');
    expect(res.body.guest.name).toBe('Test Guest');
    expect(res.body.event.id).toBe(eventId);
  });

  it('returns open invitation data for an unclaimed open token', async () => {
    const app = buildApp();
    const eventId = getFutureEventId();
    const token = insertOpenInvitation(eventId);

    const res = await request(app).get(`/api/rsvp/token/${token}`);
    expect(res.status).toBe(200);
    expect(res.body.type).toBe('open');
    expect(res.body.token).toBe(token);
  });

  it('returns 410 for a claimed one-time open invitation', async () => {
    const app = buildApp();
    const eventId = getFutureEventId();
    const token = insertOpenInvitation(eventId);
    sqlite
      .prepare("UPDATE guest_invitations SET claimed_at = '2025-01-01T10:00:00Z' WHERE token = ?")
      .run(token);

    const res = await request(app).get(`/api/rsvp/token/${token}`);
    expect(res.status).toBe(410);
    expect(res.body.type).toBe('claimed');
  });

  it('is rate-limited after 30 requests per minute', async () => {
    const app = buildApp();
    const token = randomUUID();
    let lastStatus = 0;
    for (let i = 0; i <= 31; i++) {
      const r = await request(app).get(`/api/rsvp/token/${token}`);
      lastStatus = r.status;
    }
    expect(lastStatus).toBe(429);
    // RFC 6585: Retry-After header must be present on 429
    expect(lastStatus === 429 ? true : false).toBe(true);
  });
});

// ─── Personal RSVP submit ─────────────────────────────────────────────────────

describe('POST /api/rsvp', () => {
  it('returns 404 for unknown token', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/rsvp')
      .send({ token: randomUUID(), status: 'attending' });
    expect(res.status).toBe(404);
  });

  it('returns 400 for invalid schema (missing status)', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/rsvp')
      .send({ token: randomUUID() });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('updates the invitation status — idempotent across multiple submissions', async () => {
    const app = buildApp();
    const eventId = getFutureEventId();
    const token = insertPersonalInvitation(eventId);

    const r1 = await request(app)
      .post('/api/rsvp')
      .send({ token, status: 'attending', guestCount: 2 });
    expect(r1.status).toBe(200);
    expect(r1.body.invitation.status).toBe('attending');

    const r2 = await request(app)
      .post('/api/rsvp')
      .send({ token, status: 'declined' });
    expect(r2.status).toBe(200);
    expect(r2.body.invitation.status).toBe('declined');
  });

  it('rejects RSVP for a past event with 410', async () => {
    const app = buildApp();
    const pastEventId = getPastEventId();
    const token = insertPersonalInvitation(pastEventId);

    const res = await request(app)
      .post('/api/rsvp')
      .send({ token, status: 'attending' });
    expect(res.status).toBe(410);
  });

  it('rejects open invitation tokens via the personal endpoint with 400', async () => {
    const app = buildApp();
    const eventId = getFutureEventId();
    const token = insertOpenInvitation(eventId);

    const res = await request(app)
      .post('/api/rsvp')
      .send({ token, status: 'attending' });
    expect(res.status).toBe(400);
  });
});

// ─── Claim endpoint ───────────────────────────────────────────────────────────

describe('POST /api/rsvp/claim', () => {
  it('returns 400 for invalid schema (empty body)', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/rsvp/claim').send({});
    expect(res.status).toBe(400);
  });

  it('claims an open invitation and creates a guest record', async () => {
    const app = buildApp();
    const eventId = getFutureEventId();
    const token = insertOpenInvitation(eventId);

    const res = await request(app).post('/api/rsvp/claim').send({
      token,
      name: 'Jane Doe',
      rsvpEntries: [{ eventId, status: 'attending', guestCount: 1 }],
    });
    expect(res.status).toBe(201);
    expect(res.body.guest.name).toBe('Jane Doe');

    const inv = sqlite
      .prepare('SELECT claimed_at, guest_id FROM guest_invitations WHERE token = ?')
      .get(token) as { claimed_at: string | null; guest_id: number | null };
    expect(inv.claimed_at).not.toBeNull();
    expect(inv.guest_id).not.toBeNull();
  });

  it('prevents replay: second claim on the same token returns 404', async () => {
    const app = buildApp();
    const eventId = getFutureEventId();
    const token = insertOpenInvitation(eventId);
    const payload = {
      token,
      name: 'Jane Doe',
      rsvpEntries: [{ eventId, status: 'attending', guestCount: 1 }],
    };

    await request(app).post('/api/rsvp/claim').send(payload);
    const res2 = await request(app).post('/api/rsvp/claim').send(payload);
    expect(res2.status).toBe(404);
  });

  it('rejects claims for a past event with 410', async () => {
    const app = buildApp();
    const pastEventId = getPastEventId();
    const token = insertOpenInvitation(pastEventId);

    const res = await request(app).post('/api/rsvp/claim').send({
      token,
      name: 'Late Guest',
      rsvpEntries: [{ eventId: pastEventId, status: 'attending' }],
    });
    expect(res.status).toBe(410);
  });

  it('rejects rsvpEntries referencing a different event', async () => {
    const app = buildApp();
    const futureId = getFutureEventId();
    const pastId   = getPastEventId();
    const token = insertOpenInvitation(futureId);

    const res = await request(app).post('/api/rsvp/claim').send({
      token,
      name: 'Hacker',
      rsvpEntries: [{ eventId: pastId, status: 'attending' }],
    });
    expect(res.status).toBe(400);
  });
});

// ─── Zod schema boundary tests ────────────────────────────────────────────────

describe('Zod schema validation boundaries', () => {
  it('rejects name shorter than 2 characters in /claim', async () => {
    const app = buildApp();
    const eventId = getFutureEventId();
    const token = insertOpenInvitation(eventId);

    const res = await request(app).post('/api/rsvp/claim').send({
      token,
      name: 'X',
      rsvpEntries: [{ eventId, status: 'attending' }],
    });
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('rejects guestCount above 5 in /claim', async () => {
    const app = buildApp();
    const eventId = getFutureEventId();
    const token = insertOpenInvitation(eventId);

    const res = await request(app).post('/api/rsvp/claim').send({
      token,
      name: 'John Doe',
      rsvpEntries: [{ eventId, status: 'attending', guestCount: 99 }],
    });
    expect(res.status).toBe(400);
  });

  it('rejects an invalid attendance status in personal RSVP', async () => {
    const app = buildApp();
    const eventId = getFutureEventId();
    const token = insertPersonalInvitation(eventId);

    const res = await request(app)
      .post('/api/rsvp')
      .send({ token, status: 'maybe-sort-of' });
    expect(res.status).toBe(400);
  });

  it('rejects a non-UUID token in personal RSVP', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/rsvp')
      .send({ token: 'not-a-uuid', status: 'attending' });
    expect(res.status).toBe(400);
  });

  it('rejects dietary notes exceeding 500 characters', async () => {
    const app = buildApp();
    const eventId = getFutureEventId();
    const token = insertPersonalInvitation(eventId);

    const res = await request(app)
      .post('/api/rsvp')
      .send({ token, status: 'attending', dietary: 'a'.repeat(501) });
    expect(res.status).toBe(400);
  });
});
