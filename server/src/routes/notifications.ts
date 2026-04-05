import { Router } from 'express';
import type { Request, Response } from 'express';
import { sqlite } from '../db/index.js';
import { requireAuth } from '../middleware/auth.js';
import logger from '../lib/logger.js';

const router = Router();

// All notification endpoints require admin auth
router.use(requireAuth);

export interface NotificationRow {
  id: number;
  type: string;
  guest_name: string;
  event_slug: string;
  event_name: string;
  status: string;
  guest_count: number;
  message: string | null;
  invitation_id: number;
  guest_id: number | null;
  is_read: number;
  created_at: string;
}

function rowToNotification(r: NotificationRow) {
  return {
    id: r.id,
    type: r.type,
    guestName: r.guest_name,
    eventSlug: r.event_slug,
    eventName: r.event_name,
    status: r.status,
    guestCount: r.guest_count,
    message: r.message,
    invitationId: r.invitation_id,
    guestId: r.guest_id,
    isRead: Boolean(r.is_read),
    createdAt: r.created_at,
  };
}

// GET /api/admin/notifications
// Query params: unread=true, page=1, limit=20
router.get('/', (_req: Request, res: Response): void => {
  try {
    const page  = Math.max(1, parseInt(String(_req.query['page']  ?? 1), 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(String(_req.query['limit'] ?? 20), 10) || 20));
    const unreadOnly = _req.query['unread'] === 'true';
    const offset = (page - 1) * limit;

    const whereClause = unreadOnly ? 'WHERE is_read = 0' : '';

    const rows = sqlite
      .prepare(
        `SELECT * FROM notifications ${whereClause}
         ORDER BY created_at DESC
         LIMIT ? OFFSET ?`
      )
      .all(limit, offset) as NotificationRow[];

    const { count } = sqlite
      .prepare(`SELECT COUNT(*) AS count FROM notifications ${whereClause}`)
      .get() as { count: number };

    res.json({
      notifications: rows.map(rowToNotification),
      total: count,
      page,
      limit,
    });
  } catch (error) {
    logger.error({ err: error }, 'notifications list error');
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/admin/notifications/unread-count
router.get('/unread-count', (_req: Request, res: Response): void => {
  try {
    const { count } = sqlite
      .prepare('SELECT COUNT(*) AS count FROM notifications WHERE is_read = 0')
      .get() as { count: number };
    res.json({ count });
  } catch (error) {
    logger.error({ err: error }, 'notifications unread-count error');
    res.status(500).json({ error: 'Failed to fetch unread count' });
  }
});

// PATCH /api/admin/notifications/read-all
router.patch('/read-all', (_req: Request, res: Response): void => {
  try {
    sqlite.prepare('UPDATE notifications SET is_read = 1 WHERE is_read = 0').run();
    res.json({ ok: true });
  } catch (error) {
    logger.error({ err: error }, 'notifications read-all error');
    res.status(500).json({ error: 'Failed to mark notifications as read' });
  }
});

// PATCH /api/admin/notifications/:id/read
router.patch('/:id/read', (req: Request, res: Response): void => {
  const id = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid notification id' });
    return;
  }
  try {
    const result = sqlite
      .prepare('UPDATE notifications SET is_read = 1 WHERE id = ?')
      .run(id);
    if (result.changes === 0) {
      res.status(404).json({ error: 'Notification not found' });
      return;
    }
    res.json({ ok: true });
  } catch (error) {
    logger.error({ err: error }, 'notifications mark-read error');
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

export default router;
