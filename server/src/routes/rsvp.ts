import { Router } from 'express';
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { rsvpFormSchema } from '@invitation/shared';
import { rsvpRateLimit } from '../middleware/rateLimit.js';

const router = Router();

router.get('/:email', async (req: Request, res: Response): Promise<void> => {
  const rawEmail = req.params['email'];
  if (!rawEmail) {
    res.status(400).json({ error: 'Email parameter is required' });
    return;
  }
  const email = rawEmail.toLowerCase().trim();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  try {
    const guest = await db
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.email, email))
      .limit(1);

    if (guest.length === 0) {
      res.json({ exists: false });
      return;
    }

    res.json({ exists: true, guest: guest[0] });
  } catch (error) {
    console.error('RSVP check error:', error);
    res.status(500).json({ error: 'Failed to check RSVP status' });
  }
});

router.post('/', rsvpRateLimit, async (req: Request, res: Response): Promise<void> => {
  const parsed = rsvpFormSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { name, email, status, guestCount, dietary, message } = parsed.data;
  const now = new Date().toISOString();

  try {
    const existing = await db
      .select({ id: schema.guests.id })
      .from(schema.guests)
      .where(eq(schema.guests.email, email))
      .limit(1);

    if (existing.length > 0) {
      const updated = await db
        .update(schema.guests)
        .set({
          name,
          status,
          guestCount: status === 'attending' ? (guestCount ?? 1) : 1,
          dietary: dietary ?? null,
          message: message ?? null,
          updatedAt: now,
        })
        .where(eq(schema.guests.email, email))
        .returning();

      res.json({ guest: updated[0], updated: true });
      return;
    }

    const inserted = await db
      .insert(schema.guests)
      .values({
        name,
        email,
        status,
        guestCount: status === 'attending' ? (guestCount ?? 1) : 1,
        dietary: dietary ?? null,
        message: message ?? null,
      })
      .returning();

    res.status(201).json({ guest: inserted[0], updated: false });
  } catch (error) {
    console.error('RSVP submit error:', error);
    res.status(500).json({ error: 'Failed to save RSVP. Please try again.' });
  }
});

export default router;
