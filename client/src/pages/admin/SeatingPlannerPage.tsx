import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { adminApi, eventTablesApi } from '../../lib/api';
import type { AdminGuest, EventTableWithOccupancy } from '../../lib/api';
import { CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM, PARCHMENT } from '../../garden/tokens';
import { useAdminTranslation } from '../../lib/i18n/admin';
import { getEventDisplayName } from '../../components/admin/adminTokens';
import UnassignedColumn from '../../components/admin/seating/UnassignedColumn';
import TableCard from '../../components/admin/seating/TableCard';
import AddTableButton from '../../components/admin/seating/AddTableButton';
import GuestChip from '../../components/admin/seating/GuestChip';
import { useSeatingDnd } from '../../components/admin/seating/useSeatingDnd';
import type { TableCardViewMode } from '../../components/admin/seating/TableCard';

// ─── View-mode persistence ──────────────────────────────────────────────────
// Stored in localStorage so the admin's preference survives reload. We use a
// versioned key (`_v1`) so future schema changes can invalidate cleanly.
const VIEW_MODE_STORAGE_KEY = 'seatingViewMode_v1';
function readStoredViewMode(): TableCardViewMode {
  if (typeof window === 'undefined') return 'grid';
  try {
    const raw = window.localStorage.getItem(VIEW_MODE_STORAGE_KEY);
    return raw === 'list' ? 'list' : 'grid';
  } catch {
    // localStorage can throw in private-browsing or sandboxed iframes —
    // silently fall back to the default rather than crashing the page.
    return 'grid';
  }
}

