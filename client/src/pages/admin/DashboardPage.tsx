import { useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import type { AdminGuest, AdminInvitation } from '../../lib/api';
import type {
  AddGuestValues,
  UpdateGuestContactValues,
  UpdateInvitationValues,
} from '@invitation/shared';
import { adminApi, configApi } from '../../lib/api';
import { PARCHMENT, CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM } from '../../garden/tokens';
import { LanguageContext } from '../../context/LanguageContext';
import { LANGUAGES, LANGUAGE_LABELS } from '../../lib/i18n';
import { useAdminTranslation } from '../../lib/i18n/admin';
import { getEventDisplayName } from '../../components/admin/adminTokens';
import StatsCards from '../../components/admin/StatsCards';
import GuestTable, { TablePicker } from '../../components/admin/GuestTable';
import AddGuestModal from '../../components/admin/AddGuestModal';
import BulkAddGuestsModal from '../../components/admin/BulkAddGuestsModal';
import EditGuestModal from '../../components/admin/EditGuestModal';
import EditInvitationModal from '../../components/admin/EditInvitationModal';
import NotificationBell from '../../components/admin/NotificationBell';

// ─── Static shareable link cards ─────────────────────────────────────────────

const LANG_META: Record<string, { label: string; flag: string }> = {
  en: { label: 'English',    flag: '🇬🇧' },
  tr: { label: 'Türkçe',    flag: '🇹🇷' },
  uz: { label: "O'zbekcha", flag: '🇺🇿' },
};

const VENUE_META: Record<string, { displayName: string; city: string }> = {
  tashkent: { displayName: 'Tashkent', city: 'Ofarin Restaurant' },
  ankara:   { displayName: 'Ankara',   city: "Park L'Amore" },
};

interface ShareableLinkCardProps {
  venue: string;
  lang: string;
  baseUrl: string;
}

function ShareableLinkCard({ venue, lang, baseUrl }: ShareableLinkCardProps) {
  const path  = `/invite/${venue}/${lang}`;
  const full  = baseUrl ? `${baseUrl}${path}` : `${window.location.origin}${path}`;
  const lMeta = LANG_META[lang];
  const vMeta = VENUE_META[venue];
  const at    = useAdminTranslation();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(full);
      toast.success(`${lMeta?.flag ?? ''} Copied ${vMeta?.displayName} (${lang.toUpperCase()})!`);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <div
      className="flex flex-col gap-2.5 p-3.5 rounded-xl border transition-shadow hover:shadow-md"
      style={{ background: PARCHMENT, borderColor: GOLD_DIM }}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="text-base leading-none" aria-hidden="true">{lMeta?.flag}</span>
            <span className="font-sans font-semibold text-xs" style={{ color: ESPRESSO }}>
              {lMeta?.label}
            </span>
          </div>
          <p className="text-xs font-sans" style={{ color: ESPRESSO_DIM }}>
            {vMeta?.displayName} · {vMeta?.city}
          </p>
        </div>
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold flex-shrink-0"
          style={{ background: 'rgba(184,146,74,0.12)', border: `1px solid ${GOLD_DIM}`, color: GOLD }}
        >
          <span aria-hidden="true">∞</span> {at.permanent}
        </span>
      </div>

      <p className="text-xs font-mono truncate" style={{ color: ESPRESSO_DIM }} title={full}>
        {path}
      </p>

      <button
        onClick={handleCopy}
        className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
        style={{ background: 'rgba(184,146,74,0.10)', border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(184,146,74,0.20)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'rgba(184,146,74,0.10)'; }}
        aria-label={`Copy shareable link for ${vMeta?.displayName} in ${lMeta?.label}`}
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
        {at.copyLink}
      </button>
    </div>
  );
}

// ─── Data Backup / Restore section ───────────────────────────────────────────
//
// Lets the admin download a JSON snapshot of every data table (events, guests,
// invitations, notifications) and restore the database from a previously
// downloaded backup file. Restoring is destructive — every existing row is
// replaced with the file contents — so the action is gated behind an explicit
// confirmation dialog.

