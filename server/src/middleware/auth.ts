import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AuthenticatedRequest extends Request {
  admin?: boolean;
}

// Tracks when the admin last logged out (in milliseconds since epoch).
// Tokens issued before this timestamp are rejected, providing server-side
// session invalidation without a database lookup or token blacklist.
// This is an in-memory store — suitable for a single-process deployment.
// If the process restarts, this resets to 0, which means pre-restart tokens
// remain valid until they expire naturally (24h). Acceptable trade-off for
// a single-admin wedding app; use Redis for multi-process deployments.
let lastLogoutAt = 0;

export function recordLogout(): void {
  lastLogoutAt = Date.now();
}

export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.token as string | undefined;

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  try {
    const payload = jwt.verify(token, secret) as jwt.JwtPayload;
    if (typeof payload === 'object' && payload !== null && payload['admin'] === true) {
      // Reject tokens issued before the most recent logout.
      // jwt.verify guarantees iat is a number when present.
      const issuedAt = (payload['iat'] ?? 0) * 1000;
      if (issuedAt < lastLogoutAt) {
        res.status(401).json({ error: 'Session has been invalidated. Please log in again.' });
        return;
      }
      req.admin = true;
      next();
    } else {
      res.status(401).json({ error: 'Invalid token' });
    }
  } catch {
    res.status(401).json({ error: 'Invalid or expired session' });
  }
}
