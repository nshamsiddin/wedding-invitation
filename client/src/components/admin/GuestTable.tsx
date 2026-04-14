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
  isLoading: boolean;
  onEditGuest: (guest: AdminGuest) => void;
  onEditInvitation: (invitation: AdminInvitation, guest: AdminGuest) => void;
  onDeleteGuest: (guest: AdminGuest) => void;
  onDeleteInvitation: (invitation: AdminInvitation) => void;
  onUpdateTableNumber?: (invitationId: number, tableNumber: number | null) => void;
  showTableColumn?: boolean;
}

// ─── Inline table-number editor ───────────────────────────────────────────────

function TableNumberCell({
  invitationId,
  tableNumber,
  onUpdate,
}: {
  invitationId: number;
  tableNumber: number | null | undefined;
  onUpdate: (invitationId: number, value: number | null) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      setDraft(tableNumber != null ? String(tableNumber) : '');
      requestAnimationFrame(() => inputRef.current?.select());
    }
  }, [editing, tableNumber]);

  const commit = () => {
    const raw = draft.trim();
    const parsed = raw === '' ? null : parseInt(raw, 10);
    const next = parsed !== null && !isNaN(parsed) && parsed >= 1 && parsed <= 500 ? parsed : null;
    if (next !== (tableNumber ?? null)) {
      onUpdate(invitationId, next);
    }
    setEditing(false);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={500}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') { e.preventDefault(); commit(); }
          if (e.key === 'Escape') { setEditing(false); }
        }}
        className="w-16 px-2 py-0.5 rounded-md text-xs font-semibold font-sans text-center focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.55)]"
        style={{ background: 'rgba(184,146,74,0.14)', color: '#2A1F1A', border: '1px solid rgba(184,146,74,0.6)' }}
        aria-label="Table number"
      />
    );
  }

  return tableNumber != null ? (
    <button
      onClick={() => setEditing(true)}
      title="Click to edit table number"
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold font-sans transition-colors group/tn focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.55)]"
      style={{ background: 'rgba(184,146,74,0.14)', color: '#2A1F1A', border: '1px solid rgba(184,146,74,0.4)' }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'rgba(184,146,74,0.7)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'rgba(184,146,74,0.4)'; }}
    >
      #{tableNumber}
      <svg className="w-2.5 h-2.5 opacity-0 group-hover/tn:opacity-60 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
      </svg>
    </button>
  ) : (
    <button
      onClick={() => setEditing(true)}
      title="Click to set table number"
      className="text-xs transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-[rgba(184,146,74,0.4)] rounded px-1"
      style={{ color: 'rgba(42,31,26,0.3)' }}
      onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }}
      onMouseLeave={(e) => { e.currentTarget.style.color = 'rgba(42,31,26,0.3)'; }}
    >
      + add
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
  isLoading,
  onEditGuest,
  onEditInvitation,
  onDeleteGuest,
  onDeleteInvitation,
  onUpdateTableNumber,
  showTableColumn = false,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [viewingMessages, setViewingMessages] = useState<AdminGuest | null>(null);
  const at = useAdminTranslation();

  const baseUrl = window.location.origin;

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

  const totalColSpan = 2 + events.length + 1 + 1 + (showTableColumn ? 1 : 0);

  const columns: Array<{ key: SortKey; label: string }> = [
    { key: 'name',      label: at.colName },
    { key: 'createdAt', label: at.colAdded },
  ];

  return (
    <div className="overflow-x-auto rounded-xl shadow-sm" style={{ border: `1px solid ${GOLD_DIM}`, background: PARCHMENT }}>
      <table className="w-full text-sm font-sans" aria-label="Guest list">
        <thead>
          <tr style={{ borderBottom: `1px solid ${GOLD_DIM}`, background: CREAM }}>
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

            {/* Event columns — use getEventDisplayName for consistency */}
            {events.map((ev) => (
              <th key={ev.id} scope="col" className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: ESPRESSO_DIM }}>
                {getEventDisplayName(ev)}
              </th>
            ))}

            {showTableColumn && (
              <th scope="col" className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: ESPRESSO_DIM }}>
                {at.colTable}
              </th>
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
            {!isLoading && sorted.map((guest) => (
              <motion.tr
                key={guest.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.15 }}
                className="transition-colors group"
                style={{ borderBottom: `1px solid ${GOLD_DIM}` }}
                onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
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

                {/* Added date */}
                <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: ESPRESSO_DIM }}>
                  {new Date(guest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>

                {/* Per-event invitation cells */}
                {events.map((ev) => {
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
                })}

                {/* Table number cell (Tashkent only) */}
                {showTableColumn && (
                  <td className="px-4 py-3 whitespace-nowrap">
                    {(() => {
                      const tashkentInv = guest.invitations.find((i) => i.eventSlug === 'tashkent');
                      if (!tashkentInv) return <span style={{ color: 'rgba(42,31,26,0.3)', fontSize: '0.75rem' }}>—</span>;
                      return onUpdateTableNumber ? (
                        <TableNumberCell
                          invitationId={tashkentInv.id}
                          tableNumber={tashkentInv.tableNumber}
                          onUpdate={onUpdateTableNumber}
                        />
                      ) : tashkentInv.tableNumber != null ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-semibold font-sans"
                          style={{ background: 'rgba(184,146,74,0.14)', color: '#2A1F1A', border: '1px solid rgba(184,146,74,0.4)' }}
                        >
                          #{tashkentInv.tableNumber}
                        </span>
                      ) : (
                        <span style={{ color: 'rgba(42,31,26,0.3)', fontSize: '0.75rem' }}>—</span>
                      );
                    })()}
                  </td>
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

                {/* Row actions — persistent at reduced opacity, full on hover/focus */}
                <td className="px-4 py-3">
                  <div
                    className="flex items-center justify-end gap-1 transition-opacity"
                    // Always visible at 40% — revealed fully on row hover or keyboard focus
                    // This replaces the previous opacity-0 which broke keyboard and touch access
                    style={{ opacity: undefined }}
                  >
                    <button
                      onClick={() => onEditGuest(guest)}
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
      {viewingMessages && (
        <MessageModal
          guest={viewingMessages}
          events={events}
          onClose={() => setViewingMessages(null)}
        />
      )}
    </div>
  );
}
