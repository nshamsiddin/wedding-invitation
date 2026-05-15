import { useEffect, useMemo, useRef, useState } from 'react';
import type { AdminGuest } from '../../../lib/api';
import { CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM, PARCHMENT } from '../../../garden/tokens';
import { useAdminTranslation } from '../../../lib/i18n/admin';
import type { AssignToTableFn } from './useSeatingDnd';

interface Props {
  /** Full guest list for the active event. We filter to the unassigned slice
   *  inside this component so the parent doesn't have to. */
  guests: AdminGuest[];
  eventId: number;
  tableNumber: number;
  tableLabel: string | null;
  /** Free seats left at this table. Drives both the warning state and the
   *  "Full" disabled label on the trigger button. */
  freeSeats: number;
  onAssign: AssignToTableFn;
}

// ─── "+ Add guest" trigger + dropdown picker ──────────────────────────────
// The drag-and-drop UX collapses badly when a screen has 30+ tables — admins
// have to drag a chip across the page and keep an eye on auto-scroll. Pairing
// drag-drop with this point-and-click picker is the standard "best of both"
// pattern: drag is fastest for spatial moves, click is fastest for "I know
// who goes here, I just need to pick the name".
//
// Implementation notes:
//   - The dropdown is rendered absolutely under the trigger, anchored
//     bottom-right. It's the only popover on the card so we don't bother
//     with a portal — z-20 is enough to clear sibling table cards.
//   - Outside-click and Escape both close it. Clicking a name fires the
//     mutation and closes immediately so an admin can fly through additions.
//   - Keyboard support: ↑/↓ navigate, Enter assigns, Escape closes.

export default function AddGuestToTableButton({
  guests,
  eventId,
  tableNumber,
  tableLabel,
  freeSeats,
  onAssign,
}: Props) {
  const at = useAdminTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Build the unassigned-for-this-event list once per (guests, eventId) tuple.
  // We surface the per-invitation guestCount because seating capacity is
  // headcount-based (a "party of 4" consumes 4 of this table's seats).
  const unassigned = useMemo(() => {
    const out: { guest: AdminGuest; invitationId: number; guestCount: number }[] = [];
    for (const g of guests) {
      const inv = g.invitations.find((i) => i.eventId === eventId);
      if (inv && inv.tableNumber == null) {
        out.push({ guest: g, invitationId: inv.id, guestCount: inv.guestCount });
      }
    }
    return out;
  }, [guests, eventId]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return unassigned;
    return unassigned.filter(({ guest }) => guest.name.toLowerCase().includes(q));
  }, [unassigned, search]);

  // Reset highlighted row whenever the visible list changes — otherwise the
  // pointer can dangle past the end after typing.
  useEffect(() => {
    setActiveIdx(0);
  }, [search, filtered.length]);

  // Outside-click closer. Capturing on the document keeps the popover from
  // also fighting the table card's drag-handle click activation distance.
  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  // Auto-focus the search input on open so admins can start typing right away.
  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  const isFull = freeSeats <= 0;

  const handlePick = (invitationId: number, guestName: string) => {
    onAssign(invitationId, guestName, tableNumber, tableLabel);
    setOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={unassigned.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={at.seatingAddGuestToTable}
        title={
          unassigned.length === 0
            ? at.seatingNoUnassignedGuests
            : isFull
              ? at.seatingTableFullHint
              : at.seatingAddGuestToTable
        }
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          background: isFull ? 'rgba(220,38,38,0.10)' : 'rgba(184,146,74,0.14)',
          color: isFull ? '#B91C1C' : '#7A4F10',
          border: isFull ? '1px solid rgba(220,38,38,0.30)' : `1px solid ${GOLD_DIM}`,
        }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.75} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 5v14M5 12h14" />
        </svg>
        <span>{at.seatingAddGuest}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={at.seatingAddGuestToTable}
          className="absolute right-0 top-full mt-1 z-20 rounded-lg shadow-lg overflow-hidden"
          style={{
            background: PARCHMENT,
            border: `1px solid ${GOLD_DIM}`,
            width: '15rem',
          }}
        >
          <div className="p-2" style={{ borderBottom: `1px solid ${GOLD_DIM}` }}>
            <input
              ref={inputRef}
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  e.preventDefault();
                  setOpen(false);
                  return;
                }
                if (e.key === 'ArrowDown') {
                  e.preventDefault();
                  setActiveIdx((i) => Math.min(filtered.length - 1, i + 1));
                  return;
                }
                if (e.key === 'ArrowUp') {
                  e.preventDefault();
                  setActiveIdx((i) => Math.max(0, i - 1));
                  return;
                }
                if (e.key === 'Enter') {
                  const row = filtered[activeIdx];
                  if (row) {
                    e.preventDefault();
                    handlePick(row.invitationId, row.guest.name);
                  }
                }
              }}
              placeholder={at.searchPlaceholder}
              aria-label={at.searchPlaceholder}
              className="w-full px-2 py-1 rounded-md text-xs font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: CREAM, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
            />
            {isFull && (
              <p
                className="text-[10px] font-sans mt-1.5 leading-snug"
                style={{ color: '#B91C1C' }}
                role="alert"
              >
                {at.seatingTableFullHint}
              </p>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs font-sans text-center py-3" style={{ color: ESPRESSO_DIM }}>
                {unassigned.length === 0 ? at.seatingNoUnassignedGuests : at.noGuestsFound}
              </p>
            ) : (
              filtered.map(({ guest, invitationId, guestCount }, idx) => {
                const isActive = idx === activeIdx;
                // We don't disable rows when over-capacity — admins sometimes
                // intentionally over-seat a table and prefer the warning over
                // a hard block. The trigger styling already signals "full".
                return (
                  <button
                    key={invitationId}
                    type="button"
                    role="option"
                    aria-selected={isActive}
                    onMouseEnter={() => setActiveIdx(idx)}
                    onClick={() => handlePick(invitationId, guest.name)}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-sans flex items-center justify-between gap-2 transition-colors focus:outline-none"
                    style={{
                      background: isActive ? 'rgba(184,146,74,0.14)' : 'transparent',
                      color: ESPRESSO,
                    }}
                  >
                    <span className="truncate">{guest.name}</span>
                    {guestCount > 1 && (
                      <span
                        className="tabular-nums flex-shrink-0"
                        style={{
                          background: 'rgba(184,146,74,0.18)',
                          color: ESPRESSO_DIM,
                          fontSize: '0.62rem',
                          fontWeight: 700,
                          padding: '0 5px',
                          borderRadius: '6px',
                          lineHeight: '14px',
                        }}
                      >
                        ×{guestCount}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>

          <div
            className="px-2 py-1 text-[10px] font-sans tabular-nums flex items-center justify-between"
            style={{ color: ESPRESSO_DIM, borderTop: `1px solid ${GOLD_DIM}`, background: CREAM }}
          >
            <span>{at.seatingUnassignedCount(unassigned.length)}</span>
            <span style={{ color: isFull ? '#B91C1C' : GOLD }}>
              {at.seatingFreeSeats(Math.max(0, freeSeats))}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
