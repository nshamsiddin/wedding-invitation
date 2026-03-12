import { Router } from 'express';
import type { Request, Response } from 'express';
import { and, desc, eq, inArray, isNull, isNotNull, or, sql } from 'drizzle-orm';
import { randomUUID, timingSafeEqual } from 'crypto';
import jwt from 'jsonwebtoken';
// bcryptjs is used for password hashing support ($2b$ prefix detection).
// It is the pure-JS alternative to bcrypt — no native compilation required.
import bcrypt from 'bcryptjs';
import { db, schema, sqlite } from '../db/index.js';
import { requireAuth, recordLogout } from '../middleware/auth.js';
import { loginRateLimit } from '../middleware/rateLimit.js';
import {
  adminLoginSchema,
  addGuestSchema,
  updateGuestContactSchema,
  updateInvitationSchema,
  addInvitationSchema,
  createOpenInvitationSchema,
} from '@invitation/shared';
import { toCSV } from '../lib/csv.js';
import type { AttendanceStatus } from '@invitation/shared';

const router = Router();

// Returns true when a SQLite UNIQUE constraint violation caused the error.
// Used to convert DB-level uniqueness failures into 409 responses without a
// pre-insert SELECT, which would introduce a TOCTOU race condition.
function isUniqueConstraintError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code: unknown }).code === 'SQLITE_CONSTRAINT_UNIQUE'
  );
}

// ─── Auth ────────────────────────────────────────────────────────────────────

