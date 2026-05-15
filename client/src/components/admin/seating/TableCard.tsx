import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { AdminGuest, EventTableWithOccupancy } from '../../../lib/api';
import { CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM, PARCHMENT } from '../../../garden/tokens';
import { useAdminTranslation } from '../../../lib/i18n/admin';
import GuestChip from './GuestChip';
import AddGuestToTableButton from './AddGuestToTableButton';
import type { AssignToTableFn, ClearAssignmentFn } from './useSeatingDnd';

interface Props {
  table: EventTableWithOccupancy;
  /** All guests for the active event — filtered down to this table's seated chips. */
  guests: AdminGuest[];
  eventId: number;
  onEdit: (table: EventTableWithOccupancy) => void;
  onDelete: (table: EventTableWithOccupancy) => void;
  /** Removes a single guest's invitation from this table. The chip exposes
   *  this as a small "×" button — same effect as dragging back to the
   *  Unassigned column. */
  onClearAssignment: ClearAssignmentFn;
  /** Assigns an unassigned guest to this table. Powers the "+ Add guest"
   *  popover for the click-to-assign path (alternative to drag-and-drop). */
  onAssignToTable: AssignToTableFn;
  /** Currently dragged chip (or null when nothing is being dragged). We use
   *  the headcount + source table to compute "would this drop over-fill the
   *  table?" so the card border can flash red *before* the drop, not after. */
  activeDrag?: {
    invitationId: number;
    guestCount: number;
    currentTableNumber: number | null;
  } | null;
}

export function tableDropId(eventId: number, tableNumber: number): string {
  return `table:${eventId}:${tableNumber}`;
}

