import { z } from 'zod';

export const attendanceStatus = ['attending', 'declined', 'maybe', 'pending'] as const;
export type AttendanceStatus = typeof attendanceStatus[number];

// ─── RSVP (public) ───────────────────────────────────────────────────────────

export const rsvpFormSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters')
    .trim(),
  // Email is display-only (never submitted to the server).
  // The server returns a masked value like b***@example.com, so strict
  // .email() validation would always block submission. Accept any string.
  email: z.string().max(254).trim().optional().default(''),
  status: z.enum(['attending', 'declined', 'maybe'], {
    errorMap: () => ({ message: 'Please select an attendance option' }),
  }),
  guestCount: z
    .number()
    .int()
    .min(1, 'Must have at least 1 guest')
    .max(5, 'Maximum 5 guests allowed')
    .optional()
    .default(1),
  dietary: z
    .string()
    .max(500, 'Dietary notes must be under 500 characters')
    .trim()
    .optional()
    .default(''),
  partnerDietary: z.string().max(500).trim().optional().default(''),
  partnerName: z.string().max(100).trim().optional().default(''),
  message: z
    .string()
    .max(1000, 'Message must be under 1000 characters')
    .trim()
    .optional()
    .default(''),
});

export type RSVPFormValues = z.infer<typeof rsvpFormSchema>;

// Token-only schema — anonymous slug+email submissions are intentionally not supported.
// Every personal RSVP must originate from a guest's unique personal link.
export const rsvpSubmitSchema = z.object({
  token: z.string().uuid('Invalid invitation token'),
  status: z.enum(['attending', 'declined', 'maybe']),
  guestCount: z.number().int().min(1).max(5).optional().default(1),
  dietary: z.string().max(500).trim().optional().default(''),
  partnerDietary: z.string().max(500).trim().optional().default(''),
  message: z.string().max(1000).trim().optional().default(''),
  // Optional name corrections: guests may fix a misspelling via the edit toggle
  name: z.string().min(2).max(100).trim().optional(),
  partnerName: z.string().max(100).trim().optional(),
});

// ─── Open invitation claim ────────────────────────────────────────────────────

export const rsvpEntrySchema = z.object({
  eventId: z.number().int().positive(),
  status: z.enum(['attending', 'declined', 'maybe']),
  guestCount: z.number().int().min(1).max(5).optional().default(1),
  dietary: z.string().max(500).trim().optional().default(''),
  partnerDietary: z.string().max(500).trim().optional().default(''),
  message: z.string().max(1000).trim().optional().default(''),
});

export type RSVPEntry = z.infer<typeof rsvpEntrySchema>;

export const claimInvitationSchema = z.object({
  token: z.string().uuid('Invalid invitation token'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters')
    .trim(),
  partnerName: z.string().max(100).trim().optional(),
  // Optional for one-time open links (still validated when provided)
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(254, 'Email must be under 254 characters')
    .toLowerCase()
    .trim()
    .optional(),
  phone: z.string().max(30).trim().optional(),
  rsvpEntries: z.array(rsvpEntrySchema).min(1, 'At least one RSVP entry is required'),
});

export type ClaimInvitationValues = z.infer<typeof claimInvitationSchema>;

// ─── Event (public) ──────────────────────────────────────────────────────────

export const eventSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  date: z.string(),
  time: z.string(),
  venueName: z.string(),
  venueAddress: z.string(),
  dressCode: z.string().nullable(),
  mapsUrl: z.string().nullable(),
});

export type EventData = z.infer<typeof eventSchema>;

// Partial event data returned publicly without a valid invitation token
export const partialEventSchema = z.object({
  id: z.number(),
  slug: z.string(),
  name: z.string(),
  date: z.string(),
  restricted: z.literal(true),
});

export type PartialEventData = z.infer<typeof partialEventSchema>;

// ─── Invitation (shared type) ─────────────────────────────────────────────────

export const invitationSchema = z.object({
  id: z.number(),
  token: z.string(),
  status: z.enum(attendanceStatus),
  guestCount: z.number().int().min(1),
  dietary: z.string().nullable(),
  partnerDietary: z.string().nullable().optional(),
  message: z.string().nullable(),
  updatedAt: z.string(),
});

export type InvitationData = z.infer<typeof invitationSchema>;

// Admin-facing invitation (includes event info + open invitation fields)
export const adminInvitationSchema = invitationSchema.extend({
  eventId: z.number(),
  eventSlug: z.string().nullable(),
  eventName: z.string().nullable(),
  isOpen: z.boolean().default(false),
  claimedAt: z.string().nullable().optional(),
  guestId: z.number().nullable().optional(),
});

export type AdminInvitation = z.infer<typeof adminInvitationSchema>;

// Admin-facing guest (contact + invitations)
export const adminGuestSchema = z.object({
  id: z.number(),
  name: z.string(),
  partnerName: z.string().nullable().optional(),
  // Nullable: guests who registered via a public link have no email
  email: z.string().nullable(),
  phone: z.string().nullable(),
  createdAt: z.string(),
  invitations: z.array(adminInvitationSchema),
});

export type AdminGuest = z.infer<typeof adminGuestSchema>;