export default function SeatingPlannerPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const at = useAdminTranslation();
  const [searchParams, setSearchParams] = useSearchParams();

  // Event selection is stored in the URL so an admin can deep-link to the
  // seating plan for a specific event (e.g. from Slack) and refresh keeps
  // their context.
  const eventIdParam = searchParams.get('eventId');
  const selectedEventId = eventIdParam ? parseInt(eventIdParam, 10) : null;

  const setSelectedEventId = (id: number | null) => {
    const next = new URLSearchParams(searchParams);
    if (id == null) next.delete('eventId');
    else next.set('eventId', String(id));
    setSearchParams(next, { replace: true });
  };

  // ── Editing/deleting a table ─────────────────────────────────────────────
  const [editingTable, setEditingTable] = useState<EventTableWithOccupancy | null>(null);
  const [deletingTable, setDeletingTable] = useState<EventTableWithOccupancy | null>(null);

  // ── Filter state for the table grid ──────────────────────────────────────
  // A single search input filters the visible TableCards. We search both
  // ways admins reach for a table:
  //   - by table number / label (e.g. "12", "Family")
  //   - by the name of any seated guest at that table (e.g. "John")
  // Matching tables on either field is enough to locate a row in seconds
  // even with 50+ tables on screen.
  const [tableFilter, setTableFilter] = useState('');
  // Wraps the tables grid so we can scope `querySelector` lookups to it (a
  // global query would also match the unassigned column's chips, which can
  // contain the same names). Used by the "scroll first match into view"
  // effect below.
  const tablesGridRef = useRef<HTMLDivElement>(null);

  // ── Queries ──────────────────────────────────────────────────────────────
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: adminApi.getEvents,
  });

  // Auto-select the first event when none is selected and events are loaded.
  // Keeps the page useful on direct navigation without forcing a click.
  useEffect(() => {
    if (selectedEventId == null && events.length > 0 && !eventsLoading) {
      setSelectedEventId(events[0]!.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length, eventsLoading]);

  const { data: guestsData, isLoading: guestsLoading } = useQuery({
    queryKey: ['admin', 'guests', { eventId: selectedEventId ?? undefined }],
    queryFn: () => adminApi.getGuests({ eventId: selectedEventId ?? undefined }),
    enabled: selectedEventId != null,
    placeholderData: (prev) => prev,
  });
  const guests: AdminGuest[] = guestsData?.guests ?? [];

  const { data: tables = [], isLoading: tablesLoading } = useQuery({
    queryKey: ['admin', 'eventTables', selectedEventId],
    queryFn: () => eventTablesApi.list(selectedEventId!),
    enabled: selectedEventId != null,
  });

  // ── Mutations ────────────────────────────────────────────────────────────
  // Batch-create one or more tables. We post them sequentially because the
  // backend enforces a unique (eventId, tableNumber) constraint and parallel
  // requests with consecutive numbers race against the cache invalidation
  // path. Sequential keeps error reporting simple too — we know exactly
  // which row failed.
  const createTableMutation = useMutation({
    mutationFn: async (
      values: Array<{ tableNumber: number; label: string | null; capacity: number }>,
    ) => {
      if (selectedEventId == null) {
        throw new Error('No event selected');
      }
      let created = 0;
      for (const v of values) {
        await eventTablesApi.create({
          eventId: selectedEventId,
          tableNumber: v.tableNumber,
          label: v.label,
          capacity: v.capacity,
        });
        created += 1;
      }
      return created;
    },
    onError: () => toast.error('Failed to create table'),
    onSuccess: (created) => {
      toast.success(at.seatingTablesCreated(created));
      qc.invalidateQueries({ queryKey: ['admin', 'eventTables', selectedEventId] });
      qc.invalidateQueries({ queryKey: ['admin', 'tables'] });
    },
  });

  const updateTableMutation = useMutation({
    mutationFn: ({
      tableNumber,
      values,
    }: {
      tableNumber: number;
      values: { label?: string | null; capacity?: number };
    }) => eventTablesApi.update(selectedEventId!, tableNumber, values),
    onError: () => toast.error('Failed to update table'),
    onSuccess: () => {
      toast.success('Table updated');
      setEditingTable(null);
      qc.invalidateQueries({ queryKey: ['admin', 'eventTables', selectedEventId] });
    },
  });

  const deleteTableMutation = useMutation({
    mutationFn: (tableNumber: number) => eventTablesApi.remove(selectedEventId!, tableNumber),
    onError: () => toast.error('Failed to delete table'),
    onSuccess: () => {
      toast.success('Table deleted');
      setDeletingTable(null);
      qc.invalidateQueries({ queryKey: ['admin', 'eventTables', selectedEventId] });
      qc.invalidateQueries({ queryKey: ['admin', 'guests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'tables'] });
    },
  });

  // ── DnD ──────────────────────────────────────────────────────────────────
  // Sensors:
  //   - Pointer with a 5px activation distance prevents accidental drags on
  //     simple clicks (e.g. clicking the kebab menu on a TableCard).
  //   - Touch with a 200ms delay distinguishes "drag" from "tap to scroll".
  //   - Keyboard sensor: chips become focusable, arrow keys nudge, Enter
  //     starts a drag, arrow keys move it, Enter drops, Esc cancels.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
    useSensor(KeyboardSensor),
  );

  const {
    active,
    onDragStart,
    onDragEnd,
    onDragCancel,
    clearAssignment,
    assignToTable,
    bulkUnassignFromTable,
  } = useSeatingDnd({
    eventId: selectedEventId ?? 0,
  });

  // ── View mode (Grid / List) ──────────────────────────────────────────────
  // Persisted in localStorage; default is the existing 'grid' layout so the
  // page looks identical to admins who haven't interacted with the toggle.
  const [viewMode, setViewMode] = useState<TableCardViewMode>(readStoredViewMode);
  useEffect(() => {
    try {
      window.localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    } catch {
      // Best-effort persistence; ignore quota/private-mode errors.
    }
  }, [viewMode]);

  // Whenever the filter narrows the result list, gently scroll the first
  // match into view *and* briefly pulse-highlight it so the admin's eye
  // catches the answer instead of having to scan the page.
  //
  // P0#5 fix: previously the scroll fired on every keystroke and always
  // called `scrollIntoView`, which caused the page to jitter every time the
  // admin typed. We now:
  //   1. debounce 250 ms so a fast typer gets one scroll at the end, not
  //      one per keystroke; and
  //   2. only call `scrollIntoView` when the matched card's bounding box is
  //      actually outside the visible area — otherwise we just pulse-flash
  //      it in place. `getBoundingClientRect` is cheap and lets us avoid
  //      the visual no-op scroll-to-same-position that browsers still log
  //      as a layout event.
  useEffect(() => {
    const q = tableFilter.trim();
    if (!q) return;
    if (!tablesGridRef.current) return;

    const debounce = window.setTimeout(() => {
      const node = tablesGridRef.current?.querySelector<HTMLElement>('[data-table-number]');
      if (!node) return;

      const rect = node.getBoundingClientRect();
      const viewportHeight = window.innerHeight || document.documentElement.clientHeight;
      // Treat the card as off-screen if any meaningful portion is outside
      // the viewport. The small 8-px buffer keeps near-edge cards still.
      const isOffscreen = rect.bottom < 8 || rect.top > viewportHeight - 8;
      if (isOffscreen) {
        node.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
      // Always pulse-highlight, regardless of whether we scrolled — the
      // pulse is the primary "here it is" cue.
      node.classList.add('seat-filter-pulse');
      window.setTimeout(() => node.classList.remove('seat-filter-pulse'), 900);
    }, 250);

    return () => {
      window.clearTimeout(debounce);
    };
  }, [tableFilter, tables, guests]);

  // Apply the search filter. We do this in JS rather than re-querying the
  // server because the table list is small (tens, never thousands) and the
  // search includes per-table seated guest names which we already have in
  // the in-memory guests cache. A trimmed empty query short-circuits to the
  // full list — no allocation, no token noise on the next render.
  const filteredTables = useMemo(() => {
    const q = tableFilter.trim().toLowerCase();
    if (!q) return tables;
    return tables.filter((t) => {
      // 1. Table number — admins type "12" to find table 12.
      if (String(t.tableNumber).includes(q)) return true;
      // 2. Custom label — case-insensitive substring (e.g. "fam" matches "Family").
      if (t.label && t.label.toLowerCase().includes(q)) return true;
      // 3. Seated guest names — surface the table when *anyone* at it matches,
      //    so an admin can answer "where is X seated?" without scanning all cards.
      for (const g of guests) {
        const inv = g.invitations.find(
          (i) => i.eventId === selectedEventId && i.tableNumber === t.tableNumber,
        );
        if (inv && g.name.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }, [tables, guests, tableFilter, selectedEventId]);

  // Pre-compute the "next free table number" for the AddTableButton's input.
  // Considers both event_tables rows and any legacy numbers still on
  // invitations to keep numbering continuous.
  const suggestedNumber = useMemo(() => {
    const used = new Set<number>();
    for (const t of tables) used.add(t.tableNumber);
    for (const g of guests) {
      for (const inv of g.invitations) {
        if (inv.eventId === selectedEventId && inv.tableNumber != null) {
          used.add(inv.tableNumber);
        }
      }
    }
    let n = 1;
    while (used.has(n) && n <= 500) n += 1;
    return n;
  }, [tables, guests, selectedEventId]);

  // Totals strip — counts headcount of *attending* guests so admins can size
  // tables against actual expected occupancy.
  const totals = useMemo(() => {
    let attendingPeople = 0;
    let seatedPeople = 0;
    for (const g of guests) {
      const inv = g.invitations.find((i) => i.eventId === selectedEventId);
      if (!inv || inv.status !== 'attending') continue;
      attendingPeople += inv.guestCount;
      if (inv.tableNumber != null) seatedPeople += inv.guestCount;
    }
    const capacity = tables.reduce((sum, t) => sum + t.capacity, 0);
    return { attendingPeople, seatedPeople, capacity };
  }, [guests, tables, selectedEventId]);

  // Pull the currently dragged invitation back out of the cache so the
  // DragOverlay renders an accurate floating chip (label, status dot, etc.).
  const activeChip = useMemo(() => {
    if (!active) return null;
    for (const g of guests) {
      const inv = g.invitations.find((i) => i.id === active.invitationId);
      if (inv) return { guest: g, invitation: inv };
    }
    return null;
  }, [active, guests]);

  const isLoading = eventsLoading || guestsLoading || tablesLoading;

  return (
    <div className="admin-page min-h-screen" style={{ background: CREAM, color: ESPRESSO }}>
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <header
        className="sticky top-0 z-30"
        style={{ background: PARCHMENT, borderBottom: `1px solid ${GOLD_DIM}` }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/admin')}
              aria-label={at.backToDashboard}
              title={at.backToDashboard}
              className="p-1.5 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ color: ESPRESSO_DIM, background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <div className="min-w-0">
              <p className="font-sans font-semibold text-sm leading-none truncate" style={{ color: ESPRESSO }}>
                {at.seatingPlannerTitle}
              </p>
              <p className="text-xs font-sans mt-0.5 hidden sm:block" style={{ color: ESPRESSO_DIM }}>
                {at.seatingPlannerDesc}
              </p>
            </div>
          </div>

          {/* Export MİSAFİR LİSTESİ workbook — only enabled when an event is
              selected, since table numbers are per-event. The button is the
              one and only seating-planner-specific export, so we surface it
              prominently in the header next to the back-to-dashboard arrow. */}
          <button
            type="button"
            onClick={() => {
              if (selectedEventId == null) return;
              adminApi.exportMisafirListesiXLSX(selectedEventId);
              toast.success(at.seatingExportXlsx);
            }}
            disabled={selectedEventId == null}
            aria-label={at.seatingExportXlsxHint}
            title={selectedEventId == null ? at.seatingPickEvent : at.seatingExportXlsxHint}
            className="inline-flex items-center gap-1.5 px-2 sm:px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: GOLD, color: ESPRESSO }}
            onMouseEnter={(e) => {
              if (selectedEventId != null) e.currentTarget.style.background = '#A07840';
            }}
            onMouseLeave={(e) => { e.currentTarget.style.background = GOLD; }}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span className="hidden sm:inline">{at.seatingExportXlsx}</span>
            <span className="sm:hidden">.xlsx</span>
          </button>
        </div>
      </header>

      {/* ── Mobile banner ───────────────────────────────────────────────── */}
      {/* Drag-drop seating planning on phone-sized screens is too cramped
          to be useful — we steer mobile users back to the dashboard's
          inline TablePicker, which is purpose-built for that form factor. */}
      <div className="md:hidden p-4">
        <div
          className="rounded-xl p-4"
          style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
        >
          <div className="flex items-start gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: 'rgba(184,146,74,0.12)', border: `1px solid ${GOLD_DIM}` }}
              aria-hidden="true"
            >
              <svg className="w-4 h-4" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-sans font-semibold mb-1" style={{ color: ESPRESSO }}>
                {at.seatingPlannerTitle}
              </p>
              <p className="text-xs font-sans leading-relaxed" style={{ color: ESPRESSO_DIM }}>
                {at.seatingMobileBanner}
              </p>
              <button
                onClick={() => navigate('/admin')}
                className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                style={{ background: GOLD, color: '#FFFFFF' }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                {at.seatingMobileBackToList}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Desktop body ────────────────────────────────────────────────── */}
      <main className="hidden md:block max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-6 space-y-4">
        {/* Event selector */}
        <section aria-label="Event selector" className="flex flex-wrap items-center gap-2">
          <div
            className="flex items-stretch rounded-lg overflow-hidden"
            style={{ border: `1px solid ${GOLD_DIM}` }}
            role="group"
            aria-label="Filter by event"
          >
            {events.map((ev, idx) => {
              const isActive = selectedEventId === ev.id;
              return (
                <div key={ev.id} className="flex items-stretch">
                  {idx > 0 && (
                    <div className="w-px self-stretch" style={{ background: GOLD_DIM }} aria-hidden="true" />
                  )}
                  <button
                    onClick={() => setSelectedEventId(ev.id)}
                    className="px-4 py-2 text-sm font-sans font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(184,146,74,0.8)]"
                    style={
                      isActive
                        ? { background: GOLD, color: ESPRESSO }
                        : { background: PARCHMENT, color: ESPRESSO }
                    }
                    aria-pressed={isActive}
                  >
                    {getEventDisplayName(ev)}
                  </button>
                </div>
              );
            })}
          </div>

          {selectedEventId != null && tables.length > 0 && (
            <div
              className="ml-auto flex items-center gap-2 text-xs font-sans tabular-nums"
              style={{ color: ESPRESSO_DIM }}
            >
              <span className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(184,146,74,0.12)', border: `1px solid ${GOLD_DIM}` }}>
                {at.seatingTotals(totals.seatedPeople, totals.attendingPeople)}
              </span>
              <span className="px-2.5 py-1 rounded-full" style={{ background: 'rgba(184,146,74,0.12)', border: `1px solid ${GOLD_DIM}` }}>
                {at.seatingCapacityLabel(totals.attendingPeople, totals.capacity)}
              </span>
            </div>
          )}
        </section>

        {/* Empty state when no event is selected (should be rare since we
            auto-select; covers the no-events-at-all case). */}
        {selectedEventId == null && (
          <div
            className="rounded-xl p-12 text-center"
            style={{ background: PARCHMENT, border: `1px dashed ${GOLD_DIM}` }}
          >
            <p className="font-sans text-sm font-semibold mb-1" style={{ color: ESPRESSO }}>
              {at.seatingPickEvent}
            </p>
            <p className="text-xs font-sans" style={{ color: ESPRESSO_DIM }}>
              {at.seatingPickEventHint}
            </p>
          </div>
        )}

        {/* Loading skeleton */}
        {selectedEventId != null && isLoading && (
          <div
            className="rounded-xl p-12 text-center"
            style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
          >
            <div
              className="w-8 h-8 mx-auto border-2 rounded-full animate-spin"
              style={{ borderColor: `${GOLD} transparent ${GOLD} ${GOLD}` }}
              role="status"
              aria-label="Loading seating plan"
            />
          </div>
        )}

        {/* Main layout */}
        {selectedEventId != null && !isLoading && (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragEnd={(e) => onDragEnd(e, tables)}
            onDragCancel={onDragCancel}
            // accessibility prop provides default screen-reader announcements
            // for "draggable item picked up", "moved over X", "dropped", etc.
            // These are good enough out of the box; we don't need to override.
          >
            <div className="grid grid-cols-[260px_1fr] gap-4">
              <UnassignedColumn
                guests={guests}
                eventId={selectedEventId}
                tables={tables}
                onAssignToTable={assignToTable}
              />

              <section aria-label="Tables" className="min-w-0">
                {tables.length === 0 ? (
                  <div
                    className="rounded-xl p-12 text-center"
                    style={{ background: PARCHMENT, border: `1px dashed ${GOLD_DIM}` }}
                  >
                    <p className="font-sans text-sm font-semibold mb-1" style={{ color: ESPRESSO }}>
                      {at.seatingNoTablesYet}
                    </p>
                    <p className="text-xs font-sans mb-4" style={{ color: ESPRESSO_DIM }}>
                      {at.seatingNoTablesHint}
                    </p>
                    <div className="max-w-xs mx-auto">
                      <AddTableButton
                        suggestedNumber={suggestedNumber}
                        isPending={createTableMutation.isPending}
                        onCreate={(values) => createTableMutation.mutate(values)}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Filter bar — searches both table number/label and the
                        names of seated guests so admins can locate a row in
                        seconds even with 50+ tables on screen.
                        Now sticky under the page header so it stays in reach
                        while the admin scrolls through long planners. The
                        `top` offset roughly matches the header height; the
                        background is solid so cards scrolling underneath
                        don't bleed through. */}
                    <div
                      className="mb-3 -mx-3 sm:-mx-6 px-3 sm:px-6 py-2 sticky z-20 flex items-center gap-2 flex-wrap"
                      style={{
                        // Stick directly under the sticky page header.
                        // The header is ~48–56px tall (py-2.5 sm:py-3 + two
                        // short lines of text). 56px gives the filter bar
                        // a hairline gap of CREAM (matches page bg, so it
                        // reads as one continuous toolbar) and prevents the
                        // header (z-30) from rendering on top of it.
                        top: 56,
                        background: CREAM,
                        borderBottom: `1px solid ${GOLD_DIM}`,
                      }}
                    >
                      <div className="relative flex-1 max-w-sm min-w-[12rem]">
                        <svg
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none"
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
                          value={tableFilter}
                          onChange={(e) => setTableFilter(e.target.value)}
                          placeholder={at.seatingFilterTablesPlaceholder}
                          aria-label={at.seatingFilterTablesPlaceholder}
                          className="w-full pl-7 pr-7 py-1.5 rounded-lg text-xs font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                          style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                        />
                        {tableFilter && (
                          <button
                            type="button"
                            onClick={() => setTableFilter('')}
                            aria-label={at.seatingFilterClear}
                            title={at.seatingFilterClear}
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                            style={{ color: ESPRESSO_DIM, background: 'transparent' }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                          >
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>
                          </button>
                        )}
                      </div>
                      {tableFilter && (
                        <span
                          className="text-[11px] font-sans tabular-nums"
                          style={{ color: ESPRESSO_DIM }}
                          aria-live="polite"
                        >
                          {at.seatingFilterMatches(filteredTables.length, tables.length)}
                        </span>
                      )}
                      {/* View toggle — Grid (existing dense layout) /
                          List (one chip per row, full names always visible).
                          Persisted to localStorage so the admin's choice
                          survives reload. Pushed to the right via ml-auto
                          so it never competes with the search input. */}
                      <div
                        className="ml-auto inline-flex items-stretch rounded-md overflow-hidden"
                        style={{ border: `1px solid ${GOLD_DIM}` }}
                        role="group"
                        aria-label={at.seatingViewLabel}
                      >
                        {(['grid', 'list'] as const).map((mode, idx) => {
                          const active = viewMode === mode;
                          const label =
                            mode === 'grid' ? at.seatingViewGrid : at.seatingViewList;
                          return (
                            <button
                              key={mode}
                              type="button"
                              onClick={() => setViewMode(mode)}
                              aria-pressed={active}
                              title={label}
                              className="px-2.5 py-1 text-[11px] font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(184,146,74,0.55)] inline-flex items-center gap-1.5"
                              style={{
                                background: active ? GOLD : PARCHMENT,
                                color: active ? '#FFFFFF' : ESPRESSO_DIM,
                                borderLeft: idx > 0 ? `1px solid ${GOLD_DIM}` : 'none',
                              }}
                            >
                              {mode === 'grid' ? (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden="true">
                                  <rect x="3" y="3" width="7" height="7" />
                                  <rect x="14" y="3" width="7" height="7" />
                                  <rect x="3" y="14" width="7" height="7" />
                                  <rect x="14" y="14" width="7" height="7" />
                                </svg>
                              ) : (
                                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
                                </svg>
                              )}
                              <span className="hidden sm:inline">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Grid density follows view mode. In `list` mode each
                        card holds a vertical list of chips, so we keep the
                        same horizontal density (chips are full-width within
                        the card and that's fine even on a 4-up layout). In
                        `grid` mode this is the existing dense default. */}
                    <div
                      ref={tablesGridRef}
                      className={
                        viewMode === 'list'
                          ? 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3'
                          : 'grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3'
                      }
                    >
                      {filteredTables.map((t) => (
                        <TableCard
                          key={t.tableNumber}
                          table={t}
                          guests={guests}
                          eventId={selectedEventId}
                          onEdit={setEditingTable}
                          onDelete={setDeletingTable}
                          onClearAssignment={clearAssignment}
                          onAssignToTable={assignToTable}
                          onBulkUnassign={bulkUnassignFromTable}
                          viewMode={viewMode}
                          activeDrag={
                            active
                              ? {
                                  invitationId: active.invitationId,
                                  guestCount: active.guestCount,
                                  currentTableNumber: active.currentTableNumber,
                                }
                              : null
                          }
                        />
                      ))}
                      {/* Hide the "Add table" affordance when a filter is active —
                          mixing it into a partial result list is confusing
                          ("did adding a table change the filter?"). It comes
                          back the moment the filter clears. */}
                      {!tableFilter && (
                        <AddTableButton
                          suggestedNumber={suggestedNumber}
                          isPending={createTableMutation.isPending}
                          onCreate={(values) => createTableMutation.mutate(values)}
                        />
                      )}
                    </div>

                    {tableFilter && filteredTables.length === 0 && (
                      <div
                        className="mt-3 rounded-xl p-8 text-center"
                        style={{ background: PARCHMENT, border: `1px dashed ${GOLD_DIM}` }}
                      >
                        <p className="font-sans text-sm font-semibold mb-1" style={{ color: ESPRESSO }}>
                          {at.seatingFilterNoMatches}
                        </p>
                        <button
                          type="button"
                          onClick={() => setTableFilter('')}
                          className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                          style={{ background: GOLD, color: '#FFFFFF' }}
                        >
                          {at.seatingFilterClear}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </section>
            </div>

            {/* DragOverlay renders the floating clone at cursor position.
                We re-render the same GuestChip so the visual is identical
                to what the admin grabbed. */}
            <DragOverlay dropAnimation={{ duration: 180, easing: 'cubic-bezier(0.22, 1, 0.36, 1)' }}>
              {activeChip && (
                <GuestChip
                  guest={activeChip.guest}
                  invitation={activeChip.invitation}
                  isOverlay
                />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </main>

      {/* ── Edit table modal ───────────────────────────────────────────── */}
      <EditTableModal
        table={editingTable}
        onClose={() => setEditingTable(null)}
        isPending={updateTableMutation.isPending}
        onSubmit={(values) =>
          editingTable &&
          updateTableMutation.mutate({
            tableNumber: editingTable.tableNumber,
            values,
          })
        }
      />

      {/* ── Delete confirmation ────────────────────────────────────────── */}
      <DeleteTableConfirm
        table={deletingTable}
        onClose={() => setDeletingTable(null)}
        isPending={deleteTableMutation.isPending}
        onConfirm={() => deletingTable && deleteTableMutation.mutate(deletingTable.tableNumber)}
      />
    </div>
  );
}

// ─── Edit table modal ───────────────────────────────────────────────────────
function EditTableModal({
  table,
  onClose,
  isPending,
  onSubmit,
}: {
  table: EventTableWithOccupancy | null;
  onClose: () => void;
  isPending: boolean;
  onSubmit: (values: { label: string | null; capacity: number }) => void;
}) {
  const at = useAdminTranslation();
  const [label, setLabel] = useState('');
  const [capacity, setCapacity] = useState(10);

  // Reset the form when a new table is selected for editing.
  useEffect(() => {
    if (table) {
      setLabel(table.label ?? '');
      setCapacity(table.capacity);
    }
  }, [table]);

  if (!table) return null;

  return (
    <AnimatePresence>
      <motion.div
        key="edit-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/60 z-40"
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-table-title"
      >
        <motion.div
          key="edit-panel"
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          className="rounded-xl w-full max-w-sm shadow-lg"
          style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-5 py-4" style={{ borderBottom: `1px solid ${GOLD_DIM}` }}>
            <h3 id="edit-table-title" className="font-sans font-semibold text-sm" style={{ color: ESPRESSO }}>
              {at.seatingEditTable} #{table.tableNumber}
            </h3>
          </div>
          <div className="px-5 py-4 space-y-3">
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-sans uppercase tracking-wider font-semibold" style={{ color: ESPRESSO_DIM }}>
                {at.seatingTableLabelPlaceholder}
              </span>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                maxLength={100}
                className="px-3 py-2 rounded-lg text-sm font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                style={{ background: CREAM, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-[10px] font-sans uppercase tracking-wider font-semibold" style={{ color: ESPRESSO_DIM }}>
                {at.seatingCapacity}
              </span>
              <input
                type="number"
                min={1}
                max={50}
                value={capacity}
                onChange={(e) => setCapacity(parseInt(e.target.value, 10) || 10)}
                className="px-3 py-2 rounded-lg text-sm font-sans tabular-nums focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                style={{ background: CREAM, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              />
            </label>
          </div>
          <div className="px-5 py-3 flex gap-2" style={{ borderTop: `1px solid ${GOLD_DIM}` }}>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
            >
              {at.cancel}
            </button>
            <button
              type="button"
              onClick={() => onSubmit({ label: label.trim() || null, capacity })}
              disabled={isPending}
              className="flex-1 px-3 py-2 rounded-lg text-xs font-sans font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: GOLD, color: '#FFFFFF' }}
            >
              {isPending ? at.saving : at.saveChanges}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// ─── Delete confirmation ────────────────────────────────────────────────────
function DeleteTableConfirm({
  table,
  onClose,
  isPending,
  onConfirm,
}: {
  table: EventTableWithOccupancy | null;
  onClose: () => void;
  isPending: boolean;
  onConfirm: () => void;
}) {
  const at = useAdminTranslation();
  if (!table) return null;

  const label = table.label?.trim() || at.seatingTableLabel(table.tableNumber);

  return (
    <AnimatePresence>
      <motion.div
        key="del-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-gray-900/60 z-40"
        aria-hidden="true"
      />
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="del-table-title"
      >
        <motion.div
          key="del-panel"
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.97 }}
          className="rounded-xl p-6 w-full max-w-sm shadow-lg"
          style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <h3 id="del-table-title" className="font-sans font-semibold text-sm mb-1" style={{ color: ESPRESSO }}>
                {at.seatingDeleteTable}?
              </h3>
              <p className="text-xs font-sans leading-relaxed" style={{ color: ESPRESSO_DIM }}>
                {at.seatingDeleteTableConfirm(label, table.occupancy)}
              </p>
            </div>
          </div>
          <div className="flex gap-2 mt-5">
            <button
              onClick={onClose}
              className="flex-1 font-sans font-medium text-xs py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
            >
              {at.cancel}
            </button>
            <button
              onClick={onConfirm}
              disabled={isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-sans font-semibold text-xs py-2 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 disabled:cursor-not-allowed"
            >
              {isPending ? at.deleting : at.remove}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
