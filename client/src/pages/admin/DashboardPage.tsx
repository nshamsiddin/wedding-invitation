import { useContext, useState, useEffect, useRef, useCallback } from 'react';
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
import GuestTable from '../../components/admin/GuestTable';
import AddGuestModal from '../../components/admin/AddGuestModal';
import EditGuestModal from '../../components/admin/EditGuestModal';
import EditInvitationModal from '../../components/admin/EditInvitationModal';

// ─── Static shareable link cards ─────────────────────────────────────────────

const LANG_META: Record<string, { label: string; flag: string }> = {
  en: { label: 'English',    flag: '🇬🇧' },
  tr: { label: 'Türkçe',    flag: '🇹🇷' },
  uz: { label: "O'zbekcha", flag: '🇺🇿' },
};

const VENUE_META: Record<string, { displayName: string; city: string }> = {
  tashkent: { displayName: 'Toshkent', city: 'Ofarin Restaurant' },
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
    { value: 'maybe',     label: at.statsMaybe },
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

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal]           = useState(false);
  const [editingGuest, setEditingGuest]           = useState<AdminGuest | null>(null);
  const [editingInvitation, setEditingInvitation] = useState<{ inv: AdminInvitation; guest: AdminGuest } | null>(null);
  const [deletingGuest, setDeletingGuest]         = useState<AdminGuest | null>(null);
  const [deletingInvitation, setDeletingInvitation] = useState<AdminInvitation | null>(null);

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
    search: search || undefined,
  };

  const { data: guests = [], isLoading: guestsLoading } = useQuery({
    queryKey: ['admin', 'guests', guestQueryParams],
    queryFn: () => adminApi.getGuests(guestQueryParams),
  });

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
      adminApi.exportCSV(selectedEventId ?? undefined);
      toast.success('Downloading CSV…');
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
  };

  // Is any filter active? — show indicator
  const isFiltered = statusFilters.length > 0 || searchInput.length > 0;

  return (
    <div className="admin-page min-h-screen" style={{ background: CREAM, color: ESPRESSO }}>

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-30" style={{ background: PARCHMENT, borderBottom: `1px solid ${GOLD_DIM}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: `rgba(184,146,74,0.1)`, border: `1px solid ${GOLD_DIM}` }}
              aria-hidden="true"
            >
              <svg className="w-4 h-4" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <p className="font-sans font-semibold text-sm leading-none" style={{ color: ESPRESSO }}>Guest Admin</p>
              <p className="text-xs font-sans mt-0.5 hidden sm:block" style={{ color: ESPRESSO_DIM }}>B & S · Wedding 2026</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Language switcher */}
            <div className="flex items-center rounded-lg overflow-hidden" style={{ border: `1px solid ${GOLD_DIM}` }}>
              {LANGUAGES.map((l) => (
                <button
                  key={l}
                  onClick={() => setLanguage(l)}
                  className="px-2.5 py-1.5 text-xs font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(184,146,74,0.55)]"
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

            {/* Export CSV — desktop */}
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

            <button
              onClick={() => logoutMutation.mutate()}
              className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; e.currentTarget.style.borderColor = GOLD_DIM; }}
            >
              {at.signOut}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* ── Event tabs ──────────────────────────────────────────────────── */}
        <section aria-label="Event selector">
          {/*
            "All" tab uses identical sizing/shape to event tabs.
            Active tab text uses ESPRESSO on GOLD — 5.85:1 contrast (WCAG AA ✓).
            Inactive tab text uses ESPRESSO on PARCHMENT — ~18:1 (WCAG AAA ✓).
          */}
          <div className="flex flex-wrap items-center gap-3">

            {/* "All" standalone pill — default/home state, first in DOM and visual order */}
            <button
              onClick={() => handleSelectEvent(null)}
              className="px-4 py-2 rounded-lg text-sm font-sans font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] focus-visible:ring-offset-1"
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
                      className="px-4 py-2 text-sm font-sans font-semibold transition-all inline-flex items-center gap-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(184,146,74,0.8)]"
                      style={
                        active
                          ? { background: GOLD, color: ESPRESSO }
                          : { background: PARCHMENT, color: ESPRESSO }
                      }
                      aria-pressed={active}
                    >
                      {getEventDisplayName(ev)}
                      <span
                        className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full text-[10px] font-bold leading-none"
                        style={
                          active
                            ? { background: 'rgba(42,31,26,0.15)', color: ESPRESSO }
                            : { background: GOLD, color: ESPRESSO }
                        }
                      >
                        {ev.stats.total}
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
          <StatsCards events={events} selectedEventId={selectedEventId} isLoading={eventsLoading} />
        </section>

        {/* ── Shareable Links ─────────────────────────────────────────────── */}
        <ShareableLinksSection baseUrl={config?.baseUrl ?? ''} />

        {/* ── Guest list ──────────────────────────────────────────────────── */}
        <section aria-labelledby="guests-heading">
          <div className="flex flex-col sm:flex-row sm:items-start gap-3 mb-4">
            <div className="flex-1">
              <h2 id="guests-heading" className="font-sans font-semibold text-sm" style={{ color: ESPRESSO }}>
                {at.guestList}
                {!guestsLoading && (
                  <span className="ml-2 text-xs font-normal" style={{ color: ESPRESSO_DIM }}>
                    {guests.length} {guests.length === 1 ? at.guestSingular : at.guestPlural}
                    {isFiltered && (
                      <span className="ml-1 text-[rgba(184,146,74,0.9)]">· filtered</span>
                    )}
                  </span>
                )}
              </h2>
            </div>

            <div className="flex flex-col gap-2 sm:items-end">
              {/* Row 1: search + add + mobile-CSV */}
              <div className="flex flex-wrap gap-2">
                {/* Search with loading indicator */}
                <div className="relative">
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
                    className="pl-8 pr-8 py-1.5 rounded-lg text-xs font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] transition-colors w-48"
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

              {/* Row 2: multi-select status pills */}
              <StatusPills selected={statusFilters} onChange={setStatusFilters} />
            </div>
          </div>

          <GuestTable
            guests={guests}
            events={events}
            isLoading={guestsLoading}
            onEditGuest={setEditingGuest}
            onEditInvitation={(inv, guest) => setEditingInvitation({ inv, guest })}
            onDeleteGuest={setDeletingGuest}
            onDeleteInvitation={setDeletingInvitation}
            showTableColumn={selectedEvent?.slug === 'tashkent'}
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
