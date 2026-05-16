import { useCallback, useRef, useState } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../../../lib/api';
import type { AdminGuest, EventTableWithOccupancy } from '../../../lib/api';
import { CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM, PARCHMENT } from '../../../garden/tokens';
import { useAdminTranslation } from '../../../lib/i18n/admin';

// Re-exported helper signatures so callers (TableCard) can type their props
// without importing tanstack-query types directly.
//
// The optional `previous*` arguments are how a caller opts into the undo
// toast: when supplied, the success toast renders an "Undo" button that
// reverses the move. Existing callers that don't pass them keep getting
// the legacy short success toast — so this stays backward-compatible while
// we wire the callers up one at a time.
export type ClearAssignmentFn = (
  invitationId: number,
  guestName: string,
  previousTableNumber?: number | null,
  previousTableLabel?: string | null,
) => void;
export type AssignToTableFn = (
  invitationId: number,
  guestName: string,
  tableNumber: number,
  tableLabel: string | null,
  previousTableNumber?: number | null,
  previousTableLabel?: string | null,
) => void;
// Bulk-unassign — used by the TableCard kebab's "Clear table" action and the
// over-capacity warning's "Move N to Unassigned" button. Fires one PATCH per
// invitation (the existing endpoint is single-invitation only) and surfaces
// a single summary toast at the end. Optimistic updates are inherited from
// the underlying mutation, so chips disappear instantly per call.
export type BulkUnassignFromTableFn = (params: {
  invitationIds: number[];
  /** Source table — only used so the toast / undo can name it. */
  tableNumber: number;
  /** Display label for the source table (falls back to "Table N"). */
  tableLabel: string;
}) => void;

// ─── Cache shape ─────────────────────────────────────────────────────────────
// The dashboard's getGuests query returns this shape; we mirror it here to
// keep optimistic updates type-safe.
interface GuestsQueryData {
  guests: AdminGuest[];
  total: number;
}

interface UseSeatingDndArgs {
  eventId: number;
}

interface ActiveDrag {
  invitationId: number;
  guestId: number;
  guestName: string;
  currentTableNumber: number | null;
  guestCount: number;
}

/**
 * Encapsulates the drag-and-drop seating mutation flow:
 *   - tracks the active drag (so the page can render a DragOverlay)
 *   - on drop, updates the per-invitation `tableNumber` via the existing
 *     `PATCH /admin/invitations/:id` endpoint
 *   - performs an optimistic cache update across every cached `admin/guests`
 *     query so the chip moves instantly without waiting on the network
 *   - rolls back the cache on error and surfaces a toast
 */
