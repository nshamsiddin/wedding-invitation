import { Router } from 'express';
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

const router = Router();

// GET /api/events/:slug — public endpoint returning restricted event teaser info.
// Full event details (venue, dress code, maps URL) are intentionally omitted here
// to avoid exposing logistics to uninvited visitors. Authenticated guests receive
// full details via GET /api/rsvp/token/:token which validates their invitation.
//
// The previous ?token= query-string mechanism was removed because invitation tokens
// appearing in query strings are recorded in server access logs, browser history,
// and HTTP Referer headers — all of which are outside the app's control.
router.get('/:slug', async (req: Request, res: Response): Promise<void> => {
  const slug = req.params['slug']?.toLowerCase().trim();
  if (!slug) {
    res.status(400).json({ error: 'Event slug is required' });
    return;
  }

  try {
    const rows = await db
      .select({
        id: schema.events.id,
        slug: schema.events.slug,
        name: schema.events.name,
        date: schema.events.date,
      })
      .from(schema.events)
      .where(eq(schema.events.slug, slug))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const event = rows[0];
    res.json({
      id: event.id,
      slug: event.slug,
      name: event.name,
      date: event.date,
      restricted: true,
    });
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

export default router;
