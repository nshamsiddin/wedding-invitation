import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core';

export const events = sqliteTable('events', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  slug: text('slug').notNull().unique(),
  name: text('name').notNull(),
  date: text('date').notNull(),
  time: text('time').notNull(),
  venueName: text('venue_name').notNull(),
  venueAddress: text('venue_address').notNull(),
  dressCode: text('dress_code'),
  mapsUrl: text('maps_url'),
});

export const guests = sqliteTable('guests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  phone: text('phone'),
  // Optional partner/spouse name — stored at the guest level because a couple
  // always attends together regardless of which event they are invited to.
  partnerName: text('partner_name'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export const guestInvitations = sqliteTable('guest_invitations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  // Nullable: open invitations have no guestId until claimed
  guestId: integer('guest_id').references(() => guests.id, { onDelete: 'cascade' }),
  eventId: integer('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  status: text('status', { enum: ['attending', 'declined', 'maybe', 'pending'] })
    .notNull()
    .default('pending'),
  guestCount: integer('guest_count').notNull().default(1),
  dietary: text('dietary'),
  message: text('message'),
  // Optional dietary restrictions for the guest's partner — per-event because
  // dietary needs relate to what is being served at a specific event.
  partnerDietary: text('partner_dietary'),
  // Tracks how the invitation was created: 'admin' for manually created rows,
  // 'public_rsvp' for rows created via the permanent public link flow.
  // Used to prevent public RSVP submissions from overwriting admin-curated records.
  source: text('source', { enum: ['admin', 'public_rsvp'] }).notNull().default('admin'),
  // Open invitation: created without a specific guest; can be claimed once
  isOpen: integer('is_open', { mode: 'boolean' }).notNull().default(false),
  // Permanent public invitation: reusable by any number of guests, never consumed
  isPublic: integer('is_public', { mode: 'boolean' }).notNull().default(false),
  // Assigned seating table — only used for Tashkent event; null for all others
  tableNumber: integer('table_number'),
  // Language the invitation page should default to when the guest opens their link
  language: text('language', { enum: ['en', 'tr', 'uz'] }).notNull().default('en'),
  // Timestamp when an open invitation was claimed by a self-registrant
  claimedAt: text('claimed_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
}, (t) => ({
  // Prevents a guest from having duplicate invitations for the same event.
  // SQLite treats NULL != NULL for UNIQUE constraints, so multiple open
  // invitations (guest_id = NULL) for the same event are still permitted.
  guestEventUnique: uniqueIndex('guest_event_unique').on(t.guestId, t.eventId),
}));

export type EventRow = typeof events.$inferSelect;
export type GuestRow = typeof guests.$inferSelect;
export type InvitationRow = typeof guestInvitations.$inferSelect;