router.post('/login', loginRateLimit, async (req: Request, res: Response): Promise<void> => {
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

  if (username !== expectedUsername) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  // If ADMIN_PASSWORD starts with $2b$, treat it as a bcrypt hash and compare accordingly.
  // Otherwise fall back to a constant-time comparison to prevent timing attacks.
  // To generate a bcrypt hash: node -e "require('bcryptjs').hash('your-password', 12).then(console.log)"
  let passwordMatch = false;
  if (expectedPassword.startsWith('$2b$')) {
    passwordMatch = await bcrypt.compare(password, expectedPassword);
  } else {
    // timingSafeEqual requires equal-length buffers; pad to the longer of the two so
    // the comparison time does not vary with input length.
    const a = Buffer.from(password);
    const b = Buffer.from(expectedPassword);
    const len = Math.max(a.length, b.length);
    const aPadded = Buffer.concat([a, Buffer.alloc(len - a.length)]);
    const bPadded = Buffer.concat([b, Buffer.alloc(len - b.length)]);
    passwordMatch = a.length === b.length && timingSafeEqual(aPadded, bPadded);
  }

  if (!passwordMatch) {
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
  recordLogout();
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, (_req: Request, res: Response): void => {
  res.json({ admin: true });
});

// ─── Events (with per-event stats) ──────────────────────────────────────────

router.get('/events', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const eventRows = await db.select().from(schema.events);
    const invRows = await db
      .select({
        eventId: schema.guestInvitations.eventId,
        status: schema.guestInvitations.status,
        guestCount: schema.guestInvitations.guestCount,
        isOpen: schema.guestInvitations.isOpen,
        claimedAt: schema.guestInvitations.claimedAt,
      })
      .from(schema.guestInvitations);

    const statsMap = new Map<number, {
      total: number; attending: number; declined: number;
      maybe: number; pending: number; totalHeadcount: number;
    }>();

    for (const e of eventRows) {
      statsMap.set(e.id, { total: 0, attending: 0, declined: 0, maybe: 0, pending: 0, totalHeadcount: 0 });
    }
    for (const inv of invRows) {
      // Exclude unclaimed open invitations from stats (they have no confirmed status)
      if (inv.isOpen && !inv.claimedAt) continue;
      const s = statsMap.get(inv.eventId);
      if (!s) continue;
      s.total++;
      if (inv.status === 'attending') { s.attending++; s.totalHeadcount += inv.guestCount; }
      else if (inv.status === 'declined') s.declined++;
      else if (inv.status === 'maybe') s.maybe++;
      else s.pending++;
    }

    res.json(
      eventRows.map((e) => ({
        id: e.id,
        slug: e.slug,
        name: e.name,
        date: e.date,
        time: e.time,
        venueName: e.venueName,
        venueAddress: e.venueAddress,
        dressCode: e.dressCode,
        mapsUrl: e.mapsUrl,
        stats: statsMap.get(e.id) ?? { total: 0, attending: 0, declined: 0, maybe: 0, pending: 0, totalHeadcount: 0 },
      }))
    );
  } catch (error) {
    console.error('Admin events error:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// ─── Guests (with their invitations) ────────────────────────────────────────

router.get('/guests', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const eventId = req.query['eventId'] ? parseInt(req.query['eventId'] as string, 10) : undefined;
  const status = req.query['status'] as string | undefined;
  const search = req.query['search'] as string | undefined;

  try {
    // Resolve which guest IDs match the event/status filter
    let matchingGuestIds: number[] | null = null;
    if (eventId || (status && status !== '')) {
      const invConditions = [];
      if (eventId && !isNaN(eventId)) invConditions.push(eq(schema.guestInvitations.eventId, eventId));
      if (status) {
        // Support comma-separated statuses for multi-select filtering (e.g. "attending,maybe")
        const VALID = ['attending', 'declined', 'maybe', 'pending'] as const;
        const requested = status
          .split(',')
          .map((s) => s.trim())
          .filter((s): s is AttendanceStatus => VALID.includes(s as AttendanceStatus));
        if (requested.length === 1) {
          invConditions.push(eq(schema.guestInvitations.status, requested[0]));
        } else if (requested.length > 1) {
          invConditions.push(inArray(schema.guestInvitations.status, requested));
        }
      }

      if (invConditions.length > 0) {
        const matchingInvs = await db
          .selectDistinct({ guestId: schema.guestInvitations.guestId })
          .from(schema.guestInvitations)
          .where(and(...invConditions, isNotNull(schema.guestInvitations.guestId)));
        // Filter out null guestIds (open invitations have no guest)
        matchingGuestIds = matchingInvs
          .map((r) => r.guestId)
          .filter((id): id is number => id !== null);
        if (matchingGuestIds.length === 0) {
          res.json([]);
          return;
        }
      }
    }

    // Build guest WHERE conditions
    const guestConditions = [];
    if (search && search.trim().length > 0) {
      // Escape SQLite LIKE wildcards (% and _) in the search term so that
      // a search for e.g. "%" does not accidentally match all guests.
      const rawTerm = search.trim();
      const escapedTerm = rawTerm.replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
      const term = `%${escapedTerm}%`;
      guestConditions.push(
        sql`${schema.guests.name} LIKE ${term} ESCAPE '\\'`,
      );
    }
    if (matchingGuestIds !== null) {
      guestConditions.push(inArray(schema.guests.id, matchingGuestIds));
    }

    // Fetch guests
    const guestRows = await db
      .select()
      .from(schema.guests)
      .where(guestConditions.length > 0 ? and(...guestConditions) : undefined)
      .orderBy(desc(schema.guests.createdAt));

    if (guestRows.length === 0) {
      res.json([]);
      return;
    }

    // Fetch all invitations for those guests in one query
    const guestIds = guestRows.map((g) => g.id);
    const invRows = await db
      .select({
        id: schema.guestInvitations.id,
        guestId: schema.guestInvitations.guestId,
        eventId: schema.guestInvitations.eventId,
        token: schema.guestInvitations.token,
        status: schema.guestInvitations.status,
        guestCount: schema.guestInvitations.guestCount,
        dietary: schema.guestInvitations.dietary,
        partnerDietary: schema.guestInvitations.partnerDietary,
        message: schema.guestInvitations.message,
        tableNumber: schema.guestInvitations.tableNumber,
        language: schema.guestInvitations.language,
        isOpen: schema.guestInvitations.isOpen,
        claimedAt: schema.guestInvitations.claimedAt,
        updatedAt: schema.guestInvitations.updatedAt,
        eventSlug: schema.events.slug,
        eventName: schema.events.name,
      })
      .from(schema.guestInvitations)
      .leftJoin(schema.events, eq(schema.events.id, schema.guestInvitations.eventId))
      .where(
        and(
          isNotNull(schema.guestInvitations.guestId),
          inArray(schema.guestInvitations.guestId, guestIds)
        )
      );

    // Aggregate
    const invMap = new Map<number, typeof invRows>();
    for (const inv of invRows) {
      if (inv.guestId === null) continue;
      const list = invMap.get(inv.guestId) ?? [];
      list.push(inv);
      invMap.set(inv.guestId, list);
    }

    const result = guestRows.map((g) => ({
      id: g.id,
      name: g.name,
      partnerName: g.partnerName ?? null,
      phone: g.phone,
      createdAt: g.createdAt,
      invitations: (invMap.get(g.id) ?? []).map((inv) => ({
        id: inv.id,
        guestId: inv.guestId,
        eventId: inv.eventId,
        eventSlug: inv.eventSlug,
        eventName: inv.eventName,
        token: inv.token,
        status: inv.status,
        guestCount: inv.guestCount,
        dietary: inv.dietary,
        partnerDietary: inv.partnerDietary ?? null,
        message: inv.message,
        tableNumber: inv.tableNumber ?? null,
        language: inv.language,
        isOpen: inv.isOpen,
        claimedAt: inv.claimedAt,
        updatedAt: inv.updatedAt,
      })),
    }));

    res.json(result);
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

  const { name, phone, partnerName, eventIds, status, guestCount, dietary, message, tableNumber, language } = parsed.data;

  try {
    // Wrap guest + invitation creation in a single transaction so a partial failure
    // (e.g. a duplicate event ID mid-loop) never leaves an orphaned guest record.
    type AddResult =
      | { ok: true; guest: typeof schema.guests.$inferSelect; invitations: (typeof schema.guestInvitations.$inferSelect)[] };

    const addTransaction = sqlite.transaction((): AddResult => {
      const guest = sqlite
        .prepare(
          'INSERT INTO guests (name, phone, partner_name) VALUES (?, ?, ?) RETURNING *'
        )
        .get(name, phone ?? null, partnerName ?? null) as typeof schema.guests.$inferSelect;

      const invitations: (typeof schema.guestInvitations.$inferSelect)[] = [];
      for (const eventId of eventIds) {
        const inv = sqlite
          .prepare(
            `INSERT INTO guest_invitations
               (guest_id, event_id, token, status, guest_count, dietary, message, table_number, language)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING *`
          )
          .get(
            guest.id,
            eventId,
            randomUUID(),
            status ?? 'pending',
            guestCount ?? 1,
            dietary ?? null,
            message ?? null,
            tableNumber ?? null,
            language ?? 'en',
          ) as typeof schema.guestInvitations.$inferSelect;
        invitations.push(inv);
      }

      return { ok: true, guest, invitations };
    });

    const result = addTransaction();

    res.status(201).json({ guest: result.guest, invitations: result.invitations });
  } catch (error: unknown) {
    console.error('Add guest error:', error);
    if (isUniqueConstraintError(error)) {
      res.status(409).json({ error: 'Duplicate entry' });
      return;
    }
    res.status(500).json({ error: 'Failed to add guest' });
  }
});

// Shared handler for updating guest contact details (used by both PUT and PATCH)
async function handleUpdateGuest(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid guest ID' });
    return;
  }

  const parsed = updateGuestContactSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  try {
    const existing = await db
      .select({ id: schema.guests.id })
      .from(schema.guests)
      .where(eq(schema.guests.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: 'Guest not found' });
      return;
    }

    const [updated] = await db
      .update(schema.guests)
      .set(parsed.data)
      .where(eq(schema.guests.id, id))
      .returning();

    res.json(updated);
  } catch (error: unknown) {
    console.error('Update guest error:', error);
    if (isUniqueConstraintError(error)) {
      res.status(409).json({ error: 'Duplicate entry' });
      return;
    }
    res.status(500).json({ error: 'Failed to update guest' });
  }
}

// Keep both PUT and PATCH for backward compatibility
router.put('/guests/:id', requireAuth, handleUpdateGuest);
router.patch('/guests/:id', requireAuth, handleUpdateGuest);

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

// ─── Invitations ─────────────────────────────────────────────────────────────

// POST /api/admin/invitations/open — create a generic (open) invitation link
// Must be defined before /api/admin/invitations/:id to avoid route shadowing
router.post('/invitations/open', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = createOpenInvitationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { eventIds, isPublic } = parsed.data;

  try {
    // Verify all event IDs exist
    for (const eventId of eventIds) {
      const exists = await db
        .select({ id: schema.events.id })
        .from(schema.events)
        .where(eq(schema.events.id, eventId))
        .limit(1);
      if (exists.length === 0) {
        res.status(404).json({ error: `Event ${eventId} not found` });
        return;
      }
    }

    // Create one open invitation per event (each with a unique token)
    const createdInvitations = [];
    for (const eventId of eventIds) {
      const [inv] = await db
        .insert(schema.guestInvitations)
        .values({
          guestId: null,
          eventId,
          token: randomUUID(),
          status: 'pending',
          guestCount: 1,
          isOpen: true,
          isPublic: isPublic ?? false,
          claimedAt: null,
        })
        .returning();

      const eventRow = await db
        .select({ slug: schema.events.slug, name: schema.events.name })
        .from(schema.events)
        .where(eq(schema.events.id, eventId))
        .limit(1);

      const baseUrl = process.env.BASE_URL ?? 'http://localhost:5173';
      createdInvitations.push({
        id: inv.id,
        token: inv.token,
        isOpen: true,
        isPublic: isPublic ?? false,
        claimedAt: null,
        eventId: inv.eventId,
        eventSlug: eventRow[0]?.slug ?? null,
        eventName: eventRow[0]?.name ?? null,
        url: `${baseUrl}/invite/${inv.token}`,
        createdAt: inv.createdAt,
      });
    }

    res.status(201).json(createdInvitations);
  } catch (error) {
    console.error('Create open invitation error:', error);
    res.status(500).json({ error: 'Failed to create open invitation' });
  }
});

// GET /api/admin/invitations/open — list open invitations (public links always; one-time links only while unclaimed)
router.get('/invitations/open', requireAuth, async (_req: Request, res: Response): Promise<void> => {
  try {
    const rows = await db
      .select({
        id: schema.guestInvitations.id,
        token: schema.guestInvitations.token,
        isOpen: schema.guestInvitations.isOpen,
        isPublic: schema.guestInvitations.isPublic,
        claimedAt: schema.guestInvitations.claimedAt,
        eventId: schema.guestInvitations.eventId,
        createdAt: schema.guestInvitations.createdAt,
        eventSlug: schema.events.slug,
        eventName: schema.events.name,
      })
      .from(schema.guestInvitations)
      .leftJoin(schema.events, eq(schema.events.id, schema.guestInvitations.eventId))
      // Public links are shown always; one-time links only while unclaimed.
      // Using or() directly in the WHERE clause avoids loading all claimed rows
      // into memory only to discard them in JavaScript.
      .where(
        and(
          eq(schema.guestInvitations.isOpen, true),
          or(
            eq(schema.guestInvitations.isPublic, true),
            isNull(schema.guestInvitations.claimedAt),
          ),
        )
      )
      .orderBy(desc(schema.guestInvitations.createdAt));

    const baseUrl = process.env.BASE_URL ?? 'http://localhost:5173';
    res.json(
      rows.map((r) => ({
        id: r.id,
        token: r.token,
        isOpen: r.isOpen,
        isPublic: Boolean(r.isPublic),
        claimedAt: r.claimedAt,
        eventId: r.eventId,
        eventSlug: r.eventSlug,
        eventName: r.eventName,
        url: `${baseUrl}/invite/${r.token}`,
        createdAt: r.createdAt,
      }))
    );
  } catch (error) {
    console.error('List open invitations error:', error);
    res.status(500).json({ error: 'Failed to fetch open invitations' });
  }
});

router.post('/invitations', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const parsed = addInvitationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { guestId, eventId, status, guestCount, language } = parsed.data;

  try {
    const guestExists = await db
      .select({ id: schema.guests.id })
      .from(schema.guests)
      .where(eq(schema.guests.id, guestId))
      .limit(1);

    if (guestExists.length === 0) {
      res.status(404).json({ error: 'Guest not found' });
      return;
    }

    const eventExists = await db
      .select({ id: schema.events.id })
      .from(schema.events)
      .where(eq(schema.events.id, eventId))
      .limit(1);

    if (eventExists.length === 0) {
      res.status(404).json({ error: 'Event not found' });
      return;
    }

    const [inv] = await db
      .insert(schema.guestInvitations)
      .values({
        guestId,
        eventId,
        token: randomUUID(),
        status: status ?? 'pending',
        guestCount: guestCount ?? 1,
        language: language ?? 'en',
      })
      .returning();

    res.status(201).json(inv);
  } catch (error) {
    console.error('Add invitation error:', error);
    // SQLite UNIQUE constraint on (guest_id, event_id) will throw here
    res.status(409).json({ error: 'This guest already has an invitation for this event' });
  }
});

