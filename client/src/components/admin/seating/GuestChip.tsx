import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { AdminGuest, AdminInvitation } from '../../../lib/api';
import { ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM, PARCHMENT } from '../../../garden/tokens';
import { useAdminTranslation } from '../../../lib/i18n/admin';

interface Props {
  guest: AdminGuest;
  invitation: AdminInvitation;
  /** True when this chip is currently being dragged — used to hide the original
   *  cell while the DragOverlay renders the floating clone. */
  isOverlay?: boolean;
  /** When provided, renders a small "×" button on the chip that clears the
   *  invitation's table assignment. Only rendered when the invitation is
   *  actually seated (`tableNumber != null`) — passing this on an unassigned
   *  chip is silently ignored. */
  onUnassign?: () => void;
  /** When provided, renders a small toggle on the left of the chip that
   *  controls multi-select. Only meaningful for unassigned chips today —
   *  bulk-assigning an already-seated guest is a future extension. */
  onToggleSelect?: (event: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean }) => void;
  /** True when this chip is part of the active selection. Combined with
   *  `selectionActive` this drives both the visual highlight and the
   *  always-visible selection toggle. */
  isSelected?: boolean;
  /** True when *any* chip in the same list is currently selected. We use it
   *  to keep the selection toggle visible on every chip while a selection
   *  exists, so admins don't have to hover-hunt to add to the selection. */
  selectionActive?: boolean;
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

