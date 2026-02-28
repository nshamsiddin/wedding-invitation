import { Router } from 'express';
import type { Request, Response } from 'express';
import { and, eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

const router = Router();

// GET /api/events/:slug — public endpoint for event info.
// Without a valid ?token= query param, returns only non-sensitive public info
// (name, date) to avoid exposing venue and logistics to uninvited visitors.
// With a valid token for that event, returns the full event details.
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  const slug = req.params['slug']?.toLowerCase().trim();
  if (!slug) {
    res.status(400).json({ error: 'Event slug is required' });
    return;
  }

  try {
    const rows = await db
      .select()
      .from(schema.events)
      .where(eq(schema.events.slug, slug))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const event = rows[0];
    const token = req.query['token'] as string | undefined;

    // No token provided — return only the public-facing teaser fields
    if (!token) {
      res.json({
        id: event.id,
        slug: event.slug,
        name: event.name,
        date: event.date,
        restricted: true,
      });
      return;
    }

    // Validate the token belongs to a valid (non-open, unclaimed) invitation for this event
    const invRows = await db
      .select({ id: schema.guestInvitations.id })
      .from(schema.guestInvitations)
      .where(
        and(
          eq(schema.guestInvitations.token, token),
          eq(schema.guestInvitations.eventId, event.id)
        )
      )
      .limit(1);

    if (invRows.length === 0) {
      // Token doesn't match this event — return restricted teaser
      res.json({
        id: event.id,
        slug: event.slug,
        name: event.name,
        date: event.date,
        restricted: true,
      });
      return;
    }

    // Token is valid for this event — return full details
    res.json({
      id: event.id,
      slug: event.slug,
      name: event.name,
      date: event.date,
      time: event.time,
      venueName: event.venueName,
      venueAddress: event.venueAddress,
      dressCode: event.dressCode,
      mapsUrl: event.mapsUrl,
    });
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

export default router;
