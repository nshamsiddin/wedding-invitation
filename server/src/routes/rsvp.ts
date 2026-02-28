import { Router } from 'express';
import type { Request, Response } from 'express';
import { and, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db, schema } from '../db/index.js';
import { rsvpSubmitSchema, claimInvitationSchema } from '@invitation/shared';
import { rsvpRateLimit, claimRateLimit } from '../middleware/rateLimit.js';

const router = Router();

// GET /api/rsvp/token/:token — look up an invitation by its token
// Handles three cases: personal (pre-assigned), open (unclaimed), claimed (already used)
router.get('/token/:token', async (req: Request, res: Response): Promise<void> => {
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
        invMessage: schema.guestInvitations.message,
        invUpdatedAt: schema.guestInvitations.updatedAt,
        invIsOpen: schema.guestInvitations.isOpen,
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

    // Open invitation that has already been claimed — reject further use
    if (r.invIsOpen && r.invClaimedAt !== null) {
      res.status(409).json({
        type: 'claimed',
        error: 'This invitation link has already been used.',
      });
      return;
    }

    // Open invitation that is still unclaimed — return events list for self-registration
    if (r.invIsOpen && r.invGuestId === null) {
      // Collect all open invitation rows for this same token (there's only one per token,
      // but the token is linked to one event per row)
      res.json({
        type: 'open',
        token: r.invToken,
        events: [
          {
            id: r.eventId,
            slug: r.eventSlug,
            name: r.eventName,
            date: r.eventDate,
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
      .select({ id: schema.guests.id, name: schema.guests.name, email: schema.guests.email })
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
        message: r.invMessage,
        updatedAt: r.invUpdatedAt,
      },
      guest: {
        id: guestRows[0].id,
        name: guestRows[0].name,
        email: guestRows[0].email,
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
      .select({ id: schema.guestInvitations.id, isOpen: schema.guestInvitations.isOpen })
      .from(schema.guestInvitations)
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

    // Idempotent UPDATE — subsequent submissions update the existing row
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

// POST /api/rsvp/claim — self-register via an open invitation link.
// Rate limited to 5 claims per IP per 10 minutes to prevent abuse.
router.post('/claim', claimRateLimit, async (req: Request, res: Response): Promise<void> => {
  const parsed = claimInvitationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { token, name, email, phone, rsvpEntries } = parsed.data;
  const now = new Date().toISOString();

  try {
    // 1. Validate the token is an unclaimed open invitation
    const invRow = await db
      .select()
      .from(schema.guestInvitations)
      .where(
        and(
          eq(schema.guestInvitations.token, token),
          eq(schema.guestInvitations.isOpen, true),
          isNull(schema.guestInvitations.claimedAt)
        )
      )
      .limit(1);

    if (invRow.length === 0) {
      res.status(404).json({
        error: 'This invitation link is invalid or has already been used.',
      });
      return;
    }

    const openInv = invRow[0];

    // 2. Check if the email already exists — use or create guest record
    let guest: { id: number; name: string; email: string };

    const existingGuest = await db
      .select()
      .from(schema.guests)
      .where(eq(schema.guests.email, email))
      .limit(1);

    if (existingGuest.length > 0) {
      // Re-use the existing guest record
      guest = existingGuest[0];
    } else {
      // Create new guest record from self-registration data
      const [newGuest] = await db
        .insert(schema.guests)
        .values({ name, email, phone: phone ?? null })
        .returning();
      guest = newGuest;
    }

    // 3. Claim the open invitation: assign guestId and record claimedAt
    const entry = rsvpEntries.find((e) => e.eventId === openInv.eventId) ?? rsvpEntries[0];
    await db
      .update(schema.guestInvitations)
      .set({
        guestId: guest.id,
        claimedAt: now,
        status: entry.status,
        guestCount: entry.status === 'attending' ? (entry.guestCount ?? 1) : 1,
        dietary: entry.dietary ?? null,
        message: entry.message ?? null,
        updatedAt: now,
      })
      .where(eq(schema.guestInvitations.id, openInv.id));

    // 4. Create additional invitation rows for extra events in the same claim
    const additionalInvitations = [];
    for (const rsvpEntry of rsvpEntries) {
      if (rsvpEntry.eventId === openInv.eventId) continue;

      // Check if this guest already has an invitation for this event
      const alreadyExists = await db
        .select({ id: schema.guestInvitations.id })
        .from(schema.guestInvitations)
        .where(
          and(
            eq(schema.guestInvitations.guestId, guest.id),
            eq(schema.guestInvitations.eventId, rsvpEntry.eventId)
          )
        )
        .limit(1);

      if (alreadyExists.length > 0) continue;

      const [newInv] = await db
        .insert(schema.guestInvitations)
        .values({
          guestId: guest.id,
          eventId: rsvpEntry.eventId,
          token: randomUUID(),
          status: rsvpEntry.status,
          guestCount: rsvpEntry.status === 'attending' ? (rsvpEntry.guestCount ?? 1) : 1,
          dietary: rsvpEntry.dietary ?? null,
          message: rsvpEntry.message ?? null,
        })
        .returning();

      additionalInvitations.push({
        id: newInv.id,
        token: newInv.token,
        status: newInv.status,
        guestCount: newInv.guestCount,
        dietary: newInv.dietary,
        message: newInv.message,
        updatedAt: newInv.updatedAt,
      });
    }

    res.status(201).json({
      guest: { id: guest.id, name: guest.name, email: guest.email },
      invitations: [
        {
          id: openInv.id,
          token: openInv.token,
          status: entry.status,
          guestCount: entry.guestCount ?? 1,
          dietary: entry.dietary ?? null,
          message: entry.message ?? null,
          updatedAt: now,
        },
        ...additionalInvitations,
      ],
    });
  } catch (error) {
    console.error('Claim invitation error:', error);
    res.status(500).json({ error: 'Failed to process registration. Please try again.' });
  }
});

export default router;
