import type { Request, Response, NextFunction } from 'express';

// NOTE: This rate limiter uses an in-memory Map. This is acceptable for a single-instance
// SQLite deployment but MUST be replaced with a Redis-backed solution (e.g. ioredis +
// rate-limiter-flexible) before horizontal scaling to multiple processes or nodes, as each
// process maintains its own independent counter store.

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

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string') {
    const first = forwarded.split(',')[0];
    return first !== undefined ? first.trim() : req.ip ?? 'unknown';
  }
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

export function rsvpRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const result = checkRateLimit(rsvpStore, ip, RSVP_WINDOW_MS, RSVP_MAX_REQUESTS);

  if (!result.allowed) {
    res.status(429).json({
      error: 'Too many requests. Please wait a moment before trying again.',
      retryAfter: result.retryAfter,
    });
    return;
  }
  next();
}

// Stricter limit for the claim endpoint to prevent abuse of self-registration
export function claimRateLimit(req: Request, res: Response, next: NextFunction): void {
  const ip = getClientIp(req);
  const result = checkRateLimit(claimStore, ip, CLAIM_WINDOW_MS, CLAIM_MAX_REQUESTS);

  if (!result.allowed) {
    res.status(429).json({
      error: 'Too many registration attempts. Please try again later.',
      retryAfter: result.retryAfter,
    });
    return;
  }
  next();
}

// Periodic cleanup of expired entries to prevent unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rsvpStore.entries()) {
    if (now > entry.resetAt) rsvpStore.delete(ip);
  }
  for (const [ip, entry] of claimStore.entries()) {
    if (now > entry.resetAt) claimStore.delete(ip);
  }
}, 5 * 60 * 1000);
