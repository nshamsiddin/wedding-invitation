import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { AdminGuest, AdminInvitation } from '../../lib/api';
import type { AddGuestValues, UpdateGuestContactValues, UpdateInvitationValues } from '@invitation/shared';
import { adminApi } from '../../lib/api';
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

  const logoutMutation = useMutation({
    mutationFn: adminApi.logout,
    onSuccess: () => { qc.clear(); navigate('/admin/login', { replace: true }); },
  });

  const addMutation = useMutation({
    mutationFn: adminApi.addGuest,
    onError: () => toast.error('Failed to add guest'),
    onSuccess: () => {
      setShowAddModal(false);
      toast.success('Guest added successfully');
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const updateGuestMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: UpdateGuestContactValues }) =>
      adminApi.updateGuest(id, values),
    onError: () => toast.error('Failed to update guest'),
    onSuccess: () => {
      setEditingGuest(null);
      toast.success('Contact info updated');
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

  const handleAddGuest = (values: AddGuestValues) => addMutation.mutate(values);
  const handleUpdateGuest = (id: number, values: UpdateGuestContactValues) =>
    updateGuestMutation.mutate({ id, values });
  const handleUpdateInv = (id: number, values: UpdateInvitationValues) =>
    updateInvMutation.mutate({ id, values });

  const handleExportCSV = () => {
    adminApi.exportCSV(selectedEventId ?? undefined);
    toast.success('Downloading CSV…');
  };

  const selectedEvent = selectedEventId !== null ? events.find((e) => e.id === selectedEventId) : null;

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Header */}
      <header className="bg-gray-900 border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold-500/10 border border-gold-400/40 rounded-lg flex items-center justify-center" aria-hidden="true">
              <svg className="w-4 h-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-lg text-white leading-none">Wedding Admin</h1>
              <p className="text-gray-500 text-xs font-sans mt-0.5 hidden sm:block">Guest Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleExportCSV}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-sans transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
              aria-label="Export CSV">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <button onClick={() => logoutMutation.mutate()}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm font-sans transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
              aria-label="Sign out">
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Event tabs */}
        <section aria-label="Event selector">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedEventId(null)}
              className={`px-4 py-2 rounded-lg text-sm font-sans font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 ${
                selectedEventId === null
                  ? 'bg-gold-500 text-gray-950'
                  : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
              }`}
            >
              All Events
            </button>
            {events.map((ev) => (
              <button
                key={ev.id}
                onClick={() => setSelectedEventId(ev.id)}
                className={`px-4 py-2 rounded-lg text-sm font-sans font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 ${
                  selectedEventId === ev.id
                    ? 'bg-gold-500 text-gray-950'
                    : 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-white'
                }`}
              >
                {ev.slug.charAt(0).toUpperCase() + ev.slug.slice(1)}
                <span className="ml-2 text-xs opacity-70">
                  {ev.stats.total}
                </span>
              </button>
            ))}
          </div>

          {selectedEvent && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex flex-wrap gap-x-6 gap-y-1"
            >
              <p className="text-gray-500 text-xs font-sans">
                <span className="text-gray-400">{selectedEvent.name}</span>
              </p>
              <p className="text-gray-500 text-xs font-sans">
                📅 {selectedEvent.date} at {selectedEvent.time}
              </p>
              <p className="text-gray-500 text-xs font-sans">
                📍 {selectedEvent.venueName}
              </p>
            </motion.div>
          )}
        </section>

        {/* Stats */}
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Event Statistics</h2>
          <StatsCards events={events} selectedEventId={selectedEventId} isLoading={eventsLoading} />
        </section>

        {/* Guest list */}
        <section aria-labelledby="guests-heading">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-4">
            <h2 id="guests-heading" className="font-serif text-xl text-white flex-1">
              Guest List
              {!guestsLoading && (
                <span className="ml-2 text-sm font-sans font-normal text-gray-500">
                  ({guests.length} {guests.length === 1 ? 'guest' : 'guests'})
                </span>
              )}
            </h2>
            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email…"
                  aria-label="Search guests"
                  className="pl-9 pr-4 py-2 bg-gray-900 border border-white/10 focus:border-gold-400 rounded-lg text-white text-sm font-sans placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors w-52"
                />
              </div>

              {/* Status filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by attendance status"
                className="px-3 py-2 bg-gray-900 border border-white/10 focus:border-gold-400 rounded-lg text-white text-sm font-sans focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors appearance-none cursor-pointer"
              >
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-gray-900">{o.label}</option>
                ))}
              </select>

              {/* Add guest */}
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-gold-500 hover:bg-gold-400 text-gray-950 font-sans font-semibold text-sm rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400 whitespace-nowrap"
                aria-label="Add a new guest"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Guest
              </button>

              {/* Mobile CSV */}
              <button onClick={handleExportCSV}
                className="sm:hidden inline-flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-sans rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
                aria-label="Export CSV">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
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

      {/* Add Guest Modal */}
      <AddGuestModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAddGuest}
        isPending={addMutation.isPending}
        events={events}
      />

      {/* Edit Guest (contact info) Modal */}
      <EditGuestModal
        guest={editingGuest}
        onClose={() => setEditingGuest(null)}
        onSubmit={handleUpdateGuest}
        isPending={updateGuestMutation.isPending}
      />

      {/* Edit Invitation (RSVP) Modal */}
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
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" aria-hidden="true" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog" aria-modal="true" aria-labelledby="delete-guest-title">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 id="delete-guest-title" className="font-serif text-lg text-white mb-1">Remove Guest?</h3>
                    <p className="text-gray-400 text-sm font-sans">
                      This will permanently remove{' '}
                      <span className="text-white font-medium">{deletingGuest.name}</span> and all their invitations. Cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setDeletingGuest(null)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-sans font-medium text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500">
                    Cancel
                  </button>
                  <button onClick={() => deleteGuestMutation.mutate(deletingGuest.id)}
                    disabled={deleteGuestMutation.isPending}
                    className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-sans font-semibold text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-not-allowed">
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
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40" aria-hidden="true" />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog" aria-modal="true" aria-labelledby="delete-inv-title">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 id="delete-inv-title" className="font-serif text-lg text-white mb-1">Remove from Event?</h3>
                    <p className="text-gray-400 text-sm font-sans">
                      This removes the invitation for{' '}
                      <span className="text-white font-medium">{deletingInvitation.eventName ?? deletingInvitation.eventSlug}</span>.
                      The guest record is kept.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setDeletingInvitation(null)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-sans font-medium text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500">
                    Cancel
                  </button>
                  <button onClick={() => deleteInvMutation.mutate(deletingInvitation.id)}
                    disabled={deleteInvMutation.isPending}
                    className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-sans font-semibold text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-not-allowed">
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
