import { sql } from 'drizzle-orm';
import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const guests = sqliteTable('guests', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
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

export type GuestRow = typeof guests.$inferSelect;
export type NewGuest = typeof guests.$inferInsert;
