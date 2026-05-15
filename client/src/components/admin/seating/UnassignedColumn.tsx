import { useEffect, useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { AdminGuest, EventTableWithOccupancy } from '../../../lib/api';
import { CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM, PARCHMENT } from '../../../garden/tokens';
import { useAdminTranslation } from '../../../lib/i18n/admin';
import GuestChip from './GuestChip';
import BulkAssignTargetPicker from './BulkAssignTargetPicker';
import type { AssignToTableFn } from './useSeatingDnd';

interface Props {
  guests: AdminGuest[];
  eventId: number;
  /** All event-tables for the active event, used by the bulk-assign popover. */
  tables: EventTableWithOccupancy[];
  /** Mutation function from `useSeatingDnd`; we call it once per selected
   *  invitation when the admin picks a bulk-assign target. The hook's
   *  optimistic-update pipeline tolerates fan-out fine because each
   *  `onMutate` snapshots the cache including all prior optimistic writes. */
  onAssignToTable: AssignToTableFn;
}

// ─── Status filter chips ────────────────────────────────────────────────────
// We default to *all* statuses on so admins still see declined / pending
// guests in the unassigned column (sometimes a "declined" RSVP gets reversed
// last-minute and the planner is the natural place to spot it). But making
// the filter explicit means an admin running the final pass before the event
// can hide declined guests with a single click and not waste time scanning
// rows they can never seat.

const ALL_STATUSES = ['attending', 'maybe', 'pending', 'declined'] as const;
type GuestStatus = (typeof ALL_STATUSES)[number];

const STATUS_DOT_COLOR: Record<GuestStatus, string> = {
  attending: '#059669',
  declined: '#DC2626',
  maybe: '#D97706',
  pending: GOLD,
};

// ─── Droppable column for unassigned guests ─────────────────────────────────
// The container itself is a drop target — dragging a chip back here clears
// the invitation's tableNumber.

export const UNASSIGNED_DROP_ID = 'unassigned';

export default function UnassignedColumn({ guests, eventId, tables, onAssignToTable }: Props) {
  const at = useAdminTranslation();
  const [search, setSearch] = useState('');
  // Set of statuses the admin wants to see. Stored as a Set so we can flip
  // an individual status without resequencing an array.
  const [statusFilter, setStatusFilter] = useState<Set<GuestStatus>>(() => new Set(ALL_STATUSES));
  // Selected invitations for bulk-assign. We key by invitationId because a
  // guest can in theory have invitations to multiple events and only one of
  // those is being seated here.
  const [selected, setSelected] = useState<Set<number>>(() => new Set());
  // Index of the chip most recently toggled — anchors shift-click range
  // selection (a UX pattern admins know from email clients / file managers).
  const [anchorIdx, setAnchorIdx] = useState<number | null>(null);

  const { setNodeRef, isOver } = useDroppable({
    id: UNASSIGNED_DROP_ID,
    data: { type: 'unassigned' },
  });

  // Each row in the unassigned column represents a guest's *invitation for
  // this event* — not the guest themselves. A guest can have invitations for
  // multiple events; we filter and pair them at render time.
  const allRows = useMemo(() => {
    const out: { guest: AdminGuest; invitation: AdminGuest['invitations'][number] }[] = [];
    for (const g of guests) {
      const inv = g.invitations.find((i) => i.eventId === eventId);
      if (inv && inv.tableNumber == null) {
        out.push({ guest: g, invitation: inv });
      }
    }
    return out;
  }, [guests, eventId]);

  // Per-status counts power the chip badges and run off the unfiltered list
  // so the numbers don't change as the admin toggles filters.
  const statusCounts = useMemo(() => {
    const counts: Record<GuestStatus, number> = { attending: 0, maybe: 0, pending: 0, declined: 0 };
    for (const { invitation } of allRows) {
      const s = invitation.status as GuestStatus;
      if (s in counts) counts[s] += 1;
    }
    return counts;
  }, [allRows]);

  const visibleRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allRows.filter(({ guest, invitation }) => {
      if (!statusFilter.has(invitation.status as GuestStatus)) return false;
      if (q && !guest.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [allRows, search, statusFilter]);

  // Drop selections that are no longer visible (the row was assigned by
  // someone else, or filtered out). Otherwise the count in the toolbar
  // would diverge from what the admin can see.
  useEffect(() => {
    setSelected((prev) => {
      if (prev.size === 0) return prev;
      const visibleIds = new Set(visibleRows.map(({ invitation }) => invitation.id));
      const next = new Set<number>();
      for (const id of prev) {
        if (visibleIds.has(id)) next.add(id);
      }
      return next.size === prev.size ? prev : next;
    });
  }, [visibleRows]);

  const toggleStatus = (status: GuestStatus) => {
    setStatusFilter((prev) => {
      const next = new Set(prev);
      if (next.has(status)) {
        next.delete(status);
      } else {
        next.add(status);
      }
      // Re-enable everything when the admin would otherwise end up with
      // an empty filter — clicking a single chip when only that chip is
      // active reads as "show me everything else", not "hide everything".
      if (next.size === 0) {
        for (const s of ALL_STATUSES) next.add(s);
      }
      return next;
    });
  };

  const setOnlyStatus = (status: GuestStatus) => {
    setStatusFilter(new Set([status]));
  };

  // Selection helpers ───────────────────────────────────────────────────────
  const handleToggleSelect = (
    invitationId: number,
    rowIdx: number,
    mods: { shiftKey: boolean; metaKey: boolean; ctrlKey: boolean },
  ) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (mods.shiftKey && anchorIdx != null && anchorIdx !== rowIdx) {
        // Range-toggle: select every visible row between the anchor and the
        // clicked row. We mirror the OS convention where shift-click sets
        // (rather than toggles) the range to the anchor's state.
        const anchorRow = visibleRows[anchorIdx];
        const desired = anchorRow ? prev.has(anchorRow.invitation.id) : true;
        const lo = Math.min(anchorIdx, rowIdx);
        const hi = Math.max(anchorIdx, rowIdx);
        for (let i = lo; i <= hi; i += 1) {
          const row = visibleRows[i];
          if (!row) continue;
          if (desired) next.add(row.invitation.id);
          else next.delete(row.invitation.id);
        }
        return next;
      }
      if (next.has(invitationId)) next.delete(invitationId);
      else next.add(invitationId);
      return next;
    });
    setAnchorIdx(rowIdx);
  };

  const clearSelection = () => {
    setSelected(new Set());
    setAnchorIdx(null);
  };

  const selectAllVisible = () => {
    setSelected(new Set(visibleRows.map(({ invitation }) => invitation.id)));
    setAnchorIdx(null);
  };

  // Headcount the selection consumes — drives the over-capacity warning in
  // the bulk-assign target popover.
  const selectionHeadcount = useMemo(() => {
    let total = 0;
    for (const { invitation } of visibleRows) {
      if (selected.has(invitation.id)) total += invitation.guestCount;
    }
    return total;
  }, [visibleRows, selected]);

  const handleBulkAssign = (tableNumber: number, label: string | null) => {
    // Snapshot the visible rows because the cache will mutate as soon as
    // the first call's onMutate fires.
    const rows = visibleRows.filter(({ invitation }) => selected.has(invitation.id));
    for (const { guest, invitation } of rows) {
      onAssignToTable(invitation.id, guest.name, tableNumber, label);
    }
    clearSelection();
  };

  const selectionActive = selected.size > 0;
  const allVisibleSelected = visibleRows.length > 0 && selected.size === visibleRows.length;

  return (
    <aside
      ref={setNodeRef}
      style={{
        background: isOver ? 'rgba(184,146,74,0.10)' : PARCHMENT,
        border: `1.5px ${isOver ? 'solid' : 'dashed'} ${isOver ? GOLD : GOLD_DIM}`,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      className="rounded-xl flex flex-col"
      aria-label={at.seatingUnassigned}
    >
      <div
        className="px-4 py-3 flex items-center justify-between gap-2"
        style={{ borderBottom: `1px solid ${GOLD_DIM}` }}
      >
        <div className="min-w-0">
          <h2
            className="font-sans font-semibold text-sm leading-tight"
            style={{ color: ESPRESSO }}
          >
            {at.seatingUnassigned}
          </h2>
          <p
            className="text-xs font-sans mt-0.5"
            style={{ color: ESPRESSO_DIM }}
            aria-live="polite"
          >
            {at.seatingUnassignedCount(visibleRows.length)}
          </p>
        </div>
      </div>

      <div className="px-3 pt-3">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
            style={{ color: ESPRESSO_DIM }}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={at.searchPlaceholder}
            aria-label={at.searchPlaceholder}
            className="w-full pl-7 pr-2 py-1.5 rounded-lg text-xs font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] transition-colors"
            style={{ background: CREAM, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
          />
        </div>
      </div>

      {/* Status filter chips — alt-click on a chip narrows to that status
          alone; plain click toggles. We rely on a small "info" tooltip to
          teach the alt-click shortcut without cluttering the visible UI. */}
      <div className="px-3 pt-2 flex flex-wrap gap-1">
        {ALL_STATUSES.map((status) => {
          const enabled = statusFilter.has(status);
          const count = statusCounts[status];
          return (
            <button
              key={status}
              type="button"
              onClick={(e) => {
                if (e.altKey) setOnlyStatus(status);
                else toggleStatus(status);
              }}
              aria-pressed={enabled}
              title={at.seatingStatusFilterHint}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-sans font-semibold tabular-nums transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{
                background: enabled ? 'rgba(184,146,74,0.14)' : 'transparent',
                color: enabled ? ESPRESSO : ESPRESSO_DIM,
                border: `1px solid ${enabled ? GOLD_DIM : 'transparent'}`,
                opacity: count === 0 && enabled ? 0.55 : 1,
              }}
            >
              <span
                aria-hidden="true"
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: '50%',
                  background: enabled ? STATUS_DOT_COLOR[status] : ESPRESSO_DIM,
                }}
              />
              <span>{at.statusFilterLabel(status)}</span>
              <span style={{ color: ESPRESSO_DIM }}>· {count}</span>
            </button>
          );
        })}
      </div>

      {/* Bulk-action toolbar — only visible when at least one row is selected.
          The toolbar deliberately sits between the filter chips and the list
          (rather than as a sticky header) so its presence/absence reflows
          the layout and grabs the admin's eye. */}
      {selectionActive && (
        <div
          className="mx-3 mt-2 px-2 py-1.5 rounded-md flex items-center justify-between gap-2"
          style={{
            background: 'rgba(184,146,74,0.14)',
            border: `1px solid ${GOLD_DIM}`,
          }}
          role="region"
          aria-label={at.seatingBulkSelectionToolbar}
        >
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-[11px] font-sans font-semibold tabular-nums" style={{ color: ESPRESSO }}>
              {at.seatingSelectedCount(selected.size, selectionHeadcount)}
            </span>
            <button
              type="button"
              onClick={clearSelection}
              className="text-[10px] font-sans underline focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ color: ESPRESSO_DIM, background: 'transparent', border: 'none', cursor: 'pointer' }}
            >
              {at.cancel}
            </button>
          </div>
          <BulkAssignTargetPicker
            tables={tables}
            selectionHeadcount={selectionHeadcount}
            onPick={handleBulkAssign}
          />
        </div>
      )}

      {/* "Select all visible" affordance — shown only when there's at least
          one row to act on. Acts as an indeterminate header checkbox. */}
      {visibleRows.length > 0 && (
        <div className="px-3 pt-2 flex items-center justify-between">
          <button
            type="button"
            onClick={() => (allVisibleSelected ? clearSelection() : selectAllVisible())}
            className="inline-flex items-center gap-1.5 text-[10px] font-sans font-semibold focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] rounded px-1"
            style={{ color: ESPRESSO_DIM, background: 'transparent', border: 'none', cursor: 'pointer' }}
            aria-label={allVisibleSelected ? at.seatingDeselectAll : at.seatingSelectAllVisible}
          >
            <span
              aria-hidden="true"
              style={{
                width: 12,
                height: 12,
                borderRadius: '50%',
                background: allVisibleSelected ? GOLD : 'transparent',
                border: `1.5px solid ${allVisibleSelected ? GOLD : GOLD_DIM}`,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              {allVisibleSelected && (
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              )}
            </span>
            {allVisibleSelected ? at.seatingDeselectAll : at.seatingSelectAllVisible}
          </button>
        </div>
      )}

      <div className="p-3 flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: '70vh' }}>
        {visibleRows.length === 0 ? (
          <p
            className="text-xs font-sans text-center py-6"
            style={{ color: ESPRESSO_DIM }}
          >
            {search.length > 0 ? at.noGuestsFound : at.seatingUnassignedEmpty}
          </p>
        ) : (
          visibleRows.map(({ guest, invitation }, idx) => (
            <GuestChip
              key={invitation.id}
              guest={guest}
              invitation={invitation}
              isSelected={selected.has(invitation.id)}
              selectionActive={selectionActive}
              onToggleSelect={(mods) => handleToggleSelect(invitation.id, idx, mods)}
            />
          ))
        )}
      </div>
    </aside>
  );
}