export function useSeatingDnd({ eventId }: UseSeatingDndArgs) {
  const qc = useQueryClient();
  const at = useAdminTranslation();
  const [active, setActive] = useState<ActiveDrag | null>(null);

  // `bulkContextRef` lets the bulk helpers suppress per-call success toasts
  // while a chain is in-flight, and surface one summary toast (with undo) at
  // the end. Using a ref avoids re-rendering on every increment.
  const bulkContextRef = useRef<{
    active: boolean;
    completedInvitationIds: number[];
    tableNumber: number;
    tableLabel: string;
    expected: number;
  } | null>(null);

  const moveMutation = useMutation({
    // We pass the previous snapshot through context so the error handler can
    // roll back; this is the standard tanstack-query optimistic update shape.
    mutationFn: async ({
      invitationId,
      tableNumber,
    }: {
      invitationId: number;
      tableNumber: number | null;
      // Used only for toast text — not sent to the server.
      guestName: string;
      newTableLabel: string | null;
      // Optional previous-state hints used by the undo toast. We capture them
      // on the variables (not the cache) so each call's undo is independent
      // of what subsequent moves do to the cache. If absent, no undo is
      // offered and we fall back to the legacy short toast.
      previousTableNumber?: number | null;
      previousTableLabel?: string | null;
      // Set true by bulk helpers so the per-call success toast is silenced.
      // The bulk helper renders one summary toast at the very end instead.
      silent?: boolean;
    }) => {
      return adminApi.updateInvitation(invitationId, { tableNumber });
    },
    onMutate: async ({ invitationId, tableNumber }) => {
      // Cancel any in-flight refetch so it can't overwrite our optimistic
      // write between when we set the cache and when this mutation resolves.
      await qc.cancelQueries({ queryKey: ['admin', 'guests'] });

      // Snapshot every matching cache entry so we can restore them on error.
      // We update every cached variant because filters like `tableFilter` are
      // baked into the key — leaving stale ones around would show outdated
      // chip positions when the user toggles filters.
      const previous = qc.getQueriesData<GuestsQueryData>({ queryKey: ['admin', 'guests'] });
      for (const [key, data] of previous) {
        if (!data) continue;
        const nextGuests = data.guests.map((g) => ({
          ...g,
          invitations: g.invitations.map((inv) =>
            inv.id === invitationId ? { ...inv, tableNumber } : inv,
          ),
        }));
        qc.setQueryData<GuestsQueryData>(key, { ...data, guests: nextGuests });
      }

      // Optimistically bump the occupancy on the event-tables cache so the
      // capacity pill updates without a network round-trip.
      const tablesKey = ['admin', 'eventTables', eventId];
      const previousTables = qc.getQueryData<EventTableWithOccupancy[]>(tablesKey);
      if (previousTables) {
        // Locate the moving invitation in the cached guests to discover its
        // guestCount + previous table — we need both to adjust occupancy.
        let oldTableNumber: number | null = null;
        let guestCount = 1;
        for (const [, data] of previous) {
          if (!data) continue;
          for (const g of data.guests) {
            for (const inv of g.invitations) {
              if (inv.id === invitationId) {
                // The previous snapshot still has the old tableNumber.
                oldTableNumber = inv.tableNumber ?? null;
                guestCount = inv.guestCount;
              }
            }
          }
        }
        const nextTables = previousTables.map((t) => {
          let occupancy = t.occupancy;
          if (oldTableNumber === t.tableNumber) occupancy -= guestCount;
          if (tableNumber === t.tableNumber) occupancy += guestCount;
          return { ...t, occupancy: Math.max(0, occupancy) };
        });
        qc.setQueryData<EventTableWithOccupancy[]>(tablesKey, nextTables);
      }

      return { previous, previousTables };
    },
    onError: (_err, _vars, context) => {
      // Roll back every cache entry we touched in onMutate.
      if (context?.previous) {
        for (const [key, data] of context.previous) {
          qc.setQueryData(key, data);
        }
      }
      if (context?.previousTables !== undefined) {
        qc.setQueryData(['admin', 'eventTables', eventId], context.previousTables);
      }
      toast.error('Failed to update seating');
    },
    onSuccess: (_data, vars) => {
      // 1. Bulk-suppressed calls don't toast individually — the bulk helper
      //    accumulates and shows one summary at the end.
      if (vars.silent) return;

      const message =
        vars.tableNumber != null && vars.newTableLabel
          ? at.seatingSeatedAssignment(vars.guestName, vars.newTableLabel)
          : at.seatingUnseatedAssignment(vars.guestName);

      // 2. If the caller didn't pass previous-table info, render the legacy
      //    short success toast. This keeps any caller that hasn't been
      //    migrated to undo behaving exactly as before.
      if (vars.previousTableNumber === undefined) {
        toast.success(message, { duration: 1800 });
        return;
      }

      // 3. Undoable success toast. We re-mutate with the previous table as
      //    the target on Undo click — and pass `previousTableNumber: undefined`
      //    so the undo itself doesn't chain another undo button.
      const prevTableNumber = vars.previousTableNumber;
      const prevTableLabel = vars.previousTableLabel ?? null;
      toast.custom(
        (t) => (
          <div
            // Match the visual language of react-hot-toast's default success
            // toast (parchment card, gold accent) so the undo variant
            // doesn't look like an unrelated component.
            style={{
              background: PARCHMENT,
              color: ESPRESSO,
              border: `1px solid ${GOLD_DIM}`,
              boxShadow: '0 6px 18px rgba(42,31,26,0.10)',
              borderRadius: '0.5rem',
              padding: '0.5rem 0.75rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.75rem',
              minWidth: '16rem',
              maxWidth: '24rem',
              fontFamily: 'inherit',
              fontSize: '0.8125rem',
            }}
            role="status"
          >
            {/* Small green check so success state is communicated at a
                glance — matches the colour used elsewhere for "attending". */}
            <span
              aria-hidden="true"
              style={{
                width: 18,
                height: 18,
                borderRadius: '50%',
                background: '#059669',
                color: '#FFFFFF',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            </span>
            <span style={{ flex: 1, minWidth: 0 }} className="truncate">
              {message}
            </span>
            <button
              type="button"
              onClick={() => {
                toast.dismiss(t.id);
                moveMutation.mutate({
                  invitationId: vars.invitationId,
                  tableNumber: prevTableNumber,
                  guestName: vars.guestName,
                  newTableLabel: prevTableLabel,
                  // No undo-of-undo: leave previousTableNumber undefined so
                  // the success handler falls through to the legacy toast.
                });
                // Acknowledge the undo separately so the admin sees the
                // action took effect even if the original toast was already
                // closing.
                toast.success(at.seatingUndone, { duration: 1400 });
              }}
              style={{
                background: CREAM,
                color: ESPRESSO,
                border: `1px solid ${GOLD_DIM}`,
                borderRadius: '0.375rem',
                padding: '0.2rem 0.55rem',
                fontWeight: 600,
                fontSize: '0.75rem',
                cursor: 'pointer',
                flexShrink: 0,
              }}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
            >
              {at.seatingUndo}
            </button>
            <button
              type="button"
              onClick={() => toast.dismiss(t.id)}
              aria-label="Dismiss"
              style={{
                background: 'transparent',
                color: ESPRESSO_DIM,
                border: 'none',
                cursor: 'pointer',
                padding: 2,
                marginRight: -4,
                flexShrink: 0,
                display: 'inline-flex',
              }}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] rounded"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        ),
        { duration: 4500 },
      );
      // Suppress an unused-variable warning for GOLD when undo is wired but
      // toast styling doesn't reference it directly.
      void GOLD;
    },
    onSettled: () => {
      // Background refetch to reconcile with server truth.
      qc.invalidateQueries({ queryKey: ['admin', 'guests'] });
      qc.invalidateQueries({ queryKey: ['admin', 'eventTables', eventId] });
      qc.invalidateQueries({ queryKey: ['admin', 'tables'] });
    },
  });

  const onDragStart = useCallback((event: DragStartEvent) => {
    const data = event.active.data.current as Partial<ActiveDrag> | undefined;
    if (!data || data.invitationId == null || data.guestId == null) return;
    setActive({
      invitationId: data.invitationId,
      guestId: data.guestId,
      guestName: data.guestName ?? '',
      currentTableNumber: data.currentTableNumber ?? null,
      guestCount: data.guestCount ?? 1,
    });
  }, []);

  const onDragCancel = useCallback(() => {
    setActive(null);
  }, []);

  const onDragEnd = useCallback(
    (event: DragEndEvent, tables: EventTableWithOccupancy[]) => {
      setActive(null);
      const { active: dragActive, over } = event;
      if (!over) return;

      const dragData = dragActive.data.current as Partial<ActiveDrag> | undefined;
      const dropData = over.data.current as
        | { type?: string; tableNumber?: number; eventId?: number }
        | undefined;

      if (!dragData || dragData.invitationId == null) return;
      if (!dropData) return;

      // Resolve the target table number based on drop type.
      // - `unassigned` → null (clear assignment)
      // - `table` → its tableNumber
      let nextTableNumber: number | null;
      if (dropData.type === 'unassigned') {
        nextTableNumber = null;
      } else if (dropData.type === 'table' && typeof dropData.tableNumber === 'number') {
        nextTableNumber = dropData.tableNumber;
      } else {
        return;
      }

      // No-op: dropping a chip back on its own current table.
      if (nextTableNumber === (dragData.currentTableNumber ?? null)) return;

      const newLabel =
        nextTableNumber == null
          ? null
          : (tables.find((t) => t.tableNumber === nextTableNumber)?.label?.trim() ||
              at.seatingTableLabel(nextTableNumber));

      // Resolve previous-table info (for undo) from the drag-source
      // metadata. The dragged chip always knows where it started, so we
      // don't have to look it up in the cache.
      const previousTableNumber = dragData.currentTableNumber ?? null;
      const previousTableLabel =
        previousTableNumber == null
          ? null
          : (tables.find((t) => t.tableNumber === previousTableNumber)?.label?.trim() ||
              at.seatingTableLabel(previousTableNumber));

      moveMutation.mutate({
        invitationId: dragData.invitationId,
        tableNumber: nextTableNumber,
        guestName: dragData.guestName ?? '',
        newTableLabel: newLabel,
        previousTableNumber,
        previousTableLabel,
      });
    },
    [moveMutation, at],
  );

  // Click-driven unassign (the chip's "×" button). Reuses the same
  // optimistic-update mutation as drag-drop so cache, toast, and rollback
  // behaviour stay identical to the unassign-by-drag path. The caller may
  // pass the previous table so the success toast offers an Undo button.
  const clearAssignment: ClearAssignmentFn = useCallback(
    (invitationId, guestName, previousTableNumber, previousTableLabel) => {
      moveMutation.mutate({
        invitationId,
        tableNumber: null,
        guestName,
        newTableLabel: null,
        previousTableNumber,
        previousTableLabel,
      });
    },
    [moveMutation],
  );

  // Click-driven assign (the table card's "+ Add guest" picker). Same
  // mutation, same optimistic update — the only difference vs drag-drop is
  // that the user is choosing a guest first and the table second.
  const assignToTable: AssignToTableFn = useCallback(
    (invitationId, guestName, tableNumber, tableLabel, previousTableNumber, previousTableLabel) => {
      moveMutation.mutate({
        invitationId,
        tableNumber,
        guestName,
        newTableLabel: tableLabel,
        previousTableNumber,
        previousTableLabel,
      });
    },
    [moveMutation],
  );

  // Bulk unassign — used by:
  //   - the kebab "Clear table" action (entire table → Unassigned)
  //   - the over-capacity warning's "Move N to Unassigned" button
  // Each invitation is moved with its own optimistic update via the existing
  // single-invitation mutation. We silence the per-call toast and surface one
  // summary toast at the end with an Undo that restores all of them.
  const bulkUnassignFromTable: BulkUnassignFromTableFn = useCallback(
    ({ invitationIds, tableNumber, tableLabel }) => {
      if (invitationIds.length === 0) return;

      // Snapshot what we're about to do so the summary toast's Undo can
      // re-seat every invitation back to its original table in a second pass.
      const snapshot = invitationIds.slice();
      let completed = 0;
      let firstError: unknown = null;
      for (const invitationId of snapshot) {
        // Resolve guestName from the cache for the toast text. If the cache
        // misses we fall back to a generic label — the toast is informational.
        let guestName = '';
        const cached = qc.getQueriesData<GuestsQueryData>({ queryKey: ['admin', 'guests'] });
        for (const [, data] of cached) {
          if (!data) continue;
          const g = data.guests.find((gg) => gg.invitations.some((i) => i.id === invitationId));
          if (g) {
            guestName = g.name;
            break;
          }
        }
        moveMutation.mutate(
          {
            invitationId,
            tableNumber: null,
            guestName,
            newTableLabel: null,
            silent: true,
          },
          {
            onError: (err) => {
              if (firstError == null) firstError = err;
            },
            onSettled: () => {
              completed += 1;
              if (completed < snapshot.length) return;
              if (firstError) {
                // The base mutation's onError already toasted for at least
                // one row; nothing more to add here.
                return;
              }
              // Summary success toast with one Undo for the whole batch.
              toast.custom(
                (t) => (
                  <div
                    style={{
                      background: PARCHMENT,
                      color: ESPRESSO,
                      border: `1px solid ${GOLD_DIM}`,
                      boxShadow: '0 6px 18px rgba(42,31,26,0.10)',
                      borderRadius: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      minWidth: '18rem',
                      maxWidth: '26rem',
                      fontFamily: 'inherit',
                      fontSize: '0.8125rem',
                    }}
                    role="status"
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: '#059669',
                        color: '#FFFFFF',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                    </span>
                    <span style={{ flex: 1, minWidth: 0 }} className="truncate">
                      {at.seatingClearedTable(tableLabel, snapshot.length)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        toast.dismiss(t.id);
                        // Re-seat every invitation back to the original
                        // table. We don't offer undo on the undo (no
                        // previousTableNumber) — keeps things bounded.
                        for (const invitationId of snapshot) {
                          moveMutation.mutate({
                            invitationId,
                            tableNumber,
                            guestName: '',
                            newTableLabel: tableLabel,
                            silent: true,
                          });
                        }
                        toast.success(at.seatingUndone, { duration: 1400 });
                      }}
                      style={{
                        background: CREAM,
                        color: ESPRESSO,
                        border: `1px solid ${GOLD_DIM}`,
                        borderRadius: '0.375rem',
                        padding: '0.2rem 0.55rem',
                        fontWeight: 600,
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        flexShrink: 0,
                      }}
                      className="focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
                    >
                      {at.seatingUndo}
                    </button>
                  </div>
                ),
                { duration: 5000 },
              );
            },
          },
        );
      }
      // `bulkContextRef` retained for future expansion (e.g. progress UI);
      // currently unused but cheap to keep wired so the type stays exercised.
      void bulkContextRef;
    },
    [moveMutation, qc, at],
  );

  return {
    active,
    onDragStart,
    onDragEnd,
    onDragCancel,
    isPending: moveMutation.isPending,
    clearAssignment,
    assignToTable,
    bulkUnassignFromTable,
  };
}