// Admin event with stats
export const adminEventSchema = eventSchema.extend({
  stats: z.object({
    total: z.number(),
    attending: z.number(),
    declined: z.number(),
    maybe: z.number(),
    pending: z.number(),
    totalHeadcount: z.number(),
  }),
});

export type AdminEvent = z.infer<typeof adminEventSchema>;

// Open (unclaimed) invitation shown in admin panel
export const openInvitationSchema = z.object({
  id: z.number(),
  token: z.string(),
  isOpen: z.literal(true),
  isPublic: z.boolean().default(false),
  claimedAt: z.string().nullable(),
  eventId: z.number(),
  eventSlug: z.string().nullable(),
  eventName: z.string().nullable(),
  createdAt: z.string(),
});

export type OpenInvitation = z.infer<typeof openInvitationSchema>;

// ─── Admin auth ───────────────────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(100),
});

export type AdminLoginValues = z.infer<typeof adminLoginSchema>;

// ─── Admin guest management ───────────────────────────────────────────────────

export const addGuestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Please enter a valid email').max(254).toLowerCase().trim(),
  phone: z.string().max(30).trim().optional(),
  partnerName: z.string().max(100).trim().optional(),
  eventIds: z
    .array(z.number().int().positive())
    .min(1, 'Select at least one event'),
  status: z.enum(['attending', 'declined', 'maybe', 'pending']).optional().default('pending'),
  guestCount: z.number().int().min(1).max(5).optional().default(1),
  dietary: z.string().max(500).trim().optional().default(''),
  message: z.string().max(1000).trim().optional().default(''),
});

export type AddGuestValues = z.infer<typeof addGuestSchema>;

export const updateGuestContactSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  email: z.string().email().max(254).toLowerCase().trim().optional(),
  phone: z.string().max(30).trim().nullable().optional(),
  partnerName: z.string().max(100).trim().nullable().optional(),
});

export type UpdateGuestContactValues = z.infer<typeof updateGuestContactSchema>;

export const addInvitationSchema = z.object({
  guestId: z.number().int().positive(),
  eventId: z.number().int().positive(),
  status: z.enum(['attending', 'declined', 'maybe', 'pending']).optional().default('pending'),
  guestCount: z.number().int().min(1).max(5).optional().default(1),
});

export type AddInvitationValues = z.infer<typeof addInvitationSchema>;

export const updateInvitationSchema = z.object({
  status: z.enum(['attending', 'declined', 'maybe', 'pending']).optional(),
  guestCount: z.number().int().min(1).max(5).optional(),
  dietary: z.string().max(500).trim().optional(),
  partnerDietary: z.string().max(500).trim().optional(),
  message: z.string().max(1000).trim().optional(),
});

export type UpdateInvitationValues = z.infer<typeof updateInvitationSchema>;

// Public RSVP — submitted via a permanent public link (no email required)
export const publicRsvpSchema = z.object({
  token: z.string().uuid('Invalid invitation token'),
  name: z
    .string({ required_error: 'Please enter your name' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters')
    .trim(),
  partnerName: z.string().max(100).trim().optional(),
  phone: z
    .string({ required_error: 'Please enter your phone number' })
    .min(6, 'Phone number is too short')
    .max(30)
    .trim(),
  status: z.enum(['attending', 'declined', 'maybe'], {
    errorMap: () => ({ message: 'Please select an attendance option' }),
  }),
  guestCount: z.number().int().min(1).max(5).optional().default(1),
  message: z.string().max(1000).trim().optional().default(''),
  eventId: z.number().int().positive(),
});

export type PublicRsvpValues = z.infer<typeof publicRsvpSchema>;

// Admin: create open (generic) invitation link
export const createOpenInvitationSchema = z.object({
  eventIds: z.array(z.number().int().positive()).min(1, 'Select at least one event'),
  isPublic: z.boolean().optional().default(false),
});

export type CreateOpenInvitationValues = z.infer<typeof createOpenInvitationSchema>;

// ─── API response interfaces ─────────────────────────────────────────────────

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface RSVPCheckResponse {
  exists: boolean;
  invitation?: {
    id: number;
    token: string;
    status: AttendanceStatus;
    guestCount: number;
    dietary: string | null;
    message: string | null;
  };
  guest?: { name: string; email: string };
}

// Discriminated union for token lookup — covers all three states
export interface PersonalTokenLookupResponse {
  type: 'personal';
  invitation: InvitationData;
  guest: { id: number; name: string; email: string; partnerName: string | null };
  event: EventData;
}

export interface OpenTokenLookupResponse {
  type: 'open';
  token: string;
  isPublic: boolean;
  events: Array<{ id: number; slug: string; name: string; date: string; time: string | null; venueName: string | null }>;
}

export interface ClaimedTokenLookupResponse {
  type: 'claimed';
}

export type TokenLookupResponse =
  | PersonalTokenLookupResponse
  | OpenTokenLookupResponse
  | ClaimedTokenLookupResponse;

export interface RSVPSubmitResponse {
  invitation: InvitationData;
  updated: boolean;
}

export interface ClaimInvitationResponse {
  guest: { id: number; name: string; email: string };
  invitations: InvitationData[];
}