function DataBackupSection() {
  const at = useAdminTranslation();
  const qc = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  const restoreMutation = useMutation({
    mutationFn: async (file: File) => {
      // Read the file in the browser so we can reject obviously invalid
      // payloads (non-JSON, wrong shape) before bothering the server.
      const text = await file.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(text);
      } catch {
        throw new Error(at.backupInvalidFile);
      }
      if (
        !parsed ||
        typeof parsed !== 'object' ||
        Array.isArray(parsed) ||
        (parsed as { app?: unknown }).app !== 'invitation'
      ) {
        throw new Error(at.backupInvalidFile);
      }
      return adminApi.restoreBackup(parsed);
    },
    onSuccess: ({ counts }) => {
      const summary = Object.entries(counts)
        .map(([k, v]) => `${v} ${k}`)
        .join(', ');
      toast.success(at.backupRestoreSuccess(summary));
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
    onError: (err) => {
      // axios.isAxiosError must be checked before the generic Error branch
      // because AxiosError extends Error — without this ordering TypeScript
      // narrows `err` to `never` in the second arm of the ternary.
      const message = axios.isAxiosError(err)
        ? ((err.response?.data?.error as string | undefined) ?? at.backupRestoreFailed)
        : err instanceof Error
          ? err.message
          : at.backupRestoreFailed;
      toast.error(message);
    },
  });

  const handleDownload = () => {
    adminApi.downloadBackup();
    toast.success(at.backupDownloading);
  };

  const handlePickFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setPendingFile(file);
    // Reset the input value so re-selecting the same file fires onChange again.
    e.target.value = '';
  };

  const handleConfirm = () => {
    if (!pendingFile) return;
    restoreMutation.mutate(pendingFile);
    setPendingFile(null);
  };

  return (
    <section aria-labelledby="data-backup-heading">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls="data-backup-body"
        className="w-full flex items-center justify-between gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] rounded-lg"
      >
        <div className="text-left">
          <h2
            id="data-backup-heading"
            className="font-sans font-semibold text-sm"
            style={{ color: ESPRESSO }}
          >
            {at.backupTitle}
          </h2>
          <p className="text-xs font-sans mt-0.5" style={{ color: ESPRESSO_DIM }}>
            {at.backupDesc}
          </p>
        </div>

        <span
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
          style={{
            background: isOpen ? 'rgba(184,146,74,0.12)' : 'rgba(184,146,74,0.07)',
            color: ESPRESSO_DIM,
          }}
          aria-hidden="true"
        >
          <motion.svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </span>
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="data-backup-body"
            key="data-backup-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div
              className="mt-3 p-4 rounded-xl border flex flex-wrap items-center gap-2"
              style={{ background: PARCHMENT, borderColor: GOLD_DIM }}
            >
              <button
                type="button"
                onClick={handleDownload}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                style={{ background: GOLD, color: ESPRESSO }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#A07840'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                {at.backupDownload}
              </button>

              <button
                type="button"
                onClick={handlePickFile}
                disabled={restoreMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                onMouseEnter={(e) => { if (!restoreMutation.isPending) { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; } }}
                onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; e.currentTarget.style.borderColor = GOLD_DIM; }}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                {restoreMutation.isPending ? at.backupRestoring : at.backupRestore}
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
                aria-hidden="true"
                tabIndex={-1}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation modal — destructive operation, gated behind an explicit
          dialog the admin must accept before any data is replaced. */}
      <AnimatePresence>
        {pendingFile && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setPendingFile(null)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="restore-backup-title"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-xl p-6 w-full max-w-sm shadow-lg"
                style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <h3 id="restore-backup-title" className="font-sans font-semibold text-sm mb-1" style={{ color: ESPRESSO }}>
                      {at.backupConfirmTitle}
                    </h3>
                    <p className="text-xs font-sans leading-relaxed" style={{ color: ESPRESSO_DIM }}>
                      {at.backupConfirmDesc}
                    </p>
                    <p className="text-xs font-sans leading-relaxed mt-1" style={{ color: '#B23A3A' }}>
                      {at.backupConfirmDanger}
                    </p>
                    <p className="text-xs font-mono mt-2 truncate" style={{ color: ESPRESSO_DIM }} title={pendingFile.name}>
                      {pendingFile.name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setPendingFile(null)}
                    className="flex-1 font-sans font-medium text-xs py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                    style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                  >
                    {at.cancel}
                  </button>
                  <button
                    onClick={handleConfirm}
                    disabled={restoreMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-sans font-semibold text-xs py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed"
                  >
                    {restoreMutation.isPending ? at.backupRestoring : at.backupConfirmAction}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </section>
  );
}