export default function GuestChip({
  guest,
  invitation,
  isOverlay = false,
  onUnassign,
  onToggleSelect,
  isSelected = false,
  selectionActive = false,
}: Props) {
  const at = useAdminTranslation();
  // Each draggable's id is the invitation id — the canonical key for "this
  // person at this event". A guest with multiple events would have one chip
  // per event, but the seating planner is single-event so this is unambiguous.
  const dragId = `invitation:${invitation.id}`;
  // The button only makes sense when the chip is actually seated. We also
  // hide it on the overlay copy so the floating drag preview stays clean.
  const showUnassignButton = !isOverlay && onUnassign != null && invitation.tableNumber != null;
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

  // Background/border shifts when this chip is part of the active selection
  // so a quick scan of the unassigned column reveals what's been picked.
  // We keep the change subtle so it doesn't fight the existing status dot.
  const selectionTint = !isOverlay && isSelected;

  // Compose the chip's boxShadow from three independently-toggled layers:
  //   1. status strip (always on) — a 3px inset on the LEFT edge in the RSVP
  //      status colour. Replaces the old 6px status dot, which was too small
  //      to reliably distinguish across attending / maybe / pending / declined
  //      at a glance and failed WCAG 2.5.5 target size.
  //   2. drag overlay shadow (when DragOverlay is rendering this chip).
  //   3. selection ring (when the chip is part of the bulk-select set).
  // We use boxShadow rather than borderLeft for the strip so the chip's
  // outer geometry and content offset stay identical across every state.
  const chipBoxShadow = [
    `inset 3px 0 0 ${statusColor}`,
    isOverlay
      ? '0 8px 24px rgba(42,31,26,0.18), 0 2px 6px rgba(42,31,26,0.08)'
      : selectionTint
        ? '0 0 0 2px rgba(184,146,74,0.20)'
        : '',
  ]
    .filter(Boolean)
    .join(', ');

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
        background: selectionTint ? 'rgba(184,146,74,0.18)' : PARCHMENT,
        border: `1px solid ${selectionTint ? GOLD : GOLD_DIM}`,
        boxShadow: chipBoxShadow,
        touchAction: 'none', // required by @dnd-kit pointer/touch sensors
        transition: 'background 0.12s, box-shadow 0.12s, border-color 0.12s',
      }}
      // `pl-2.5` (10px) instead of `px-2` (8px) so the name doesn't sit
      // visually on top of the 3px status strip — keeps the inner padding
      // the eye perceives at the same ~8px the chip had before.
      className="group/chip inline-flex items-center gap-1.5 pl-2.5 pr-2 py-1 rounded-md text-xs font-sans font-medium select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] max-w-full"
      // The listeners include both pointer/touch and keyboard event handlers.
      {...listeners}
      // Attributes include role="button", aria-roledescription="draggable",
      // and tabIndex=0 — making the chip keyboard-actionable for free.
      {...attributes}
      aria-label={`${guest.name}${invitation.guestCount > 1 ? `, party of ${invitation.guestCount}` : ''}. ${statusLabel}.${onToggleSelect ? ` ${isSelected ? 'Selected. ' : ''}Click circle to ${isSelected ? 'deselect' : 'select'}. ` : ' '}Drag to a table to assign seating.`}
    >
      {onToggleSelect && (
        // Selection toggle — a small circle/checkbox on the left of the chip.
        // Hidden at rest until hovered; pinned visible whenever *any* chip in
        // the column is selected so the user can keep adding without hunting.
        // We stopPropagation on every pointer event so this never starts a
        // drag.
        <button
          type="button"
          role="checkbox"
          aria-checked={isSelected}
          onPointerDownCapture={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect({
              shiftKey: e.shiftKey,
              metaKey: e.metaKey,
              ctrlKey: e.ctrlKey,
            });
          }}
          aria-label={isSelected ? 'Deselect' : 'Select for bulk assignment'}
          title={isSelected ? 'Deselect' : 'Select'}
          className={
            (selectionActive || isSelected
              ? 'opacity-100'
              : 'opacity-0 group-hover/chip:opacity-100 focus-visible:opacity-100') +
            ' focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]'
          }
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 14,
            height: 14,
            marginLeft: -3,
            padding: 0,
            borderRadius: '50%',
            background: isSelected ? GOLD : PARCHMENT,
            border: `1.5px solid ${isSelected ? GOLD : GOLD_DIM}`,
            color: '#FFFFFF',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.12s, border-color 0.12s, opacity 0.12s',
          }}
        >
          {isSelected && (
            <svg
              width="9"
              height="9"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={3.5}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </button>
      )}
      {/* Drag-grip glyph — fades in only on hover/focus so it doesn't
          contribute to chip clutter at rest. It's a redundant affordance
          on top of `cursor: grab` for users who skim with their eyes
          before they hover (the Notion/Linear/Trello pattern). Hidden on
          the DragOverlay clone where it would be visual noise. */}
      {!isOverlay && (
        <span
          aria-hidden="true"
          className="opacity-0 group-hover/chip:opacity-50 group-focus-within/chip:opacity-50 transition-opacity"
          style={{
            display: 'inline-flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            width: 4,
            height: 12,
            flexShrink: 0,
            marginLeft: -2,
            marginRight: -2,
            color: ESPRESSO_DIM,
          }}
        >
          {/* Three pairs of dots forming the standard 6-dot drag grip. */}
          {[0, 1, 2].map((row) => (
            <span key={row} style={{ display: 'flex', gap: 2 }}>
              <span style={{ width: 1.5, height: 1.5, borderRadius: '50%', background: 'currentColor' }} />
              <span style={{ width: 1.5, height: 1.5, borderRadius: '50%', background: 'currentColor' }} />
            </span>
          ))}
        </span>
      )}
      {/* Name shrinks to fit the chip (which itself is capped at the parent's
          width via `max-w-full`). The `min-w-0` is the magic that lets a flex
          child shrink below its content width so `truncate` can engage —
          without it the chip would push past the card's right edge on narrow
          columns (e.g. 4-up at 2xl), or names like "Abdussamet Korkmaz ve
          Ailesi" would be amputated at a hard 10rem cap instead of using
          whatever room the card actually has. */}
      <span style={{ color: ESPRESSO }} className="truncate min-w-0" title={`${guest.name} · ${statusLabel}`}>
        {guest.name}
      </span>
      {showPartyBadge && (
        // Demoted from a tinted pill to a subtle inline suffix so the name
        // is the dominant element on the chip. The party-size filter chips
        // in the Unassigned column are now the primary scanning tool for
        // "where are my big parties?" — the per-chip badge is just a
        // confirmation cue.
        <span
          aria-hidden="true"
          title={`Party of ${invitation.guestCount}`}
          style={{
            color: ESPRESSO_DIM,
            fontSize: '0.7rem',
            fontWeight: 500,
            flexShrink: 0,
            // The bullet leans into the dim color so it reads as a
            // separator, not a real character of the name.
          }}
          className="tabular-nums"
        >
          ·&nbsp;×{invitation.guestCount}
        </span>
      )}
      {showUnassignButton && (
        // The chip's parent is the drag handle — we have to stop the pointer
        // sequence on the button itself so clicking it never starts a drag.
        // Using `onPointerDownCapture` ensures we beat @dnd-kit's pointer
        // listener (which is registered on the parent in the bubbling phase).
        // The button is also a real <button>, giving us free keyboard support
        // (Enter / Space) without conflicting with @dnd-kit's keyboard sensor.
        //
        // Visual: a discreet pill at rest using the chip's warm palette so it
        // reads as an action affordance — not an error. Hover/focus shifts
        // it to a saturated red to confirm the destructive intent before
        // the click lands. An earlier red-tinted rest state looked like a
        // permanent error indicator on every seated chip.
        <button
          type="button"
          onPointerDownCapture={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onKeyDown={(e) => {
            // Block Enter/Space from being interpreted as "start drag" by
            // @dnd-kit's keyboard sensor. The default button activation still
            // fires onClick, so removal works as expected.
            if (e.key === 'Enter' || e.key === ' ') e.stopPropagation();
          }}
          onClick={(e) => {
            e.stopPropagation();
            onUnassign?.();
          }}
          aria-label={`${at.seatingUnassignFromTable}: ${guest.name}`}
          title={at.seatingUnassignFromTable}
          // Hidden at rest, fades in on chip hover or when the button itself
          // is focused. Cuts the visual weight of a card with 10–15 chips
          // (a wall of always-visible destructive controls used to draw the
          // eye away from the names). `focus-visible:opacity-100` keeps it
          // discoverable for keyboard tabbing — the chip is `focus-within`
          // when the button has focus, so it stays visible until blur.
          className="opacity-0 group-hover/chip:opacity-100 group-focus-within/chip:opacity-100 focus-visible:opacity-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 18,
            height: 18,
            padding: 0,
            marginLeft: 2,
            marginRight: -3,
            borderRadius: '50%',
            background: 'transparent',
            border: `1px solid ${GOLD_DIM}`,
            color: ESPRESSO_DIM,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'background 0.12s, border-color 0.12s, color 0.12s, transform 0.12s, opacity 0.12s',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = '#DC2626';
            e.currentTarget.style.borderColor = '#DC2626';
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.transform = 'scale(1.08)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = GOLD_DIM;
            e.currentTarget.style.color = ESPRESSO_DIM;
            e.currentTarget.style.transform = 'none';
          }}
          onFocus={(e) => {
            e.currentTarget.style.background = '#DC2626';
            e.currentTarget.style.borderColor = '#DC2626';
            e.currentTarget.style.color = '#FFFFFF';
          }}
          onBlur={(e) => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = GOLD_DIM;
            e.currentTarget.style.color = ESPRESSO_DIM;
          }}
        >
          <svg
            width="11"
            height="11"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            // Without `pointer-events: none`, SVG's default
            // `visiblePainted` hit-testing means hovers over the empty
            // gaps between the X strokes fall through to the chip's drag
            // handle (cursor: grab). Letting the button own the entire
            // hit area keeps the pointer cursor stable on hover.
            style={{ pointerEvents: 'none' }}
          >
            <path d="M18 6L6 18M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}
