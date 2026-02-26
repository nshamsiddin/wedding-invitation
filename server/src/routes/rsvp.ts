import { Router } from 'express';
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import { rsvpSubmitSchema } from '@invitation/shared';
import { rsvpRateLimit } from '../middleware/rateLimit.js';

const router = Router();

// GET /api/rsvp/token/:token — pre-fill invite page from a personal link
router.get('/token/:token', async (req: Request, res: Response): Promise<void> => {
  const token = req.params['token']?.trim();
  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  try {
    const rows = await db
      .select({
        invId: schema.guestInvitations.id,
        invToken: schema.guestInvitations.token,
        invStatus: schema.guestInvitations.status,
        invGuestCount: schema.guestInvitations.guestCount,
        invDietary: schema.guestInvitations.dietary,
        invMessage: schema.guestInvitations.message,
        invUpdatedAt: schema.guestInvitations.updatedAt,
        guestId: schema.guests.id,
        guestName: schema.guests.name,
        guestEmail: schema.guests.email,
        eventId: schema.events.id,
        eventSlug: schema.events.slug,
        eventName: schema.events.name,
        eventDate: schema.events.date,
        eventTime: schema.events.time,
        eventVenueName: schema.events.venueName,
        eventVenueAddress: schema.events.venueAddress,
        eventDressCode: schema.events.dressCode,
        eventMapsUrl: schema.events.mapsUrl,
      })
      .from(schema.guestInvitations)
      .innerJoin(schema.guests, eq(schema.guests.id, schema.guestInvitations.guestId))
      .innerJoin(schema.events, eq(schema.events.id, schema.guestInvitations.eventId))
      .where(eq(schema.guestInvitations.token, token))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    const r = rows[0];
    res.json({
      invitation: {
        id: r.invId,
        token: r.invToken,
        status: r.invStatus,
        guestCount: r.invGuestCount,
        dietary: r.invDietary,
        message: r.invMessage,
        updatedAt: r.invUpdatedAt,
      },
      guest: {
        id: r.guestId,
        name: r.guestName,
        email: r.guestEmail,
      },
      event: {
        id: r.eventId,
        slug: r.eventSlug,
        name: r.eventName,
        date: r.eventDate,
        time: r.eventTime,
        venueName: r.eventVenueName,
        venueAddress: r.eventVenueAddress,
        dressCode: r.eventDressCode,
        mapsUrl: r.eventMapsUrl,
      },
    });
  } catch (error) {
    console.error('Token lookup error:', error);
    res.status(500).json({ error: 'Failed to fetch invitation' });
  }
});

// POST /api/rsvp — submit or update RSVP (token-based only)
// Anonymous slug+email submissions are intentionally removed;
// every guest must use their unique personal link to RSVP.
router.post('/', rsvpRateLimit, async (req: Request, res: Response): Promise<void> => {
  const parsed = rsvpSubmitSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const data = parsed.data;

  if (!('token' in data) || !data.token) {
    res.status(403).json({ error: 'A personal invitation token is required to RSVP.' });
    return;
  }

  const now = new Date().toISOString();

  try {
    const existing = await db
      .select({ id: schema.guestInvitations.id })
      .from(schema.guestInvitations)
      .where(eq(schema.guestInvitations.token, data.token))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: 'Invitation not found. Please check your personal link.' });
      return;
    }

    const updated = await db
      .update(schema.guestInvitations)
      .set({
        status: data.status,
        guestCount: data.status === 'attending' ? (data.guestCount ?? 1) : 1,
        dietary: data.dietary ?? null,
        message: data.message ?? null,
        updatedAt: now,
      })
      .where(eq(schema.guestInvitations.token, data.token))
      .returning();

    res.json({ invitation: updated[0], updated: true });
  } catch (error) {
    console.error('RSVP submit error:', error);
    res.status(500).json({ error: 'Failed to save RSVP. Please try again.' });
  }
});

export default router;
