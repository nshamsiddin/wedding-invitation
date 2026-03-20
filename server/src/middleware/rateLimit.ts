import type { Request, Response, NextFunction } from 'express';

// NOTE: This rate limiter uses an in-memory Map. This is acceptable for a single-instance
// SQLite deployment but MUST be replaced with a Redis-backed solution (e.g. ioredis +
// rate-limiter-flexible) before horizontal scaling to multiple processes or nodes, as each
// process maintains its own independent counter store.
//
// IP resolution: req.ip is used directly (the real connection IP as seen by Express).
// If the server runs behind a trusted reverse proxy (nginx, Cloudflare, etc.), configure
// `app.set('trust proxy', 1)` in index.ts so that Express correctly resolves req.ip from
// the X-Forwarded-For header set by the proxy — NOT the user-supplied header value.

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rsvpStore = new Map<string, RateLimitEntry>();
const RSVP_WINDOW_MS = 60 * 1000;   // 1 minute
const RSVP_MAX_REQUESTS = 5;

const claimStore = new Map<string, RateLimitEntry>();
const CLAIM_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const CLAIM_MAX_REQUESTS = 5;

const loginStore = new Map<string, RateLimitEntry>();
const LOGIN_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const LOGIN_MAX_REQUESTS = 5;

// Token lookup: generous limit since guests may refresh; still prevents mass scanning.
const tokenLookupStore = new Map<string, RateLimitEntry>();
const TOKEN_LOOKUP_WINDOW_MS = 60 * 1000; // 1 minute
const TOKEN_LOOKUP_MAX_REQUESTS = 30;

// Uses req.ip only — never the user-controllable X-Forwarded-For header.
// Configure app.set('trust proxy', 1) in index.ts if behind a trusted proxy.
function getClientIp(req: Request): string {
  return req.ip ?? 'unknown';
}

function checkRateLimit(
  store: Map<string, RateLimitEntry>,
  ip: string,
  windowMs: number,
  maxRequests: number,
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = store.get(ip);

  if (!entry || now > entry.resetAt) {
    store.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true };
  }

  if (entry.count >= maxRequests) {
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return { allowed: false, retryAfter };
  }

  entry.count += 1;
  return { allowed: true };
}

// Sends a 429 response with both a Retry-After HTTP header (RFC 6585) and a
// JSON body. The header is what HTTP clients and load-balancers act on;
// the body is what our own frontend reads to display a countdown.
function rejectRateLimit(res: Response, message: string, retryAfter: number): void {
  res.set('Retry-After', String(retryAfter));
  res.status(429).json({ error: message, retryAfter });
}

export function rsvpRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const result = checkRateLimit(rsvpStore, ip, RSVP_WINDOW_MS, RSVP_MAX_REQUESTS);
  if (!result.allowed) {
    rejectRateLimit(res, 'Too many requests. Please wait a moment before trying again.', result.retryAfter!);
    return;
  }
  next();
}

// Stricter limit for the claim endpoint to prevent abuse of self-registration
export function claimRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const result = checkRateLimit(claimStore, ip, CLAIM_WINDOW_MS, CLAIM_MAX_REQUESTS);
  if (!result.allowed) {
    rejectRateLimit(res, 'Too many registration attempts. Please try again later.', result.retryAfter!);
    return;
  }
  next();
}

// Strict limit for admin login to prevent brute-force attacks: 5 attempts per 15 minutes
export function loginRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const result = checkRateLimit(loginStore, ip, LOGIN_WINDOW_MS, LOGIN_MAX_REQUESTS);
  if (!result.allowed) {
    rejectRateLimit(res, 'Too many login attempts. Please try again later.', result.retryAfter!);
    return;
  }
  next();
}

// Token lookup: generous limit to accommodate page refreshes while still
// preventing automated scanning of the invitation token space.
export function tokenLookupRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const result = checkRateLimit(tokenLookupStore, ip, TOKEN_LOOKUP_WINDOW_MS, TOKEN_LOOKUP_MAX_REQUESTS);
  if (!result.allowed) {
    rejectRateLimit(res, 'Too many requests. Please try again shortly.', result.retryAfter!);
    return;
  }
  next();
}

// Periodic cleanup of expired entries to prevent unbounded memory growth.
// The interval reference is stored so it can be cleared on graceful shutdown.
let cleanupInterval: ReturnType<typeof setInterval> | null = null;

cleanupInterval = setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rsvpStore.entries()) {
    if (now > entry.resetAt) rsvpStore.delete(ip);
  }
  for (const [ip, entry] of claimStore.entries()) {
    if (now > entry.resetAt) claimStore.delete(ip);
  }
  for (const [ip, entry] of loginStore.entries()) {
    if (now > entry.resetAt) loginStore.delete(ip);
  }
  for (const [ip, entry] of tokenLookupStore.entries()) {
    if (now > entry.resetAt) tokenLookupStore.delete(ip);
  }
}, 5 * 60 * 1000);

// Call this during graceful shutdown to allow the Node process to exit cleanly.
export function clearRateLimitStore(): void {
  if (cleanupInterval !== null) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
  rsvpStore.clear();
  claimStore.clear();
  loginStore.clear();
  tokenLookupStore.clear();
}
