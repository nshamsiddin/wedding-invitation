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
  // Assigned seating table — only set for Tashkent invitations
  tableNumber: z.number().int().min(1).max(500).nullable().optional(),
  // Language the invitation page defaults to when the guest opens their link
  language: z.enum(['en', 'tr', 'uz']).optional().default('en'),
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
  tableNumber: z.number().int().nullable().optional(),
  language: z.enum(['en', 'tr', 'uz']).optional().default('en'),
});

export type AdminInvitation = z.infer<typeof adminInvitationSchema>;

// Admin-facing guest (contact + invitations)
export const adminGuestSchema = z.object({
  id: z.number(),
  name: z.string(),
  partnerName: z.string().nullable().optional(),
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
  phone: z.string().max(30).trim().optional(),
  partnerName: z.string().max(100).trim().optional(),
  eventIds: z
    .array(z.number().int().positive())
    .min(1, 'Select at least one event'),
  status: z.enum(['attending', 'declined', 'maybe', 'pending']).optional().default('pending'),
  // Per-event status overrides; keys are event IDs (as strings). Takes precedence over `status`.
  eventStatuses: z.record(z.string(), z.enum(['attending', 'declined', 'maybe', 'pending'])).optional(),
  // Admin-facing schemas allow up to 10 (vs 5 on the public RSVP form)
  guestCount: z.number().int().min(1).max(10).optional().default(1),
  dietary: z.string().max(500).trim().optional().default(''),
  message: z.string().max(1000).trim().optional().default(''),
  // Per-event assigned table numbers; keys are event IDs (as strings)
  tableNumbers: z.record(z.string(), z.number().int().min(1).max(500).nullable()).optional(),
  // Language the invitation page should default to when the guest opens their link
  language: z.enum(['en', 'tr', 'uz']).optional().default('en'),
});

export type AddGuestValues = z.infer<typeof addGuestSchema>;

export const updateGuestContactSchema = z.object({
  name: z.string().min(2).max(100).trim().optional(),
  phone: z.string().max(30).trim().nullable().optional(),
  partnerName: z.string().max(100).trim().nullable().optional(),
});

export type UpdateGuestContactValues = z.infer<typeof updateGuestContactSchema>;

export const addInvitationSchema = z.object({
  guestId: z.number().int().positive(),
  eventId: z.number().int().positive(),
  status: z.enum(['attending', 'declined', 'maybe', 'pending']).optional().default('pending'),
  guestCount: z.number().int().min(1).max(10).optional().default(1),
  language: z.enum(['en', 'tr', 'uz']).optional().default('en'),
});

export type AddInvitationValues = z.infer<typeof addInvitationSchema>;

export const updateInvitationSchema = z.object({
  status: z.enum(['attending', 'declined', 'maybe', 'pending']).optional(),
  // Admin can set up to 10 guests; public RSVP form enforces max 5 separately
  guestCount: z.number().int().min(1).max(10).optional(),
  dietary: z.string().max(500).trim().optional(),
  partnerDietary: z.string().max(500).trim().optional(),
  message: z.string().max(1000).trim().optional(),
  // Assigned seating table — only meaningful for Tashkent invitations
  tableNumber: z.number().int().min(1).max(500).nullable().optional(),
  language: z.enum(['en', 'tr', 'uz']).optional(),
});

export type UpdateInvitationValues = z.infer<typeof updateInvitationSchema>;

// Public RSVP via static language page — no token or email required
export const publicPageRsvpSchema = z.object({
  eventSlug: z.string().min(1).max(100).trim(),
  name: z
    .string({ required_error: 'Please enter your name' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be under 100 characters')
    .trim(),
  phone: z
    .string({ required_error: 'Please enter your phone number' })
    .min(6, 'Phone number is too short')
    .max(30)
    .trim(),
  status: z.enum(['attending', 'declined', 'maybe'], {
    errorMap: () => ({ message: 'Please select an attendance option' }),
  }),
  guestCount: z.number().int().min(1).max(5).optional().default(1),
  dietary: z.string().max(500).trim().optional().default(''),
  partnerDietary: z.string().max(500).trim().optional().default(''),
  message: z.string().max(1000).trim().optional().default(''),
});

export type PublicPageRsvpValues = z.infer<typeof publicPageRsvpSchema>;

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
  dietary: z.string().max(500).trim().optional().default(''),
  partnerDietary: z.string().max(500).trim().optional().default(''),
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

// Bulk guest import — admin uploads a plain-text list of names (one per line)
export const bulkAddGuestsSchema = z.object({
  names: z
    .array(z.string().min(2, 'Each name must be at least 2 characters').max(100).trim())
    .min(1, 'At least one name is required'),
  eventIds: z.array(z.number().int().positive()).min(1, 'Select at least one event'),
  status: z.enum(['attending', 'declined', 'maybe', 'pending']).optional().default('pending'),
  language: z.enum(['en', 'tr', 'uz']).optional().default('en'),
  guestCount: z.number().int().min(1).max(10).optional().default(1),
  tableNumber: z.number().int().min(1).max(500).nullable().optional(),
  // When true, perform a dry-run: check duplicates and return what would be created/skipped
  // without actually writing any rows to the database.
  dryRun: z.boolean().optional().default(false),
});

export type BulkAddGuestsValues = z.infer<typeof bulkAddGuestsSchema>;

export interface BulkAddGuestsResult {
  dryRun: boolean;
  newNames: string[];
  duplicateNames: string[];
  created: number;
  createdInvitations: Array<{
    guestName: string;
    eventId: number;
    eventName: string;
    invitationUrl: string;
  }>;
}

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
  guest?: { name: string };
}

// Discriminated union for token lookup — covers all three states
export interface PersonalTokenLookupResponse {
  type: 'personal';
  invitation: InvitationData & { tableNumber: number | null };
  guest: { id: number; name: string; partnerName: string | null };
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
  claimedAt: string;
  error: string;
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
  guest: { id: number; name: string };
  invitations: InvitationData[];
}