// Shared handler for invitation updates (PUT and PATCH)
async function handleUpdateInvitation(req: Request, res: Response): Promise<void> {
  const id = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid invitation ID' });
    return;
  }

  const parsed = updateInvitationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const now = new Date().toISOString();
  const updates = parsed.data;

  try {
    const existing = await db
      .select({ id: schema.guestInvitations.id })
      .from(schema.guestInvitations)
      .where(eq(schema.guestInvitations.id, id))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    const [updated] = await db
      .update(schema.guestInvitations)
      .set({
        ...updates,
        dietary: updates.dietary !== undefined ? (updates.dietary || null) : undefined,
        partnerDietary: updates.partnerDietary !== undefined ? (updates.partnerDietary || null) : undefined,
        message: updates.message !== undefined ? (updates.message || null) : undefined,
        updatedAt: now,
      })
      .where(eq(schema.guestInvitations.id, id))
      .returning();

    res.json(updated);
  } catch (error) {
    console.error('Update invitation error:', error);
    res.status(500).json({ error: 'Failed to update invitation' });
  }
}

// Keep both PUT and PATCH for backward compatibility
router.put('/invitations/:id', requireAuth, handleUpdateInvitation);
router.patch('/invitations/:id', requireAuth, handleUpdateInvitation);

router.delete('/invitations/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid invitation ID' });
    return;
  }

  try {
    const deleted = await db
      .delete(schema.guestInvitations)
      .where(eq(schema.guestInvitations.id, id))
      .returning({ id: schema.guestInvitations.id });

    if (deleted.length === 0) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    res.json({ ok: true });
  } catch (error) {
    console.error('Delete invitation error:', error);
    res.status(500).json({ error: 'Failed to delete invitation' });
  }
});

