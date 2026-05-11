import { motion } from 'framer-motion';
import type { AdminEvent } from '../../lib/api';
import {
  PARCHMENT,
  ESPRESSO,
  ESPRESSO_DIM,
  GOLD_DIM,
  GOLD_ACCESSIBLE,
} from '../../garden/tokens';
import { useAdminTranslation } from '../../lib/i18n/admin';

interface Props {
  events: AdminEvent[];
  selectedEventId: number | null;
  isLoading: boolean;
  /** Currently active status filters. When provided, breakdown rows become toggle buttons. */
  selectedStatuses?: string[];
  /** Called when a breakdown row is pressed — toggles that status in the filter. */
  onToggleStatus?: (status: 'attending' | 'declined' | 'maybe' | 'pending') => void;
}

// Warm muted tones consistent with the parchment palette
const SEGMENT_COLORS = {
  attending: '#4A9E78', // muted emerald
  declined:  '#C0615A', // muted red
  maybe:     '#C4924A', // muted amber (matches GOLD family)
  pending:   '#C9BFB6', // warm light gray
} as const;

const STATUS_TEXT_COLORS = {
  attending: '#2D6B50',
  declined:  '#8B3A36',
  maybe:     '#7A5520',
  pending:   'rgba(42,31,26,0.55)',
} as const;

// Diagonal stripe for "No response" so the segment reads as “unknown”,
// not “empty space remaining”. Subtle enough to keep the bar quiet.
const PENDING_STRIPE = `repeating-linear-gradient(45deg, ${SEGMENT_COLORS.pending} 0, ${SEGMENT_COLORS.pending} 4px, rgba(255,255,255,0.55) 4px, rgba(255,255,255,0.55) 8px)`;

function SkeletonBar() {
  return (
    <div
      className="rounded-xl px-6 py-5 shadow-sm space-y-4"
      style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
      aria-hidden="true"
    >
      <div className="flex items-baseline justify-between">
        <div className="h-9 w-28 rounded animate-pulse" style={{ background: GOLD_DIM }} />
        <div className="h-3 w-32 rounded animate-pulse" style={{ background: GOLD_DIM }} />
      </div>
      <div className="h-2 w-full rounded-full animate-pulse" style={{ background: GOLD_DIM }} />
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-8 rounded animate-pulse" style={{ background: GOLD_DIM }} />
        ))}
      </div>
      <div className="h-px w-full" style={{ background: GOLD_DIM }} />
      <div className="flex items-baseline justify-between">
        <div className="h-3 w-32 rounded animate-pulse" style={{ background: GOLD_DIM }} />
        <div className="h-4 w-10 rounded animate-pulse" style={{ background: GOLD_DIM }} />
      </div>
    </div>
  );
}

