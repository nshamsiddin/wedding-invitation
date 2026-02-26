import { z } from 'zod';

export const attendanceStatus = ['attending', 'declined', 'maybe', 'pending'] as const;
export type AttendanceStatus = typeof attendanceStatus[number];

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

export const guestSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  status: z.enum(attendanceStatus),
  guestCount: z.number().int().min(1).max(5),
  dietary: z.string().nullable(),
  message: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type Guest = z.infer<typeof guestSchema>;

export const adminLoginSchema = z.object({
  username: z.string().min(1, 'Username is required').max(100),
  password: z.string().min(1, 'Password is required').max(100),
});

export type AdminLoginValues = z.infer<typeof adminLoginSchema>;

export const addGuestSchema = z.object({
  name: z.string().min(2).max(100).trim(),
  email: z.string().email().max(255).toLowerCase().trim(),
  status: z.enum(['attending', 'declined', 'maybe', 'pending']),
  guestCount: z.number().int().min(1).max(5).default(1),
  dietary: z.string().max(500).trim().optional().default(''),
  message: z.string().max(1000).trim().optional().default(''),
});

export type AddGuestValues = z.infer<typeof addGuestSchema>;

export const updateGuestSchema = addGuestSchema.partial().extend({
  status: z.enum(['attending', 'declined', 'maybe', 'pending']).optional(),
});

export type UpdateGuestValues = z.infer<typeof updateGuestSchema>;

export interface ApiError {
  error: string;
  details?: unknown;
}

export interface RSVPCheckResponse {
  exists: boolean;
  guest?: Guest;
}

export interface StatsResponse {
  total: number;
  attending: number;
  declined: number;
  maybe: number;
  pending: number;
  totalHeadcount: number;
}
