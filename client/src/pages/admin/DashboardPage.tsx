import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import axios from 'axios';
import type { AdminGuest, AdminInvitation, OpenInvitation } from '../../lib/api';
import type {
  AddGuestValues,
  UpdateGuestContactValues,
  UpdateInvitationValues,
  CreateOpenInvitationValues,
} from '@invitation/shared';
import { adminApi } from '../../lib/api';
import { PARCHMENT, CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM, ROSE } from '../../garden/tokens';
import StatsCards from '../../components/admin/StatsCards';
import GuestTable from '../../components/admin/GuestTable';
import AddGuestModal from '../../components/admin/AddGuestModal';
import EditGuestModal from '../../components/admin/EditGuestModal';
import EditInvitationModal from '../../components/admin/EditInvitationModal';

const STATUS_FILTER_OPTIONS = [
  { value: '',          label: 'All Statuses' },
  { value: 'attending', label: 'Attending' },
  { value: 'declined',  label: 'Declined' },
  { value: 'maybe',     label: 'Maybe' },
  { value: 'pending',   label: 'No Response' },
];

function OpenInvitationRow({
  inv,
  onDelete,
}: {
  inv: OpenInvitation & { url?: string };
  onDelete: (id: number) => void;
}) {
  const handleCopy = async () => {
    const url = inv.url ?? `${window.location.origin}/invite/${inv.token}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Open link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const isPermanent = inv.isPublic;

  return (
    <div className="flex items-center justify-between py-2.5 px-3 rounded-lg gap-3 border" style={{
      background: isPermanent ? 'rgba(196,132,140,0.12)' : 'rgba(184,146,74,0.12)',
      borderColor: isPermanent ? 'rgba(196,132,140,0.35)' : GOLD_DIM,
    }}>
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {isPermanent ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: ROSE, color: PARCHMENT }} title="Permanent link — reusable by anyone, no limit">
              <span aria-hidden="true">∞</span> Permanent
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: 'rgba(184,146,74,0.15)', color: ESPRESSO, border: `1px solid ${GOLD_DIM}` }} title="One-time — locked after first use">
              1× One-time
            </span>
          )}
          <span className="text-xs font-sans" style={{ color: ESPRESSO_DIM }}>{inv.eventName ?? inv.eventSlug}</span>
        </div>
        <p className="text-xs font-mono mt-0.5 truncate max-w-[200px]" style={{ color: ESPRESSO_DIM }}>{inv.token.slice(0, 8)}…</p>
      </div>
      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={handleCopy}
          className="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-sans transition-colors focus:outline-none focus:ring-1"
          style={{
            background: PARCHMENT,
            border: `1px solid ${isPermanent ? 'rgba(196,132,140,0.4)' : GOLD_DIM}`,
            color: isPermanent ? ROSE : ESPRESSO,
          }}
        >
          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copy
        </button>
        <button
          onClick={() => onDelete(inv.id)}
          className="p-1 rounded text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors focus:outline-none focus:ring-1 focus:ring-red-400"
          aria-label="Delete open invitation"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<AdminGuest | null>(null);
  const [editingInvitation, setEditingInvitation] = useState<{ inv: AdminInvitation; guest: AdminGuest } | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<AdminGuest | null>(null);
  const [deletingInvitation, setDeletingInvitation] = useState<AdminInvitation | null>(null);
  const [showOpenLinkModal, setShowOpenLinkModal] = useState(false);
  const [openLinkEventIds, setOpenLinkEventIds] = useState<number[]>([]);
  const [openLinkIsPublic, setOpenLinkIsPublic] = useState(false);

  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: adminApi.getEvents,
    refetchInterval: 60_000,
  });

  const guestQueryParams = {
    eventId: selectedEventId ?? undefined,
    status: statusFilter || undefined,
    search: search || undefined,
  };

  const { data: guests = [], isLoading: guestsLoading } = useQuery({
    queryKey: ['admin', 'guests', guestQueryParams],
    queryFn: () => adminApi.getGuests(guestQueryParams),
  });

  const { data: openInvitations = [] } = useQuery({
    queryKey: ['admin', 'invitations', 'open'],
    queryFn: adminApi.getOpenInvitations,
  });

  const logoutMutation = useMutation({
    mutationFn: adminApi.logout,
    onSuccess: () => { qc.clear(); navigate('/admin/login', { replace: true }); },
  });

  const addMutation = useMutation({
    mutationFn: adminApi.addGuest,
    onError: (error) => {
      const message =
        axios.isAxiosError(error) && error.response?.status === 409
          ? (error.response.data?.error as string | undefined) ?? 'A guest with this email already exists'
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
          ? (error.response.data?.error as string | undefined) ?? 'A guest with this email already exists'
          : 'Failed to update guest';
      toast.error(message);
    },
    onSuccess: () => {
      setEditingGuest(null);
      toast.success('Contact updated');
      qc.invalidateQueries({ queryKey: ['admin', 'guests'] });
    },
  });

  const updateInvMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: UpdateInvitationValues }) =>
      adminApi.updateInvitation(id, values),
    onError: () => toast.error('Failed to update RSVP'),
    onSuccess: () => {
      setEditingInvitation(null);
      toast.success('RSVP updated');
      qc.invalidateQueries({ queryKey: ['admin', 'guests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'events'] });
    },
  });

  const deleteGuestMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteGuest(id),
    onError: () => toast.error('Failed to delete guest'),
    onSuccess: () => {
      setDeletingGuest(null);
      toast.success('Guest removed');
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const deleteInvMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteInvitation(id),
    onError: () => toast.error('Failed to remove from event'),
    onSuccess: () => {
      setDeletingInvitation(null);
      toast.success('Removed from event');
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const createOpenInvMutation = useMutation({
    mutationFn: (values: CreateOpenInvitationValues) => adminApi.createOpenInvitation(values),
    onError: () => toast.error('Failed to create open invitation'),
    onSuccess: (data) => {
      setShowOpenLinkModal(false);
      setOpenLinkEventIds([]);
      setOpenLinkIsPublic(false);
      toast.success(`Created ${data.length} open invitation link${data.length !== 1 ? 's' : ''}`);
      qc.invalidateQueries({ queryKey: ['admin', 'invitations', 'open'] });
      // Copy first URL to clipboard automatically
      if (data[0]?.token) {
        const url = `${window.location.origin}/invite/${data[0].token}`;
        navigator.clipboard.writeText(url).catch(() => {});
      }
    },
  });

  const handleAddGuest = (values: AddGuestValues) => addMutation.mutate(values);
  const handleUpdateGuest = (id: number, values: UpdateGuestContactValues) =>
    updateGuestMutation.mutate({ id, values });
  const handleUpdateInvFromUnified = (id: number, values: UpdateInvitationValues) =>
    updateInvMutation.mutate({ id, values });
  const handleUpdateInv = (id: number, values: UpdateInvitationValues) =>
    updateInvMutation.mutate({ id, values });

  const handleExportCSV = () => {
    adminApi.exportCSV(selectedEventId ?? undefined);
    toast.success('Downloading CSV…');
  };

  const selectedEvent = selectedEventId !== null ? events.find((e) => e.id === selectedEventId) : null;

  return (
    <div className="admin-page min-h-screen" style={{ background: CREAM, color: ESPRESSO }}>

      {/* Header */}
      <header className="sticky top-0 z-30" style={{ background: PARCHMENT, borderBottom: `1px solid ${GOLD_DIM}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: `rgba(184,146,74,0.1)`, border: `1px solid ${GOLD_DIM}` }} aria-hidden="true">
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
            <button
              onClick={handleExportCSV}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus:ring-2"
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; e.currentTarget.style.borderColor = GOLD_DIM; }}
              aria-label="Export CSV"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => logoutMutation.mutate()}
              className="px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus:ring-2"
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; e.currentTarget.style.borderColor = GOLD_DIM; }}
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">

        {/* Event tabs */}
        <section aria-label="Event selector">
          <div className="flex flex-wrap gap-1.5">
            <button
              onClick={() => setSelectedEventId(null)}
              className="px-3.5 py-1.5 rounded-md text-xs font-sans font-medium transition-colors focus:outline-none focus:ring-2"
              style={
                selectedEventId === null
                  ? { background: GOLD, color: PARCHMENT }
                  : { background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }
              }
            >
              All Events
            </button>
            {events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className="px-3.5 py-1.5 rounded-md text-xs font-sans font-medium transition-colors focus:outline-none focus:ring-2"
                style={
                  selectedEventId === ev.id
                    ? { background: GOLD, color: PARCHMENT }
                    : { background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }
                }
              >
                {ev.slug.charAt(0).toUpperCase() + ev.slug.slice(1)}
                <span className="ml-1.5" style={{ opacity: selectedEventId === ev.id ? 0.7 : 0.6 }}>{ev.stats.total}</span>
              </button>
            ))}
          </div>

          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 flex flex-wrap gap-x-5 gap-y-1"
            >
              <span className="text-xs font-sans flex items-center gap-1.5" style={{ color: ESPRESSO_DIM }}>
                <svg className="w-3 h-3 flex-shrink-0" style={{ color: ESPRESSO_DIM }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {selectedEvent.date} at {selectedEvent.time}
              </span>
              <span className="text-xs font-sans flex items-center gap-1.5" style={{ color: ESPRESSO_DIM }}>
                <svg className="w-3 h-3 flex-shrink-0" style={{ color: ESPRESSO_DIM }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {selectedEvent.venueName}
              </span>
            </motion.div>
          )}
        </section>

        {/* Stats */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Event Statistics</h2>
          <StatsCards events={events} selectedEventId={selectedEventId} isLoading={eventsLoading} />
        </section>

        {/* Open Invitations */}
        {openInvitations.length > 0 && (
          <section aria-labelledby="open-inv-heading">
            <div className="flex items-center justify-between mb-2">
              <h2 id="open-inv-heading" className="font-sans font-semibold text-sm" style={{ color: ESPRESSO }}>
                Open Links
                <span className="ml-2 text-xs font-normal" style={{ color: ESPRESSO_DIM }}>{openInvitations.length} active</span>
              </h2>
            </div>
            <div className="space-y-2">
              {openInvitations.map((inv) => (
                <OpenInvitationRow
                  key={inv.id}
                  inv={inv as OpenInvitation & { url?: string }}
                  onDelete={(id) => deleteInvMutation.mutate(id)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Guest list */}
        <section aria-labelledby="guests-heading">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-4">
            <div className="flex-1">
              <h2 id="guests-heading" className="font-sans font-semibold text-sm" style={{ color: ESPRESSO }}>
                Guest List
                {!guestsLoading && (
                  <span className="ml-2 text-xs font-normal" style={{ color: ESPRESSO_DIM }}>
                    {guests.length} {guests.length === 1 ? 'guest' : 'guests'}
                  </span>
                )}
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: ESPRESSO_DIM }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email…"
                  aria-label="Search guests"
                  className="pl-8 pr-3 py-1.5 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 transition-colors w-48"
                  style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by attendance status"
                className="px-3 py-1.5 rounded-lg text-xs font-sans focus:outline-none focus:ring-2 transition-colors appearance-none"
                style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              >
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>

              {/* Generate open link */}
              <button
                onClick={() => setShowOpenLinkModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-sans font-medium text-xs rounded-lg transition-colors focus:outline-none focus:ring-2 whitespace-nowrap"
                style={{ background: 'rgba(184,146,74,0.12)', border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                aria-label="Generate open invitation link"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                Open Link
              </button>

              {/* Add guest */}
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 font-sans font-medium text-xs rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 whitespace-nowrap"
                style={{ background: GOLD, color: PARCHMENT }}
                aria-label="Add a new guest"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Guest
              </button>

              {/* Mobile CSV */}
              <button
                onClick={handleExportCSV}
                className="sm:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans rounded-lg transition-colors focus:outline-none focus:ring-2"
                style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                aria-label="Export CSV"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV
              </button>
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
          />
        </section>
      </main>

      {/* Generate Open Link Modal */}
      <AnimatePresence>
        {showOpenLinkModal && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowOpenLinkModal(false)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40"
              aria-hidden="true"
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog" aria-modal="true" aria-labelledby="open-link-title">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-xl p-6 w-full max-w-sm shadow-lg"
                style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
              >
                <h3 id="open-link-title" className="font-sans font-semibold text-sm mb-1" style={{ color: ESPRESSO }}>
                  Generate Open Invitation Link
                </h3>
                <p className="text-xs font-sans mb-4" style={{ color: ESPRESSO_DIM }}>
                  Creates a shareable link that any new guest can use to self-register. Select the event(s) to cover.
                </p>

                {/* Permanent / one-time toggle */}
                <div className="mb-4 p-3 rounded-lg border" style={{ borderColor: GOLD_DIM, background: CREAM }}>
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={openLinkIsPublic}
                      onClick={() => setOpenLinkIsPublic((v) => !v)}
                      className="mt-0.5 relative inline-flex h-5 w-9 flex-shrink-0 rounded-full border-2 border-transparent transition-colors focus:outline-none focus:ring-2"
                      style={{ background: openLinkIsPublic ? GOLD : 'rgba(184,146,74,0.3)' }}
                    >
                      <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${openLinkIsPublic ? 'translate-x-4' : 'translate-x-0'}`} />
                    </button>
                    <div>
                      <p className="text-xs font-medium font-sans" style={{ color: ESPRESSO }}>
                        Permanent link <span className="ml-1 text-xs font-normal" style={{ color: GOLD }}>{openLinkIsPublic ? '∞ reusable' : '1× one-time'}</span>
                      </p>
                      <p className="text-xs font-sans mt-0.5" style={{ color: ESPRESSO_DIM }}>
                        {openLinkIsPublic
                          ? 'Anyone can fill this link — no email required, phone for deduplication.'
                          : 'Single-use link locked after the first person claims it.'}
                      </p>
                    </div>
                  </label>
                </div>

                <fieldset className="mb-4">
                  <legend className="text-xs font-medium uppercase tracking-wider mb-2" style={{ color: ESPRESSO_DIM }}>Events</legend>
                  <div className="space-y-2">
                    {events.map((ev) => {
                      const checked = openLinkEventIds.includes(ev.id);
                      return (
                        <label
                          key={ev.id}
                          className="flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors"
                          style={{
                            background: checked ? 'rgba(184,146,74,0.12)' : PARCHMENT,
                            borderColor: checked ? GOLD : GOLD_DIM,
                          }}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={checked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setOpenLinkEventIds((ids) => [...ids, ev.id]);
                              } else {
                                setOpenLinkEventIds((ids) => ids.filter((id) => id !== ev.id));
                              }
                            }}
                          />
                          <div className="w-4 h-4 rounded border flex items-center justify-center flex-shrink-0" style={{ background: checked ? GOLD : PARCHMENT, borderColor: checked ? GOLD : GOLD_DIM }}>
                            {checked && (
                              <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            )}
                          </div>
                          <div>
                            <p className="font-medium text-sm font-sans" style={{ color: ESPRESSO }}>{ev.name}</p>
                            <p className="text-xs" style={{ color: ESPRESSO_DIM }}>{ev.date}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowOpenLinkModal(false); setOpenLinkEventIds([]); setOpenLinkIsPublic(false); }}
                    className="flex-1 font-sans font-medium text-xs py-2 rounded-lg"
                    style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => {
                      if (openLinkEventIds.length === 0) {
                        toast.error('Select at least one event');
                        return;
                      }
                      createOpenInvMutation.mutate({ eventIds: openLinkEventIds, isPublic: openLinkIsPublic });
                    }}
                    disabled={createOpenInvMutation.isPending || openLinkEventIds.length === 0}
                    className="flex-1 disabled:opacity-50 font-sans font-semibold text-xs py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 disabled:cursor-not-allowed"
                    style={{ background: GOLD, color: PARCHMENT }}
                  >
                    {createOpenInvMutation.isPending ? 'Creating…' : 'Generate Link'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Modals */}
      <AddGuestModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddGuest}
        isPending={addMutation.isPending}
        events={events}
      />

      {/* Unified edit modal: contact info + per-event RSVP tabs */}
      <EditGuestModal
        guest={editingGuest}
        events={events}
        onClose={() => setEditingGuest(null)}
        onUpdateContact={handleUpdateGuest}
        onUpdateInvitation={handleUpdateInvFromUnified}
        isContactPending={updateGuestMutation.isPending}
        isInvitationPending={updateInvMutation.isPending}
      />

      {/* Separate invitation modal accessible from per-event edit button in table */}
      <EditInvitationModal
        invitation={editingInvitation?.inv ?? null}
        guest={editingInvitation?.guest ?? null}
        onClose={() => setEditingInvitation(null)}
        onSubmit={handleUpdateInv}
        isPending={updateInvMutation.isPending}
      />

      {/* Delete Guest confirmation */}
      <AnimatePresence>
        {deletingGuest && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingGuest(null)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40" aria-hidden="true" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog" aria-modal="true" aria-labelledby="delete-guest-title">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-xl p-6 w-full max-w-sm shadow-lg"
                style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </div>
                  <div>
                    <h3 id="delete-guest-title" className="font-sans font-semibold text-sm mb-1" style={{ color: ESPRESSO }}>Remove guest?</h3>
                    <p className="text-xs font-sans leading-relaxed" style={{ color: ESPRESSO_DIM }}>
                      <span className="font-medium" style={{ color: ESPRESSO }}>{deletingGuest.name}</span> and all their invitations will be permanently deleted.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={() => setDeletingGuest(null)}
                    className="flex-1 font-sans font-medium text-xs py-2 rounded-lg transition-colors focus:outline-none focus:ring-2"
                    style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}>
                    Cancel
                  </button>
                  <button onClick={() => deleteGuestMutation.mutate(deletingGuest.id)}
                    disabled={deleteGuestMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-sans font-semibold text-xs py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed">
                    {deleteGuestMutation.isPending ? 'Removing…' : 'Remove'}
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Invitation confirmation */}
      <AnimatePresence>
        {deletingInvitation && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setDeletingInvitation(null)}
              className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm z-40" aria-hidden="true" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog" aria-modal="true" aria-labelledby="delete-inv-title">
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.97 }}
                className="rounded-xl p-6 w-full max-w-sm shadow-lg"
                style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}>
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 id="delete-inv-title" className="font-sans font-semibold text-sm mb-1" style={{ color: ESPRESSO }}>Remove from event?</h3>
                    <p className="text-xs font-sans leading-relaxed" style={{ color: ESPRESSO_DIM }}>
                      Invitation for <span className="font-medium" style={{ color: ESPRESSO }}>{deletingInvitation.eventName ?? deletingInvitation.eventSlug}</span> will be removed. The guest record is kept.
                    </p>
                  </div>
                </div>
                <div className="flex gap-2 mt-5">
                  <button onClick={() => setDeletingInvitation(null)}
                    className="flex-1 font-sans font-medium text-xs py-2 rounded-lg transition-colors focus:outline-none focus:ring-2"
                    style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}>
                    Cancel
                  </button>
                  <button onClick={() => deleteInvMutation.mutate(deletingInvitation.id)}
                    disabled={deleteInvMutation.isPending}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-sans font-semibold text-xs py-2 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 disabled:cursor-not-allowed">
                    {deleteInvMutation.isPending ? 'Removing…' : 'Remove'}
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
