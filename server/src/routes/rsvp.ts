import { Router } from 'express';
import type { Request, Response } from 'express';
import { and, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db, schema, sqlite } from '../db/index.js';
import { rsvpSubmitSchema, claimInvitationSchema, publicRsvpSchema, publicPageRsvpSchema } from '@invitation/shared';
import { rsvpRateLimit, claimRateLimit, tokenLookupRateLimit } from '../middleware/rateLimit.js';
import logger from '../lib/logger.js';

const router = Router();

// Returns true when the event date (YYYY-MM-DD) is strictly in the past (UTC day).
// A small grace period of 1 day is included so late-night attendees in UTC+offset
// time zones can still update their RSVP on the event day itself.
function isEventPast(eventDate: string | null | undefined): boolean {
  if (!eventDate) return false;
  const eventMs = new Date(`${eventDate}T00:00:00Z`).getTime();
  const nowMs   = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  return nowMs > eventMs + ONE_DAY_MS;
}

// GET /api/rsvp/token/:token — look up an invitation by its token
// Handles three cases: personal (pre-assigned), open (unclaimed), claimed (already used)
router.get('/token/:token', tokenLookupRateLimit, async (req: Request, res: Response): Promise<void> => {
  const token = req.params['token']?.trim();
  if (!token) {
    res.status(400).json({ error: 'Token is required' });
    return;
  }

  try {
    // First fetch the base invitation row
    const invRows = await db
      .select({
        invId: schema.guestInvitations.id,
        invToken: schema.guestInvitations.token,
        invStatus: schema.guestInvitations.status,
        invGuestCount: schema.guestInvitations.guestCount,
        invDietary: schema.guestInvitations.dietary,
        invPartnerDietary: schema.guestInvitations.partnerDietary,
        invMessage: schema.guestInvitations.message,
        invTableNumber: schema.guestInvitations.tableNumber,
        invLanguage: schema.guestInvitations.language,
        invUpdatedAt: schema.guestInvitations.updatedAt,
        invIsOpen: schema.guestInvitations.isOpen,
        invIsPublic: schema.guestInvitations.isPublic,
        invClaimedAt: schema.guestInvitations.claimedAt,
        invGuestId: schema.guestInvitations.guestId,
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
      .leftJoin(schema.events, eq(schema.events.id, schema.guestInvitations.eventId))
      .where(eq(schema.guestInvitations.token, token))
      .limit(1);

    if (invRows.length === 0) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    const r = invRows[0];

    // Open invitation that has already been claimed — reject further use.
    // Public links are never consumed, so skip this check for them.
    // HTTP 410 Gone is the most semantically correct status for a one-time resource
    // that has been permanently consumed. 409 Conflict implies a recoverable state;
    // a claimed invitation link is not recoverable by the same token.
    // claimedAt is included so the frontend can show when the link was registered,
    // helping guests who received a forwarded link understand what happened.
    if (r.invIsOpen && !r.invIsPublic && r.invClaimedAt !== null) {
      res.status(410).json({
        type: 'claimed',
        claimedAt: r.invClaimedAt,
        error: 'This invitation link has already been used.',
      });
      return;
    }

    // Open invitation (one-time or permanent public) — return events list for self-registration
    if (r.invIsOpen) {
      res.json({
        type: 'open',
        token: r.invToken,
        isPublic: Boolean(r.invIsPublic),
        events: [
          {
            id: r.eventId,
            slug: r.eventSlug,
            name: r.eventName,
            date: r.eventDate,
            time: r.eventTime,
            venueName: r.eventVenueName,
          },
        ],
      });
      return;
    }

    // Personal (pre-assigned) invitation — fetch the guest record
    if (r.invGuestId === null) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    const guestRows = await db
      .select({
        id: schema.guests.id,
        name: schema.guests.name,
        partnerName: schema.guests.partnerName,
      })
      .from(schema.guests)
      .where(eq(schema.guests.id, r.invGuestId))
      .limit(1);

    if (guestRows.length === 0) {
      res.status(404).json({ error: 'Guest record not found' });
      return;
    }

    res.json({
      type: 'personal',
      invitation: {
        id: r.invId,
        token: r.invToken,
        status: r.invStatus,
        guestCount: r.invGuestCount,
        dietary: r.invDietary,
        partnerDietary: r.invPartnerDietary ?? null,
        message: r.invMessage,
        tableNumber: r.invTableNumber ?? null,
        language: r.invLanguage ?? 'en',
        updatedAt: r.invUpdatedAt,
      },
      guest: {
        id: guestRows[0].id,
        name: guestRows[0].name,
        partnerName: guestRows[0].partnerName ?? null,
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
    logger.error({ err: error }, 'token lookup error');
    res.status(500).json({ error: 'Failed to fetch invitation' });
  }
});

// POST /api/rsvp — submit or update RSVP for a personal (pre-assigned) invitation.
// This endpoint is idempotent: submitting the same token multiple times performs
// an UPDATE on the existing row rather than creating a duplicate.
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
      .select({
        id: schema.guestInvitations.id,
        isOpen: schema.guestInvitations.isOpen,
        eventDate: schema.events.date,
      })
      .from(schema.guestInvitations)
      .leftJoin(schema.events, eq(schema.events.id, schema.guestInvitations.eventId))
      .where(eq(schema.guestInvitations.token, data.token))
      .limit(1);

    if (existing.length === 0) {
      res.status(404).json({ error: 'Invitation not found. Please check your personal link.' });
      return;
    }

    // Open invitations must go through the /rsvp/claim endpoint
    if (existing[0].isOpen) {
      res.status(400).json({ error: 'Open invitations must be claimed via /api/rsvp/claim.' });
      return;
    }

    // Reject RSVP submissions after the event has passed
    if (isEventPast(existing[0].eventDate)) {
      res.status(410).json({ error: 'This event has already taken place. RSVPs are no longer accepted.' });
      return;
    }

    // Idempotent UPDATE — subsequent submissions update the existing row
    const updated = await db
      .update(schema.guestInvitations)
      .set({
        status: data.status,
        guestCount: data.status === 'attending' ? (data.guestCount ?? 1) : 1,
        dietary: data.dietary ?? null,
        partnerDietary: data.partnerDietary ?? null,
        message: data.message ?? null,
        updatedAt: now,
      })
      .where(eq(schema.guestInvitations.token, data.token))
      .returning();

    // Apply name corrections to the guest record when provided
    if (data.name !== undefined || data.partnerName !== undefined) {
      const inv = updated[0];
      if (inv?.guestId) {
        const nameUpdate: Partial<typeof schema.guests.$inferInsert> = {};
        if (data.name !== undefined) nameUpdate.name = data.name;
        if (data.partnerName !== undefined) nameUpdate.partnerName = data.partnerName;
        await db
          .update(schema.guests)
          .set(nameUpdate)
          .where(eq(schema.guests.id, inv.guestId));
      }
    }

    logger.info({ token: data.token, status: data.status, guestCount: data.guestCount ?? 1 }, 'rsvp submitted');
    res.json({ invitation: updated[0], updated: true });
  } catch (error) {
    logger.error({ err: error }, 'rsvp submit error');
    res.status(500).json({ error: 'Failed to save RSVP. Please try again.' });
  }
});

// POST /api/rsvp/claim — self-register via an open invitation link.
// Rate limited to 5 claims per IP per 10 minutes to prevent abuse.
// The entire operation is wrapped in a SQLite transaction to guarantee atomicity:
// if any step fails, the DB is rolled back to its pre-claim state.
router.post('/claim', claimRateLimit, async (req: Request, res: Response): Promise<void> => {
  const parsed = claimInvitationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { token, name, partnerName, phone, rsvpEntries } = parsed.data;
  const now = new Date().toISOString();

  try {
    // Wrap all DB mutations in a single transaction.
    // better-sqlite3's transaction() is synchronous; we use it here with the
    // raw sqlite connection so Drizzle queries inside are still awaitable.
    type ClaimResult =
      | { ok: true; guest: { id: number; name: string }; invitations: unknown[] }
      | { ok: false; status: number; error: string };

    // Run the transactional logic synchronously using better-sqlite3's transaction API.
    // All individual Drizzle calls inside are themselves synchronous in the better-sqlite3 driver.
    const claimTransaction = sqlite.transaction((): ClaimResult => {
      // 1. Validate the token is an unclaimed open invitation (lock the row)
      const invRow = sqlite
        .prepare(
          `SELECT gi.*, e.date AS event_date
           FROM guest_invitations gi
           LEFT JOIN events e ON e.id = gi.event_id
           WHERE gi.token = ? AND gi.is_open = 1 AND gi.claimed_at IS NULL
           LIMIT 1`
        )
        .get(token) as {
          id: number; guest_id: number | null; event_id: number; token: string;
          status: string; guest_count: number; dietary: string | null;
          message: string | null; is_open: number; claimed_at: string | null;
          created_at: string; updated_at: string; event_date: string | null;
        } | undefined;

      if (!invRow) {
        return { ok: false, status: 404, error: 'This invitation link is invalid or has already been used.' };
      }

      if (isEventPast(invRow.event_date)) {
        return { ok: false, status: 410, error: 'This event has already taken place. RSVPs are no longer accepted.' };
      }

      // Validate that every RSVP entry references the event this token belongs to.
      // Without this check, a guest could inject additional event IDs in rsvpEntries
      // and self-register for events they were never invited to.
      if (rsvpEntries.some((e) => e.eventId !== invRow.event_id)) {
        return { ok: false, status: 400, error: 'RSVP entries must only reference your invited event.' };
      }

      // 2. Insert guest record
      let guest: { id: number; name: string };
      const result = sqlite
        .prepare(
          'INSERT INTO guests (name, phone, partner_name) VALUES (?, ?, ?) RETURNING id, name'
        )
        .get(name, phone ?? null, partnerName ?? null) as { id: number; name: string };
      guest = result;

      // 3. Claim the open invitation: assign guestId and record claimedAt
      const entry = rsvpEntries.find((e) => e.eventId === invRow.event_id) ?? rsvpEntries[0];
      sqlite
        .prepare(
          `UPDATE guest_invitations
           SET guest_id = ?, claimed_at = ?, status = ?, guest_count = ?,
               dietary = ?, partner_dietary = ?, message = ?, updated_at = ?
           WHERE id = ?`
        )
        .run(
          guest.id,
          now,
          entry.status,
          entry.status === 'attending' ? (entry.guestCount ?? 1) : 1,
          entry.dietary ?? null,
          entry.partnerDietary ?? null,
          entry.message ?? null,
          now,
          invRow.id
        );

      // 4. Create additional invitation rows for extra events in the same claim
      const additionalInvitations: unknown[] = [];
      for (const rsvpEntry of rsvpEntries) {
        if (rsvpEntry.eventId === invRow.event_id) continue;

        const alreadyExists = sqlite
          .prepare(
            'SELECT id FROM guest_invitations WHERE guest_id = ? AND event_id = ? LIMIT 1'
          )
          .get(guest.id, rsvpEntry.eventId);

        if (alreadyExists) continue;

        const newInv = sqlite
          .prepare(
            `INSERT INTO guest_invitations
               (guest_id, event_id, token, status, guest_count, dietary, partner_dietary, message)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             RETURNING id, token, status, guest_count, dietary, partner_dietary, message, updated_at`
          )
          .get(
            guest.id,
            rsvpEntry.eventId,
            randomUUID(),
            rsvpEntry.status,
            rsvpEntry.status === 'attending' ? (rsvpEntry.guestCount ?? 1) : 1,
            rsvpEntry.dietary ?? null,
            rsvpEntry.partnerDietary ?? null,
            rsvpEntry.message ?? null
          ) as {
            id: number; token: string; status: string; guest_count: number;
            dietary: string | null; partner_dietary: string | null;
            message: string | null; updated_at: string;
          };

        additionalInvitations.push({
          id: newInv.id,
          token: newInv.token,
          status: newInv.status,
          guestCount: newInv.guest_count,
          dietary: newInv.dietary,
          partnerDietary: newInv.partner_dietary,
          message: newInv.message,
          updatedAt: newInv.updated_at,
        });
      }

      return {
        ok: true,
        guest: { id: guest.id, name: guest.name },
        invitations: [
          {
            id: invRow.id,
            token: invRow.token,
            status: entry.status,
            guestCount: entry.guestCount ?? 1,
            dietary: entry.dietary ?? null,
            partnerDietary: entry.partnerDietary ?? null,
            message: entry.message ?? null,
            updatedAt: now,
          },
          ...additionalInvitations,
        ],
      };
    });

    const result = claimTransaction();

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    logger.info({ token, guestId: result.guest.id, name: result.guest.name }, 'invitation claimed');
    res.status(201).json({
      guest: result.guest,
      invitations: result.invitations,
    });
  } catch (error) {
    logger.error({ err: error }, 'claim invitation error');
    res.status(500).json({ error: 'Failed to process registration. Please try again.' });
  }
});

// POST /api/rsvp/public — submit an RSVP via a permanent public link.
// Unlike /claim, the template row is never mutated: a new guest + invitation row are
// created for each submission. Phone number is used for deduplication.
// Only rows created by this flow (source = 'public_rsvp') are ever updated —
// admin-curated personal invitations (source = 'admin') are never touched.
router.post('/public', claimRateLimit, async (req: Request, res: Response): Promise<void> => {
  const parsed = publicRsvpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  // phone is required by publicRsvpSchema (min 6 chars), so it is always present.
  const { token, name, partnerName, phone, status, guestCount, dietary, partnerDietary, message, eventId } = parsed.data;
  const now = new Date().toISOString();

  try {
    type PublicResult =
      | { ok: true; guestId: number; invitationId: number }
      | { ok: false; status: number; error: string };

    const publicTransaction = sqlite.transaction((): PublicResult => {
      // 1. Validate the token is a permanent public invitation for the given event
      const templateRow = sqlite
        .prepare(
          `SELECT gi.id, gi.event_id, e.date AS event_date
           FROM guest_invitations gi
           LEFT JOIN events e ON e.id = gi.event_id
           WHERE gi.token = ? AND gi.is_open = 1 AND gi.is_public = 1 AND gi.event_id = ?
           LIMIT 1`
        )
        .get(token, eventId) as { id: number; event_id: number; event_date: string | null } | undefined;

      if (!templateRow) {
        return { ok: false, status: 404, error: 'Public invitation link not found or invalid.' };
      }

      if (isEventPast(templateRow.event_date)) {
        return { ok: false, status: 410, error: 'This event has already taken place. RSVPs are no longer accepted.' };
      }

      // 2. Phone-based deduplication — reuse existing guest if phone matches
      const existingByPhone = sqlite
        .prepare('SELECT id FROM guests WHERE phone = ? LIMIT 1')
        .get(phone) as { id: number } | undefined;

      let guestId: number;
      if (existingByPhone) {
        guestId = existingByPhone.id;
        // Update name and partnerName in case they have changed since last submission
        sqlite
          .prepare('UPDATE guests SET name = ?, partner_name = ? WHERE id = ?')
          .run(name, partnerName ?? null, guestId);
      } else {
        const inserted = sqlite
          .prepare(
            'INSERT INTO guests (name, phone, partner_name) VALUES (?, ?, ?) RETURNING id'
          )
          .get(name, phone, partnerName ?? null) as { id: number };
        guestId = inserted.id;
      }

      // 3. Upsert invitation row for this guest+event.
      // Only rows with source = 'public_rsvp' are candidates for update, preventing
      // this flow from overwriting admin-created personal invitations (source = 'admin').
      const existingInv = sqlite
        .prepare(
          `SELECT id FROM guest_invitations
           WHERE guest_id = ? AND event_id = ? AND is_open = 0 AND source = 'public_rsvp'
           LIMIT 1`
        )
        .get(guestId, eventId) as { id: number } | undefined;

      let invitationId: number;
      if (existingInv) {
        sqlite
          .prepare(
            `UPDATE guest_invitations
             SET status = ?, guest_count = ?, dietary = ?, partner_dietary = ?,
                 message = ?, updated_at = ?
             WHERE id = ?`
          )
          .run(
            status,
            status === 'attending' ? (guestCount ?? 1) : 1,
            dietary || null,
            partnerDietary || null,
            message || null,
            now,
            existingInv.id,
          );
        invitationId = existingInv.id;
      } else {
        const newInv = sqlite
          .prepare(
            `INSERT INTO guest_invitations
               (guest_id, event_id, token, status, guest_count, dietary, partner_dietary,
                message, is_open, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'public_rsvp')
             RETURNING id`
          )
          .get(
            guestId,
            eventId,
            randomUUID(),
            status,
            status === 'attending' ? (guestCount ?? 1) : 1,
            dietary || null,
            partnerDietary || null,
            message || null,
          ) as { id: number };
        invitationId = newInv.id;
      }

      return { ok: true, guestId, invitationId };
    });

    const result = publicTransaction();

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    logger.info({ eventId, guestId: result.guestId, status }, 'public rsvp submitted');
    res.status(201).json({ ok: true });
  } catch (error) {
    logger.error({ err: error }, 'public rsvp submit error');
    res.status(500).json({ error: 'Failed to save RSVP. Please try again.' });
  }
});

// POST /api/rsvp/public-page — submit an RSVP from a static public language page.
// Does not require a token — event is identified by slug.
// Phone number is used for deduplication across submissions.
router.post('/public-page', claimRateLimit, async (req: Request, res: Response): Promise<void> => {
  const parsed = publicPageRsvpSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { eventSlug, name, phone, status, guestCount, dietary, partnerDietary, message } = parsed.data;
  const now = new Date().toISOString();

  try {
    type PageResult =
      | { ok: true; guestId: number; invitationId: number }
      | { ok: false; status: number; error: string };

    const pageTransaction = sqlite.transaction((): PageResult => {
      // 1. Find event by slug
      const event = sqlite
        .prepare('SELECT id, date FROM events WHERE slug = ? LIMIT 1')
        .get(eventSlug) as { id: number; date: string } | undefined;

      if (!event) {
        return { ok: false, status: 404, error: 'Event not found.' };
      }

      if (isEventPast(event.date)) {
        return { ok: false, status: 410, error: 'This event has already taken place. RSVPs are no longer accepted.' };
      }

      // 2. Phone-based deduplication
      const existingByPhone = sqlite
        .prepare('SELECT id FROM guests WHERE phone = ? LIMIT 1')
        .get(phone) as { id: number } | undefined;

      let guestId: number;
      if (existingByPhone) {
        guestId = existingByPhone.id;
        sqlite.prepare('UPDATE guests SET name = ? WHERE id = ?').run(name, guestId);
      } else {
        const inserted = sqlite
          .prepare(
            'INSERT INTO guests (name, phone) VALUES (?, ?) RETURNING id'
          )
          .get(name, phone) as { id: number };
        guestId = inserted.id;
      }

      // 3. Upsert invitation — only update rows this flow created (source = 'public_rsvp')
      const existingInv = sqlite
        .prepare(
          `SELECT id FROM guest_invitations
           WHERE guest_id = ? AND event_id = ? AND is_open = 0 AND source = 'public_rsvp'
           LIMIT 1`
        )
        .get(guestId, event.id) as { id: number } | undefined;

      let invitationId: number;
      if (existingInv) {
        sqlite
          .prepare(
            `UPDATE guest_invitations
             SET status = ?, guest_count = ?, dietary = ?, partner_dietary = ?,
                 message = ?, updated_at = ?
             WHERE id = ?`
          )
          .run(
            status,
            status === 'attending' ? (guestCount ?? 1) : 1,
            dietary || null,
            partnerDietary || null,
            message || null,
            now,
            existingInv.id,
          );
        invitationId = existingInv.id;
      } else {
        const newInv = sqlite
          .prepare(
            `INSERT INTO guest_invitations
               (guest_id, event_id, token, status, guest_count, dietary, partner_dietary,
                message, is_open, source)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 'public_rsvp')
             RETURNING id`
          )
          .get(
            guestId,
            event.id,
            randomUUID(),
            status,
            status === 'attending' ? (guestCount ?? 1) : 1,
            dietary || null,
            partnerDietary || null,
            message || null,
          ) as { id: number };
        invitationId = newInv.id;
      }

      return { ok: true, guestId, invitationId };
    });

    const result = pageTransaction();

    if (!result.ok) {
      res.status(result.status).json({ error: result.error });
      return;
    }

    logger.info({ eventSlug, guestId: result.guestId, status }, 'public-page rsvp submitted');
    res.status(201).json({ ok: true });
  } catch (error) {
    logger.error({ err: error }, 'public-page rsvp error');
    res.status(500).json({ error: 'Failed to save RSVP. Please try again.' });
  }
});

export default router;
