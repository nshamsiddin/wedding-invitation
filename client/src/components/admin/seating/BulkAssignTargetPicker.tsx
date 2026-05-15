import { useEffect, useMemo, useRef, useState } from 'react';
import type { EventTableWithOccupancy } from '../../../lib/api';
import { CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM, PARCHMENT } from '../../../garden/tokens';
import { useAdminTranslation } from '../../../lib/i18n/admin';

interface Props {
  /** All event-tables for the active event. We render every table with a
   *  capacity hint so the admin can see at a glance which ones still fit
   *  the selection without doing arithmetic in their head. */
  tables: EventTableWithOccupancy[];
  /** Total headcount of the current selection. Used to flag tables that
   *  would exceed capacity (the picker lets the admin proceed anyway —
   *  same forgiving rule as the rest of the planner). */
  selectionHeadcount: number;
  /** Disabled while a bulk-mutation chain is mid-flight. */
  disabled?: boolean;
  /** Fires with the chosen table; the parent kicks off the mutation chain. */
  onPick: (tableNumber: number, label: string | null) => void;
}

// ─── Dropdown that picks a single target table for a bulk-assign action ───
// Visually parallel to AddGuestToTableButton (the "+ Add guest" picker on
// each TableCard) but inverted: there the admin had picked a table and was
// choosing a guest; here the admin has picked guests and is choosing a
// table. Sharing visual language across both surfaces means an admin who
// learns one picker has effectively learned both.

export default function BulkAssignTargetPicker({
  tables,
  selectionHeadcount,
  disabled = false,
  onPick,
}: Props) {
  const at = useAdminTranslation();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter((t) => {
      if (String(t.tableNumber).includes(q)) return true;
      if (t.label && t.label.toLowerCase().includes(q)) return true;
      return false;
    });
  }, [tables, search]);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const id = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(id);
  }, [open]);

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled || tables.length === 0}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] disabled:opacity-40 disabled:cursor-not-allowed"
        style={{ background: GOLD, color: '#FFFFFF' }}
      >
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 12h14M13 5l7 7-7 7" />
        </svg>
        <span>{at.seatingBulkAssignTo}</span>
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={at.seatingBulkAssignTo}
          className="absolute right-0 top-full mt-1 z-30 rounded-lg shadow-lg overflow-hidden"
          style={{
            background: PARCHMENT,
            border: `1px solid ${GOLD_DIM}`,
            width: '17rem',
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
                }
              }}
              placeholder={at.seatingFilterTablesPlaceholder}
              aria-label={at.seatingFilterTablesPlaceholder}
              className="w-full px-2 py-1 rounded-md text-xs font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: CREAM, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
            />
          </div>

          <div className="max-h-64 overflow-y-auto py-1">
            {filtered.length === 0 ? (
              <p className="text-xs font-sans text-center py-3" style={{ color: ESPRESSO_DIM }}>
                {at.seatingFilterNoMatches}
              </p>
            ) : (
              filtered.map((t) => {
                const free = Math.max(0, t.capacity - t.occupancy);
                // "Predicted overflow" = bulk-assigning this whole selection
                // would push the table over capacity. We don't disable the row
                // (the planner is forgiving by design) but we do flag it red
                // so the admin makes a deliberate choice.
                const wouldOverflow = t.occupancy + selectionHeadcount > t.capacity;
                const label = t.label?.trim() || at.seatingTableLabel(t.tableNumber);
                return (
                  <button
                    key={t.tableNumber}
                    type="button"
                    role="option"
                    aria-selected={false}
                    onClick={() => {
                      onPick(t.tableNumber, t.label?.trim() || null);
                      setOpen(false);
                      setSearch('');
                    }}
                    className="w-full text-left px-2.5 py-1.5 text-xs font-sans transition-colors focus:outline-none focus-visible:bg-[rgba(184,146,74,0.14)]"
                    style={{ background: 'transparent', color: ESPRESSO }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(184,146,74,0.14)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-semibold truncate" style={{ color: ESPRESSO }}>
                          {label}
                        </div>
                        {t.label && (
                          <div className="text-[10px] tabular-nums" style={{ color: ESPRESSO_DIM }}>
                            #{t.tableNumber}
                          </div>
                        )}
                      </div>
                      <span
                        className="tabular-nums flex-shrink-0 px-1.5 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{
                          background: wouldOverflow
                            ? 'rgba(220,38,38,0.10)'
                            : free === 0
                              ? 'rgba(220,38,38,0.10)'
                              : 'rgba(184,146,74,0.14)',
                          color: wouldOverflow || free === 0 ? '#B91C1C' : '#7A4F10',
                          border: `1px solid ${wouldOverflow || free === 0 ? 'rgba(220,38,38,0.30)' : GOLD_DIM}`,
                        }}
                      >
                        {t.occupancy} / {t.capacity}
                      </span>
                    </div>
                    {wouldOverflow && (
                      <div className="text-[10px] mt-0.5" style={{ color: '#B91C1C' }}>
                        {at.seatingBulkWouldOverflow(
                          t.occupancy + selectionHeadcount - t.capacity,
                        )}
                      </div>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
