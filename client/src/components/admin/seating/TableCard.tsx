import { useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { AdminGuest, EventTableWithOccupancy } from '../../../lib/api';
import { CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM, PARCHMENT } from '../../../garden/tokens';
import { useAdminTranslation } from '../../../lib/i18n/admin';
import GuestChip from './GuestChip';
import AddGuestToTableButton from './AddGuestToTableButton';
import type { AssignToTableFn, BulkUnassignFromTableFn, ClearAssignmentFn } from './useSeatingDnd';

// Layout density for the chip body. Picked once at the page level and passed
// down; each value maps to a specific layout treatment inside the card body.
//   - 'grid': chips wrap inline (existing default; densest)
//   - 'list': each chip occupies its own row (full names always visible)
// We deliberately ship only two modes to start — admins overwhelmingly want
// either "fit as much as possible on screen" or "I'm printing this".
export type TableCardViewMode = 'grid' | 'list';

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
  /** Bulk-unassign every (or N) invitations on this table back to the
   *  Unassigned column. Powers two affordances:
   *   - the kebab's "Clear table" action
   *   - the over-capacity warning's "Move last N to Unassigned" button
   */
  onBulkUnassign: BulkUnassignFromTableFn;
  /** Currently dragged chip (or null when nothing is being dragged). We use
   *  the headcount + source table to compute "would this drop over-fill the
   *  table?" so the card border can flash red *before* the drop, not after. */
  activeDrag?: {
    invitationId: number;
    guestCount: number;
    currentTableNumber: number | null;
  } | null;
  /** Layout density for the chip body. Defaults to 'grid' (existing layout). */
  viewMode?: TableCardViewMode;
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
  onBulkUnassign,
  activeDrag,
  viewMode = 'grid',
}: Props) {
  const at = useAdminTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  // Inline confirm for "Clear table". We render a small confirmation row
  // beneath the kebab menu instead of a full modal so admins can blow through
  // a re-plan without modal whiplash on every table. Destructive intent is
  // still preserved by requiring an explicit second click.
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);

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

  // `tableLabel` is used for accessible names (aria-label, confirm dialogs).
  // The visible header leads with a prominent number badge; the title text is
  // only rendered when the admin has set a custom label, so default tables
  // show just the badge instead of a redundant "Table N".
  const customLabel = table.label?.trim() || null;
  const tableLabel = customLabel ?? at.seatingTableLabel(table.tableNumber);

  // Pill colour rules:
  //   - over capacity → red
  //   - full (occupancy === capacity) → olive-green solid (matches the
  //     "attending" accent used elsewhere). The previous gold solid was
  //     visually indistinguishable from the gold table-number badge two
  //     centimetres to the left, so the "full" state stopped standing out.
  //   - partial → gold tinted
  //   - empty → muted gold outline
  const FULL_GREEN = '#059669'; // matches the "attending" status dot
  const isFull = occupancy === table.capacity && occupancy > 0;
  let pillStyle: React.CSSProperties;
  if (isOver_) {
    pillStyle = {
      background: 'rgba(220,38,38,0.12)',
      color: '#B91C1C',
      border: '1px solid rgba(220,38,38,0.35)',
    };
  } else if (isFull) {
    pillStyle = {
      background: 'rgba(5,150,105,0.12)',
      color: FULL_GREEN,
      border: `1px solid rgba(5,150,105,0.45)`,
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

  // Previously we rendered a plain-text "N free" / "Full" label beside the
  // capacity pill and another copy in the footer. The pill itself already
  // conveys both magnitude (8/10) and state (gold vs olive-green vs red),
  // so the extra text was redundant signal — admins reported the cards
  // looked "shouty" with Full repeated 3-4 times. The single source of
  // truth is now the pill (header) and the over-capacity warning row.

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
      // `min-w-0` so a long chip never balloons the card past its grid column
      // (grid items default to `min-width: auto`, which would otherwise let an
      // overflowing chip widen the whole card).
      //
      // The `group/card` scope is what powers the kebab "reveal on hover"
      // behaviour below — at rest the menu trigger is a faint zero-opacity
      // smudge so 12+ cards on screen don't show 12 sets of three dots
      // competing for attention. The menu is still keyboard-discoverable
      // via focus-within, and stays visible while the menu itself is open.
      className="group/card rounded-xl flex flex-col min-w-0"
      aria-label={`${tableLabel}. ${at.seatingCapacityLabel(occupancy, table.capacity)}${isOver_ ? `. ${at.seatingOverCapacity}` : ''}`}
    >
      {/* Header */}
      <div className="px-3.5 pt-3 pb-2 flex items-start justify-between gap-2">
        <div className="min-w-0 flex items-center gap-2.5">
          {/* Prominent table-number badge — always visible so the table number
              stays scannable regardless of whether the admin has given the
              table a custom label. Solid gold tile keeps it the strongest
              element in the header. */}
          <span
            className="inline-flex items-center justify-center rounded-lg font-sans font-bold tabular-nums leading-none flex-shrink-0"
            style={{
              background: GOLD,
              color: '#FFFFFF',
              minWidth: '2rem',
              height: '2rem',
              padding: '0 0.45rem',
              fontSize: '0.95rem',
              boxShadow: '0 1px 2px rgba(184,146,74,0.35)',
            }}
            aria-hidden="true"
          >
            {table.tableNumber}
          </span>
          {customLabel && (
            <h3
              className="font-sans font-semibold text-sm leading-tight truncate min-w-0"
              style={{ color: ESPRESSO }}
              title={customLabel}
            >
              {customLabel}
            </h3>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Capacity pill — always visible, communicates capacity at a glance */}
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-sans font-semibold tabular-nums"
            style={pillStyle}
            aria-live="polite"
            aria-label={`${at.seatingCapacityLabel(occupancy, table.capacity)}${isFull ? `. ${at.seatingFullPill}` : ''}`}
          >
            {isFull && (
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            )}
            {occupancy} / {table.capacity}
          </span>

          {/* Kebab menu — edit + delete. Hidden at rest, fades in when the
              card is hovered, when any child is focus-within (keyboard
              tabbing through), or when the menu is open (so it doesn't
              vanish under the cursor mid-click). With ~12 cards on screen
              the always-visible state was 12 sets of three dots competing
              with the table-number badges; admins almost never use this
              menu in the primary drag-and-drop loop, so it earns its
              visibility on intent rather than at rest. */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label={`${at.seatingEditTable} options`}
              className={
                'p-1 rounded transition-opacity transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] ' +
                (menuOpen
                  ? 'opacity-100'
                  : 'opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100 focus-visible:opacity-100')
              }
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
                  style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, minWidth: '11rem' }}
                >
                  {/* Safe actions group — edit + clear are both reversible
                      (clear runs through onBulkUnassign which surfaces an
                      Undo toast). They live above the visual divider that
                      isolates the destructive "Delete table" so a misclick
                      between Edit and Delete can't happen. */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit(table);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-sans transition-colors focus:outline-none focus-visible:bg-[rgba(184,146,74,0.12)] inline-flex items-center gap-2"
                    style={{ color: ESPRESSO, background: 'transparent' }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, color: ESPRESSO_DIM }}>
                      <path d="M12 20h9" />
                      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
                    </svg>
                    {at.seatingEditTable}
                  </button>
                  {/* Clear table — reversible bulk-unassign. Disabled when
                      the table is already empty (no rows to act on). */}
                  <button
                    type="button"
                    role="menuitem"
                    disabled={seated.length === 0}
                    onClick={() => {
                      if (seated.length === 0) return;
                      setMenuOpen(false);
                      setClearConfirmOpen(true);
                    }}
                    className="w-full text-left px-3 py-1.5 text-xs font-sans transition-colors focus:outline-none focus-visible:bg-[rgba(184,146,74,0.12)] inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
                    style={{ color: ESPRESSO, background: 'transparent' }}
                    onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.background = CREAM; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0, color: ESPRESSO_DIM }}>
                      <path d="M20 12H4M14 6l-6 6 6 6" />
                    </svg>
                    {at.seatingClearTable}
                  </button>
                  {/* Visual divider + spacer — the gap (`pt-1 mt-1`) plus
                      the divider line means an admin can't slip from "Clear"
                      onto "Delete" with a single accidental cursor twitch. */}
                  <div className="pt-1 mt-1" style={{ borderTop: `1px solid ${GOLD_DIM}` }}>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setMenuOpen(false);
                        onDelete(table);
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs font-sans transition-colors focus:outline-none focus-visible:bg-red-50 inline-flex items-center gap-2"
                      style={{ color: '#B91C1C', background: 'transparent' }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(220,38,38,0.06)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
                        <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6" />
                      </svg>
                      {at.seatingDeleteTable}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Over-capacity warning row — persistent so it remains visible after
          the drag finishes; mirrors the red pill above with a longer label.
          Now actionable: a "Move last N to Unassigned" button restores the
          table to capacity by popping the most-recently-added invitations
          off the seated list and bulk-unassigning them in one step. */}
      {isOver_ && (
        <div
          className="mx-3.5 mb-2 px-2 py-1.5 rounded-md flex items-center justify-between gap-2 text-[11px] font-sans font-medium"
          style={{ background: 'rgba(220,38,38,0.08)', color: '#B91C1C', border: '1px solid rgba(220,38,38,0.25)' }}
          role="alert"
        >
          <span className="inline-flex items-center gap-1.5 min-w-0">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ flexShrink: 0 }}>
              <path d="M12 9v4M12 17h.01" />
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            </svg>
            <span className="truncate">{at.seatingOverCapacityBy(overBy)}</span>
          </span>
          {seated.length > 0 && (
            <button
              type="button"
              onClick={() => {
                // Pop the most recent N invitations until headcount fits.
                // We sort by invitation id desc as a stable proxy for
                // "added most recently" — invitations are append-only.
                const ordered = seated
                  .slice()
                  .sort((a, b) => b.inv.id - a.inv.id);
                const ids: number[] = [];
                let popped = 0;
                for (const row of ordered) {
                  if (popped >= overBy) break;
                  ids.push(row.inv.id);
                  popped += row.inv.guestCount;
                }
                if (ids.length === 0) return;
                onBulkUnassign({
                  invitationIds: ids,
                  tableNumber: table.tableNumber,
                  tableLabel,
                });
              }}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 flex-shrink-0"
              style={{
                background: '#FFFFFF',
                color: '#B91C1C',
                border: '1px solid rgba(220,38,38,0.35)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(220,38,38,0.08)';
                e.currentTarget.style.borderColor = 'rgba(220,38,38,0.55)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = 'rgba(220,38,38,0.35)';
              }}
            >
              {at.seatingMoveOverflow(overBy)}
            </button>
          )}
        </div>
      )}

      {/* Inline "Clear table" confirmation row — kept inside the card (rather
          than a modal) because clearing is reversible via the Undo toast and
          the admin is already in a re-plan loop. Persists until either the
          confirm or the cancel is clicked. */}
      {clearConfirmOpen && (
        <div
          className="mx-3.5 mb-2 px-2 py-1.5 rounded-md flex items-center justify-between gap-2 text-[11px] font-sans"
          style={{ background: 'rgba(184,146,74,0.10)', color: ESPRESSO, border: `1px solid ${GOLD_DIM}` }}
          role="alertdialog"
          aria-label={at.seatingClearTable}
        >
          <span className="truncate">{at.seatingClearTableConfirm(tableLabel, occupancy)}</span>
          <span className="inline-flex items-center gap-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setClearConfirmOpen(false)}
              className="px-2 py-0.5 rounded-md text-[11px] font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: PARCHMENT, color: ESPRESSO, border: `1px solid ${GOLD_DIM}`, cursor: 'pointer' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; }}
            >
              {at.cancel}
            </button>
            <button
              type="button"
              onClick={() => {
                setClearConfirmOpen(false);
                onBulkUnassign({
                  invitationIds: seated.map(({ inv }) => inv.id),
                  tableNumber: table.tableNumber,
                  tableLabel,
                });
              }}
              className="px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: GOLD, color: '#FFFFFF', border: `1px solid ${GOLD}`, cursor: 'pointer' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#A6803F';
                e.currentTarget.style.borderColor = '#A6803F';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = GOLD;
                e.currentTarget.style.borderColor = GOLD;
              }}
            >
              {at.seatingClearTable}
            </button>
          </span>
        </div>
      )}

      {/* Body — list of seated chips. Doubles as the drop zone visual.
          Layout depends on viewMode:
            - 'grid' (default): chips wrap inline (dense scanning).
            - 'list': one chip per row (full names always visible — admins
              use this when they're printing or doing detail work).
          The "+ Add guest" trigger lives in the footer below, separated by
          a dashed top border, so it never looks like another seated chip. */}
      <div
        className={`px-3.5 pb-2 min-h-[3.5rem] content-start ${
          viewMode === 'list'
            ? 'flex flex-col gap-1'
            : 'flex flex-wrap gap-1.5 items-center'
        }`}
      >
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
            // Pass previous-table info so the unassign success toast can
            // show an Undo button that re-seats the guest at this table.
            onUnassign={() => onClearAssignment(inv.id, guest.name, table.tableNumber, tableLabel)}
          />
        ))}
      </div>

      {/* Footer — the "+ Add guest" picker lives here in its own dashed-
          bordered strip so it reads as an *action* (distinct from the
          seated chips above). Previously inlined into the chip wrap, where
          it visually looked like a guest.

          We use py-1 (not py-2) so the footer doesn't introduce an 8px-tall
          arrow-cursor "dead zone" above the small "+ Add guest" button —
          admins were noticing the cursor only flipped to pointer on the
          bottom half of the button because their mouse drifted across the
          padding zone on the way in. The button itself was also bumped to
          py-1.5 (was py-0.5) so the hit target is generous on its own. */}
      <div
        className="px-3.5 py-1 flex items-center justify-between gap-2"
        style={{ borderTop: `1px dashed ${GOLD_DIM}` }}
      >
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
