import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import type { Guest, AddGuestValues } from '@invitation/shared';
import { adminApi } from '../../lib/api';
import StatsCards from '../../components/admin/StatsCards';
import GuestTable from '../../components/admin/GuestTable';
import AddGuestModal from '../../components/admin/AddGuestModal';
import EditGuestModal from '../../components/admin/EditGuestModal';

const STATUS_FILTER_OPTIONS = [
  { value: '', label: 'All Guests' },
  { value: 'attending', label: 'Attending' },
  { value: 'declined', label: 'Declined' },
  { value: 'maybe', label: 'Maybe' },
  { value: 'pending', label: 'No Response' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingGuest, setEditingGuest] = useState<Guest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<Guest | null>(null);

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
    refetchInterval: 30_000,
  });

  const { data: guests = [], isLoading: guestsLoading } = useQuery({
    queryKey: ['admin', 'guests', { status: statusFilter, search }],
    queryFn: () => adminApi.getGuests({ status: statusFilter || undefined, search: search || undefined }),
  });

  const logoutMutation = useMutation({
    mutationFn: adminApi.logout,
    onSuccess: () => {
      qc.clear();
      navigate('/admin/login', { replace: true });
    },
  });

  const addMutation = useMutation({
    mutationFn: adminApi.addGuest,
    onMutate: async (values) => {
      await qc.cancelQueries({ queryKey: ['admin', 'guests'] });
      const prev = qc.getQueryData<Guest[]>(['admin', 'guests', { status: statusFilter, search }]);
      const optimistic: Guest = {
        id: Date.now(),
        ...values,
        dietary: values.dietary ?? null,
        message: values.message ?? null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      qc.setQueryData<Guest[]>(
        ['admin', 'guests', { status: statusFilter, search }],
        (old) => [...(old ?? []), optimistic]
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['admin', 'guests', { status: statusFilter, search }], ctx?.prev);
      toast.error('Failed to add guest');
    },
    onSuccess: () => {
      setShowAddModal(false);
      toast.success('Guest added successfully');
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: number; values: AddGuestValues }) =>
      adminApi.updateGuest(id, values),
    onMutate: async ({ id, values }) => {
      await qc.cancelQueries({ queryKey: ['admin', 'guests'] });
      const prev = qc.getQueryData<Guest[]>(['admin', 'guests', { status: statusFilter, search }]);
      qc.setQueryData<Guest[]>(
        ['admin', 'guests', { status: statusFilter, search }],
        (old) =>
          old?.map((g) =>
            g.id === id
              ? { ...g, ...values, dietary: values.dietary ?? null, message: values.message ?? null, updatedAt: new Date().toISOString() }
              : g
          ) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['admin', 'guests', { status: statusFilter, search }], ctx?.prev);
      toast.error('Failed to update guest');
    },
    onSuccess: () => {
      setEditingGuest(null);
      toast.success('Guest updated');
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => adminApi.deleteGuest(id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: ['admin', 'guests'] });
      const prev = qc.getQueryData<Guest[]>(['admin', 'guests', { status: statusFilter, search }]);
      qc.setQueryData<Guest[]>(
        ['admin', 'guests', { status: statusFilter, search }],
        (old) => old?.filter((g) => g.id !== id) ?? []
      );
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      qc.setQueryData(['admin', 'guests', { status: statusFilter, search }], ctx?.prev);
      toast.error('Failed to delete guest');
    },
    onSuccess: () => {
      setDeletingGuest(null);
      toast.success('Guest removed');
      qc.invalidateQueries({ queryKey: ['admin'] });
    },
  });

  const handleExportCSV = () => {
    adminApi.exportCSV();
    toast.success('Downloading guest list CSV…');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <header className="bg-gray-900 border-b border-white/10 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gold-500/10 border border-gold-400/40 rounded-lg flex items-center justify-center" aria-hidden="true">
              <svg className="w-4 h-4 text-gold-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
              </svg>
            </div>
            <div>
              <h1 className="font-serif text-lg text-white leading-none">Event Admin</h1>
              <p className="text-gray-500 text-xs font-sans mt-0.5 hidden sm:block">Guest Management Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-sans transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
              aria-label="Export guest list as CSV"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={() => logoutMutation.mutate()}
              className="px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white text-sm font-sans transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        <section aria-labelledby="stats-heading">
          <h2 id="stats-heading" className="sr-only">Event Statistics</h2>
          <StatsCards stats={stats} isLoading={statsLoading} />
        </section>

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
              <div className="relative">
                <svg
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name or email…"
                  aria-label="Search guests by name or email"
                  className="pl-9 pr-4 py-2 bg-gray-900 border border-white/10 focus:border-gold-400 rounded-lg text-white text-sm font-sans placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors w-56"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                aria-label="Filter by attendance status"
                className="px-3 py-2 bg-gray-900 border border-white/10 focus:border-gold-400 rounded-lg text-white text-sm font-sans focus:outline-none focus:ring-1 focus:ring-gold-400 transition-colors appearance-none cursor-pointer"
              >
                {STATUS_FILTER_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value} className="bg-gray-900">
                    {o.label}
                  </option>
                ))}
              </select>

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

              <button
                onClick={handleExportCSV}
                className="sm:hidden inline-flex items-center gap-1.5 px-3 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-sans rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
                aria-label="Export guest list as CSV"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                </svg>
                CSV
              </button>
            </div>
          </div>

          <GuestTable
            guests={guests}
            isLoading={guestsLoading}
            onEdit={setEditingGuest}
            onDelete={setDeletingGuest}
          />
        </section>
      </main>

      <AddGuestModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={(values) => addMutation.mutate(values)}
        isPending={addMutation.isPending}
      />

      <EditGuestModal
        guest={editingGuest}
        onClose={() => setEditingGuest(null)}
        onSubmit={(id, values) => updateMutation.mutate({ id, values })}
        isPending={updateMutation.isPending}
      />

      <AnimatePresence>
        {deletingGuest && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingGuest(null)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40"
              aria-hidden="true"
            />
            <div
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              role="dialog"
              aria-modal="true"
              aria-labelledby="delete-confirm-title"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-gray-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl"
              >
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 id="delete-confirm-title" className="font-serif text-lg text-white mb-1">
                      Remove Guest?
                    </h3>
                    <p className="text-gray-400 text-sm font-sans">
                      This will permanently remove{' '}
                      <span className="text-white font-medium">{deletingGuest.name}</span> from the
                      guest list. This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setDeletingGuest(null)}
                    className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-sans font-medium text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => deleteMutation.mutate(deletingGuest.id)}
                    disabled={deleteMutation.isPending}
                    className="flex-1 bg-red-500 hover:bg-red-400 disabled:opacity-50 text-white font-sans font-semibold text-sm py-2.5 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-400 disabled:cursor-not-allowed"
                  >
                    {deleteMutation.isPending ? 'Removing…' : 'Remove'}
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