export default function TableCard({
  table,
  guests,
  eventId,
  onEdit,
  onDelete,
  onClearAssignment,
  onAssignToTable,
  activeDrag,
}: Props) {
  const at = useAdminTranslation();
  const [menuOpen, setMenuOpen] = useState(false);

  const { setNodeRef, isOver } = useDroppable({
    id: tableDropId(eventId, table.tableNumber),
    data: {
      type: 'table',
      eventId,
      tableNumber: table.tableNumber,
      capacity: table.capacity,
    },
  });

  // Pair each guest with their per-event invitation, but only keep guests
  // whose invitation actually points at this table.
  const seated = guests
    .map((g) => ({
      guest: g,
      inv: g.invitations.find((i) => i.eventId === eventId && i.tableNumber === table.tableNumber),
    }))
    .filter((row): row is { guest: AdminGuest; inv: NonNullable<typeof row.inv> } => row.inv != null);

  // We use occupancy from the server (which sums guestCount across all linked
  // invitations) so the displayed count matches the per-row party-size badges.
  // Falling back to a local sum keeps things consistent during optimistic
  // updates before the server has confirmed the new mapping.
  const localOccupancy = seated.reduce((sum, { inv }) => sum + inv.guestCount, 0);
  const occupancy = Math.max(table.occupancy, localOccupancy);
  const overBy = Math.max(0, occupancy - table.capacity);
  const isOver_ = overBy > 0;
  const freeSeats = Math.max(0, table.capacity - occupancy);

  // Predicted occupancy if the currently-dragged chip is dropped here. Used
  // to drive the red "drop will over-fill" outline *during* the drag rather
  // than only after the drop has settled.
  const wouldOverflow = (() => {
    if (!activeDrag) return false;
    if (!isOver) return false; // only when this card is the hover target
    if (activeDrag.currentTableNumber === table.tableNumber) return false; // no-op move
    return occupancy + activeDrag.guestCount > table.capacity;
  })();

  const tableLabel = table.label?.trim()
    ? table.label.trim()
    : at.seatingTableLabel(table.tableNumber);

  // Pill colour rules:
  //   - over capacity → red
  //   - full (occupancy === capacity) → gold solid
  //   - partial → gold tinted
  //   - empty → muted gold outline
  let pillStyle: React.CSSProperties;
  if (isOver_) {
    pillStyle = {
      background: 'rgba(220,38,38,0.12)',
      color: '#B91C1C',
      border: '1px solid rgba(220,38,38,0.35)',
    };
  } else if (occupancy === table.capacity && occupancy > 0) {
    pillStyle = {
      background: GOLD,
      color: '#FFFFFF',
      border: `1px solid ${GOLD}`,
    };
  } else if (occupancy > 0) {
    pillStyle = {
      background: 'rgba(184,146,74,0.14)',
      color: '#7A4F10',
      border: `1px solid ${GOLD_DIM}`,
    };
  } else {
    pillStyle = {
      background: 'transparent',
      color: ESPRESSO_DIM,
      border: `1px dashed ${GOLD_DIM}`,
    };
  }

  return (
    <div
      ref={setNodeRef}
      data-table-number={table.tableNumber}
      style={{
        background: wouldOverflow ? 'rgba(220,38,38,0.04)' : PARCHMENT,
        // Card outline states:
        //   - default: faint gold border
        //   - drag hover (drop will fit): bright gold border + soft tint
        //   - drag hover (drop will over-fill): red border + red glow so the
        //     admin can decide to release on a different card
        //   - already over capacity: persistent red border
        border: `1.5px solid ${
          wouldOverflow
            ? '#DC2626'
            : isOver
              ? GOLD
              : isOver_
                ? 'rgba(220,38,38,0.45)'
                : GOLD_DIM
        }`,
        boxShadow: wouldOverflow
          ? '0 0 0 3px rgba(220,38,38,0.18)'
          : isOver
            ? '0 0 0 3px rgba(184,146,74,0.18)'
            : '0 1px 2px rgba(42,31,26,0.04)',
        transition: 'box-shadow 0.15s, border-color 0.15s, background 0.15s',
      }}
      className="rounded-xl flex flex-col"
      aria-label={`${tableLabel}. ${at.seatingCapacityLabel(occupancy, table.capacity)}${isOver_ ? `. ${at.seatingOverCapacity}` : ''}`}
    >
      {/* Header */}
      <div className="px-3.5 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3
            className="font-sans font-semibold text-sm leading-tight truncate"
            style={{ color: ESPRESSO }}
            title={tableLabel}
          >
            {tableLabel}
          </h3>
          {table.label && (
            <p
              className="text-[10px] font-sans uppercase tracking-wider mt-0.5 tabular-nums"
              style={{ color: ESPRESSO_DIM }}
            >
              #{table.tableNumber}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Capacity pill — always visible, communicates capacity at a glance */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans font-semibold tabular-nums"
            style={pillStyle}
            aria-live="polite"
          >
            {occupancy} / {table.capacity}
          </span>

          {/* Kebab menu — edit + delete. We keep these collapsed under a
              single button so the card header isn't visually busy at rest. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`${at.seatingEditTable} options`}
              className="p-1 rounded transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ color: ESPRESSO_DIM }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                <circle cx="5" cy="12" r="1.6" />
                <circle cx="12" cy="12" r="1.6" />
                <circle cx="19" cy="12" r="1.6" />
              </svg>
            </button>
            {menuOpen && (
              <>
                {/* Outside-click veil — invisible, captures clicks to close
                    the menu without needing a global click listener. */}
                <button
                  type="button"
                  className="fixed inset-0 z-10"
                  aria-hidden="true"
                  tabIndex={-1}
                  onClick={() => setMenuOpen(false)}
                  style={{ background: 'transparent', cursor: 'default' }}
                />
                <div
                  role="menu"
                  className="absolute right-0 top-full mt-1 z-20 rounded-lg shadow-lg overflow-hidden"
                  style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, minWidth: '9rem' }}
                >
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(table);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-sans transition-colors focus:outline-none focus-visible:bg-[rgba(184,146,74,0.12)]"
                    style={{ color: ESPRESSO, background: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {at.seatingEditTable}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onDelete(table);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-sans transition-colors focus:outline-none"
                    style={{ color: '#B91C1C', background: 'transparent', borderTop: `1px solid ${GOLD_DIM}` }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    {at.seatingDeleteTable}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Over-capacity warning row — persistent so it remains visible after
          the drag finishes; mirrors the red pill above with a longer label. */}
      {isOver_ && (
        <div
          className="mx-3.5 mb-2 px-2 py-1 rounded-md flex items-center gap-1.5 text-[11px] font-sans font-medium"
          style={{ background: 'rgba(220,38,38,0.08)', color: '#B91C1C', border: '1px solid rgba(220,38,38,0.25)' }}
          role="alert"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 9v4M12 17h.01" />
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
          </svg>
          {at.seatingOverCapacityBy(overBy)}
        </div>
      )}

      {/* Body — list of seated chips. Doubles as the drop zone visual. The
          "+ Add guest" picker is inlined as the last item in the chip row so
          its visual weight matches the chips and it stays close to where the
          new chip will appear, instead of being parked off in the header. */}
      <div className="px-3.5 pb-3 flex flex-wrap gap-1.5 min-h-[3.5rem] content-start items-center">
        {seated.length === 0 && !isOver && (
          <p
            className="text-xs font-sans flex-1 py-1"
            style={{ color: ESPRESSO_DIM }}
          >
            {at.seatingFreeSeats(freeSeats)}
          </p>
        )}
        {seated.length === 0 && isOver && (
          <p
            className="text-xs font-sans w-full text-center py-2"
            style={{ color: ESPRESSO_DIM }}
          >
            {at.seatingDragHint}
          </p>
        )}
        {seated.map(({ guest, inv }) => (
          <GuestChip
            key={inv.id}
            guest={guest}
            invitation={inv}
            onUnassign={() => onClearAssignment(inv.id, guest.name)}
          />
        ))}
        <AddGuestToTableButton
          guests={guests}
          eventId={eventId}
          tableNumber={table.tableNumber}
          tableLabel={table.label?.trim() || null}
          freeSeats={freeSeats}
          onAssign={onAssignToTable}
        />
      </div>
    </div>
  );
}
