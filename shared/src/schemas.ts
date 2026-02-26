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
  email: z
    .string()
    .email('Please enter a valid email address')
    .max(255, 'Email must be under 255 characters')
    .toLowerCase()
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
  message: z
    .string()
    .max(1000, 'Message must be under 1000 characters')
    .trim()
    .optional()
    .default(''),
});

export type RSVPFormValues = z.infer<typeof rsvpFormSchema>;

// Server-side RSVP submission — either token-based or slug+email
// Token-only schema — anonymous slug+email submissions are intentionally not supported.
// Every RSVP must originate from a guest's unique personal link.
export const rsvpSubmitSchema = z.object({
  token: z.string().uuid('Invalid invitation token'),
  status: z.enum(['attending', 'declined', 'maybe']),
  guestCount: z.number().int().min(1).max(5).optional().default(1),
  dietary: z.string().max(500).trim().optional().default(''),
  message: z.string().max(1000).trim().optional().default(''),
});

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

// ─── Invitation (shared type) ─────────────────────────────────────────────────

export const invitationSchema = z.object({
  id: z.number(),
  token: z.string(),
  status: z.enum(attendanceStatus),
  guestCount: z.number().int().min(1),
  dietary: z.string().nullable(),
  message: z.string().nullable(),
  updatedAt: z.string(),
});

export type InvitationData = z.infer<typeof invitationSchema>;

// Admin-facing invitation (includes event info)
export const adminInvitationSchema = invitationSchema.extend({
  eventId: z.number(),
  eventSlug: z.string().nullable(),
  eventName: z.string().nullable(),
});

export type AdminInvitation = z.infer<typeof adminInvitationSchema>;

// Admin-facing guest (contact + invitations)
export const adminGuestSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
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

// ─── Admin auth ───────────────────────────────────────────────────────────────

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(100),
});

export type AdminLoginValues = z.infer<typeof adminLoginSchema>;

// ─── Admin guest management ───────────────────────────────────────────────────

export const addGuestSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).trim(),
  email: z.string().email('Please enter a valid email').max(255).toLowerCase().trim(),
  phone: z.string().max(30).trim().optional(),
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
  email: z.string().email().max(255).toLowerCase().trim().optional(),
  phone: z.string().max(30).trim().nullable().optional(),
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
  message: z.string().max(1000).trim().optional(),
});

export type UpdateInvitationValues = z.infer<typeof updateInvitationSchema>;

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

export interface TokenLookupResponse {
  invitation: InvitationData;
  guest: { id: number; name: string; email: string };
  event: EventData;
}

export interface RSVPSubmitResponse {
  invitation: InvitationData;
  updated: boolean;
}
