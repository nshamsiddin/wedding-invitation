import { useState, useRef, useEffect, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../../lib/api';
import type { AdminNotification } from '../../lib/api';
import { PARCHMENT, CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM } from '../../garden/tokens';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins  = Math.floor(diffMs / 60_000);
  const hours = Math.floor(diffMs / 3_600_000);
  const days  = Math.floor(diffMs / 86_400_000);
  if (mins  < 1)  return 'just now';
  if (mins  < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

const STATUS_LABEL: Record<string, string> = {
  attending: 'Attending',
  declined:  'Declined',
  maybe:     'Maybe',
  pending:   'Pending',
};

const STATUS_COLOR: Record<string, string> = {
  attending: '#4CAF85',
  declined:  '#C9808A',
  maybe:     '#C4975A',
  pending:   '#9E9082',
};

const EVENT_SHORT: Record<string, string> = {
  tashkent: 'Tashkent',
  ankara:   'Ankara',
};

// ─── Single notification item ─────────────────────────────────────────────────

function NotificationItem({
  n,
  onMarkRead,
}: {
  n: AdminNotification;
  onMarkRead: (id: number) => void;
}) {
  const color = STATUS_COLOR[n.status] ?? ESPRESSO_DIM;
  const event = EVENT_SHORT[n.eventSlug] ?? n.eventSlug;

  return (
    <div
      className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-[rgba(184,146,74,0.05)] cursor-default"
      style={{
        borderBottom: `1px solid ${GOLD_DIM}`,
        background: n.isRead ? 'transparent' : 'rgba(184,146,74,0.06)',
      }}
    >
      {/* Unread dot */}
      <div className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full" style={{
        background: n.isRead ? 'transparent' : GOLD,
      }} />

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <span className="font-sans font-semibold text-xs truncate block" style={{ color: ESPRESSO }}>
              {n.guestName}
            </span>
            <span className="font-sans text-xs" style={{ color: ESPRESSO_DIM }}>
              {event} ·{' '}
              <span style={{ color, fontWeight: 600 }}>
                {STATUS_LABEL[n.status] ?? n.status}
              </span>
              {n.status === 'attending' && n.guestCount > 1 && (
                <span style={{ color: ESPRESSO_DIM }}> × {n.guestCount}</span>
              )}
            </span>
          </div>
          <div className="flex flex-col items-end gap-1 flex-shrink-0">
            <span className="font-sans text-[10px]" style={{ color: ESPRESSO_DIM }}>
              {timeAgo(n.createdAt)}
            </span>
            {!n.isRead && (
              <button
                onClick={() => onMarkRead(n.id)}
                className="text-[10px] font-sans underline focus:outline-none"
                style={{ color: ESPRESSO_DIM }}
                aria-label="Mark as read"
              >
                read
              </button>
            )}
          </div>
        </div>

        {n.message && (
          <p
            className="mt-1 text-[11px] font-sans italic truncate"
            style={{ color: ESPRESSO_DIM }}
            title={n.message}
          >
            "{n.message}"
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Bell icon ────────────────────────────────────────────────────────────────

function BellIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
    </svg>
  );
}

// ─── NotificationBell ─────────────────────────────────────────────────────────

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const qc = useQueryClient();

  // Poll unread count every 30 s when panel is closed; 10 s when open
  const { data: countData } = useQuery({
    queryKey: ['admin', 'notifications', 'unread-count'],
    queryFn: notificationsApi.getUnreadCount,
    refetchInterval: open ? 10_000 : 30_000,
  });

  // Fetch list only when panel is open
  const { data: listData, isLoading } = useQuery({
    queryKey: ['admin', 'notifications', 'list'],
    queryFn: () => notificationsApi.list({ limit: 30 }),
    enabled: open,
    refetchInterval: open ? 15_000 : false,
  });

  const notifications = listData?.notifications ?? [];
  const unreadCount = countData?.count ?? 0;

  const markReadMutation = useMutation({
    mutationFn: notificationsApi.markRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: notificationsApi.markAllRead,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    },
  });

  const handleMarkRead = useCallback((id: number) => {
    markReadMutation.mutate(id);
  }, [markReadMutation]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') { setOpen(false); buttonRef.current?.focus(); }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  // Refresh count when panel opens
  useEffect(() => {
    if (open) {
      qc.invalidateQueries({ queryKey: ['admin', 'notifications'] });
    }
  }, [open, qc]);

  return (
    <div className="relative">
      {/* ── Bell button ─────────────────────────────────────────────────────── */}
      <button
        ref={buttonRef}
        onClick={() => setOpen((v) => !v)}
        aria-label={`Notifications${unreadCount > 0 ? ` — ${unreadCount} unread` : ''}`}
        aria-expanded={open}
        aria-haspopup="true"
        className="relative flex items-center justify-center w-8 h-8 rounded-lg transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
        style={{ background: open ? 'rgba(184,146,74,0.12)' : 'rgba(184,146,74,0.07)', border: `1px solid ${GOLD_DIM}` }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(184,146,74,0.14)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = open ? 'rgba(184,146,74,0.12)' : 'rgba(184,146,74,0.07)'; }}
      >
        <svg className="w-4 h-4" style={{ color: GOLD }} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {/* Unread badge */}
        {unreadCount > 0 && (
          <span
            className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-sans font-bold leading-none"
            style={{ background: '#C9808A', color: '#fff' }}
            aria-hidden="true"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* ── Dropdown panel ──────────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-label="Notifications"
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 top-10 z-50 w-80 rounded-xl shadow-xl overflow-hidden"
            style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-2.5"
              style={{ borderBottom: `1px solid ${GOLD_DIM}` }}
            >
              <span className="font-sans font-semibold text-xs" style={{ color: ESPRESSO }}>
                Notifications
                {unreadCount > 0 && (
                  <span
                    className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: 'rgba(201,128,138,0.15)', color: '#C9808A' }}
                  >
                    {unreadCount} new
                  </span>
                )}
              </span>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllReadMutation.mutate()}
                  disabled={markAllReadMutation.isPending}
                  className="text-[11px] font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] rounded"
                  style={{ color: GOLD }}
                >
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ maxHeight: '360px' }}>
              {isLoading && (
                <div className="px-4 py-6 text-center font-sans text-xs" style={{ color: ESPRESSO_DIM }}>
                  Loading…
                </div>
              )}

              {!isLoading && notifications.length === 0 && (
                <div className="px-4 py-8 text-center" style={{ color: ESPRESSO_DIM }}>
                  <BellIcon className="w-6 h-6 mx-auto mb-2 opacity-40" />
                  <p className="font-sans text-xs">No notifications yet</p>
                </div>
              )}

              {!isLoading && notifications.map((n) => (
                <NotificationItem key={n.id} n={n} onMarkRead={handleMarkRead} />
              ))}
            </div>

            {/* Footer */}
            {!isLoading && listData && listData.total > 30 && (
              <div
                className="px-4 py-2 text-center font-sans text-[11px]"
                style={{ borderTop: `1px solid ${GOLD_DIM}`, color: ESPRESSO_DIM, background: CREAM }}
              >
                Showing 30 of {listData.total} notifications
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
