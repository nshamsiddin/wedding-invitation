import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Guest } from '@invitation/shared';

type SortKey = keyof Guest;
type SortDir = 'asc' | 'desc';

const STATUS_COLORS: Record<string, string> = {
  attending: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  declined: 'bg-red-500/20 text-red-400 border-red-500/30',
  maybe: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  attending: 'Attending',
  declined: 'Declined',
  maybe: 'Maybe',
  pending: 'Pending',
};

interface Props {
  guests: Guest[];
  isLoading: boolean;
  onEdit: (guest: Guest) => void;
  onDelete: (guest: Guest) => void;
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <span className={`ml-1 inline-flex flex-col gap-px ${active ? 'text-gold-400' : 'text-gray-600'}`} aria-hidden="true">
      <svg className={`w-2.5 h-2.5 transition-transform ${active && dir === 'desc' ? 'opacity-30' : ''}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M5 0L10 6H0L5 0Z" />
      </svg>
      <svg className={`w-2.5 h-2.5 transition-transform ${active && dir === 'asc' ? 'opacity-30' : ''}`} viewBox="0 0 10 6" fill="currentColor">
        <path d="M5 6L0 0H10L5 6Z" />
      </svg>
    </span>
  );
}

function SkeletonRow() {
  return (
    <tr className="border-b border-white/5">
      {Array.from({ length: 7 }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-3 rounded bg-gray-800 animate-pulse" style={{ width: `${60 + (i * 13) % 40}%` }} />
        </td>
      ))}
    </tr>
  );
}

export default function GuestTable({ guests, isLoading, onEdit, onDelete }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const sorted = useMemo(() => {
    return [...guests].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp = String(av ?? '').localeCompare(String(bv ?? ''), undefined, { numeric: true });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [guests, sortKey, sortDir]);

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const columns: Array<{ key: SortKey; label: string; className?: string }> = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    { key: 'status', label: 'Status' },
    { key: 'guestCount', label: 'Guests', className: 'text-center' },
    { key: 'dietary', label: 'Dietary' },
    { key: 'message', label: 'Message' },
    { key: 'createdAt', label: 'RSVP Date' },
  ];

  return (
    <div className="overflow-x-auto rounded-xl border border-white/10">
      <table className="w-full text-sm font-sans" aria-label="Guest list">
        <thead>
          <tr className="border-b border-white/10 bg-gray-900/80">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                className={`px-4 py-3 text-left font-medium text-gray-400 whitespace-nowrap ${col.className ?? ''}`}
              >
                <button
                  onClick={() => handleSort(col.key)}
                  className="flex items-center gap-1 hover:text-white transition-colors focus:outline-none focus:text-gold-400"
                  aria-label={`Sort by ${col.label} ${sortKey === col.key && sortDir === 'asc' ? 'descending' : 'ascending'}`}
                >
                  {col.label}
                  <SortIcon active={sortKey === col.key} dir={sortDir} />
                </button>
              </th>
            ))}
            <th scope="col" className="px-4 py-3 text-right font-medium text-gray-400">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading &&
            Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)}

          {!isLoading && sorted.length === 0 && (
            <tr>
              <td colSpan={8} className="px-4 py-16 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-800 flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                  </div>
                  <p className="text-gray-500 font-sans">No guests found</p>
                  <p className="text-gray-600 text-xs">Try adjusting your filters or add a guest manually</p>
                </div>
              </td>
            </tr>
          )}

          <AnimatePresence initial={false}>
            {!isLoading &&
              sorted.map((guest) => (
                <motion.tr
                  key={guest.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  className="border-b border-white/5 hover:bg-white/3 transition-colors group"
                >
                  <td className="px-4 py-3 text-white font-medium whitespace-nowrap max-w-[160px] truncate">
                    {guest.name}
                  </td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap max-w-[180px] truncate">
                    {guest.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_COLORS[guest.status] ?? 'bg-gray-500/20 text-gray-400'}`}
                    >
                      {STATUS_LABELS[guest.status] ?? guest.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-300 text-center">{guest.guestCount}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-[140px] truncate" title={guest.dietary ?? undefined}>
                    {guest.dietary || <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-[180px] truncate" title={guest.message ?? undefined}>
                    {guest.message || <span className="text-gray-600">—</span>}
                  </td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap text-xs">
                    {new Date(guest.createdAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        onClick={() => onEdit(guest)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
                        aria-label={`Edit ${guest.name}`}
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => onDelete(guest)}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors focus:outline-none focus:ring-2 focus:ring-red-400"
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