// GET /api/admin/invitations/:id/link — returns the shareable invite URL
router.get('/invitations/:id/link', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const id = parseInt(req.params['id'] ?? '', 10);
  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid invitation ID' });
    return;
  }

  try {
    const rows = await db
      .select({ token: schema.guestInvitations.token })
      .from(schema.guestInvitations)
      .where(eq(schema.guestInvitations.id, id))
      .limit(1);

    if (rows.length === 0) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    const baseUrl = process.env.BASE_URL ?? `http://localhost:5173`;
    res.json({ url: `${baseUrl}/invite/${rows[0].token}` });
  } catch (error) {
    console.error('Get link error:', error);
    res.status(500).json({ error: 'Failed to get invite link' });
  }
});

// ─── Export ───────────────────────────────────────────────────────────────────

router.get('/export', requireAuth, async (req: Request, res: Response): Promise<void> => {
  const eventId = req.query['eventId'] ? parseInt(req.query['eventId'] as string, 10) : undefined;

  try {
    const conditions = [];
    if (eventId && !isNaN(eventId)) {
      conditions.push(eq(schema.guestInvitations.eventId, eventId));
    }
    // Only export claimed/personal invitations (those with a guest record)
    conditions.push(isNotNull(schema.guestInvitations.guestId));

    const rows = await db
      .select({
        guestId: schema.guests.id,
        name: schema.guests.name,
        partnerName: schema.guests.partnerName,
        phone: schema.guests.phone,
        eventName: schema.events.name,
        eventSlug: schema.events.slug,
        status: schema.guestInvitations.status,
        guestCount: schema.guestInvitations.guestCount,
        dietary: schema.guestInvitations.dietary,
        partnerDietary: schema.guestInvitations.partnerDietary,
        message: schema.guestInvitations.message,
        tableNumber: schema.guestInvitations.tableNumber,
        rsvpDate: schema.guestInvitations.createdAt,
        updatedAt: schema.guestInvitations.updatedAt,
      })
      .from(schema.guestInvitations)
      .innerJoin(schema.guests, eq(schema.guests.id, schema.guestInvitations.guestId))
      .innerJoin(schema.events, eq(schema.events.id, schema.guestInvitations.eventId))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(schema.events.slug, schema.guests.name);

    const csv = toCSV(rows);
    const suffix = eventId ? `-event-${eventId}` : '-all-events';
    const filename = `guests${suffix}-${new Date().toISOString().split('T')[0]}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ error: 'Failed to export guest list' });
  }
});

export default router;
