import { Router } from 'express';
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';
import logger from '../lib/logger.js';

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
    // Cache teaser data for 5 minutes in shared caches (CDN/proxy); allow serving
    // stale while revalidating for up to 60 s to keep latency low for guests.
    // Event details rarely change once published, so a short TTL is sufficient.
    res.setHeader('Cache-Control', 'public, max-age=300, stale-while-revalidate=60');
    res.json({
      id: event.id,
      slug: event.slug,
      name: event.name,
      date: event.date,
      restricted: true,
    });
  } catch (error) {
    logger.error({ err: error, slug }, 'event fetch error');
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

export default router;
