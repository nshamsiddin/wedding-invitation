import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type {
  AdminGuest, AdminInvitation, AdminEvent,
  EventTableWithOccupancy,
} from '../../lib/api';
import { eventTablesApi } from '../../lib/api';
import { PARCHMENT, CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM } from '../../garden/tokens';
import { useAdminTranslation } from '../../lib/i18n/admin';
import { getEventDisplayName } from './adminTokens';

// ─── Status styling — colour + icon to avoid colour-only differentiation ───────
// WCAG 1.4.1: information must not rely solely on colour.

const STATUS_CONFIG: Record<
  string,
  { classes: string; icon: React.ReactNode; label: string }
> = {
  attending: {
    classes: 'bg-emerald-50 text-emerald-800 border border-emerald-200',
    icon: (
      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
      </svg>
    ),
    label: 'Attending',
  },
  declined: {
    classes: 'bg-red-50 text-red-800 border border-red-200',
    icon: (
      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
      </svg>
    ),
    label: 'Declined',
  },
  maybe: {
    classes: 'bg-yellow-50 text-yellow-800 border border-yellow-200',
    icon: (
      <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
      </svg>
    ),
    label: 'Maybe',
  },
  pending: {
    classes: 'bg-[rgba(184,146,74,0.10)] text-[#2A1F1A] border border-[rgba(184,146,74,0.35)]',
    icon: (
      <svg className="w-3 h-3 flex-shrink-0 opacity-60" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
      </svg>
    ),
    label: 'Pending',
  },
};

// Status options offered in the inline editor. "maybe" is legacy — kept in
// STATUS_CONFIG so existing records still render, but never offered as a
// pickable option here, mirroring the StatusPicker form control.
type EditableStatus = 'attending' | 'declined' | 'pending';
const EDITABLE_STATUSES: readonly EditableStatus[] = ['attending', 'declined', 'pending'] as const;

