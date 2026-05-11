import { useMemo, useState } from 'react';
import { useDroppable } from '@dnd-kit/core';
import type { AdminGuest } from '../../../lib/api';
import { CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM, PARCHMENT } from '../../../garden/tokens';
import { useAdminTranslation } from '../../../lib/i18n/admin';
import GuestChip from './GuestChip';

interface Props {
  guests: AdminGuest[];
  eventId: number;
}

// ─── Droppable column for unassigned guests ─────────────────────────────────
// The container itself is a drop target — dragging a chip back here clears
// the invitation's tableNumber.

export const UNASSIGNED_DROP_ID = 'unassigned';

export default function UnassignedColumn({ guests, eventId }: Props) {
  const at = useAdminTranslation();
  const [search, setSearch] = useState('');

  const { setNodeRef, isOver } = useDroppable({
    id: UNASSIGNED_DROP_ID,
    data: { type: 'unassigned' },
  });

  // Each row in the unassigned column represents a guest's *invitation for
  // this event* — not the guest themselves. A guest can have invitations for
  // multiple events; we filter and pair them at render time.
  const rows = useMemo(() => {
    const out: { guest: AdminGuest; invitation: AdminGuest['invitations'][number] }[] = [];
    for (const g of guests) {
      const inv = g.invitations.find((i) => i.eventId === eventId);
      // Only include invitations that aren't yet linked to a table for this event.
      if (inv && inv.tableNumber == null) {
        out.push({ guest: g, invitation: inv });
      }
    }
    const q = search.trim().toLowerCase();
    if (!q) return out;
    return out.filter(({ guest }) => guest.name.toLowerCase().includes(q));
  }, [guests, eventId, search]);

  return (
    <aside
      ref={setNodeRef}
      // The column doubles as a drop target — when a chip hovers over it the
      // border + background shift to make the affordance obvious. Tailwind
      // doesn't reach into nested @dnd-kit state directly, so we drive the
      // style inline based on `isOver`.
      style={{
        background: isOver ? 'rgba(184,146,74,0.10)' : PARCHMENT,
        border: `1.5px ${isOver ? 'solid' : 'dashed'} ${isOver ? GOLD : GOLD_DIM}`,
        transition: 'background 0.15s, border-color 0.15s',
      }}
      className="rounded-xl flex flex-col"
      aria-label={at.seatingUnassigned}
    >
      {/* Header */}
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
            {at.seatingUnassignedCount(rows.length)}
          </p>
        </div>
      </div>

      {/* Search */}
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

      {/* List */}
      <div className="p-3 flex flex-col gap-1.5 overflow-y-auto" style={{ maxHeight: '70vh' }}>
        {rows.length === 0 ? (
          <p
            className="text-xs font-sans text-center py-6"
            style={{ color: ESPRESSO_DIM }}
          >
            {search.length > 0 ? at.noGuestsFound : at.seatingUnassignedEmpty}
          </p>
        ) : (
          rows.map(({ guest, invitation }) => (
            <GuestChip key={invitation.id} guest={guest} invitation={invitation} />
          ))
        )}
      </div>
    </aside>
  );
}
