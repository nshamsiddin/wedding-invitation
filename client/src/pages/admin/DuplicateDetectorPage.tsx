import { useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AdminGuest } from '../../lib/api';
import { adminApi } from '../../lib/api';
import { PARCHMENT, CREAM, ESPRESSO, ESPRESSO_DIM, GOLD, GOLD_DIM } from '../../garden/tokens';
import { LanguageContext } from '../../context/LanguageContext';
import { LANGUAGES, LANGUAGE_LABELS } from '../../lib/i18n';
import { useAdminTranslation } from '../../lib/i18n/admin';
import { getEventDisplayName } from '../../components/admin/adminTokens';
import NotificationBell from '../../components/admin/NotificationBell';

function normalizeGuestName(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function bigrams(value: string): string[] {
  if (value.length < 2) return value.length === 1 ? [value] : [];
  const pairs: string[] = [];
  for (let i = 0; i < value.length - 1; i += 1) pairs.push(value.slice(i, i + 2));
  return pairs;
}

function diceCoefficient(a: string, b: string): number {
  if (a === b) return 1;
  const aPairs = bigrams(a);
  const bPairs = bigrams(b);
  if (aPairs.length === 0 || bPairs.length === 0) return 0;
  const counts = new Map<string, number>();
  for (const p of aPairs) counts.set(p, (counts.get(p) ?? 0) + 1);
  let matches = 0;
  for (const p of bPairs) {
    const c = counts.get(p) ?? 0;
    if (c > 0) {
      matches += 1;
      counts.set(p, c - 1);
    }
  }
  return (2 * matches) / (aPairs.length + bPairs.length);
}

function tokenJaccard(a: string, b: string): number {
  const aTokens = new Set(a.split(' ').filter(Boolean));
  const bTokens = new Set(b.split(' ').filter(Boolean));
  if (aTokens.size === 0 || bTokens.size === 0) return 0;
  let intersection = 0;
  for (const token of aTokens) if (bTokens.has(token)) intersection += 1;
  const union = aTokens.size + bTokens.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

function fuzzyNameSimilarity(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 1;
  const dice = diceCoefficient(a, b);
  const jaccard = tokenJaccard(a, b);
  return (dice * 0.7) + (jaccard * 0.3);
}

export default function DuplicateDetectorPage() {
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

  const guestQueryParams = {
    eventId: selectedEventId ?? undefined,
  };
  const { data: guestsData, isLoading: guestsLoading } = useQuery({
    queryKey: ['admin', 'guests', 'duplicates', guestQueryParams],
    queryFn: () => adminApi.getGuests(guestQueryParams),
    placeholderData: (prev) => prev,
  });
  const guests = guestsData?.guests ?? [];

  const duplicateMatches = useMemo(() => {
    const candidates = guests.slice(0, 700);
    const threshold = 0.86;
    const results: Array<{ a: AdminGuest; b: AdminGuest; score: number; reason: 'phone' | 'name' }> = [];

    const namesByGuest = new Map<number, string[]>();
    const phonesByGuest = new Map<number, string | null>();
    for (const guest of candidates) {
      const names = [
        normalizeGuestName(guest.name),
        normalizeGuestName(guest.partnerName ?? ''),
      ].filter(Boolean);
      namesByGuest.set(guest.id, names);
      phonesByGuest.set(guest.id, (guest.phone ?? '').replace(/\D/g, '') || null);
    }

    for (let i = 0; i < candidates.length; i += 1) {
      for (let j = i + 1; j < candidates.length; j += 1) {
        const a = candidates[i];
        const b = candidates[j];
        if (!a || !b) continue;

        const aPhone = phonesByGuest.get(a.id);
        const bPhone = phonesByGuest.get(b.id);
        if (aPhone && bPhone && aPhone === bPhone) {
          results.push({ a, b, score: 0.99, reason: 'phone' });
          continue;
        }

        const aNames = namesByGuest.get(a.id) ?? [];
        const bNames = namesByGuest.get(b.id) ?? [];
        let best = 0;
        for (const an of aNames) {
          for (const bn of bNames) {
            best = Math.max(best, fuzzyNameSimilarity(an, bn));
          }
        }
        if (best >= threshold) {
          results.push({ a, b, score: Number(best.toFixed(3)), reason: 'name' });
        }
      }
    }

    return results
      .sort((x, y) => y.score - x.score)
      .slice(0, 40);
  }, [guests]);

  const logoutMutation = useMutation({
    mutationFn: adminApi.logout,
    onSuccess: () => { qc.clear(); navigate('/admin/login', { replace: true }); },
  });

  return (
    <div className="admin-page min-h-screen" style={{ background: CREAM, color: ESPRESSO }}>
      <header className="sticky top-0 z-30" style={{ background: PARCHMENT, borderBottom: `1px solid ${GOLD_DIM}` }}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3 flex items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <button
              onClick={() => navigate('/admin')}
              className="inline-flex items-center gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg text-xs font-sans font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] flex-shrink-0"
              style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
              onMouseEnter={(e) => { e.currentTarget.style.background = CREAM; e.currentTarget.style.borderColor = GOLD; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = PARCHMENT; e.currentTarget.style.borderColor = GOLD_DIM; }}
              aria-label={at.backToDashboard}
              title={at.backToDashboard}
            >
              <span aria-hidden="true">←</span>
              <span className="hidden sm:inline">{at.backToDashboard}</span>
            </button>
            <div className="min-w-0">
              <p className="font-sans font-semibold text-sm leading-none truncate" style={{ color: ESPRESSO }}>
                {at.duplicateDetectorTitle}
              </p>
              <p className="text-xs font-sans mt-0.5 hidden sm:block" style={{ color: ESPRESSO_DIM }}>
                {at.duplicateDetectorHint}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <NotificationBell />
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

      <main className="max-w-7xl mx-auto px-3 sm:px-6 py-5 sm:py-6 space-y-6">
        <section aria-label="Event selector">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSelectedEventId(null)}
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
            <div
              className="flex items-stretch rounded-lg overflow-hidden"
              style={{ border: `1px solid ${GOLD_DIM}` }}
              role="group"
              aria-label="Filter duplicates by event"
            >
              {events.map((ev, idx) => {
                const active = selectedEventId === ev.id;
                return (
                  <div key={ev.id} className="flex items-stretch">
                    {idx > 0 && <div className="w-px self-stretch" style={{ background: GOLD_DIM }} aria-hidden="true" />}
                    <button
                      onClick={() => setSelectedEventId(ev.id)}
                      className="px-2.5 sm:px-4 py-2 text-sm font-sans font-semibold transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[rgba(184,146,74,0.8)]"
                      style={active ? { background: GOLD, color: ESPRESSO } : { background: PARCHMENT, color: ESPRESSO }}
                      aria-pressed={active}
                    >
                      {getEventDisplayName(ev)}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section aria-labelledby="duplicate-detector-heading">
          <div className="flex items-end justify-between gap-3 mb-3">
            <h2 id="duplicate-detector-heading" className="font-sans font-semibold text-sm" style={{ color: ESPRESSO }}>
              {at.duplicateDetectorTitle}
            </h2>
            {!guestsLoading && (
              <p className="text-xs font-sans" style={{ color: ESPRESSO_DIM }}>
                {guests.length} {guests.length === 1 ? at.guestSingular : at.guestPlural}
              </p>
            )}
          </div>

          <div className="rounded-xl border p-3 sm:p-4 space-y-3" style={{ background: PARCHMENT, borderColor: GOLD_DIM }}>
            {guestsLoading ? (
              Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="rounded-lg border p-3 animate-pulse" style={{ borderColor: GOLD_DIM, background: 'rgba(255,255,255,0.35)' }}>
                  <div className="h-3 w-36 rounded mb-2" style={{ background: GOLD_DIM }} />
                  <div className="h-3 w-4/5 rounded mb-1.5" style={{ background: GOLD_DIM }} />
                  <div className="h-3 w-3/5 rounded" style={{ background: GOLD_DIM }} />
                </div>
              ))
            ) : duplicateMatches.length === 0 ? (
              <div className="rounded-lg border p-4" style={{ borderColor: GOLD_DIM }}>
                <p className="font-sans text-sm" style={{ color: ESPRESSO }}>{at.duplicateDetectorNoMatches}</p>
                <p className="font-sans text-xs mt-1" style={{ color: ESPRESSO_DIM }}>{at.duplicateDetectorHint}</p>
              </div>
            ) : (
              <>
                <div className="space-y-1.5">
                  {duplicateMatches.map((m, idx) => (
                    <div
                      key={`${m.a.id}-${m.b.id}-${idx}`}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-lg px-2.5 py-2"
                      style={{ background: CREAM, border: `1px solid ${GOLD_DIM}` }}
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-sans font-semibold truncate" style={{ color: ESPRESSO }}>
                          {m.a.name} ↔ {m.b.name}
                        </p>
                        <p className="text-[11px] font-sans truncate" style={{ color: ESPRESSO_DIM }}>
                          {m.reason === 'phone'
                            ? `${m.a.phone ?? '—'} = ${m.b.phone ?? '—'}`
                            : `${m.a.partnerName ?? '—'} · ${m.b.partnerName ?? '—'}`}
                        </p>
                      </div>
                      <span
                        className="text-[11px] font-sans font-semibold tabular-nums px-2 py-1 rounded-full whitespace-nowrap"
                        style={{ background: 'rgba(184,146,74,0.12)', border: `1px solid ${GOLD_DIM}`, color: ESPRESSO }}
                      >
                        {Math.round(m.score * 100)}% {at.duplicateDetectorScore}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
