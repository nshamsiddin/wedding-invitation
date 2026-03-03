import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import type { AdminGuest, AdminInvitation, AdminEvent } from '../../lib/api';
import { PARCHMENT, CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM } from '../../garden/tokens';

const STATUS_COLORS: Record<string, string> = {
  attending: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  declined:  'bg-red-50 text-red-700 border border-red-200',
  maybe:     'bg-yellow-50 text-yellow-700 border border-yellow-200',
  pending:   'bg-[rgba(184,146,74,0.12)] text-[#2A1F1A]/70 border border-[rgba(184,146,74,0.35)]',
};

const STATUS_LABELS: Record<string, string> = {
  attending: 'Attending',
  declined:  'Declined',
  maybe:     'Maybe',
  pending:   'Pending',
};

interface Props {
  guests: AdminGuest[];
  events: AdminEvent[];
  isLoading: boolean;
  onEditGuest: (guest: AdminGuest) => void;
  onEditInvitation: (invitation: AdminInvitation, guest: AdminGuest) => void;
  onDeleteGuest: (guest: AdminGuest) => void;
  onDeleteInvitation: (invitation: AdminInvitation) => void;
}

type SortKey = 'name' | 'email' | 'createdAt';
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
      title={`Copy invite link for ${invitation.eventName ?? 'event'}`}
      className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-sans transition-colors focus:outline-none focus:ring-1"
      style={{ background: 'rgba(184,146,74,0.12)', color: ESPRESSO, border: `1px solid ${GOLD_DIM}` }}
    >
      <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
      </svg>
      Link
    </button>
  );
}

export default function GuestTable({
  guests, events, isLoading,
  onEditGuest, onEditInvitation, onDeleteGuest, onDeleteInvitation,
}: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

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

  const totalColSpan = 3 + events.length + 1;

  const columns: Array<{ key: SortKey; label: string }> = [
    { key: 'name',      label: 'Name' },
    { key: 'email',     label: 'Email' },
    { key: 'createdAt', label: 'Added' },
  ];

  return (
    <div className="overflow-x-auto rounded-xl shadow-sm" style={{ border: `1px solid ${GOLD_DIM}`, background: PARCHMENT }}>
      <table className="w-full text-sm font-sans" aria-label="Guest list">
        <thead>
          <tr style={{ borderBottom: `1px solid ${GOLD_DIM}`, background: CREAM }}>
            {columns.map((col) => (
              <th key={col.key} scope="col" className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: ESPRESSO_DIM }}>
                <button
                  onClick={() => handleSort(col.key)}
                  className="flex items-center gap-1 transition-colors focus:outline-none"
                  style={{ color: ESPRESSO_DIM }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = ESPRESSO_DIM; }}
                  aria-label={`Sort by ${col.label}`}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </button>
              </th>
            ))}
            {events.map((ev) => (
              <th key={ev.id} scope="col" className="px-4 py-3 text-left font-medium whitespace-nowrap" style={{ color: ESPRESSO_DIM }}>
                {ev.slug.charAt(0).toUpperCase() + ev.slug.slice(1)}
              </th>
            ))}
            <th scope="col" className="px-4 py-3 text-right font-medium" style={{ color: ESPRESSO_DIM }}>
              Actions
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
                  <p className="font-medium text-sm" style={{ color: ESPRESSO }}>No guests found</p>
                  <p className="text-xs" style={{ color: ESPRESSO_DIM }}>Try adjusting filters or add a guest manually</p>
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
                <td className="px-4 py-3 font-medium whitespace-nowrap max-w-[150px] truncate" style={{ color: ESPRESSO }}>
                  {guest.name}
                  {guest.partnerName && (
                    <p className="text-xs font-normal mt-0.5" style={{ color: ESPRESSO_DIM }}>& {guest.partnerName}</p>
                  )}
                  {guest.phone && (
                    <p className="text-xs font-normal mt-0.5" style={{ color: ESPRESSO_DIM }}>{guest.phone}</p>
                  )}
                </td>
                <td className="px-4 py-3 whitespace-nowrap max-w-[180px] truncate" style={{ color: ESPRESSO_DIM }}>
                  {guest.email}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-xs" style={{ color: ESPRESSO_DIM }}>
                  {new Date(guest.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>

                {events.map((ev) => {
                  const inv = guest.invitations.find((i) => i.eventId === ev.id);
                  return (
                    <td key={ev.id} className="px-4 py-3 min-w-[120px]">
                      {inv ? (
                        <div className="flex flex-col gap-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium self-start ${STATUS_COLORS[inv.status] ?? 'bg-gray-100 text-gray-600'}`}>
                            {STATUS_LABELS[inv.status] ?? inv.status}
                          </span>
                          <div className="flex items-center gap-1">
                            <CopyLinkButton invitation={inv} baseUrl={baseUrl} />
                            <button
                              onClick={() => onEditInvitation(inv, guest)}
                              title="Edit RSVP"
                              className="p-1 rounded transition-colors focus:outline-none focus:ring-1"
                              style={{ color: ESPRESSO_DIM }}
                              onMouseEnter={(e) => { e.currentTarget.style.color = GOLD; e.currentTarget.style.background = 'rgba(184,146,74,0.1)'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.color = ESPRESSO_DIM; e.currentTarget.style.background = 'transparent'; }}
                              aria-label={`Edit ${ev.slug} RSVP for ${guest.name}`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                              </svg>
                            </button>
                            <button
                              onClick={() => onDeleteInvitation(inv)}
                              title="Remove from this event"
                              className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-1 focus:ring-red-400"
                              aria-label={`Remove ${guest.name} from ${ev.slug}`}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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

                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditGuest(guest)}
                      className="p-1.5 rounded-lg transition-colors focus:outline-none focus:ring-2"
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
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
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
  );
}