// ─── Inline status badge editor ──────────────────────────────────────────────
// Click the badge → small popover anchored beneath it with the 3 status
// options. Click outside or Escape to dismiss. When `onChange` is not
// provided the badge renders as a plain (non-interactive) pill — that's used
// in any future read-only contexts and lets us share one component path.
function StatusBadgeEditor({
  invitationId,
  status,
  onChange,
  ariaLabelContext,
}: {
  invitationId: number;
  status: string;
  onChange?: (invitationId: number, next: EditableStatus) => void;
  /** Extra context for screen readers, e.g. guest name + event name. */
  ariaLabelContext?: string;
}) {
  const at = useAdminTranslation();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click or Escape — restore focus to trigger on Escape so
  // keyboard users don't get dumped at the document root.
  useEffect(() => {
    if (!open) return;
    const handleDocPointer = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener('mousedown', handleDocPointer);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleDocPointer);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['pending'];
  const labels: Record<EditableStatus, string> = {
    attending: at.statusAttending,
    declined: at.statusDeclined,
    pending: at.statusPending,
  };

  // Read-only fallback — keeps the component drop-in safe for callers that
  // don't (yet) wire a mutation.
  if (!onChange) {
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
        {config.icon}
        {config.label}
      </span>
    );
  }

  return (
    <div ref={containerRef} className="relative inline-block">
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`Status: ${config.label}${ariaLabelContext ? ` for ${ariaLabelContext}` : ''}. Click to change.`}
        title="Click to change status"
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium transition-all cursor-pointer hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] focus-visible:ring-offset-1 ${config.classes}`}
      >
        {config.icon}
        {config.label}
        {/* Chevron — universal "opens a menu" affordance */}
        <svg className="w-2.5 h-2.5 opacity-60 -mr-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.12, ease: 'easeOut' }}
            role="listbox"
            aria-label="Choose status"
            className="absolute left-0 top-full mt-1 z-20 rounded-lg shadow-xl overflow-hidden py-1 min-w-[160px]"
            style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
          >
            {EDITABLE_STATUSES.map((opt, idx) => {
              const c = STATUS_CONFIG[opt];
              const selected = status === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  // Autofocus the current option so keyboard users start from "their" position.
                  // Fallback to first option if `status` is a legacy value (e.g. "maybe").
                  autoFocus={selected || (idx === 0 && !(EDITABLE_STATUSES as readonly string[]).includes(status))}
                  onClick={() => {
                    if (!selected) onChange(invitationId, opt);
                    setOpen(false);
                    // Restore focus to trigger for screen reader continuity
                    requestAnimationFrame(() => triggerRef.current?.focus());
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-1.5 text-left transition-colors focus:outline-none focus:bg-[rgba(184,146,74,0.14)] hover:bg-[rgba(184,146,74,0.08)]"
                >
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${c.classes}`}>
                    {c.icon}
                    {labels[opt]}
                  </span>
                  {selected && (
                    <svg
                      className="w-3.5 h-3.5 ml-auto flex-shrink-0"
                      style={{ color: GOLD }}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                    >
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Props {
  guests: AdminGuest[];
  events: AdminEvent[];
  /**
   * When an event tab is active, the table only displays that event's column.
   * `null` (the "All" tab) keeps every event column visible.
   */
  selectedEventId?: number | null;
  isLoading: boolean;
  selectedGuestIds: Set<number>;
  onToggleGuestSelection: (guestId: number) => void;
  onToggleSelectAllVisible: (checked: boolean) => void;
  onEditGuest: (guest: AdminGuest) => void;
  onEditInvitation: (invitation: AdminInvitation, guest: AdminGuest) => void;
  onDeleteGuest: (guest: AdminGuest) => void;
  onDeleteInvitation: (invitation: AdminInvitation) => void;
  onUpdateTableNumber?: (invitationId: number, tableNumber: number | null) => void;
  /**
   * Fired when the admin picks a new status from the inline status badge
   * editor. When omitted, status badges render as static read-only pills.
   */
  onUpdateStatus?: (invitationId: number, status: EditableStatus) => void;
  /**
   * Tables already in use for the active event scope. Powers the smart-picker
   * suggestions inside `TableNumberCell` (existing tables shown as chips, plus
   * a "next available" hint).
   */
  existingTables?: number[];
  /**
   * Optional handler that lets the dashboard filter the guest list to a single
   * table. When provided, clicking a "Table N" pill body fires this and the
   * tiny pencil icon becomes the only way to enter edit mode — separating the
   * "find people seated together" intent from the "edit assignment" intent.
   */
  onFilterByTable?: (tableNumber: number | null) => void;
  /**
   * The currently-active table filter. Used purely for visual state — pills
   * matching this number render as "selected" so the active filter is obvious
   * inside the table itself.
   */
  activeTableFilter?: number | null;
}

// ─── TablePicker — visual seating matrix ──────────────────────────────────────
// Shared by the inline cell editor and (re-exported below) by the dashboard's
// bulk "Assign table" popover. Rather than a raw number input, this presents
// every existing table as a tap-to-select card in a grid (the "matrix"),
// followed by an inline "+ New table" affordance. A small "Type a number"
// row is kept as an escape hatch for power users.
//
// Backward-compat: callers can keep passing only `existingTables: number[]`.
// When an `eventId` is provided, the picker self-fetches rich table metadata
// (label, capacity, occupancy) and enables true table creation via the
// `event_tables` API. Without an eventId, it gracefully degrades to plain
// number cards.

interface TableOption {
  tableNumber: number;
  label: string | null;
  capacity: number | null;
  occupancy: number | null;
}

function TableCardChip({
  option,
  isCurrent,
  onSelect,
}: {
  option: TableOption;
  isCurrent: boolean;
  onSelect: () => void;
}) {
  const { tableNumber, label, capacity, occupancy } = option;
  const hasMeta = capacity != null;
  const isFull = capacity != null && occupancy != null && occupancy >= capacity;
  const isOver = capacity != null && occupancy != null && occupancy > capacity;

  return (
    <button
      type="button"
      onClick={onSelect}
      role="option"
      aria-selected={isCurrent}
      aria-label={
        label
          ? `Table ${tableNumber} — ${label}${hasMeta ? `, ${occupancy ?? 0} of ${capacity} seats` : ''}`
          : `Table ${tableNumber}${hasMeta ? `, ${occupancy ?? 0} of ${capacity} seats` : ''}`
      }
      title={label ? `${label} · #${tableNumber}` : `Table ${tableNumber}`}
      className="group/tbl relative flex flex-col items-stretch justify-between text-left transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
      style={{
        padding: '0.4rem 0.5rem 0.35rem',
        borderRadius: '0.5rem',
        border: `1.5px solid ${isCurrent ? GOLD : isOver ? 'rgba(220,38,38,0.45)' : 'rgba(184,146,74,0.32)'}`,
        background: isCurrent
          ? GOLD
          : isOver
            ? 'rgba(220,38,38,0.06)'
            : 'rgba(184,146,74,0.07)',
        color: isCurrent ? '#FFFFFF' : ESPRESSO,
        cursor: 'pointer',
        minHeight: hasMeta ? '3.2rem' : '2.4rem',
      }}
    >
      <span
        className="font-sans tabular-nums"
        style={{
          fontSize: '0.95rem',
          fontWeight: 700,
          letterSpacing: '-0.01em',
          lineHeight: 1.05,
          color: isCurrent ? '#FFFFFF' : '#7A4F10',
        }}
      >
        #{tableNumber}
      </span>
      {label && (
        <span
          className="font-sans truncate"
          style={{
            fontSize: '0.65rem',
            fontWeight: 500,
            opacity: isCurrent ? 0.92 : 0.85,
            marginTop: '0.1rem',
          }}
        >
          {label}
        </span>
      )}
      {hasMeta && (
        <span
          className="font-sans tabular-nums"
          style={{
            fontSize: '0.6rem',
            fontWeight: 600,
            letterSpacing: '0.02em',
            marginTop: '0.15rem',
            color: isCurrent
              ? 'rgba(255,255,255,0.92)'
              : isOver
                ? '#B0203F'
                : isFull
                  ? '#7A4F10'
                  : ESPRESSO_DIM,
          }}
        >
          {occupancy ?? 0}/{capacity}
          {isFull && !isOver ? ' · full' : ''}
        </span>
      )}
      {isCurrent && (
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: 3,
            right: 3,
            width: 12,
            height: 12,
            borderRadius: '50%',
            background: '#FFFFFF',
            color: GOLD,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6L9 17l-5-5" />
          </svg>
        </span>
      )}
    </button>
  );
}

export function TablePicker({
  value,
  existingTables,
  eventId,
  onCommit,
  onCancel,
  showCancel = true,
  showClear = true,
  /** When true, the picker auto-focuses on mount (a11y / keyboard flow). */
  autoFocus = true,
  /** Optional title shown at the top — used by the bulk popover. */
  title,
  /** Optional override for the description below the title. */
  subtitle,
}: {
  value: number | null;
  existingTables: number[];
  /** When provided, the picker fetches event_tables for richer cards and
   *  enables true "create new table" via the event_tables API. */
  eventId?: number | null;
  onCommit: (next: number | null) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  showClear?: boolean;
  /** @deprecated kept for backward compat — the picker no longer leads with a
   *  number input, so this label is unused. */
  inputAriaLabel?: string;
  autoFocus?: boolean;
  title?: string;
  subtitle?: string;
}) {
  const qc = useQueryClient();
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Rich event_tables (when eventId is provided) ───────────────────────────
  const { data: eventTables = [] } = useQuery({
    queryKey: ['admin', 'eventTables', eventId ?? null],
    queryFn: () => eventTablesApi.list(eventId!),
    enabled: eventId != null,
    staleTime: 30_000,
  });

  // Merge two sources of truth: rich event_tables rows + legacy invitation
  // tableNumbers that don't have a matching event_tables row yet. We want the
  // matrix to surface every assignable table whether or not the host has
  // formalised it via the seating planner.
  const options: TableOption[] = useMemo(() => {
    const byNumber = new Map<number, TableOption>();
    for (const t of eventTables as EventTableWithOccupancy[]) {
      byNumber.set(t.tableNumber, {
        tableNumber: t.tableNumber,
        label: t.label ?? null,
        capacity: t.capacity,
        occupancy: t.occupancy,
      });
    }
    for (const n of existingTables) {
      if (!byNumber.has(n)) {
        byNumber.set(n, { tableNumber: n, label: null, capacity: null, occupancy: null });
      }
    }
    return Array.from(byNumber.values()).sort((a, b) => a.tableNumber - b.tableNumber);
  }, [eventTables, existingTables]);

  // Smallest positive integer not yet used — capped at the schema's 500 limit.
  const nextAvailable = useMemo(() => {
    const used = new Set<number>(options.map((o) => o.tableNumber));
    for (let n = 1; n <= 500; n += 1) {
      if (!used.has(n)) return n;
    }
    return null;
  }, [options]);

  // ── "Add new table" inline form state ──────────────────────────────────────
  const [adding, setAdding] = useState(false);
  const [newNumber, setNewNumber] = useState<number>(nextAvailable ?? 1);
  const [newLabel, setNewLabel] = useState('');
  const [newCapacity, setNewCapacity] = useState(10);
  const newLabelRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!adding) setNewNumber(nextAvailable ?? 1);
  }, [nextAvailable, adding]);

  useEffect(() => {
    if (adding) {
      const id = requestAnimationFrame(() => newLabelRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [adding]);

  // ── "Advanced: type a number" escape hatch ─────────────────────────────────
  const [typingMode, setTypingMode] = useState(false);
  const [draft, setDraft] = useState<string>(value != null ? String(value) : '');
  const draftRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (typingMode) {
      const id = requestAnimationFrame(() => {
        draftRef.current?.focus();
        draftRef.current?.select();
      });
      return () => cancelAnimationFrame(id);
    }
    return undefined;
  }, [typingMode]);

  const parseDraft = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    const parsed = parseInt(trimmed, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 500) return null;
    return parsed;
  };

  // ── Initial focus ──────────────────────────────────────────────────────────
  // Land focus on the first interactive element of the picker — the first
  // table card if any exist, else the "+ New table" trigger. Using a query
  // against the container keeps this resilient to the matrix being empty.
  useEffect(() => {
    if (!autoFocus) return;
    const id = requestAnimationFrame(() => {
      const root = containerRef.current;
      if (!root) return;
      const target = root.querySelector<HTMLButtonElement>(
        '[role="option"], button[type="button"]',
      );
      target?.focus();
    });
    return () => cancelAnimationFrame(id);
  }, [autoFocus]);

  // ── Escape closes the picker ───────────────────────────────────────────────
  useEffect(() => {
    if (!onCancel) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        if (adding) { setAdding(false); return; }
        if (typingMode) { setTypingMode(false); return; }
        onCancel();
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onCancel, adding, typingMode]);

  // ── Create a new event_table (only available with eventId) ─────────────────
  const createMutation = useMutation({
    mutationFn: eventTablesApi.create,
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['admin', 'eventTables', eventId ?? null] });
      qc.invalidateQueries({ queryKey: ['admin', 'tables'] });
      toast.success(`Table ${created.tableNumber} created`);
      setAdding(false);
      setNewLabel('');
      onCommit(created.tableNumber);
    },
    onError: () => toast.error('Failed to create table'),
  });

  const handleCreate = () => {
    const n = Number.isFinite(newNumber) && newNumber > 0 ? Math.floor(newNumber) : (nextAvailable ?? 1);
    const c = Number.isFinite(newCapacity) && newCapacity > 0 ? Math.floor(newCapacity) : 10;
    if (eventId != null) {
      createMutation.mutate({
        eventId,
        tableNumber: n,
        label: newLabel.trim() || null,
        capacity: c,
      });
    } else {
      // No eventId — we can't create a real event_table row, so just commit
      // the chosen number. The invitation will still link via tableNumber.
      setAdding(false);
      setNewLabel('');
      onCommit(n);
    }
  };

  const showClearButton = showClear && value != null;

  return (
    <div
      ref={containerRef}
      className="flex flex-col gap-2"
      style={{
        minWidth: '15rem',
        maxWidth: '20rem',
        padding: '0.65rem',
        borderRadius: '0.6rem',
        background: PARCHMENT,
        border: `1px solid ${GOLD_DIM}`,
        boxShadow: '0 10px 28px rgba(42,31,26,0.12), 0 2px 6px rgba(42,31,26,0.06)',
      }}
      role="dialog"
      aria-label={title ?? 'Assign table'}
      // The cell-level outer button uses onClick to enter edit mode; once
      // we're inside the picker, any clicks would bubble back and re-trigger
      // edit. Stop them here.
      onClick={(e) => e.stopPropagation()}
    >
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p
            className="font-sans uppercase"
            style={{
              fontSize: '0.65rem',
              fontWeight: 700,
              letterSpacing: '0.14em',
              color: ESPRESSO_DIM,
              lineHeight: 1.1,
            }}
          >
            {title ?? 'Select a table'}
          </p>
          <p
            className="font-sans"
            style={{
              fontSize: '0.7rem',
              color: ESPRESSO,
              lineHeight: 1.35,
              marginTop: '0.15rem',
            }}
          >
            {subtitle ?? (
              value != null
                ? <>Currently <span className="tabular-nums font-semibold">#{value}</span>. Tap a card to reassign.</>
                : options.length > 0
                  ? <>Tap a card to seat this guest.</>
                  : <>No tables yet — add the first one below.</>
            )}
          </p>
        </div>
        {showCancel && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Close"
            className="flex-shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
            style={{
              width: 22, height: 22, borderRadius: '50%',
              background: 'rgba(42,31,26,0.05)',
              border: '1px solid rgba(42,31,26,0.12)',
              color: 'rgba(42,31,26,0.55)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {/* ── Matrix of existing tables ─────────────────────────────────────── */}
      {options.length > 0 ? (
        <div
          role="listbox"
          aria-label="Existing tables"
          className="grid gap-1.5"
          style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(4.2rem, 1fr))' }}
        >
          {options.map((opt) => (
            <TableCardChip
              key={opt.tableNumber}
              option={opt}
              isCurrent={opt.tableNumber === value}
              onSelect={() => onCommit(opt.tableNumber)}
            />
          ))}
        </div>
      ) : (
        <p
          className="font-sans italic"
          style={{
            fontSize: '0.72rem',
            color: ESPRESSO_DIM,
            padding: '0.4rem 0.1rem',
            background: 'rgba(184,146,74,0.06)',
            borderRadius: '0.4rem',
            textAlign: 'center',
          }}
        >
          No tables yet
        </p>
      )}

      {/* ── Add-new-table affordance ──────────────────────────────────────── */}
      <AnimatePresence initial={false} mode="wait">
        {!adding ? (
          <motion.button
            key="add-trigger"
            type="button"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            onClick={() => setAdding(true)}
            aria-label={
              nextAvailable != null
                ? `Add a new table (next available is ${nextAvailable})`
                : 'Add a new table'
            }
            className="font-sans inline-flex items-center justify-center gap-1.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
            style={{
              padding: '0.4rem 0.6rem',
              borderRadius: '0.45rem',
              border: `1.5px dashed ${GOLD_DIM}`,
              background: 'transparent',
              color: GOLD,
              fontSize: '0.72rem',
              fontWeight: 600,
              letterSpacing: '0.02em',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(184,146,74,0.08)';
              e.currentTarget.style.borderColor = GOLD;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.borderColor = GOLD_DIM;
            }}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5v14M5 12h14"/>
            </svg>
            {eventId != null ? 'New table' : 'Use new number'}
            {nextAvailable != null && (
              <span
                className="tabular-nums"
                style={{
                  marginLeft: '0.15rem',
                  padding: '0 0.3rem',
                  borderRadius: '0.25rem',
                  background: 'rgba(184,146,74,0.16)',
                  color: '#7A4F10',
                  fontSize: '0.65rem',
                  fontWeight: 700,
                }}
              >
                #{nextAvailable}
              </span>
            )}
          </motion.button>
        ) : (
          <motion.div
            key="add-form"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.12 }}
            className="flex flex-col gap-1.5"
            style={{
              padding: '0.55rem',
              borderRadius: '0.5rem',
              background: CREAM,
              border: `1.5px solid ${GOLD}`,
            }}
          >
            <p
              className="font-sans uppercase"
              style={{
                fontSize: '0.6rem',
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: GOLD,
              }}
            >
              {eventId != null ? 'Create new table' : 'Use a new number'}
            </p>

            {/* Label — only meaningful when we can create a real event_table */}
            {eventId != null && (
              <input
                ref={newLabelRef}
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
                  if (e.key === 'Escape') { e.preventDefault(); setAdding(false); }
                }}
                maxLength={100}
                placeholder="Optional name (e.g. Family)"
                aria-label="Table label"
                className="font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                style={{
                  padding: '0.3rem 0.45rem',
                  borderRadius: '0.35rem',
                  border: `1px solid ${GOLD_DIM}`,
                  background: '#FDFAF5',
                  color: ESPRESSO,
                  fontSize: '0.78rem',
                }}
              />
            )}

            <div className="flex gap-1.5">
              <label className="flex flex-col gap-0.5 flex-1">
                <span
                  className="font-sans uppercase"
                  style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: ESPRESSO_DIM }}
                >
                  Table #
                </span>
                <input
                  ref={eventId == null ? newLabelRef : undefined}
                  type="number"
                  min={1}
                  max={500}
                  value={newNumber}
                  onChange={(e) => setNewNumber(parseInt(e.target.value, 10) || (nextAvailable ?? 1))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
                    if (e.key === 'Escape') { e.preventDefault(); setAdding(false); }
                  }}
                  aria-label="New table number"
                  className="font-sans tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                  style={{
                    padding: '0.3rem 0.4rem',
                    borderRadius: '0.35rem',
                    border: `1px solid ${GOLD_DIM}`,
                    background: '#FDFAF5',
                    color: ESPRESSO,
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    textAlign: 'center',
                  }}
                />
              </label>
              {eventId != null && (
                <label className="flex flex-col gap-0.5 flex-1">
                  <span
                    className="font-sans uppercase"
                    style={{ fontSize: '0.55rem', fontWeight: 700, letterSpacing: '0.12em', color: ESPRESSO_DIM }}
                  >
                    Capacity
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={newCapacity}
                    onChange={(e) => setNewCapacity(parseInt(e.target.value, 10) || 10)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') { e.preventDefault(); handleCreate(); }
                      if (e.key === 'Escape') { e.preventDefault(); setAdding(false); }
                    }}
                    aria-label="New table capacity"
                    className="font-sans tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                    style={{
                      padding: '0.3rem 0.4rem',
                      borderRadius: '0.35rem',
                      border: `1px solid ${GOLD_DIM}`,
                      background: '#FDFAF5',
                      color: ESPRESSO,
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      textAlign: 'center',
                    }}
                  />
                </label>
              )}
            </div>

            <div className="flex gap-1.5 mt-0.5">
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="flex-1 font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: '0.35rem',
                  border: `1px solid ${GOLD_DIM}`,
                  background: 'transparent',
                  color: ESPRESSO_DIM,
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="flex-1 font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  padding: '0.3rem 0.5rem',
                  borderRadius: '0.35rem',
                  border: `1px solid ${GOLD}`,
                  background: GOLD,
                  color: '#FFFFFF',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {createMutation.isPending ? 'Adding…' : (eventId != null ? 'Create & assign' : 'Assign')}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Footer row: type-a-number escape hatch + clear ────────────────── */}
      <div
        className="flex items-center justify-between gap-2"
        style={{ borderTop: `1px dashed ${GOLD_DIM}`, paddingTop: '0.45rem' }}
      >
        {typingMode ? (
          <div className="flex items-center gap-1">
            <input
              ref={draftRef}
              type="number"
              min={1}
              max={500}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') { e.preventDefault(); onCommit(parseDraft(draft)); }
                if (e.key === 'Escape') { e.preventDefault(); setTypingMode(false); }
              }}
              placeholder="#"
              aria-label="Type a table number"
              className="font-sans tabular-nums focus:outline-none"
              style={{
                width: '3rem',
                padding: '0.2rem 0.35rem',
                borderRadius: '0.3rem',
                border: '1.5px solid rgba(184,146,74,0.7)',
                background: '#FDFAF5',
                color: ESPRESSO,
                fontSize: '0.72rem',
                fontWeight: 700,
                textAlign: 'center',
                boxShadow: '0 0 0 3px rgba(184,146,74,0.12)',
              }}
            />
            <button
              type="button"
              onClick={() => onCommit(parseDraft(draft))}
              aria-label="Use this number"
              style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(74,158,120,0.14)', border: '1px solid rgba(74,158,120,0.45)',
                color: '#2D6B50', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6L9 17l-5-5"/>
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setTypingMode(false)}
              aria-label="Cancel typing"
              style={{
                width: 22, height: 22, borderRadius: '50%',
                background: 'rgba(42,31,26,0.05)', border: '1px solid rgba(42,31,26,0.12)',
                color: 'rgba(42,31,26,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => { setDraft(value != null ? String(value) : ''); setTypingMode(true); }}
            className="font-sans focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.55)]"
            style={{
              fontSize: '0.68rem',
              color: ESPRESSO_DIM,
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              textDecoration: 'underline',
              textUnderlineOffset: '2px',
            }}
          >
            Type a number
          </button>
        )}

        {showClearButton && !typingMode && (
          <button
            type="button"
            onClick={() => onCommit(null)}
            aria-label="Clear table assignment"
            className="font-sans inline-flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.55)]"
            style={{
              fontSize: '0.68rem',
              color: '#B0203F',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              fontWeight: 600,
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
            Unassign
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Inline table-number cell ─────────────────────────────────────────────────
// The filled pill is a dual-purpose affordance:
//   • Clicking the body filters the whole guest list to that table — the most
//     common follow-up action when an admin sees "Table 5" on a row is "OK so
//     who else is at this table?".
//   • A tiny pencil icon (visible on hover or focus) enters edit mode. The
//     edit mode shows existing tables as quick-pick chips, plus a "next free
//     table" suggestion and a one-tap Clear.
// When the active table filter matches the pill's number, the pill is rendered
// in its "selected" state so an admin can see the filter context from inside
// the table itself, not just the toolbar.

function TableNumberCell({
  invitationId,
  eventId,
  tableNumber,
  onUpdate,
  existingTables = [],
  onFilterByTable,
  activeTableFilter = null,
}: {
  invitationId: number;
  /** When provided, the picker fetches event_tables and can create new ones. */
  eventId?: number | null;
  tableNumber: number | null | undefined;
  onUpdate: (invitationId: number, value: number | null) => void;
  existingTables?: number[];
  onFilterByTable?: (tableNumber: number | null) => void;
  activeTableFilter?: number | null;
}) {
  const [editing, setEditing] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const startEdit = () => setEditing(true);

  const commitFromPicker = (next: number | null) => {
    if (next !== (tableNumber ?? null)) onUpdate(invitationId, next);
    setEditing(false);
  };

  // Close the picker when the admin clicks outside it. Without this, the
  // floating panel sat on the page indefinitely after a successful select —
  // pleasant only by accident.
  useEffect(() => {
    if (!editing) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setEditing(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [editing]);

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <div ref={wrapRef} className="relative inline-block" style={{ zIndex: 30 }}>
        <TablePicker
          value={tableNumber ?? null}
          eventId={eventId ?? undefined}
          existingTables={existingTables}
          onCommit={commitFromPicker}
          onCancel={() => setEditing(false)}
        />
      </div>
    );
  }

  // ── Filled display ─────────────────────────────────────────────────────────
  if (tableNumber != null) {
    const isActiveFilter = activeTableFilter === tableNumber;
    const canFilter = typeof onFilterByTable === 'function';

    // Primary click: filter (when available) or edit (fallback when no filter
    // handler was passed). The pencil icon always enters edit mode so the two
    // intents are never ambiguous on touch devices.
    const onPrimaryClick = () => {
      if (canFilter) {
        onFilterByTable!(isActiveFilter ? null : tableNumber);
      } else {
        startEdit();
      }
    };

    return (
      <span
        className="inline-flex items-stretch rounded-md overflow-hidden"
        style={{
          // Two-segment pill: body (filter) + edge button (edit).
          border: `1px solid ${isActiveFilter ? GOLD : 'rgba(184,146,74,0.32)'}`,
          background: isActiveFilter ? GOLD : 'rgba(184,146,74,0.11)',
          transition: 'background 0.15s, border-color 0.15s',
        }}
      >
        <button
          type="button"
          onClick={onPrimaryClick}
          title={
            canFilter
              ? (isActiveFilter ? 'Clear table filter' : `Show everyone at Table ${tableNumber}`)
              : 'Edit table number'
          }
          aria-label={
            canFilter
              ? (isActiveFilter
                ? `Clear filter (currently showing Table ${tableNumber})`
                : `Filter list to Table ${tableNumber}`)
              : `Edit table number (currently ${tableNumber})`
          }
          aria-pressed={isActiveFilter}
          className="group/tn inline-flex items-center gap-1.5 focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.55)]"
          style={{
            padding: '0.22rem 0.55rem',
            color: isActiveFilter ? '#FFFFFF' : '#7A4F10',
            fontSize: '0.72rem',
            fontWeight: 700,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            letterSpacing: '0.02em',
            fontVariantNumeric: 'tabular-nums',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            background: 'transparent',
            border: 'none',
          }}
        >
          <svg
            width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            style={{ opacity: isActiveFilter ? 0.9 : 0.6 }}
          >
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
          </svg>
          Table {tableNumber}
          {canFilter && isActiveFilter && (
            // Tiny "x" appears when the pill IS the active filter — making it
            // a single-click way to drop the filter.
            <svg
              width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
              style={{ marginLeft: '0.1rem', opacity: 0.85 }}
            >
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          )}
        </button>
        {/* Edit affordance — segment styled like a divider so it reads as a
            secondary action on the same control. Always tappable on touch
            (no opacity-0 hover gating), but visually quiet at rest. */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); startEdit(); }}
          title="Edit table number"
          aria-label={`Edit table ${tableNumber}`}
          className="focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.55)]"
          style={{
            padding: '0 0.4rem',
            display: 'flex',
            alignItems: 'center',
            background: isActiveFilter ? 'rgba(255,255,255,0.18)' : 'rgba(184,146,74,0.06)',
            borderLeft: `1px solid ${isActiveFilter ? 'rgba(255,255,255,0.35)' : 'rgba(184,146,74,0.25)'}`,
            color: isActiveFilter ? '#FFFFFF' : ESPRESSO_DIM,
            cursor: 'pointer',
          }}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        </button>
      </span>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  return (
    <button
      onClick={startEdit}
      title="Assign table"
      className="inline-flex items-center gap-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.4)]"
      style={{
        padding: '0.2rem 0.45rem',
        borderRadius: '0.375rem',
        border: '1px dashed rgba(184,146,74,0.3)',
        color: 'rgba(184,146,74,0.55)',
        fontSize: '0.68rem',
        fontWeight: 600,
        fontFamily: '"DM Sans", system-ui, sans-serif',
        letterSpacing: '0.03em',
        cursor: 'pointer',
        background: 'transparent',
        whiteSpace: 'nowrap',
        transition: 'color 0.15s, border-color 0.15s',
      }}
      onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; e.currentTarget.style.borderColor = GOLD; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(184,146,74,0.55)'; e.currentTarget.style.borderColor = 'rgba(184,146,74,0.3)'; }}
    >
      <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 5v14M5 12h14"/>
      </svg>
      Set table
    </button>
  );
}

type SortKey = 'name' | 'createdAt';
type SortDir = 'asc' | 'desc';

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className="ml-1 inline-flex flex-col gap-px" style={{ color: active ? GOLD : GOLD_DIM }} aria-hidden="true">
      <svg className={`w-2.5 h-2.5 ${active && dir === 'desc' ? 'opacity-30' : ''}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M5 0L10 6H0L5 0Z" />
      </svg>
      <svg className={`w-2.5 h-2.5 ${active && dir === 'asc' ? 'opacity-30' : ''}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M5 6L0 0H10L5 6Z" />
      </svg>
    </span>
  );
}

function SkeletonRow({ colSpan }: { colSpan: number }) {
  return (
    <tr style={{ borderBottom: `1px solid ${GOLD_DIM}` }}>
      {Array.from({ length: colSpan }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded animate-pulse" style={{ width: `${55 + (i * 17) % 40}%`, background: GOLD_DIM }} />
        </td>
      ))}
    </tr>
  );
}

function CopyLinkButton({ invitation, baseUrl }: { invitation: AdminInvitation; baseUrl: string }) {
  const handleCopy = async () => {
    const url = `${baseUrl}/invite/${invitation.token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Invite link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  return (
    <button
      onClick={handleCopy}
      title={`Copy personal invite link for ${invitation.eventName ?? 'event'}`}
      aria-label={`Copy personal invite link for ${invitation.eventName ?? invitation.eventSlug ?? 'event'}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-sans transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.55)]"
      style={{ background: 'rgba(184,146,74,0.12)', color: ESPRESSO, border: `1px solid ${GOLD_DIM}` }}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      Copy invite link
    </button>
  );
}

