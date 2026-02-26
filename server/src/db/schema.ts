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
  createdAt: text('created_at')
    .notNull()
    .default(sql`(strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))`),
});

export const guestInvitations = sqliteTable('guest_invitations', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  guestId: integer('guest_id').notNull(),
  eventId: integer('event_id').notNull(),
  token: text('token').notNull().unique(),
  status: text('status', { enum: ['attending', 'declined', 'maybe', 'pending'] })
    .notNull()
    .default('pending'),
  guestCount: integer('guest_count').notNull().default(1),
  dietary: text('dietary'),
  message: text('message'),
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
