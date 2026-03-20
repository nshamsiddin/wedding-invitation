/**
 * Auth middleware and admin login/logout tests.
 */
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createTestApp, extractCookie } from './helpers.js';
import adminRouter from '../routes/admin.js';

function buildApp() {
  const app = createTestApp();
  app.use('/api/admin', adminRouter);
  return app;
}

describe('POST /api/admin/login', () => {
  it('rejects missing credentials with 400', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/admin/login').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toBeTruthy();
  });

  it('rejects wrong username with 401', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'wrong', password: 'testpassword' });
    expect(res.status).toBe(401);
  });

  it('rejects wrong password with 401', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'wrongpassword' });
    expect(res.status).toBe(401);
  });

  it('accepts correct credentials and sets httpOnly cookie', async () => {
    const app = buildApp();
    const res = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'testpassword' });
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
    const setCookie = res.headers['set-cookie'];
    expect(setCookie).toBeTruthy();
    const cookieStr = Array.isArray(setCookie) ? setCookie[0] : setCookie;
    expect(cookieStr).toContain('token=');
    expect(cookieStr).toContain('HttpOnly');
  });

  it('is rate-limited after 5 failed attempts from the same IP', async () => {
    const app = buildApp();
    const bad = { username: 'admin', password: 'bad' };
    for (let i = 0; i < 5; i++) {
      await request(app).post('/api/admin/login').send(bad);
    }
    const res = await request(app).post('/api/admin/login').send(bad);
    expect(res.status).toBe(429);
    expect(res.headers['retry-after']).toBeTruthy();
  });
});

describe('GET /api/admin/me', () => {
  it('returns 401 without a cookie', async () => {
    const app = buildApp();
    const res = await request(app).get('/api/admin/me');
    expect(res.status).toBe(401);
  });

  it('returns 200 with a valid session cookie', async () => {
    const app = buildApp();
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'testpassword' });
    const cookie = extractCookie(loginRes.headers);
    const res = await request(app).get('/api/admin/me').set('Cookie', cookie);
    expect(res.status).toBe(200);
    expect(res.body.admin).toBe(true);
  });
});

describe('POST /api/admin/logout', () => {
  it('requires authentication — returns 401 without a cookie', async () => {
    const app = buildApp();
    const res = await request(app).post('/api/admin/logout');
    expect(res.status).toBe(401);
  });

  it('invalidates the session: token is rejected after logout', async () => {
    const app = buildApp();
    const loginRes = await request(app)
      .post('/api/admin/login')
      .send({ username: 'admin', password: 'testpassword' });
    const cookie = extractCookie(loginRes.headers);

    const logoutRes = await request(app)
      .post('/api/admin/logout')
      .set('Cookie', cookie);
    expect(logoutRes.status).toBe(200);

    // The token was issued before lastLogoutAt — must be rejected
    const meRes = await request(app).get('/api/admin/me').set('Cookie', cookie);
    expect(meRes.status).toBe(401);
  });
});
