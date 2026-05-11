import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { AdminGuest, AdminInvitation } from '../../../lib/api';
import { ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM, PARCHMENT } from '../../../garden/tokens';

interface Props {
  guest: AdminGuest;
  invitation: AdminInvitation;
  /** True when this chip is currently being dragged — used to hide the original
   *  cell while the DragOverlay renders the floating clone. */
  isOverlay?: boolean;
}

// ─── RSVP status indicator dot ──────────────────────────────────────────────
// Information density on a seat chip is precious — a 6px dot communicates
// RSVP status without consuming the horizontal real-estate a full badge would.
// Colors mirror the STATUS_CONFIG in GuestTable.tsx so admins build muscle
// memory once across views.

const STATUS_DOT_COLOR: Record<string, string> = {
  attending: '#059669', // emerald-600
  declined: '#DC2626', // red-600
  maybe: '#D97706', // amber-600
  pending: GOLD,
};

const STATUS_LABEL: Record<string, string> = {
  attending: 'Attending',
  declined: 'Declined',
  maybe: 'Maybe',
  pending: 'No response',
};

export default function GuestChip({ guest, invitation, isOverlay = false }: Props) {
  // Each draggable's id is the invitation id — the canonical key for "this
  // person at this event". A guest with multiple events would have one chip
  // per event, but the seating planner is single-event so this is unambiguous.
  const dragId = `invitation:${invitation.id}`;
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: dragId,
    data: {
      type: 'guest',
      invitationId: invitation.id,
      guestId: guest.id,
      currentTableNumber: invitation.tableNumber ?? null,
      guestCount: invitation.guestCount,
      guestName: guest.name,
    },
  });

  const statusColor = STATUS_DOT_COLOR[invitation.status] ?? GOLD;
  const statusLabel = STATUS_LABEL[invitation.status] ?? 'Unknown';
  const showPartyBadge = invitation.guestCount > 1;

  // When this chip is the active drag source we visually hollow it out so
  // the user sees where the chip came from while DragOverlay renders the
  // floating clone. The overlay copy itself sets `isOverlay` to skip this.
  const sourceFaded = isDragging && !isOverlay;

  return (
    <div
      ref={setNodeRef}
      // Transform is null in the overlay copy (the overlay positions itself
      // via cursor coords) — we still apply it for the in-place source so
      // keyboard drags from focus produce the standard nudge animation.
      style={{
        transform: isOverlay ? undefined : CSS.Translate.toString(transform),
        opacity: sourceFaded ? 0.35 : 1,
        cursor: isOverlay ? 'grabbing' : 'grab',
        background: PARCHMENT,
        border: `1px solid ${GOLD_DIM}`,
        boxShadow: isOverlay
          ? '0 8px 24px rgba(42,31,26,0.18), 0 2px 6px rgba(42,31,26,0.08)'
          : undefined,
        touchAction: 'none', // required by @dnd-kit pointer/touch sensors
      }}
      className="group/chip inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-sans font-medium select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
      // The listeners include both pointer/touch and keyboard event handlers.
      {...listeners}
      // Attributes include role="button", aria-roledescription="draggable",
      // and tabIndex=0 — making the chip keyboard-actionable for free.
      {...attributes}
      aria-label={`${guest.name}${invitation.guestCount > 1 ? `, party of ${invitation.guestCount}` : ''}. ${statusLabel}. Drag to a table to assign seating.`}
    >
      <span
        aria-hidden="true"
        title={statusLabel}
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: statusColor,
          flexShrink: 0,
        }}
      />
      <span style={{ color: ESPRESSO }} className="truncate max-w-[10rem]">
        {guest.name}
      </span>
      {showPartyBadge && (
        <span
          aria-hidden="true"
          title={`Party of ${invitation.guestCount}`}
          style={{
            background: 'rgba(184,146,74,0.18)',
            color: ESPRESSO_DIM,
            fontSize: '0.62rem',
            fontWeight: 700,
            padding: '0 5px',
            borderRadius: '6px',
            lineHeight: '14px',
            flexShrink: 0,
          }}
          className="tabular-nums"
        >
          ×{invitation.guestCount}
        </span>
      )}
    </div>
  );
}