function ShareableLinksSection({ baseUrl }: { baseUrl: string }) {
  const venues = ['tashkent', 'ankara'];
  const langs  = ['en', 'tr', 'uz'];
  const at     = useAdminTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const toggle = useCallback(() => setIsOpen((v) => !v), []);

  return (
    <section aria-labelledby="shareable-links-heading">
      {/* ── Collapsible header ─────────────────────────────────────────────── */}
      <button
        type="button"
        onClick={toggle}
        aria-expanded={isOpen}
        aria-controls="shareable-links-body"
        className="w-full flex items-center justify-between gap-3 group focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] rounded-lg"
      >
        <div className="text-left">
          <h2
            id="shareable-links-heading"
            className="font-sans font-semibold text-sm"
            style={{ color: ESPRESSO }}
          >
            {at.shareableLinksTitle}
          </h2>
          <p className="text-xs font-sans mt-0.5" style={{ color: ESPRESSO_DIM }}>
            {at.shareableLinksDesc}
          </p>
        </div>

        <span
          className="flex-shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors"
          style={{ background: isOpen ? 'rgba(184,146,74,0.12)' : 'rgba(184,146,74,0.07)', color: ESPRESSO_DIM }}
          aria-hidden="true"
        >
          <motion.svg
            className="w-3.5 h-3.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </motion.svg>
        </span>
      </button>

      {/* ── Collapsible body ───────────────────────────────────────────────── */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id="shareable-links-body"
            key="links-body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div className="pt-4 space-y-4">
              {venues.map((venue) => (
                <div key={venue}>
                  <p
                    className="text-xs font-sans font-semibold uppercase tracking-wider mb-2"
                    style={{ color: ESPRESSO_DIM }}
                  >
                    {VENUE_META[venue]?.displayName}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {langs.map((lang) => (
                      <ShareableLinkCard key={lang} venue={venue} lang={lang} baseUrl={baseUrl} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}

// ─── Multi-select status filter pills ─────────────────────────────────────────

interface StatusPillsProps {
  selected: string[];
  onChange: (next: string[]) => void;
}

function StatusPills({ selected, onChange }: StatusPillsProps) {
  const at = useAdminTranslation();

  const OPTIONS = [
    { value: 'attending', label: at.statsAttending },
    { value: 'declined',  label: at.statsDeclined },
    { value: 'pending',   label: at.noResponse },
  ];

  const toggle = (value: string) => {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value));
    } else {
      onChange([...selected, value]);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1"
      role="group"
      aria-label="Filter by attendance status"
    >
      {OPTIONS.map((opt) => {
        const active = selected.includes(opt.value);
        return (
          <button
            key={opt.value}
            onClick={() => toggle(opt.value)}
            aria-pressed={active}
            className="px-2.5 py-1 rounded-full text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
            style={
              active
                ? { background: GOLD, color: ESPRESSO, border: `1px solid ${GOLD}` }
                : {
                    background: PARCHMENT,
                    color: ESPRESSO_DIM,
                    border: `1px solid ${GOLD_DIM}`,
                  }
            }
          >
            {opt.label}
          </button>
        );
      })}
      {selected.length > 0 && (
        <button
          onClick={() => onChange([])}
          className="px-2 py-1 rounded-full text-xs font-sans transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
          style={{ color: ESPRESSO_DIM, background: 'transparent' }}
          aria-label="Clear status filters"
        >
          ✕ {at.allStatuses}
        </button>
      )}
    </div>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const at = useAdminTranslation();
  const { language, setLanguage } = useContext(LanguageContext);

  // ── Filter state ────────────────────────────────────────────────────────────
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  // Search: controlled input value with 300 ms debounce before hitting the API
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setSearch(searchInput), 300);
    return () => clearTimeout(id);
  }, [searchInput]);

  // Multi-select status filter — replaces the previous single <select>
  const [statusFilters, setStatusFilters] = useState<string[]>([]);

  // Table number filter — client-side, applied after the API response
  const [tableFilter, setTableFilter] = useState<number | null>(null);

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal]           = useState(false);
  const [showBulkModal, setShowBulkModal]         = useState(false);
  const [editingGuest, setEditingGuest]           = useState<AdminGuest | null>(null);
  const [editingInvitation, setEditingInvitation] = useState<{ inv: AdminInvitation; guest: AdminGuest } | null>(null);
  const [deletingGuest, setDeletingGuest]         = useState<AdminGuest | null>(null);
  const [deletingInvitation, setDeletingInvitation] = useState<AdminInvitation | null>(null);
  const [selectedGuestIds, setSelectedGuestIds] = useState<Set<number>>(new Set());

  // ── Bulk "Assign table" popover ─────────────────────────────────────────────
  // Toggled from the selection toolbar — only meaningful when a single event
  // tab is active, since table numbers belong to per-event invitations.
  const [showBulkTablePopover, setShowBulkTablePopover] = useState(false);

  // Undo delete: store a snapshot of the guest before deletion for 5s
  const deletedGuestRef = useRef<AdminGuest | null>(null);

  // ── Queries ─────────────────────────────────────────────────────────────────
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: adminApi.getEvents,
    refetchInterval: 60_000,
  });

  const guestQueryParams = {
    eventId: selectedEventId ?? undefined,
    status: statusFilters.length > 0 ? statusFilters.join(',') : undefined,
    tableNumber: tableFilter ?? undefined,
    search: search || undefined,
  };

  const { data: guestsData, isLoading: guestsLoading } = useQuery({
    queryKey: ['admin', 'guests', guestQueryParams],
    queryFn: () => adminApi.getGuests(guestQueryParams),
    placeholderData: (prev) => prev,
  });
  const guests    = guestsData?.guests ?? [];
  const guestTotal = guestsData?.total ?? 0;

  const { data: availableTables = [] } = useQuery({
    queryKey: ['admin', 'tables', selectedEventId],
    queryFn: () => adminApi.getTableNumbers(selectedEventId ?? undefined),
    staleTime: 30_000,
  });

  const filteredGuests = guests;
  const visibleGuestIdSet = useMemo(() => new Set(filteredGuests.map((g) => g.id)), [filteredGuests]);
  useEffect(() => {
    setSelectedGuestIds((prev) => {
      const next = new Set<number>();
      for (const id of prev) {
        if (visibleGuestIdSet.has(id)) next.add(id);
      }
      return next;
    });
  }, [visibleGuestIdSet]);

  const selectedGuests = useMemo(
    () => filteredGuests.filter((g) => selectedGuestIds.has(g.id)),
    [filteredGuests, selectedGuestIds],
  );

  const selectedInvitationCount = useMemo(() => (
    selectedGuests.reduce((sum, g) => {
      if (selectedEventId === null) return sum + g.invitations.length;
      return sum + g.invitations.filter((i) => i.eventId === selectedEventId).length;
    }, 0)
  ), [selectedGuests, selectedEventId]);

  const selectedPeopleCount = useMemo(() => (
    selectedGuests.reduce((sum, g) => {
      if (selectedEventId === null) {
        return sum + g.invitations.reduce((inner, i) => inner + i.guestCount, 0);
      }
      return sum + g.invitations
        .filter((i) => i.eventId === selectedEventId)
        .reduce((inner, i) => inner + i.guestCount, 0);
    }, 0)
  ), [selectedGuests, selectedEventId]);

  const selectedAttendingPeople = useMemo(() => (
    selectedGuests.reduce((sum, g) => {
      if (selectedEventId === null) {
        return sum + g.invitations
          .filter((i) => i.status === 'attending')
          .reduce((inner, i) => inner + i.guestCount, 0);
      }
      return sum + g.invitations
        .filter((i) => i.eventId === selectedEventId && i.status === 'attending')
        .reduce((inner, i) => inner + i.guestCount, 0);
    }, 0)
  ), [selectedGuests, selectedEventId]);
  const visibleInvitationCount = useMemo(() => (
    filteredGuests.reduce((sum, g) => {
      if (selectedEventId === null) return sum + g.invitations.length;
      return sum + g.invitations.filter((i) => i.eventId === selectedEventId).length;
    }, 0)
  ), [filteredGuests, selectedEventId]);

  const visiblePeopleCount = useMemo(() => (
    filteredGuests.reduce((sum, g) => {
      if (selectedEventId === null) {
        return sum + g.invitations.reduce((inner, i) => inner + i.guestCount, 0);
      }
      return sum + g.invitations
        .filter((i) => i.eventId === selectedEventId)
        .reduce((inner, i) => inner + i.guestCount, 0);
    }, 0)
  ), [filteredGuests, selectedEventId]);

  // Headcount for the selected table on current result page
  const tableHeadcount = useMemo(() => {
    if (tableFilter == null) return null;
    return filteredGuests.reduce((sum, g) => {
      const inv = g.invitations.find((i) => i.tableNumber === tableFilter && i.status === 'attending');
      return sum + (inv?.guestCount ?? 0);
    }, 0);
  }, [filteredGuests, tableFilter]);

  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: configApi.getConfig,
    staleTime: Infinity,
  });

  // ── Mutations ────────────────────────────────────────────────────────────────

  const logoutMutation = useMutation({
    mutationFn: adminApi.logout,
    onSuccess: () => { qc.clear(); navigate('/admin/login', { replace: true }); },
  });

  const addMutation = useMutation({
    mutationFn: adminApi.addGuest,
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.status === 409
          ? (error.response.data?.error as string | undefined) ?? 'Duplicate entry'
          : 'Failed to add guest';
      toast.error(message);
    },
    onSuccess: () => {
      setShowAddModal(false);
      toast.success('Guest added');
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const updateGuestMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: UpdateGuestContactValues }) =>
      adminApi.updateGuest(id, values),
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.status === 409
          ? (error.response.data?.error as string | undefined) ?? 'Duplicate entry'
          : 'Failed to update guest';
      toast.error(message);
    },
    onSuccess: () => {
      setEditingGuest(null);
      toast.success('Contact updated');
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const updateInvMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: UpdateInvitationValues }) =>
      adminApi.updateInvitation(id, values),
    onError: () => toast.error('Failed to update RSVP'),
    onSuccess: () => {
      setEditingInvitation(null);
      setEditingGuest(null);
      toast.success('RSVP updated');
      qc.invalidateQueries({ queryKey: ['admin', 'guests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'events'] });
    },
  });

  const updateTableNumberMutation = useMutation({
    mutationFn: ({ id, tableNumber }: { id: number; tableNumber: number | null }) =>
      adminApi.updateInvitation(id, { tableNumber }),
    onError: () => toast.error('Failed to update table number'),
    onSuccess: (_data, { tableNumber }) => {
      toast.success(tableNumber != null ? `Table set to #${tableNumber}` : 'Table number cleared');
      qc.invalidateQueries({ queryKey: ['admin', 'guests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'tables'] });
    },
  });

  // Inline status change from the badge in the guest table. Separate from the
  // full-form RSVP edit so we can show a focused, single-field success toast
  // (and skip closing/reopening the EditInvitationModal).
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'attending' | 'declined' | 'pending' }) =>
      adminApi.updateInvitation(id, { status }),
    onError: () => toast.error('Failed to update status'),
    onSuccess: (_data, { status }) => {
      const label =
        status === 'attending' ? at.statusAttending
        : status === 'declined' ? at.statusDeclined
        : at.statusPending;
      toast.success(`Status: ${label}`);
      // Refresh guests + events so the stats cards reflect the change.
      qc.invalidateQueries({ queryKey: ['admin', 'guests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'events'] });
    },
  });

  // Bulk-assign the same table number to every selected guest's invitation for
  // the currently-active event tab. We resolve invitation IDs at submit time
  // rather than caching them so the list stays correct if the user changes
  // selection mid-popover.
  const bulkAssignTableMutation = useMutation({
    mutationFn: async ({
      invitationIds,
      tableNumber,
    }: {
      invitationIds: number[];
      tableNumber: number | null;
    }) => {
      // Sequential rather than Promise.all to keep the server load light if
      // someone bulk-assigns several hundred guests. Failures of individual
      // requests are caught and reported as a partial-success toast.
      const successes: number[] = [];
      const failures: number[] = [];
      for (const id of invitationIds) {
        try {
          await adminApi.updateInvitation(id, { tableNumber });
          successes.push(id);
        } catch {
          failures.push(id);
        }
      }
      return { successes, failures, tableNumber };
    },
    onSuccess: ({ successes, failures, tableNumber }) => {
      const verb = tableNumber != null ? `assigned to Table ${tableNumber}` : 'cleared';
      if (failures.length === 0) {
        toast.success(`${successes.length} ${successes.length === 1 ? 'invitation' : 'invitations'} ${verb}`);
      } else if (successes.length === 0) {
        toast.error(`Failed to update ${failures.length} ${failures.length === 1 ? 'invitation' : 'invitations'}`);
      } else {
        toast(`${successes.length} ${verb}, ${failures.length} failed`, { icon: '⚠️' });
      }
      qc.invalidateQueries({ queryKey: ['admin', 'guests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'tables'] });
      setShowBulkTablePopover(false);
    },
  });

  /**
   * Returns the invitation IDs that the bulk action would target — selected
   * guests' invitations for the currently-active event tab. Empty when no
   * event tab is active (table numbers are per-event so multi-event bulk
   * assignment isn't a meaningful operation).
   */
  const bulkAssignableInvitationIds = useMemo<number[]>(() => {
    if (selectedEventId == null) return [];
    const ids: number[] = [];
    for (const g of selectedGuests) {
      const inv = g.invitations.find((i) => i.eventId === selectedEventId);
      if (inv) ids.push(inv.id);
    }
    return ids;
  }, [selectedGuests, selectedEventId]);

  // Per-table attending headcount for the overview strip. Computed from the
  // currently-loaded guests; intentionally suppressed when a single-table
  // filter is active (otherwise every non-selected chip would read "0" and
  // mislead the admin).
  const tableHeadcountMap = useMemo<Map<number, number>>(() => {
    const m = new Map<number, number>();
    if (tableFilter != null) return m;
    for (const g of filteredGuests) {
      for (const inv of g.invitations) {
        if (selectedEventId != null && inv.eventId !== selectedEventId) continue;
        if (inv.tableNumber == null) continue;
        if (inv.status !== 'attending') continue;
        m.set(inv.tableNumber, (m.get(inv.tableNumber) ?? 0) + inv.guestCount);
      }
    }
    return m;
  }, [filteredGuests, selectedEventId, tableFilter]);

  const addInvitationMutation = useMutation({
    mutationFn: adminApi.addInvitation,
    onError: () => toast.error('Failed to add to event'),
    onSuccess: () => {
      toast.success('Added to event');
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  // ── Delete with undo ────────────────────────────────────────────────────────

  const deleteGuestMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteGuest(id),
    onError: () => toast.error('Failed to delete guest'),
    onSuccess: () => {
      // Guest was deleted — now offer a 5s undo window by re-adding contact only
      const snapshot = deletedGuestRef.current;
      if (!snapshot) { qc.invalidateQueries({ queryKey: ['admin'] }); return; }

      const toastId = toast(
        (t) => (
          <span className="flex items-center gap-2">
            <span style={{ fontSize: '13px' }}>Removed <strong>{snapshot.name}</strong></span>
            <button
              onClick={() => {
                toast.dismiss(t.id);
                // Restore the guest — re-add with original event assignments + pending status
                const eventIds = snapshot.invitations.map((i) => i.eventId);
                if (eventIds.length === 0) { return; }
                addMutation.mutate(
                  {
                    name: snapshot.name,
                    phone: snapshot.phone ?? undefined,
                    partnerName: snapshot.partnerName ?? undefined,
                    eventIds,
                    status: 'pending',
                    guestCount: 1,
                    dietary: '',
                    message: '',
                    language: 'en',
                  },
                  {
                    onSuccess: () => toast.success(at.guestRestored(snapshot.name), { duration: 4000 }),
                  },
                );
              }}
              style={{
                padding: '2px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'rgba(184,146,74,0.15)',
                color: '#2A1F1A',
                border: '1px solid rgba(184,146,74,0.4)',
                cursor: 'pointer',
              }}
            >
              {at.undoRemove}
            </button>
          </span>
        ),
        { duration: 5000 },
      );
      void toastId; // toast ID captured but not needed for this undo pattern
      deletedGuestRef.current = null;

      qc.invalidateQueries({ queryKey: ['admin'] });
      setDeletingGuest(null);
    },
  });

  const handleConfirmDeleteGuest = () => {
    if (!deletingGuest) return;
    deletedGuestRef.current = deletingGuest;
    deleteGuestMutation.mutate(deletingGuest.id);
  };

  const deleteInvMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteInvitation(id),
    onError: () => toast.error('Failed to remove from event'),
    onSuccess: () => {
      setDeletingInvitation(null);
      toast.success('Removed from event');
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  // ── Handlers ─────────────────────────────────────────────────────────────────

  const handleAddGuest = (values: AddGuestValues) => addMutation.mutate(values);

  const handleUpdateGuest = (id: number, values: UpdateGuestContactValues) =>
    updateGuestMutation.mutate({ id, values });

  const handleUpdateInvFromUnified = (id: number, values: UpdateInvitationValues) =>
    updateInvMutation.mutate({ id, values });

  const handleUpdateInv = (id: number, values: UpdateInvitationValues) =>
    updateInvMutation.mutate({ id, values });

  const handleAddToEvent = (guestId: number, eventId: number) =>
    addInvitationMutation.mutate({ guestId, eventId, status: 'pending', guestCount: 1, language: 'en' });

  const handleExportCSV = async () => {
    try {
      adminApi.exportAcceptedInvitationLinksCSV(selectedEventId ?? undefined);
      toast.success('Downloading accepted guests with invitation links…');
    } catch {
      toast.error('Export failed');
    }
  };

  const selectedEvent = selectedEventId !== null ? events.find((e) => e.id === selectedEventId) : null;

  // ── Clear filters when switching tabs ────────────────────────────────────────
  const handleSelectEvent = (id: number | null) => {
    setSelectedEventId(id);
    setStatusFilters([]);
    setSearchInput('');
    setTableFilter(null);
    setSelectedGuestIds(new Set());
  };

  // Is any filter active? — show indicator
  const isFiltered = statusFilters.length > 0 || searchInput.length > 0 || tableFilter !== null;

  return (
    <div className="admin-page min-h-screen" style={{ background: CREAM, color: ESPRESSO }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30" style={{ background: PARCHMENT, borderBottom: `1px solid ${GOLD_DIM}` }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `rgba(184,146,74,0.1)`, border: `1px solid ${GOLD_DIM}` }}
              aria-hidden="true"
            >
              <svg className="w-4 h-4" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="font-sans font-semibold text-sm leading-none truncate" style={{ color: ESPRESSO }}>Guest Admin</p>
              <p className="text-xs font-sans mt-0.5 hidden sm:block" style={{ color: ESPRESSO_DIM }}>B & S · Wedding 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <NotificationBell />

            {/* Guest Wishes — icon-only on mobile, full label from sm: */}
            <button
              onClick={() => navigate('/admin/messages')}
              className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; e.currentTarget.style.borderColor = GOLD_DIM; }}
              aria-label={at.openGuestWishes}
              title={at.openGuestWishes}
            >
              <svg className="w-3.5 h-3.5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="hidden sm:inline">{at.openGuestWishes}</span>
            </button>

            <button
              onClick={() => navigate('/admin/duplicates')}
              className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; e.currentTarget.style.borderColor = GOLD_DIM; }}
              aria-label={at.openDuplicateDetector}
              title={at.openDuplicateDetector}
            >
              <svg className="w-3.5 h-3.5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h10M7 12h10m-7 5h7M5 4h14a2 2 0 012 2v12a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" />
              </svg>
              <span className="hidden sm:inline">{at.openDuplicateDetector}</span>
            </button>

            {/* Seating planner — link includes the active eventId so the
                planner opens already focused on the event the admin was
                looking at. */}
            <button
              onClick={() =>
                navigate(
                  selectedEventId != null
                    ? `/admin/seating?eventId=${selectedEventId}`
                    : '/admin/seating',
                )
              }
              className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; e.currentTarget.style.borderColor = GOLD_DIM; }}
              aria-label={at.openSeatingPlanner}
              title={at.openSeatingPlanner}
            >
              <svg className="w-3.5 h-3.5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
              </svg>
              <span className="hidden sm:inline">{at.openSeatingPlanner}</span>
            </button>

            {/* Language switcher — compact on mobile */}
            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${GOLD_DIM}` }}>
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className="px-2 sm:px-2.5 py-1.5 text-xs font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(184,146,74,0.55)]"
                  style={
                    language === l
                      ? { background: GOLD, color: ESPRESSO }
                      : { background: PARCHMENT, color: ESPRESSO_DIM }
                  }
                  aria-pressed={language === l}
                  aria-label={`Switch to ${LANGUAGE_LABELS[l]}`}
                >
                  {LANGUAGE_LABELS[l]}
                </button>
              ))}
            </div>

            {/* Export CSV — hidden on mobile (also offered in the toolbar below) */}
            <button
              onClick={handleExportCSV}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; e.currentTarget.style.borderColor = GOLD_DIM; }}
              aria-label={at.exportCsv}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              {at.exportCsv}
            </button>

            {/* Sign out — icon-only on mobile so the row never overflows */}
            <button
              onClick={() => logoutMutation.mutate()}
              className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; e.currentTarget.style.borderColor = GOLD_DIM; }}
              aria-label={at.signOut}
              title={at.signOut}
            >
              <svg className="w-3.5 h-3.5 sm:hidden" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span className="hidden sm:inline">{at.signOut}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-6 space-y-5 sm:space-y-6">

        {/* ── Event tabs ──────────────────────────────────────────────────── */}
        <section aria-label="Event selector">
          {/*
            "All" tab uses identical sizing/shape to event tabs.
            Active tab text uses ESPRESSO on GOLD — 5.85:1 contrast (WCAG AA ✓).
            Inactive tab text uses ESPRESSO on PARCHMENT — ~18:1 (WCAG AAA ✓).
          */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">

            {/* "All" standalone pill — default/home state, first in DOM and visual order */}
            <button
              onClick={() => handleSelectEvent(null)}
              className="px-3 sm:px-4 py-2 rounded-lg text-sm font-sans font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] focus-visible:ring-offset-1"
              style={
                selectedEventId === null
                  ? { background: ESPRESSO, color: PARCHMENT }
                  : { background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }
              }
              aria-pressed={selectedEventId === null}
            >
              {at.all}
            </button>

            {/* Event tabs — connected segmented group */}
            <div
              className="flex items-stretch rounded-lg overflow-hidden"
              style={{ border: `1px solid ${GOLD_DIM}` }}
              role="group"
              aria-label="Filter by event"
            >
              {events.map((ev, idx) => {
                const active = selectedEventId === ev.id;
                return (
                  <div key={ev.id} className="flex items-stretch">
                    {idx > 0 && (
                      <div className="w-px self-stretch" style={{ background: GOLD_DIM }} aria-hidden="true" />
                    )}
                    <button
                      onClick={() => handleSelectEvent(ev.id)}
                      className="px-2.5 sm:px-4 py-2 text-sm font-sans font-semibold transition-all inline-flex items-center gap-1.5 sm:gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(184,146,74,0.8)]"
                      style={
                        active
                          ? { background: GOLD, color: ESPRESSO }
                          : { background: PARCHMENT, color: ESPRESSO }
                      }
                      aria-pressed={active}
                    >
                      {getEventDisplayName(ev)}
                      <span className="inline-flex items-center gap-1.5 text-[10px] leading-none">
                        <span
                          className="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1 rounded-full font-bold"
                          title={`${ev.stats.totalInvitations ?? ev.stats.total} ${ev.stats.totalInvitations === 1 ? at.invitationUnitSingular : at.invitationUnitPlural}`}
                          style={
                            active
                              ? { background: 'rgba(42,31,26,0.15)', color: ESPRESSO }
                              : { background: GOLD, color: ESPRESSO }
                          }
                        >
                          {ev.stats.totalInvitations ?? ev.stats.total}i
                        </span>
                        <span
                          className="inline-flex items-center justify-center min-w-[22px] h-[18px] px-1 rounded-full font-bold"
                          title={`${ev.stats.total} ${ev.stats.total === 1 ? at.personUnitSingular : at.personUnitPlural}`}
                          style={
                            active
                              ? { background: 'rgba(42,31,26,0.15)', color: ESPRESSO }
                              : { background: GOLD, color: ESPRESSO }
                          }
                        >
                          {ev.stats.total}p
                        </span>
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>

          </div>

          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex flex-wrap gap-x-5 gap-y-1"
            >
              <span className="text-xs font-sans flex items-center gap-1.5" style={{ color: ESPRESSO_DIM }}>
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {selectedEvent.date} at {selectedEvent.time}
              </span>
              <span className="text-xs font-sans flex items-center gap-1.5" style={{ color: ESPRESSO_DIM }}>
                <svg className="w-3 h-3 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {selectedEvent.venueName}
              </span>
            </motion.div>
          )}
        </section>

        {/* ── Stats ──────────────────────────────────────────────────────── */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Event Statistics</h2>
          <StatsCards
            events={events}
            selectedEventId={selectedEventId}
            isLoading={eventsLoading}
            selectedStatuses={statusFilters}
            onToggleStatus={(status) =>
              setStatusFilters((prev) =>
                prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status],
              )
            }
          />
        </section>

        {/* ── Shareable Links ─────────────────────────────────────────────── */}
        <ShareableLinksSection baseUrl={config?.baseUrl ?? ''} />

        {/* ── Data Backup ─────────────────────────────────────────────────── */}
        <DataBackupSection />

        {/* ── Guest list ──────────────────────────────────────────────────── */}
        <section aria-labelledby="guests-heading">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
            <div className="flex-1">
              <h2 id="guests-heading" className="font-sans font-semibold text-sm" style={{ color: ESPRESSO }}>
                {at.guestList}
                {!guestsLoading && (
                  <span className="ml-2 text-xs font-normal" style={{ color: ESPRESSO_DIM }}>
                    {guestTotal} {guestTotal === 1 ? at.guestSingular : at.guestPlural}
                    <span className="ml-1">
                      · {visibleInvitationCount} {visibleInvitationCount === 1 ? at.invitationUnitSingular : at.invitationUnitPlural}
                    </span>
                    <span className="ml-1">
                      · {visiblePeopleCount} {visiblePeopleCount === 1 ? at.personUnitSingular : at.personUnitPlural}
                    </span>
                    {isFiltered && (
                      <span className="ml-1 text-[rgba(184,146,74,0.9)]">· filtered</span>
                    )}
                  </span>
                )}
              </h2>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              {/* Row 1: search + add + mobile-CSV */}
              <div className="flex flex-wrap items-stretch gap-2">
                {/* Search with loading indicator — fills remaining width on mobile */}
                <div className="relative flex-1 min-w-[8rem] sm:flex-none">
                  <svg
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
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
                    value={searchInput}
                    onChange={(e) => setSearchInput(e.target.value)}
                    placeholder={at.searchPlaceholder}
                    aria-label="Search guests"
                    className="pl-8 pr-8 py-1.5 rounded-lg text-xs font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] transition-colors w-full min-w-0 sm:w-48"
                    style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                  />
                  {/* Debounce loading indicator */}
                  {guestsLoading && search.length > 0 && (
                    <span
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border-2 border-t-transparent animate-spin"
                      style={{ borderColor: `${GOLD} transparent transparent transparent` }}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Add guest */}
                <button
                  onClick={() => setShowAddModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 font-sans font-semibold text-xs rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] whitespace-nowrap"
                  style={{ background: GOLD, color: ESPRESSO }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#A07840'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; }}
                  aria-label={at.addGuest}
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  {at.addGuest}
                </button>

                {/* Bulk Import */}
                <button
                  onClick={() => setShowBulkModal(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 font-sans font-medium text-xs rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] whitespace-nowrap"
                  style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; e.currentTarget.style.borderColor = GOLD_DIM; }}
                  aria-label="Bulk import guests"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  Bulk Import
                </button>

                {/* Mobile CSV */}
                <button
                  onClick={handleExportCSV}
                  className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                  style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                  aria-label="Export CSV"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  CSV
                </button>
              </div>

              {/* Row 2: status pills.
                  Table filtering is handled by the Tables overview strip
                  rendered just above the guest list — having two equivalent
                  filter controls is visual noise. */}
              <div className="flex flex-wrap items-center gap-2">
                <StatusPills selected={statusFilters} onChange={setStatusFilters} />
              </div>
            </div>
          </div>

          <div
            className="mb-4 rounded-xl border"
            style={{ background: PARCHMENT, borderColor: GOLD_DIM }}
          >
            <div className="p-3.5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-xs font-sans font-semibold uppercase tracking-widest" style={{ color: ESPRESSO_DIM }}>
                  {at.verificationTitle}
                </p>
                <p className="text-xs font-sans mt-0.5" style={{ color: ESPRESSO_DIM }}>
                  {at.verificationHint}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 text-xs font-sans" style={{ color: ESPRESSO }}>
                <span className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(184,146,74,0.12)', border: `1px solid ${GOLD_DIM}` }}>
                  {selectedGuestIds.size} {at.verificationSelected}
                </span>
                <span>{selectedInvitationCount} {selectedInvitationCount === 1 ? at.invitationUnitSingular : at.invitationUnitPlural}</span>
                <span>{selectedPeopleCount} {selectedPeopleCount === 1 ? at.personUnitSingular : at.personUnitPlural}</span>
                <span>{at.statsAttending}: {selectedAttendingPeople} {at.personUnitPlural}</span>

                {/* Bulk "Assign table" — only meaningful on a single-event tab
                    because table numbers belong to per-event invitations. We
                    surface the button regardless of event scope so admins can
                    discover it, but disable it (with a clear reason) when no
                    event tab is active. */}
                <button
                  type="button"
                  disabled={selectedGuestIds.size === 0 || bulkAssignableInvitationIds.length === 0}
                  onClick={() => setShowBulkTablePopover((v) => !v)}
                  aria-expanded={showBulkTablePopover}
                  aria-controls="bulk-table-popover"
                  title={
                    selectedGuestIds.size === 0
                      ? 'Select guests first'
                      : selectedEventId == null
                        ? 'Choose an event tab to assign a table'
                        : bulkAssignableInvitationIds.length === 0
                          ? 'None of the selected guests have an invitation for this event'
                          : `Assign a table to ${bulkAssignableInvitationIds.length} invitation${bulkAssignableInvitationIds.length === 1 ? '' : 's'}`
                  }
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full font-sans font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                  style={{
                    background: showBulkTablePopover ? GOLD : 'rgba(184,146,74,0.12)',
                    border: `1px solid ${showBulkTablePopover ? GOLD : GOLD_DIM}`,
                    color: showBulkTablePopover ? '#FFFFFF' : ESPRESSO,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
                    <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
                  </svg>
                  Assign table
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={{ transform: showBulkTablePopover ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
                    <path d="M6 9l6 6 6-6"/>
                  </svg>
                </button>

                <button
                  type="button"
                  disabled={selectedGuestIds.size === 0}
                  onClick={() => setSelectedGuestIds(new Set())}
                  className="px-2.5 py-1 rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                  style={{ border: `1px solid ${GOLD_DIM}`, color: ESPRESSO_DIM }}
                >
                  {at.clearSelection}
                </button>
              </div>
            </div>

            {/* Bulk assign popover — inline expansion keeps it visually
                anchored to the trigger without absolute-positioning gymnastics
                and works gracefully on narrow viewports. */}
            <AnimatePresence initial={false}>
              {showBulkTablePopover && bulkAssignableInvitationIds.length > 0 && (
                <motion.div
                  key="bulk-table-popover"
                  id="bulk-table-popover"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.15 }}
                  style={{ overflow: 'hidden', borderTop: `1px solid ${GOLD_DIM}` }}
                >
                  <div className="p-3.5 flex flex-wrap items-start gap-4" style={{ background: CREAM }}>
                    <div className="min-w-0">
                      <p className="text-xs font-sans font-semibold uppercase tracking-widest" style={{ color: ESPRESSO_DIM }}>
                        Assign table
                      </p>
                      <p className="text-xs font-sans mt-0.5" style={{ color: ESPRESSO }}>
                        Pick a table for{' '}
                        <span className="font-semibold tabular-nums">{bulkAssignableInvitationIds.length}</span>{' '}
                        {bulkAssignableInvitationIds.length === 1 ? 'invitation' : 'invitations'} on this event.
                      </p>
                    </div>
                    <div className="flex-1 min-w-0 flex justify-end">
                      <TablePicker
                        value={null}
                        existingTables={availableTables}
                        onCommit={(next) =>
                          bulkAssignTableMutation.mutate({
                            invitationIds: bulkAssignableInvitationIds,
                            tableNumber: next,
                          })
                        }
                        onCancel={() => setShowBulkTablePopover(false)}
                        showClear
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Tables overview strip ─────────────────────────────────────────
              Replaces the previous native <select> with a glanceable, tactile
              row of pill chips — one per table currently in use, with the
              attending headcount when computable. Click toggles the filter;
              the same pill in the guest table is highlighted so the active
              filter context is visible both in the toolbar and inline.

              We don't render this when there are no tables in play — the
              empty state is more useful as silence than as a visual block. */}
          {availableTables.length > 0 && (
            <div
              className="mb-4 rounded-xl border"
              style={{ background: PARCHMENT, borderColor: GOLD_DIM }}
              role="region"
              aria-label="Tables overview"
            >
              <div className="p-3 flex flex-wrap items-center gap-2">
                <span
                  className="text-[10px] font-sans font-bold uppercase tracking-widest flex-shrink-0"
                  style={{ color: ESPRESSO_DIM }}
                >
                  Tables
                </span>

                {/* "All" chip clears the table filter. Always present so the
                    chip pattern is consistent — when nothing is filtered, it
                    holds the "selected" state. */}
                <button
                  type="button"
                  onClick={() => setTableFilter(null)}
                  aria-pressed={tableFilter === null}
                  className="font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                  style={{
                    padding: '0.25rem 0.7rem',
                    borderRadius: '9999px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    background: tableFilter === null ? GOLD : 'transparent',
                    color: tableFilter === null ? '#FFFFFF' : ESPRESSO_DIM,
                    border: `1px solid ${tableFilter === null ? GOLD : GOLD_DIM}`,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  All
                </button>

                {availableTables.map((n) => {
                  const isActive = tableFilter === n;
                  const headcount = tableHeadcountMap.get(n);
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setTableFilter(isActive ? null : n)}
                      aria-pressed={isActive}
                      aria-label={
                        headcount != null
                          ? `Table ${n}, ${headcount} attending. ${isActive ? 'Currently filtered.' : 'Click to filter.'}`
                          : `Table ${n}. ${isActive ? 'Currently filtered.' : 'Click to filter.'}`
                      }
                      title={isActive ? 'Click to clear filter' : `Show only guests at Table ${n}`}
                      className="inline-flex items-center gap-1.5 font-sans tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                      style={{
                        padding: '0.25rem 0.7rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 700,
                        background: isActive ? GOLD : 'rgba(184,146,74,0.11)',
                        color: isActive ? '#FFFFFF' : '#7A4F10',
                        border: `1px solid ${isActive ? GOLD : 'rgba(184,146,74,0.32)'}`,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <span>{n}</span>
                      {headcount != null && headcount > 0 && (
                        <span
                          aria-hidden="true"
                          style={{
                            fontWeight: 500,
                            opacity: isActive ? 0.9 : 0.7,
                          }}
                        >
                          · {headcount}
                        </span>
                      )}
                      {isActive && (
                        <svg
                          width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                          strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                          style={{ marginLeft: '0.1rem' }}
                        >
                          <path d="M18 6L6 18M6 6l12 12"/>
                        </svg>
                      )}
                    </button>
                  );
                })}

                {/* Right-aligned summary of the active filter — keeps context
                    visible even after scrolling within the strip on long lists. */}
                {tableFilter != null && tableHeadcount != null && (
                  <span
                    className="ml-auto px-2.5 py-1 rounded-full text-xs font-sans font-medium tabular-nums"
                    style={{ background: 'rgba(184,146,74,0.12)', color: ESPRESSO, border: `1px solid ${GOLD_DIM}` }}
                    aria-live="polite"
                  >
                    {tableHeadcount} {tableHeadcount === 1 ? 'guest' : 'guests'} attending
                  </span>
                )}
              </div>
            </div>
          )}

          <GuestTable
            guests={filteredGuests}
            events={events}
            selectedEventId={selectedEventId}
            isLoading={guestsLoading}
            selectedGuestIds={selectedGuestIds}
            onToggleGuestSelection={(guestId) =>
              setSelectedGuestIds((prev) => {
                const next = new Set(prev);
                if (next.has(guestId)) next.delete(guestId);
                else next.add(guestId);
                return next;
              })
            }
            onToggleSelectAllVisible={(checked) =>
              setSelectedGuestIds((prev) => {
                const next = new Set(prev);
                if (checked) {
                  for (const g of filteredGuests) next.add(g.id);
                } else {
                  for (const g of filteredGuests) next.delete(g.id);
                }
                return next;
              })
            }
            onEditGuest={setEditingGuest}
            onEditInvitation={(inv, guest) => setEditingInvitation({ inv, guest })}
            onDeleteGuest={setDeletingGuest}
            onDeleteInvitation={setDeletingInvitation}
            onUpdateTableNumber={(invId, tableNumber) =>
              updateTableNumberMutation.mutate({ id: invId, tableNumber })
            }
            onUpdateStatus={(invId, status) =>
              updateStatusMutation.mutate({ id: invId, status })
            }
            existingTables={availableTables}
            onFilterByTable={setTableFilter}
            activeTableFilter={tableFilter}
          />

        </section>
      </main>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}

      <AddGuestModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddGuest}
        isPending={addMutation.isPending}
        events={events}
        defaultEventId={selectedEventId ?? undefined}
      />

      <BulkAddGuestsModal
        isOpen={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        events={events}
        defaultEventId={selectedEventId ?? undefined}
      />

      <EditGuestModal
        guest={editingGuest}
        events={events}
        onClose={() => setEditingGuest(null)}
        onUpdateContact={handleUpdateGuest}
        onUpdateInvitation={handleUpdateInvFromUnified}
        onAddToEvent={handleAddToEvent}
        isContactPending={updateGuestMutation.isPending}
        isInvitationPending={updateInvMutation.isPending}
        isAddToEventPending={addInvitationMutation.isPending}
      />

      <EditInvitationModal
        invitation={editingInvitation?.inv ?? null}
        guest={editingInvitation?.guest ?? null}
        onClose={() => setEditingInvitation(null)}
        onSubmit={handleUpdateInv}
        isPending={updateInvMutation.isPending}
      />

      {/* ── Delete Guest confirmation ─────────────────────────────────────── */}
      <AnimatePresence>
        {deletingGuest && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingGuest(null)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-guest-title"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-xl p-6 w-full max-w-sm shadow-lg"
                style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 id="delete-guest-title" className="font-sans font-semibold text-sm mb-1" style={{ color: ESPRESSO }}>
                      {at.removeGuestTitle}
                    </h3>
                    <p className="text-xs font-sans leading-relaxed" style={{ color: ESPRESSO_DIM }}>
                      {at.removeGuestDesc(deletingGuest.name)}
                    </p>
                    <p className="text-xs font-sans mt-1" style={{ color: ESPRESSO_DIM }}>
                      You&apos;ll have 5 seconds to undo this action.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setDeletingGuest(null)}
                    className="flex-1 font-sans font-medium text-xs py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                    style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                  >
                    {at.cancel}
                  </button>
                  <button
                    onClick={handleConfirmDeleteGuest}
                    disabled={deleteGuestMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-sans font-semibold text-xs py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed"
                  >
                    {deleteGuestMutation.isPending ? at.deleting : at.remove}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* ── Delete Invitation confirmation ────────────────────────────────── */}
      <AnimatePresence>
        {deletingInvitation && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingInvitation(null)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-inv-title"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-xl p-6 w-full max-w-sm shadow-lg"
                style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 id="delete-inv-title" className="font-sans font-semibold text-sm mb-1" style={{ color: ESPRESSO }}>
                      {at.removeInvTitle}
                    </h3>
                    <p className="text-xs font-sans leading-relaxed" style={{ color: ESPRESSO_DIM }}>
                      {at.removeInvDesc(deletingInvitation.eventName ?? deletingInvitation.eventSlug ?? '')}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button
                    onClick={() => setDeletingInvitation(null)}
                    className="flex-1 font-sans font-medium text-xs py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                    style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                  >
                    {at.cancel}
                  </button>
                  <button
                    onClick={() => deleteInvMutation.mutate(deletingInvitation.id)}
                    disabled={deleteInvMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-sans font-semibold text-xs py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed"
                  >
                    {deleteInvMutation.isPending ? at.deleting : at.remove}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
