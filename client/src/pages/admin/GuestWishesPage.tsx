import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminGuestMessage } from '../../lib/api';
import { adminApi } from '../../lib/api';
import { PARCHMENT, CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM } from '../../garden/tokens';
import { LanguageContext } from '../../context/LanguageContext';
import { LANGUAGES, LANGUAGE_LABELS } from '../../lib/i18n';
import { useAdminTranslation } from '../../lib/i18n/admin';
import { getEventDisplayName } from '../../components/admin/adminTokens';
import NotificationBell from '../../components/admin/NotificationBell';

export default function GuestWishesPage() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const at = useAdminTranslation();
  const { language, setLanguage } = useContext(LanguageContext);

  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);

  const { data: events = [] } = useQuery({
    queryKey: ['admin', 'events'],
    queryFn: adminApi.getEvents,
    refetchInterval: 60_000,
  });

  const messageQueryParams = {
    eventId: selectedEventId ?? undefined,
  };
  const { data: messagesData, isLoading: messagesLoading } = useQuery({
    queryKey: ['admin', 'messages', messageQueryParams],
    queryFn: () => adminApi.getMessages(messageQueryParams),
    placeholderData: (prev) => prev,
  });

  const guestMessages = messagesData?.messages ?? [];
  const guestMessagesTotal = messagesData?.total ?? 0;

  const statusLabelByValue: Record<AdminGuestMessage['status'], string> = {
    attending: at.statusAttending,
    declined: at.statusDeclined,
    maybe: at.statusMaybe,
    pending: at.statusPending,
  };

  const logoutMutation = useMutation({
    mutationFn: adminApi.logout,
    onSuccess: () => { qc.clear(); navigate('/admin/login', { replace: true }); },
  });

  return (
    <div className="admin-page min-h-screen" style={{ background: CREAM, color: ESPRESSO }}>
      <header className="sticky top-0 z-30" style={{ background: PARCHMENT, borderBottom: `1px solid ${GOLD_DIM}` }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)]"
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; e.currentTarget.style.borderColor = GOLD_DIM; }}
            >
              ← {at.backToGuestList}
            </button>
            <div>
              <p className="font-sans font-semibold text-sm leading-none" style={{ color: ESPRESSO }}>{at.guestWishesTitle}</p>
              <p className="text-xs font-sans mt-0.5 hidden sm:block" style={{ color: ESPRESSO_DIM }}>
                {at.guestWishesSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationBell />
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
        <section aria-label="Event selector">
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setSelectedEventId(null)}
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
            <div
              className="flex items-stretch rounded-lg overflow-hidden"
              style={{ border: `1px solid ${GOLD_DIM}` }}
              role="group"
              aria-label="Filter messages by event"
            >
              {events.map((ev, idx) => {
                const active = selectedEventId === ev.id;
                return (
                  <div key={ev.id} className="flex items-stretch">
                    {idx > 0 && <div className="w-px self-stretch" style={{ background: GOLD_DIM }} aria-hidden="true" />}
                    <button
                      onClick={() => setSelectedEventId(ev.id)}
                      className="px-4 py-2 text-sm font-sans font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(184,146,74,0.8)]"
                      style={active ? { background: GOLD, color: ESPRESSO } : { background: PARCHMENT, color: ESPRESSO }}
                      aria-pressed={active}
                    >
                      {getEventDisplayName(ev)}
                      <span className="ml-2 text-[10px] font-bold tabular-nums">
                        {(ev.stats.totalInvitations ?? ev.stats.total)}i · {ev.stats.total}p
                      </span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section aria-labelledby="guest-wishes-heading">
          <div className="flex items-end justify-between gap-3 mb-3">
            <h2 id="guest-wishes-heading" className="font-sans font-semibold text-sm" style={{ color: ESPRESSO }}>
              {at.guestWishesTitle}
            </h2>
            {!messagesLoading && (
              <p className="text-xs font-sans" style={{ color: ESPRESSO_DIM }}>
                {guestMessagesTotal} {guestMessagesTotal === 1 ? at.guestWishSingular : at.guestWishPlural}
                <span className="ml-1">
                  · {guestMessagesTotal} {guestMessagesTotal === 1 ? at.invitationUnitSingular : at.invitationUnitPlural}
                </span>
                <span className="ml-1">
                  · {guestMessages.reduce((sum, m) => sum + m.guestCount, 0)} {at.personUnitPlural}
                </span>
              </p>
            )}
          </div>

          <div className="rounded-xl border p-3 sm:p-4 space-y-3" style={{ background: PARCHMENT, borderColor: GOLD_DIM }}>
            {messagesLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded-lg border p-3 animate-pulse" style={{ borderColor: GOLD_DIM, background: 'rgba(255,255,255,0.35)' }}>
                  <div className="h-3 w-36 rounded mb-2" style={{ background: GOLD_DIM }} />
                  <div className="h-3 w-4/5 rounded mb-1.5" style={{ background: GOLD_DIM }} />
                  <div className="h-3 w-3/5 rounded" style={{ background: GOLD_DIM }} />
                </div>
              ))
            ) : guestMessages.length === 0 ? (
              <div className="rounded-lg border p-4" style={{ borderColor: GOLD_DIM }}>
                <p className="font-sans text-sm" style={{ color: ESPRESSO }}>{at.guestWishesEmpty}</p>
                <p className="font-sans text-xs mt-1" style={{ color: ESPRESSO_DIM }}>{at.guestWishesEmptyHint}</p>
              </div>
            ) : (
              guestMessages.map((item) => (
                <motion.article
                  key={item.invitationId}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg border p-3"
                  style={{ borderColor: GOLD_DIM }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-sans text-xs font-semibold" style={{ color: ESPRESSO }}>
                      {at.guestWishesFrom}: {item.guestName}
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                        style={{ background: 'rgba(184,146,74,0.12)', border: `1px solid ${GOLD_DIM}`, color: ESPRESSO_DIM }}
                      >
                        {item.eventName ?? item.eventSlug ?? `Event ${item.eventId}`}
                      </span>
                      <span className="text-[10px] font-sans uppercase tracking-wide" style={{ color: ESPRESSO_DIM }}>
                        {statusLabelByValue[item.status]} · {item.guestCount}
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-sm font-sans whitespace-pre-wrap break-words" style={{ color: ESPRESSO }}>
                    {item.message}
                  </p>
                  <p className="mt-2 text-[10px] font-sans" style={{ color: ESPRESSO_DIM }}>
                    {at.guestWishesUpdated}: {new Date(item.updatedAt).toLocaleString()}
                  </p>
                </motion.article>
              ))
            )}

          </div>
        </section>
      </main>
    </div>
  );
}
