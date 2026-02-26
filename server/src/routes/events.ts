import { Router } from 'express';
import type { Request, Response } from 'express';
import { eq } from 'drizzle-orm';
import { db, schema } from '../db/index.js';

const router = Router();

// GET /api/events/:slug — public, returns event details for the invitation page
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

    res.json(rows[0]);
  } catch (error) {
    console.error('Event fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch event details' });
  }
});

export default router;
