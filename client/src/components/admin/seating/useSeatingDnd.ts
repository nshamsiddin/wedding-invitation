import { useCallback, useState } from 'react';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adminApi } from '../../../lib/api';
import type { AdminGuest, EventTableWithOccupancy } from '../../../lib/api';
import { useAdminTranslation } from '../../../lib/i18n/admin';

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
      // Quiet success toast — drag-drop is high-frequency, full-width loud
      // toasts on every action would be noise.
      toast.success(
        vars.tableNumber != null && vars.newTableLabel
          ? at.seatingSeatedAssignment(vars.guestName, vars.newTableLabel)
          : at.seatingUnseatedAssignment(vars.guestName),
        { duration: 1800 },
      );
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

      moveMutation.mutate({
        invitationId: dragData.invitationId,
        tableNumber: nextTableNumber,
        guestName: dragData.guestName ?? '',
        newTableLabel: newLabel,
      });
    },
    [moveMutation, at],
  );

  return {
    active,
    onDragStart,
    onDragEnd,
    onDragCancel,
    isPending: moveMutation.isPending,
  };
}
