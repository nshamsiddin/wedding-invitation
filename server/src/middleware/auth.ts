import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getLastLogoutAt, recordLogout } from '../lib/adminSession.js';

export { recordLogout };

export interface AuthenticatedRequest extends Request {
  admin?: boolean;
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
      // getLastLogoutAt() reads from an in-memory cache seeded from SQLite at
      // startup, so this is zero-cost on the hot path while surviving restarts.
      const issuedAt = (payload['iat'] ?? 0) * 1000;
      if (issuedAt < getLastLogoutAt()) {
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
