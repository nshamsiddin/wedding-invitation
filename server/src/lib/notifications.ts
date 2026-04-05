import type { Database } from 'better-sqlite3';

export type NotificationType = 'rsvp_new' | 'rsvp_updated';

export interface CreateNotificationParams {
  type: NotificationType;
  guestName: string;
  eventSlug: string;
  eventName: string;
  status: string;
  guestCount: number;
  message?: string | null;
  invitationId: number;
  guestId?: number | null;
}

/**
 * Insert a notification row. Call this inside (or right after) any RSVP
 * transaction so that the admin panel receives a real-time audit trail of
 * every guest action.  Intentionally fire-and-forget — a failure here must
 * never abort the RSVP response.
 */
export function createNotification(sqlite: Database, params: CreateNotificationParams): void {
  try {
    sqlite
      .prepare(
        `INSERT INTO notifications
           (type, guest_name, event_slug, event_name, status, guest_count,
            message, invitation_id, guest_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        params.type,
        params.guestName,
        params.eventSlug,
        params.eventName,
        params.status,
        params.guestCount,
        params.message ?? null,
        params.invitationId,
        params.guestId ?? null,
      );
  } catch {
    // Swallow — notification failure must never break the RSVP response
  }
}
