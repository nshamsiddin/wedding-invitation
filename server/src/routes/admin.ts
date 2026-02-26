import { Router } from 'express';
import type { Request, Response } from 'express';
import { and, eq, like, or } from 'drizzle-orm';
import jwt from 'jsonwebtoken';
import { db, schema } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import { adminLoginSchema, addGuestSchema, updateGuestSchema } from '@invitation/shared';
import { guestsToCSV } from '../lib/csv.js';

const router = Router();

router.post('/login', async (req: Request, res: Response): Promise<void> => {
  const parsed = adminLoginSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Invalid credentials format' });
    return;
  }

  const { username, password } = parsed.data;
  const expectedUsername = process.env.ADMIN_USERNAME;
  const expectedPassword = process.env.ADMIN_PASSWORD;
  const jwtSecret = process.env.JWT_SECRET;

  if (!expectedUsername || !expectedPassword || !jwtSecret) {
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  if (username !== expectedUsername || password !== expectedPassword) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  const token = jwt.sign({ admin: true }, jwtSecret, { expiresIn: '24h' });

  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000,
  });

  res.json({ ok: true });
});

router.post('/logout', (_req: Request, res: Response): void => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (_req: Request, res: Response): void => {
  res.json({ admin: true });
});

router.get('/stats', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await db
      .select({
        status: schema.guests.status,
        guestCount: schema.guests.guestCount,
      })
      .from(schema.guests);

    const stats = {
      total: rows.length,
      attending: 0,
      declined: 0,
      maybe: 0,
      pending: 0,
      totalHeadcount: 0,
    };

    for (const row of rows) {
      if (row.status === 'attending') {
        stats.attending++;
        stats.totalHeadcount += row.guestCount;
      } else if (row.status === 'declined') {
        stats.declined++;
      } else if (row.status === 'maybe') {
        stats.maybe++;
      } else {
        stats.pending++;
      }
    }

    res.json(stats);
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

router.get('/guests', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const status = req.query['status'] as string | undefined;
  const search = req.query['search'] as string | undefined;

  try {
    const conditions = [];

    if (status && ['attending', 'declined', 'maybe', 'pending'].includes(status)) {
      conditions.push(eq(schema.guests.status, status as 'attending' | 'declined' | 'maybe' | 'pending'));
    }

    if (search && search.trim().length > 0) {
      const term = `%${search.trim()}%`;
      conditions.push(
        or(
          like(schema.guests.name, term),
          like(schema.guests.email, term)
        )
      );
    }

    const guests = await db
      .select()
      .from(schema.guests)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(guests);
  } catch (error) {
    console.error('Guest list error:', error);
    res.status(500).json({ error: 'Failed to fetch guests' });
  }
});

router.post('/guests', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = addGuestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { name, email, status, guestCount, dietary, message } = parsed.data;

  try {
    const existing = await db
      .select({ id: schema.guests.id })
      .from(schema.guests)
      .where(eq(schema.guests.email, email))
      .limit(1);

    if (existing.length > 0) {
      res.status(409).json({ error: 'A guest with this email already exists' });
      return;
    }

    const inserted = await db
      .insert(schema.guests)
      .values({
        name,
        email,
        status,
        guestCount,
        dietary: dietary ?? null,
        message: message ?? null,
      })
      .returning();

    res.status(201).json(inserted[0]);
  } catch (error) {
    console.error('Add guest error:', error);
    res.status(500).json({ error: 'Failed to add guest' });
  }
});

router.put('/guests/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid guest ID' });
    return;
  }

  const parsed = updateGuestSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const updates = parsed.data;
  const now = new Date().toISOString();

  try {
    const existing = await db
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: 'Guest not found' });
      return;
    }

    const updated = await db
      .update(schema.guests)
      .set({
        ...updates,
        dietary: updates.dietary !== undefined ? (updates.dietary || null) : undefined,
        message: updates.message !== undefined ? (updates.message || null) : undefined,
        updatedAt: now,
      })
      .where(eq(schema.guests.id, id))
      .returning();

    res.json(updated[0]);
  } catch (error) {
    console.error('Update guest error:', error);
    res.status(500).json({ error: 'Failed to update guest' });
  }
});

router.delete('/guests/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid guest ID' });
    return;
  }

  try {
    const deleted = await db
      .delete(schema.guests)
      .where(eq(schema.guests.id, id))
      .returning({ id: schema.guests.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: 'Guest not found' });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete guest error:', error);
    res.status(500).json({ error: 'Failed to delete guest' });
  }
});

router.get('/export', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const guests = await db.select().from(schema.guests);
    const csv = guestsToCSV(guests);

    const filename = `guests-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export guest list' });
  }
});

export default router;
