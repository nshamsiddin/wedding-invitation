import { Router } from 'express';
import type { Request, Response } from 'express';
import { and, eq, isNull } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { db, schema, sqlite } from '../db/index.js';
import { rsvpSubmitSchema, claimInvitationSchema } from '@invitation/shared';
import { rsvpRateLimit, claimRateLimit } from '../middleware/rateLimit.js';

const router = Router();

// Mask an email address for the token-lookup response to minimise PII exposure.
// A forwarded invitation link would otherwise hand out the guest's full email.
// Example: "berfin@example.com" → "b***@example.com"
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '***';
  return `${local.charAt(0)}***@${domain}`;
}

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
        invPartnerDietary: schema.guestInvitations.partnerDietary,
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
      .select({
        id: schema.guests.id,
        name: schema.guests.name,
        email: schema.guests.email,
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
        updatedAt: r.invUpdatedAt,
      },
      guest: {
        id: guestRows[0].id,
        name: guestRows[0].name,
        partnerName: guestRows[0].partnerName ?? null,
        // Email is masked to prevent PII leakage via a forwarded invitation URL.
        email: maskEmail(guestRows[0].email),
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
        partnerDietary: data.partnerDietary ?? null,
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
// The entire operation is wrapped in a SQLite transaction to guarantee atomicity:
// if any step fails, the DB is rolled back to its pre-claim state.
router.post('/claim', claimRateLimit, async (req: Request, res: Response): Promise<void> => {
  const parsed = claimInvitationSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: 'Validation failed', details: parsed.error.flatten() });
    return;
  }

  const { token, name, partnerName, email, phone, rsvpEntries } = parsed.data;
  const now = new Date().toISOString();

  try {
    // Wrap all DB mutations in a single transaction.
    // better-sqlite3's transaction() is synchronous; we use it here with the
    // raw sqlite connection so Drizzle queries inside are still awaitable.
    type ClaimResult =
      | { ok: true; guest: { id: number; name: string; email: string }; invitations: unknown[] }
      | { ok: false; status: number; error: string };

    // Run the transactional logic synchronously using better-sqlite3's transaction API.
    // All individual Drizzle calls inside are themselves synchronous in the better-sqlite3 driver.
    const claimTransaction = sqlite.transaction((): ClaimResult => {
      // 1. Validate the token is an unclaimed open invitation (lock the row)
      const invRow = sqlite
        .prepare(
          `SELECT * FROM guest_invitations
           WHERE token = ? AND is_open = 1 AND claimed_at IS NULL
           LIMIT 1`
        )
        .get(token) as {
          id: number; guest_id: number | null; event_id: number; token: string;
          status: string; guest_count: number; dietary: string | null;
          message: string | null; is_open: number; claimed_at: string | null;
          created_at: string; updated_at: string;
        } | undefined;

      if (!invRow) {
        return { ok: false, status: 404, error: 'This invitation link is invalid or has already been used.' };
      }

      // 2. Upsert guest record — reuse existing record if email matches
      const existingGuest = sqlite
        .prepare('SELECT id, name, email FROM guests WHERE email = ? LIMIT 1')
        .get(email) as { id: number; name: string; email: string } | undefined;

      let guest: { id: number; name: string; email: string };
      if (existingGuest) {
        guest = existingGuest;
      } else {
        const result = sqlite
          .prepare(
            'INSERT INTO guests (name, email, phone, partner_name) VALUES (?, ?, ?, ?) RETURNING id, name, email'
          )
          .get(name, email, phone ?? null, partnerName ?? null) as { id: number; name: string; email: string };
        guest = result;
      }

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
        guest: { id: guest.id, name: guest.name, email: guest.email },
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

    res.status(201).json({
      guest: result.guest,
      invitations: result.invitations,
    });
  } catch (error) {
    console.error('Claim invitation error:', error);
    res.status(500).json({ error: 'Failed to process registration. Please try again.' });
  }
});

export default router;