export default function StatsCards({
  events,
  selectedEventId,
  isLoading,
  selectedStatuses,
  onToggleStatus,
}: Props) {
  const at = useAdminTranslation();
  const interactive = typeof onToggleStatus === 'function';
  const activeSet = new Set(selectedStatuses ?? []);

  if (isLoading || events.length === 0) return <SkeletonBar />;

  let stats: AdminEvent['stats'];
  if (selectedEventId !== null) {
    const ev = events.find((e) => e.id === selectedEventId);
    stats = ev?.stats ?? {
      total: 0,
      attending: 0,
      declined: 0,
      maybe: 0,
      pending: 0,
      totalHeadcount: 0,
      totalInvitations: 0,
      invitationAttending: 0,
      invitationDeclined: 0,
      invitationMaybe: 0,
      invitationPending: 0,
    };
  } else {
    stats = events.reduce(
      (acc, ev) => ({
        total:          acc.total          + ev.stats.total,
        attending:      acc.attending      + ev.stats.attending,
        declined:       acc.declined       + ev.stats.declined,
        maybe:          acc.maybe          + ev.stats.maybe,
        pending:        acc.pending        + ev.stats.pending,
        totalHeadcount: acc.totalHeadcount + ev.stats.totalHeadcount,
        totalInvitations:     acc.totalInvitations     + (ev.stats.totalInvitations ?? 0),
        invitationAttending:  acc.invitationAttending  + (ev.stats.invitationAttending ?? 0),
        invitationDeclined:   acc.invitationDeclined   + (ev.stats.invitationDeclined ?? 0),
        invitationMaybe:      acc.invitationMaybe      + (ev.stats.invitationMaybe ?? 0),
        invitationPending:    acc.invitationPending    + (ev.stats.invitationPending ?? 0),
      }),
      {
        total: 0,
        attending: 0,
        declined: 0,
        maybe: 0,
        pending: 0,
        totalHeadcount: 0,
        totalInvitations: 0,
        invitationAttending: 0,
        invitationDeclined: 0,
        invitationMaybe: 0,
        invitationPending: 0,
      },
    );
  }

  const invitationTotal = stats.totalInvitations ?? stats.total;
  const invitationAttending = stats.invitationAttending ?? stats.attending;
  const invitationDeclined = stats.invitationDeclined ?? stats.declined;
  const invitationMaybe = stats.invitationMaybe ?? stats.maybe;
  const invitationPending = stats.invitationPending ?? stats.pending;

  const responded  = invitationAttending + invitationDeclined + invitationMaybe;
  const safeTotal  = invitationTotal || 1;
  const rate       = invitationTotal === 0 ? 0 : Math.round((responded / safeTotal) * 100);

  // Logical reading order on the bar: positive → uncertain → negative → unknown
  const segments = [
    { key: 'attending', value: invitationAttending, people: stats.attending, label: at.statsAttending, isPending: false },
    { key: 'maybe',     value: invitationMaybe,     people: stats.maybe,     label: at.statsMaybe,     isPending: false },
    { key: 'declined',  value: invitationDeclined,  people: stats.declined,  label: at.statsDeclined,  isPending: false },
    { key: 'pending',   value: invitationPending,   people: stats.pending,   label: at.statsPending,   isPending: true  },
  ] as const;

  const activeSegments = segments.filter((s) => s.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl px-6 py-5 shadow-sm"
      style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
      aria-label="Event statistics"
    >
      {/* ── Hero: Response rate ──────────────────────────────────────────── */}
      <div className="flex items-baseline justify-between gap-4 mb-3">
        <div className="flex items-baseline gap-3 min-w-0">
          <p
            className="font-sans text-4xl font-bold tabular-nums leading-none"
            style={{ color: ESPRESSO }}
          >
            {rate}
            <span
              className="text-2xl font-semibold ml-0.5"
              style={{ color: ESPRESSO_DIM }}
            >
              %
            </span>
          </p>
          <p
            className="text-[10px] font-sans uppercase tracking-widest"
            style={{ color: ESPRESSO_DIM }}
          >
            {at.statsResponseRate}
          </p>
        </div>
        <p
          className="text-xs font-sans tabular-nums whitespace-nowrap"
          style={{ color: ESPRESSO_DIM }}
        >
          {at.statsRespondedInvitations(responded, invitationTotal)}
        </p>
      </div>
      <p className="text-[11px] font-sans tabular-nums mb-3" style={{ color: ESPRESSO_DIM }}>
        {at.statsInvitations}: {invitationTotal} · {at.statsPeople}: {stats.total}
      </p>

      {/* ── Stacked progress bar ─────────────────────────────────────────── */}
      <div
        className="flex h-2 rounded-full overflow-hidden mb-5"
        style={{ gap: '2px' }}
        role="img"
        aria-label={`${invitationAttending} attending invitations, ${invitationMaybe} maybe invitations, ${invitationDeclined} declined invitations, ${invitationPending} no-response invitations`}
      >
        {invitationTotal === 0 ? (
          <div className="flex-1 rounded-full" style={{ background: GOLD_DIM }} />
        ) : (
          activeSegments.map((seg, idx) => {
            const pct     = (seg.value / safeTotal) * 100;
            const isFirst = idx === 0;
            const isLast  = idx === activeSegments.length - 1;
            const radius  = isFirst && isLast
              ? '9999px'
              : isFirst ? '9999px 0 0 9999px'
              : isLast  ? '0 9999px 9999px 0'
              : '0';
            return (
              <div
                key={seg.key}
                style={{
                  width: `${pct}%`,
                  background: seg.isPending ? PENDING_STRIPE : SEGMENT_COLORS[seg.key],
                  borderRadius: radius,
                  minWidth: 4,
                }}
              />
            );
          })
        )}
      </div>

      {/* ── Breakdown grid (pressable to filter the guest list) ──────────── */}
      <div
        className="grid grid-cols-2 sm:grid-cols-4 gap-2"
        role={interactive ? 'group' : undefined}
        aria-label={interactive ? 'Filter guest list by status' : undefined}
      >
        {segments.map((seg) => {
          const pct      = stats.total === 0 ? 0 : Math.round((seg.value / safeTotal) * 100);
          const isActive = activeSet.has(seg.key);
          const disabled = interactive && seg.value === 0;

          const rowContent = (
            <>
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ background: SEGMENT_COLORS[seg.key] }}
                aria-hidden="true"
              />
              <span
                className="text-base font-sans font-bold tabular-nums leading-none"
                style={{ color: STATUS_TEXT_COLORS[seg.key] }}
              >
                {seg.value}
              </span>
              <span
                className="text-[10px] font-sans tabular-nums leading-none"
                style={{ color: 'rgba(42,31,26,0.55)' }}
                title={`${seg.people} ${at.statsPeople.toLowerCase()}`}
              >
                · {seg.people}p
              </span>
              <span
                className="text-[10px] font-sans tabular-nums leading-none"
                style={{ color: 'rgba(42,31,26,0.45)' }}
              >
                {pct}%
              </span>
              <span
                className="text-xs font-sans truncate"
                style={{ color: ESPRESSO_DIM }}
              >
                {seg.label}
              </span>
            </>
          );

          if (!interactive) {
            return (
              <div key={seg.key} className="flex items-center gap-2.5 min-w-0 px-2 py-1.5">
                {rowContent}
              </div>
            );
          }

          return (
            <button
              key={seg.key}
              type="button"
              onClick={() => onToggleStatus?.(seg.key)}
              disabled={disabled}
              aria-pressed={isActive}
              aria-label={
                isActive
                  ? `Remove ${seg.label} filter (${seg.value})`
                  : `Filter guest list to ${seg.label} (${seg.value})`
              }
              className="flex items-center gap-2.5 min-w-0 px-2 py-1.5 rounded-lg text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(184,146,74,0.55)] disabled:cursor-not-allowed disabled:opacity-50 enabled:hover:bg-[rgba(184,146,74,0.08)]"
              style={
                isActive
                  ? {
                      background: `${SEGMENT_COLORS[seg.key]}1F`, // ~12% tint of the segment colour
                      boxShadow: `inset 0 0 0 1px ${SEGMENT_COLORS[seg.key]}`,
                    }
                  : { background: 'transparent', boxShadow: `inset 0 0 0 1px transparent` }
              }
            >
              {rowContent}
            </button>
          );
        })}
      </div>

      {/* ── Footer: Expected headcount (derived metric) ──────────────────── */}
      <div
        className="flex items-baseline justify-between mt-5 pt-3"
        style={{ borderTop: `1px solid ${GOLD_DIM}` }}
        title={at.headcountHint}
      >
        <p
          className="text-[10px] font-sans uppercase tracking-widest"
          style={{ color: ESPRESSO_DIM }}
        >
          {at.statsPeople}
        </p>
        <p
          className="text-base font-sans font-bold tabular-nums leading-none"
          style={{ color: GOLD_ACCESSIBLE }}
        >
          {stats.totalHeadcount}
        </p>
      </div>
    </motion.div>
  );
}
