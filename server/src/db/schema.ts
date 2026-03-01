import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

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
  email: text('email').notNull().unique(),
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
  guestId: integer('guest_id'),
  eventId: integer('event_id').notNull(),
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
  // Open invitation: created without a specific guest; can be claimed once
  isOpen: integer('is_open', { mode: 'boolean' }).notNull().default(false),
  // Timestamp when an open invitation was claimed by a self-registrant
  claimedAt: text('claimed_at'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export type EventRow = typeof events.$inferSelect;
export type GuestRow = typeof guests.$inferSelect;
export type InvitationRow = typeof guestInvitations.$inferSelect;