// ─── Message modal ─────────────────────────────────────────────────────────────
function MessageModal({
  guest,
  events,
  onClose,
}: {
  guest: AdminGuest;
  events: AdminEvent[];
  onClose: () => void;
}) {
  const messages = guest.invitations
    .filter((inv) => inv.message && inv.message.trim().length > 0)
    .map((inv) => ({
      eventName: inv.eventName ?? events.find((e) => e.id === inv.eventId)?.name ?? inv.eventSlug ?? 'Event',
      message: inv.message!,
    }));

  return (
    <AnimatePresence>
      <motion.div
        key="msg-backdrop"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="msg-modal-title"
      >
        <motion.div
          key="msg-panel"
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="rounded-xl w-full max-w-md shadow-lg"
          style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${GOLD_DIM}` }}>
            <div className="flex items-center gap-2.5">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'rgba(184,146,74,0.12)', border: `1px solid ${GOLD_DIM}` }}
                aria-hidden="true"
              >
                <svg className="w-4 h-4" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h3 id="msg-modal-title" className="font-sans font-semibold text-sm" style={{ color: ESPRESSO }}>
                  {guest.name}
                </h3>
                <p className="text-xs font-sans" style={{ color: ESPRESSO_DIM }}>
                  {messages.length === 1 ? '1 message' : `${messages.length} messages`}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ color: ESPRESSO_DIM }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="px-5 py-4 space-y-4 max-h-[60vh] overflow-y-auto">
            {messages.map(({ eventName, message }, i) => (
              <div key={i}>
                {messages.length > 1 && (
                  <p className="text-[10px] font-sans font-semibold uppercase tracking-wider mb-1.5" style={{ color: GOLD }}>
                    {eventName}
                  </p>
                )}
                <p
                  className="text-sm font-sans leading-relaxed whitespace-pre-wrap rounded-lg px-4 py-3"
                  style={{ background: CREAM, color: ESPRESSO, border: `1px solid ${GOLD_DIM}` }}
                >
                  {message}
                </p>
              </div>
            ))}
          </div>

          <div className="px-5 py-3 flex justify-end" style={{ borderTop: `1px solid ${GOLD_DIM}` }}>
            <button
              onClick={onClose}
              className="px-4 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: GOLD, color: ESPRESSO }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#A07840'; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; }}
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

export default function GuestTable({
  guests,
  events,
  selectedEventId = null,
  isLoading,
  selectedGuestIds,
  onToggleGuestSelection,
  onToggleSelectAllVisible,
  onEditGuest,
  onEditInvitation,
  onDeleteGuest,
  onDeleteInvitation,
  onUpdateTableNumber,
  onUpdateStatus,
  existingTables = [],
  onFilterByTable,
  activeTableFilter = null,
}: Props) {
  // Default to "newest first" so freshly added guests stay visible.
  // Sorting by name is the only user-toggleable option below.
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [viewingMessages, setViewingMessages] = useState<AdminGuest | null>(null);
  const at = useAdminTranslation();

  const baseUrl = window.location.origin;

  // When a single event is selected, only show that event's column so the
  // admin doesn't have to look at irrelevant venues (e.g. Tashkent on the
  // Ankara tab) — this is also what unblocks fitting on iPhone width.
  const displayedEvents = useMemo(
    () => (selectedEventId != null
      ? events.filter((e) => e.id === selectedEventId)
      : events),
    [events, selectedEventId],
  );

  const sorted = useMemo(() => {
    return [...guests].sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      const cmp = String(av).localeCompare(String(bv), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [guests, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('asc'); }
  };

  // When the admin has filtered to a single event the per-event cell becomes
  // pointless duplication: every row is for that one event. In that case we
  // promote the invitation fields (status / party / table) to first-class
  // columns and lift per-invitation actions (copy link, edit RSVP, remove)
  // into the unified Actions column. The "All" tab keeps the grouped layout
  // because the side-by-side comparison across events is the whole point.
  const isSingleEvent = displayedEvents.length === 1;
  const singleEvent = isSingleEvent ? displayedEvents[0] : null;

  // Columns: checkbox + # + name + (per-invitation OR per-event) + message + actions
  const totalColSpan = isSingleEvent
    ? 3 + 3 + 1 + 1
    : 3 + displayedEvents.length + 1 + 1;
  const headerCheckboxRef = useRef<HTMLInputElement>(null);
  const allVisibleSelected = sorted.length > 0 && sorted.every((g) => selectedGuestIds.has(g.id));
  const someVisibleSelected = sorted.some((g) => selectedGuestIds.has(g.id));

  useEffect(() => {
    if (!headerCheckboxRef.current) return;
    headerCheckboxRef.current.indeterminate = someVisibleSelected && !allVisibleSelected;
  }, [someVisibleSelected, allVisibleSelected]);

  const columns: Array<{ key: SortKey; label: string }> = [
    { key: 'name', label: at.colName },
  ];

  return (
    <>
    {/* ── Mobile card list (below md) ─────────────────────────────────────────
        On iPhone the wide table needs horizontal scrolling, so phones render a
        vertical card per guest instead — same data, fits the viewport. */}
    <div className="md:hidden space-y-2.5" aria-label="Guest list (mobile)">
      {isLoading && Array.from({ length: 4 }).map((_, i) => (
        <div
          key={`m-skel-${i}`}
          className="rounded-xl p-4 animate-pulse"
          style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
        >
          <div className="h-3 w-2/5 rounded mb-2" style={{ background: GOLD_DIM }} />
          <div className="h-2.5 w-3/5 rounded mb-3" style={{ background: GOLD_DIM }} />
          <div className="h-16 w-full rounded" style={{ background: GOLD_DIM }} />
        </div>
      ))}

      {!isLoading && sorted.length === 0 && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
        >
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(184,146,74,0.12)' }}>
              <svg className="w-6 h-6" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <p className="font-medium text-sm" style={{ color: ESPRESSO }}>{at.noGuestsFound}</p>
            <p className="text-xs" style={{ color: ESPRESSO_DIM }}>{at.noGuestsHint}</p>
          </div>
        </div>
      )}

      <AnimatePresence initial={false}>
        {!isLoading && sorted.map((guest, rowIndex) => {
          const isSelected = selectedGuestIds.has(guest.id);
          const hasMessage = guest.invitations.some((inv) => inv.message && inv.message.trim().length > 0);
          return (
            <motion.div
              key={`m-${guest.id}`}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className="rounded-xl overflow-hidden"
              style={{
                background: isSelected ? 'rgba(184,146,74,0.08)' : PARCHMENT,
                border: `1px solid ${isSelected ? GOLD : GOLD_DIM}`,
              }}
            >
              {/* Card header: select + index + name + per-guest actions */}
              <div className="flex items-start gap-2.5 px-3.5 pt-3 pb-2">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => onToggleGuestSelection(guest.id)}
                  aria-label={`Select ${guest.name}`}
                  className="mt-0.5 w-4 h-4 rounded border-[rgba(184,146,74,0.45)] focus:ring-[rgba(184,146,74,0.45)] flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-semibold text-sm leading-tight break-words" style={{ color: ESPRESSO }}>
                    <span className="tabular-nums mr-1.5" style={{ color: ESPRESSO_DIM }}>#{rowIndex + 1}</span>
                    {guest.name}
                  </p>
                  {guest.partnerName && (
                    <p className="text-xs font-sans mt-0.5 break-words" style={{ color: ESPRESSO_DIM }}>
                      & {guest.partnerName}
                    </p>
                  )}
                  {guest.phone && (
                    <p className="text-xs font-sans mt-0.5 tabular-nums" style={{ color: ESPRESSO_DIM }}>
                      {guest.phone}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {hasMessage && (
                    <button
                      onClick={() => setViewingMessages(guest)}
                      className="p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                      style={{ background: 'rgba(184,146,74,0.12)', border: `1px solid ${GOLD_DIM}`, color: GOLD }}
                      aria-label={`Read message from ${guest.name}`}
                      title={`Message from ${guest.name}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                      </svg>
                    </button>
                  )}
                  <button
                    onClick={() => onEditGuest(guest)}
                    className="p-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                    style={{ color: ESPRESSO_DIM, background: 'rgba(184,146,74,0.06)', border: `1px solid ${GOLD_DIM}` }}
                    aria-label={`Edit contact info for ${guest.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteGuest(guest)}
                    className="p-2 rounded-lg text-[rgba(42,31,26,0.55)] hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                    style={{ background: 'rgba(42,31,26,0.04)', border: `1px solid ${GOLD_DIM}` }}
                    aria-label={`Delete ${guest.name}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Per-event invitation sub-cards */}
              <div className="px-3.5 pb-3 space-y-2">
                {displayedEvents.map((ev) => {
                  const inv = guest.invitations.find((i) => i.eventId === ev.id);
                  const config = inv ? (STATUS_CONFIG[inv.status] ?? STATUS_CONFIG['pending']) : null;
                  return (
                    <div
                      key={ev.id}
                      className="rounded-lg p-2.5"
                      style={{ background: CREAM, border: `1px solid ${GOLD_DIM}` }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className="text-[10px] font-sans font-bold uppercase tracking-widest"
                          style={{ color: GOLD }}
                        >
                          {getEventDisplayName(ev)}
                        </span>
                        {inv && config ? (
                          <StatusBadgeEditor
                            invitationId={inv.id}
                            status={inv.status}
                            onChange={onUpdateStatus}
                            ariaLabelContext={`${guest.name} at ${getEventDisplayName(ev)}`}
                          />
                        ) : (
                          <span className="text-[11px]" style={{ color: ESPRESSO_DIM }}>—</span>
                        )}
                      </div>

                      {inv && config ? (
                        <>
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-2">
                            <span className="text-[11px] font-sans uppercase tracking-wide" style={{ color: ESPRESSO_DIM }}>
                              {at.partySizeLabel}: <span className="font-semibold" style={{ color: ESPRESSO }}>{inv.guestCount}</span>
                            </span>
                            {onUpdateTableNumber && (
                              <TableNumberCell
                                invitationId={inv.id}
                                eventId={inv.eventId}
                                tableNumber={inv.tableNumber}
                                onUpdate={onUpdateTableNumber}
                                existingTables={existingTables}
                                onFilterByTable={onFilterByTable}
                                activeTableFilter={activeTableFilter}
                              />
                            )}
                          </div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <CopyLinkButton invitation={inv} baseUrl={baseUrl} />
                            <button
                              onClick={() => onEditInvitation(inv, guest)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.55)]"
                              style={{ background: 'rgba(184,146,74,0.06)', border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                              aria-label={`Edit ${getEventDisplayName(ev)} RSVP for ${guest.name}`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                              Edit RSVP
                            </button>
                            <button
                              onClick={() => onDeleteInvitation(inv)}
                              className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-sans text-[rgba(42,31,26,0.55)] hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
                              style={{ border: `1px solid ${GOLD_DIM}` }}
                              aria-label={`Remove ${guest.name} from ${getEventDisplayName(ev)}`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Remove
                            </button>
                          </div>
                        </>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>

    {/* ── Desktop table (md and up) ─────────────────────────────────────── */}
    <div className="hidden md:block overflow-x-auto rounded-xl shadow-sm" style={{ border: `1px solid ${GOLD_DIM}`, background: PARCHMENT }}>
      <table className="w-full text-sm font-sans" aria-label="Guest list">
        <thead>
          <tr style={{ borderBottom: `1px solid ${GOLD_DIM}`, background: CREAM }}>
            <th scope="col" className="px-3 py-3 text-left font-medium whitespace-nowrap" style={{ color: ESPRESSO_DIM }}>
              <input
                ref={headerCheckboxRef}
                type="checkbox"
                checked={allVisibleSelected}
                disabled={sorted.length === 0}
                onChange={(e) => onToggleSelectAllVisible(e.currentTarget.checked)}
                aria-label="Select all visible guests"
                className="w-4 h-4 rounded border-[rgba(184,146,74,0.45)] focus:ring-[rgba(184,146,74,0.45)]"
              />
            </th>
            <th scope="col" className="px-3 py-3 text-left font-medium whitespace-nowrap" style={{ color: ESPRESSO_DIM }}>
              {at.colNumber}
            </th>
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                // WCAG 1.3.1: aria-sort communicates sort state to screen readers
                aria-sort={
                  sortKey === col.key
                    ? sortDir === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
                className="px-4 py-3 text-left font-medium whitespace-nowrap"
                style={{ color: ESPRESSO_DIM }}
              >
                <button
                  onClick={() => handleSort(col.key)}
                  className="flex items-center gap-1 transition-colors focus:outline-none focus-visible:underline"
                  style={{ color: ESPRESSO_DIM }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = ESPRESSO_DIM; }}
                  aria-label={`Sort by ${col.label}${sortKey === col.key ? ` (${sortDir === 'asc' ? 'ascending' : 'descending'})` : ''}`}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </button>
              </th>
            ))}

            {/* Single-event tab: promote invitation fields to columns so the
                Ankara/Tashkent header (and its stacked sub-fields) stops being
                redundant with the active tab.
                "All" tab: keep grouped per-event columns for cross-event scan. */}
            {isSingleEvent ? (
              <>
                <th scope="col" className="px-3 py-3 text-left font-medium whitespace-nowrap" style={{ color: ESPRESSO_DIM }}>
                  {at.colStatus}
                </th>
                <th scope="col" className="px-3 py-3 text-left font-medium whitespace-nowrap" style={{ color: ESPRESSO_DIM }}>
                  {at.colParty}
                </th>
                <th scope="col" className="px-3 py-3 text-left font-medium whitespace-nowrap" style={{ color: ESPRESSO_DIM }}>
                  {at.colTable}
                </th>
              </>
            ) : (
              displayedEvents.map((ev) => (
                <th key={ev.id} scope="col" className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: ESPRESSO_DIM }}>
                  {getEventDisplayName(ev)}
                </th>
              ))
            )}

            {/* Message column header */}
            <th scope="col" className="px-3 py-3 text-center font-medium" style={{ color: ESPRESSO_DIM }}>
              <span className="sr-only">Message</span>
              <svg className="w-4 h-4 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </th>

            <th scope="col" className="px-4 py-3 text-right font-medium" style={{ color: ESPRESSO_DIM }}>
              {at.colActions}
            </th>
          </tr>
        </thead>

        <tbody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} colSpan={totalColSpan} />)}

          {!isLoading && sorted.length === 0 && (
            <tr>
              <td colSpan={totalColSpan} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(184,146,74,0.12)' }}>
                    <svg className="w-6 h-6" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="font-medium text-sm" style={{ color: ESPRESSO }}>{at.noGuestsFound}</p>
                  <p className="text-xs" style={{ color: ESPRESSO_DIM }}>{at.noGuestsHint}</p>
                </div>
              </td>
            </tr>
          )}

          <AnimatePresence initial={false}>
            {!isLoading && sorted.map((guest, rowIndex) => (
              <motion.tr
                key={guest.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="transition-colors group"
                style={{
                  borderBottom: `1px solid ${GOLD_DIM}`,
                  background: selectedGuestIds.has(guest.id) ? 'rgba(184,146,74,0.08)' : 'transparent',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = selectedGuestIds.has(guest.id)
                    ? 'rgba(184,146,74,0.08)'
                    : 'transparent';
                }}
              >
                {/* Row selection */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <input
                    type="checkbox"
                    checked={selectedGuestIds.has(guest.id)}
                    onChange={() => onToggleGuestSelection(guest.id)}
                    aria-label={`Select ${guest.name}`}
                    className="w-4 h-4 rounded border-[rgba(184,146,74,0.45)] focus:ring-[rgba(184,146,74,0.45)]"
                  />
                </td>

                {/* Row number */}
                <td className="px-3 py-3 whitespace-nowrap text-xs tabular-nums" style={{ color: ESPRESSO_DIM }}>
                  {rowIndex + 1}
                </td>

                {/* Name cell */}
                <td className="px-4 py-3 font-medium whitespace-nowrap max-w-[160px] truncate" style={{ color: ESPRESSO }}>
                  {guest.name}
                  {guest.partnerName && (
                    <p className="text-xs font-normal mt-0.5" style={{ color: ESPRESSO_DIM }}>& {guest.partnerName}</p>
                  )}
                  {guest.phone && (
                    <p className="text-xs font-normal mt-0.5" style={{ color: ESPRESSO_DIM }}>{guest.phone}</p>
                  )}
                </td>

                {/* Invitation columns.
                    Single-event tab → 3 narrow columns (status / party / table).
                    "All" tab → grouped compound cell per event. */}
                {isSingleEvent && singleEvent ? (
                  (() => {
                    const inv = guest.invitations.find((i) => i.eventId === singleEvent.id);
                    const config = inv ? (STATUS_CONFIG[inv.status] ?? STATUS_CONFIG['pending']) : null;
                    return (
                      <>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {inv && config ? (
                            <StatusBadgeEditor
                              invitationId={inv.id}
                              status={inv.status}
                              onChange={onUpdateStatus}
                              ariaLabelContext={`${guest.name} at ${getEventDisplayName(singleEvent)}`}
                            />
                          ) : (
                            <span className="text-xs" style={{ color: GOLD_DIM }}>—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap text-sm tabular-nums" style={{ color: ESPRESSO }}>
                          {inv ? inv.guestCount : <span className="text-xs" style={{ color: GOLD_DIM }}>—</span>}
                        </td>
                        <td className="px-3 py-3 whitespace-nowrap">
                          {inv && onUpdateTableNumber ? (
                            <TableNumberCell
                              invitationId={inv.id}
                              eventId={inv.eventId}
                              tableNumber={inv.tableNumber}
                              onUpdate={onUpdateTableNumber}
                              existingTables={existingTables}
                              onFilterByTable={onFilterByTable}
                              activeTableFilter={activeTableFilter}
                            />
                          ) : (
                            <span className="text-xs" style={{ color: GOLD_DIM }}>—</span>
                          )}
                        </td>
                      </>
                    );
                  })()
                ) : (
                  displayedEvents.map((ev) => {
                    const inv = guest.invitations.find((i) => i.eventId === ev.id);
                    const config = inv ? (STATUS_CONFIG[inv.status] ?? STATUS_CONFIG['pending']) : null;

                    return (
                      <td key={ev.id} className="px-4 py-3 min-w-[140px]">
                        {inv && config ? (
                          <div className="flex flex-col gap-1.5 items-start">
                            {/* Status badge — interactive when onUpdateStatus is provided.
                                WCAG 1.4.1: still uses icon + colour, not colour alone. */}
                            <StatusBadgeEditor
                              invitationId={inv.id}
                              status={inv.status}
                              onChange={onUpdateStatus}
                              ariaLabelContext={`${guest.name} at ${getEventDisplayName(ev)}`}
                            />
                            <span className="text-[10px] font-sans uppercase tracking-wide" style={{ color: ESPRESSO_DIM }}>
                              {at.partySizeLabel}: {inv.guestCount}
                            </span>

                            {/* Inline table number */}
                            {onUpdateTableNumber && (
                              <TableNumberCell
                                invitationId={inv.id}
                                eventId={inv.eventId}
                                tableNumber={inv.tableNumber}
                                onUpdate={onUpdateTableNumber}
                                existingTables={existingTables}
                                onFilterByTable={onFilterByTable}
                                activeTableFilter={activeTableFilter}
                              />
                            )}

                            {/* Per-invitation actions */}
                            <div className="flex items-center gap-1 flex-wrap">
                              <CopyLinkButton invitation={inv} baseUrl={baseUrl} />

                              <button
                                onClick={() => onEditInvitation(inv, guest)}
                                title="Edit RSVP"
                                className="p-1 rounded transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.55)]"
                                style={{ color: ESPRESSO_DIM }}
                                onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; e.currentTarget.style.background = 'rgba(184,146,74,0.1)'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = ESPRESSO_DIM; e.currentTarget.style.background = 'transparent'; }}
                                aria-label={`Edit ${getEventDisplayName(ev)} RSVP for ${guest.name}`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </button>

                              <button
                                onClick={() => onDeleteInvitation(inv)}
                                title="Remove from this event"
                                className="p-1 rounded text-[rgba(42,31,26,0.35)] hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-red-400"
                                aria-label={`Remove ${guest.name} from ${getEventDisplayName(ev)}`}
                              >
                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs" style={{ color: GOLD_DIM }}>—</span>
                        )}
                      </td>
                    );
                  })
                )}

                {/* Message cell */}
                <td className="px-3 py-3 text-center">
                  {(() => {
                    const hasMessage = guest.invitations.some(
                      (inv) => inv.message && inv.message.trim().length > 0,
                    );
                    return hasMessage ? (
                      <button
                        onClick={() => setViewingMessages(guest)}
                        className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                        style={{ background: 'rgba(184,146,74,0.12)', border: `1px solid ${GOLD_DIM}`, color: GOLD }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(184,146,74,0.25)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(184,146,74,0.12)'; }}
                        aria-label={`Read message from ${guest.name}`}
                        title={`Message from ${guest.name}`}
                      >
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z"/>
                        </svg>
                      </button>
                    ) : (
                      <span style={{ color: GOLD_DIM, fontSize: '0.75rem' }} aria-hidden="true">—</span>
                    );
                  })()}
                </td>

                {/* Row actions — persistent at reduced opacity, full on hover/focus.
                    Single-event tab: per-invitation actions (copy link, edit RSVP,
                    remove from event) are lifted into this same cell behind a
                    vertical divider so all action affordances live in one column. */}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-0.5 transition-opacity">
                    {isSingleEvent && singleEvent && (() => {
                      const inv = guest.invitations.find((i) => i.eventId === singleEvent.id);
                      if (!inv) return null;
                      return (
                        <>
                          <button
                            onClick={async () => {
                              const url = `${baseUrl}/invite/${inv.token}`;
                              try {
                                await navigator.clipboard.writeText(url);
                                toast.success('Invite link copied!');
                              } catch {
                                toast.error('Failed to copy link');
                              }
                            }}
                            title={`Copy invite link for ${guest.name}`}
                            className="p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] opacity-50 group-hover:opacity-100 focus-visible:opacity-100"
                            style={{ color: ESPRESSO_DIM }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; e.currentTarget.style.background = 'rgba(184,146,74,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = ESPRESSO_DIM; e.currentTarget.style.background = 'transparent'; }}
                            aria-label={`Copy invite link for ${guest.name}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </button>

                          <button
                            onClick={() => onEditInvitation(inv, guest)}
                            title="Edit RSVP"
                            className="p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] opacity-50 group-hover:opacity-100 focus-visible:opacity-100"
                            style={{ color: ESPRESSO_DIM }}
                            onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; e.currentTarget.style.background = 'rgba(184,146,74,0.1)'; }}
                            onMouseLeave={(e) => { e.currentTarget.style.color = ESPRESSO_DIM; e.currentTarget.style.background = 'transparent'; }}
                            aria-label={`Edit RSVP for ${guest.name}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>

                          <button
                            onClick={() => onDeleteInvitation(inv)}
                            title="Remove from this event"
                            className="p-1.5 rounded-lg text-[rgba(42,31,26,0.35)] hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 opacity-50 group-hover:opacity-100 focus-visible:opacity-100"
                            aria-label={`Remove ${guest.name} from ${getEventDisplayName(singleEvent)}`}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>

                          {/* Divider separating per-invitation actions from per-guest actions */}
                          <span
                            aria-hidden="true"
                            className="mx-1 w-px h-5"
                            style={{ background: GOLD_DIM }}
                          />
                        </>
                      );
                    })()}

                    <button
                      onClick={() => onEditGuest(guest)}
                      title="Edit contact info"
                      className="p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] opacity-40 group-hover:opacity-100 focus-visible:opacity-100"
                      style={{ color: ESPRESSO_DIM }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; e.currentTarget.style.background = 'rgba(184,146,74,0.1)'; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = ESPRESSO_DIM; e.currentTarget.style.background = 'transparent'; }}
                      aria-label={`Edit contact info for ${guest.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </button>

                    <button
                      onClick={() => onDeleteGuest(guest)}
                      title="Delete guest"
                      className="p-1.5 rounded-lg text-[rgba(42,31,26,0.35)] hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400 opacity-40 group-hover:opacity-100 focus-visible:opacity-100"
                      aria-label={`Delete ${guest.name}`}
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </AnimatePresence>
        </tbody>
      </table>
    </div>

    {viewingMessages && (
      <MessageModal
        guest={viewingMessages}
        events={events}
        onClose={() => setViewingMessages(null)}
      />
    )}
    </>
  );
}
