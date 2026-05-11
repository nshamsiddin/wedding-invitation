import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { AdminGuest, AdminInvitation, AdminEvent } from '../../lib/api';
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

// ─── TablePicker — chip-driven seating editor ─────────────────────────────────
// Shared by the inline cell editor and (re-exported below) by the dashboard's
// bulk "Assign table" popover. Keeping a single visual treatment for assignment
// means admins build muscle memory once.

export function TablePicker({
  value,
  existingTables,
  onCommit,
  onCancel,
  showCancel = true,
  showClear = true,
  inputAriaLabel = 'Table number',
  /** When true, the input takes focus on mount. */
  autoFocus = true,
  /** Optional title shown above the input — used by the bulk popover. */
  title,
}: {
  value: number | null;
  existingTables: number[];
  onCommit: (next: number | null) => void;
  onCancel?: () => void;
  showCancel?: boolean;
  showClear?: boolean;
  inputAriaLabel?: string;
  autoFocus?: boolean;
  title?: string;
}) {
  const [draft, setDraft] = useState(value != null ? String(value) : '');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!autoFocus) return;
    const id = requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
    return () => cancelAnimationFrame(id);
  }, [autoFocus]);

  // Smallest positive integer not yet used — capped at the schema's 500 limit.
  const nextAvailable = useMemo(() => {
    const used = new Set(existingTables);
    for (let n = 1; n <= 500; n += 1) {
      if (!used.has(n)) return n;
    }
    return null;
  }, [existingTables]);

  const parseDraft = (raw: string): number | null => {
    const trimmed = raw.trim();
    if (trimmed === '') return null;
    const parsed = parseInt(trimmed, 10);
    if (Number.isNaN(parsed) || parsed < 1 || parsed > 500) return null;
    return parsed;
  };

  const commit = () => onCommit(parseDraft(draft));

  // Quick-pick chips: existing tables sorted ascending, deduped.
  const sortedExisting = useMemo(
    () => Array.from(new Set(existingTables)).sort((a, b) => a - b),
    [existingTables],
  );

  // The "next available" chip is only meaningful if it's actually a *new*
  // table — otherwise it just duplicates an existing chip.
  const showNextChip = nextAvailable != null && !sortedExisting.includes(nextAvailable);

  return (
    <div
      className="inline-flex flex-col gap-1.5"
      // Compact layout — the picker stays the width of its content so it
      // doesn't stretch the cell column.
      style={{ minWidth: '7rem' }}
      // The cell-level outer button uses `onClick` to enter edit mode; once
      // we're inside the picker, any clicks on the input/chips would bubble
      // back to that parent and re-trigger edit. Stop them here.
      onClick={(e) => e.stopPropagation()}
    >
      {title && (
        <p
          className="text-[10px] font-sans font-semibold uppercase tracking-widest"
          style={{ color: ESPRESSO_DIM }}
        >
          {title}
        </p>
      )}

      <div className="flex items-center gap-1">
        <input
          ref={inputRef}
          type="number"
          min={1}
          max={500}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commit(); }
            if (e.key === 'Escape' && onCancel) onCancel();
          }}
          placeholder="#"
          aria-label={inputAriaLabel}
          style={{
            width: '3.25rem',
            padding: '0.25rem 0.4rem',
            borderRadius: '0.375rem',
            fontSize: '0.78rem',
            fontWeight: 700,
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontVariantNumeric: 'tabular-nums',
            textAlign: 'center',
            background: '#FDFAF5',
            border: '1.5px solid rgba(184,146,74,0.7)',
            color: ESPRESSO,
            outline: 'none',
            boxShadow: '0 0 0 3px rgba(184,146,74,0.12)',
          }}
        />
        <button
          onClick={commit}
          type="button"
          aria-label="Save table number"
          style={{
            width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
            background: 'rgba(74,158,120,0.14)', border: '1px solid rgba(74,158,120,0.45)',
            color: '#2D6B50', display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M20 6L9 17l-5-5"/>
          </svg>
        </button>
        {showCancel && onCancel && (
          <button
            onClick={onCancel}
            type="button"
            aria-label="Cancel"
            style={{
              width: '22px', height: '22px', borderRadius: '50%', flexShrink: 0,
              background: 'rgba(42,31,26,0.05)', border: '1px solid rgba(42,31,26,0.12)',
              color: 'rgba(42,31,26,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          </button>
        )}
      </div>

      {(sortedExisting.length > 0 || showNextChip || (showClear && value != null)) && (
        <div className="flex flex-wrap items-center gap-1" role="group" aria-label="Quick-pick tables">
          {sortedExisting.map((n) => {
            const isCurrent = n === value;
            return (
              <button
                key={n}
                type="button"
                onClick={() => onCommit(n)}
                aria-label={`Use table ${n}`}
                aria-pressed={isCurrent}
                className="font-sans tabular-nums focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.55)]"
                style={{
                  padding: '0.1rem 0.4rem',
                  borderRadius: '0.3rem',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  background: isCurrent ? GOLD : 'rgba(184,146,74,0.11)',
                  color: isCurrent ? '#FFFFFF' : '#7A4F10',
                  border: `1px solid ${isCurrent ? GOLD : 'rgba(184,146,74,0.32)'}`,
                  cursor: 'pointer',
                }}
              >
                {n}
              </button>
            );
          })}
          {showNextChip && (
            <button
              type="button"
              onClick={() => onCommit(nextAvailable)}
              title={`Use the next free table (${nextAvailable})`}
              aria-label={`Use the next available table, number ${nextAvailable}`}
              className="font-sans tabular-nums focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.55)] inline-flex items-center gap-0.5"
              style={{
                padding: '0.1rem 0.4rem',
                borderRadius: '0.3rem',
                fontSize: '0.7rem',
                fontWeight: 700,
                background: 'transparent',
                color: GOLD,
                border: '1px dashed rgba(184,146,74,0.5)',
                cursor: 'pointer',
              }}
            >
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14"/>
              </svg>
              {nextAvailable}
            </button>
          )}
          {showClear && value != null && (
            <button
              type="button"
              onClick={() => onCommit(null)}
              aria-label="Clear table assignment"
              className="font-sans focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{
                padding: '0.1rem 0.4rem',
                borderRadius: '0.3rem',
                fontSize: '0.7rem',
                fontWeight: 600,
                background: 'transparent',
                color: ESPRESSO_DIM,
                border: '1px solid transparent',
                cursor: 'pointer',
                textDecoration: 'underline',
                textUnderlineOffset: '2px',
              }}
            >
              Clear
            </button>
          )}
        </div>
      )}
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
  tableNumber,
  onUpdate,
  existingTables = [],
  onFilterByTable,
  activeTableFilter = null,
}: {
  invitationId: number;
  tableNumber: number | null | undefined;
  onUpdate: (invitationId: number, value: number | null) => void;
  existingTables?: number[];
  onFilterByTable?: (tableNumber: number | null) => void;
  activeTableFilter?: number | null;
}) {
  const [editing, setEditing] = useState(false);

  const startEdit = () => setEditing(true);

  const commitFromPicker = (next: number | null) => {
    if (next !== (tableNumber ?? null)) onUpdate(invitationId, next);
    setEditing(false);
  };

  // ── Edit mode ──────────────────────────────────────────────────────────────
  if (editing) {
    return (
      <TablePicker
        value={tableNumber ?? null}
        existingTables={existingTables}
        onCommit={commitFromPicker}
        onCancel={() => setEditing(false)}
      />
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
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium ${config.classes}`}>
                            {config.icon}
                            {config.label}
                          </span>
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
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${config.classes}`}>
                              {config.icon}
                              {config.label}
                            </span>
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
                          <div className="flex flex-col gap-1.5">
                            {/* Status badge with icon — WCAG 1.4.1 */}
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium self-start ${config.classes}`}>
                              {config.icon}
                              {config.label}
                            </span>
                            <span className="text-[10px] font-sans uppercase tracking-wide" style={{ color: ESPRESSO_DIM }}>
                              {at.partySizeLabel}: {inv.guestCount}
                            </span>

                            {/* Inline table number */}
                            {onUpdateTableNumber && (
                              <TableNumberCell
                                invitationId={inv.id}
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
