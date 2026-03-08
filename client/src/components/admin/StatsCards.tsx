import { motion } from 'framer-motion';
import type { AdminEvent } from '../../lib/api';
import { PARCHMENT, ESPRESSO, ESPRESSO_DIM, GOLD_DIM } from '../../garden/tokens';
import { useAdminTranslation } from '../../lib/i18n/admin';

interface Props {
  events: AdminEvent[];
  selectedEventId: number | null;
  isLoading: boolean;
}

// Warm muted tones consistent with the parchment palette
const SEGMENT_COLORS = {
  attending: '#4A9E78',   // muted emerald
  declined:  '#C0615A',   // muted red
  maybe:     '#C4924A',   // muted amber (matches GOLD family)
  pending:   '#C9BFB6',   // warm light gray
};

const STATUS_TEXT_COLORS = {
  attending: '#2D6B50',
  declined:  '#8B3A36',
  maybe:     '#7A5520',
  pending:   'rgba(42,31,26,0.45)',
};

function SkeletonBar() {
  return (
    <div
      className="rounded-xl px-5 py-4 shadow-sm"
      style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
      aria-hidden="true"
    >
      <div className="flex items-center gap-5 sm:gap-8">
        <div className="flex-shrink-0 space-y-2 text-center min-w-[44px]">
          <div className="h-8 w-8 mx-auto rounded animate-pulse" style={{ background: GOLD_DIM }} />
          <div className="h-2 w-12 mx-auto rounded animate-pulse" style={{ background: GOLD_DIM }} />
        </div>
        <div className="flex-1 min-w-0 space-y-3">
          <div className="h-2 w-full rounded-full animate-pulse" style={{ background: GOLD_DIM }} />
          <div className="flex gap-4">
            {[72, 60, 50, 80].map((w, i) => (
              <div key={i} className="h-2.5 rounded animate-pulse" style={{ background: GOLD_DIM, width: w }} />
            ))}
          </div>
        </div>
        <div
          className="flex-shrink-0 space-y-2 text-center pl-5 sm:pl-8 min-w-[60px]"
          style={{ borderLeft: `1px solid ${GOLD_DIM}` }}
        >
          <div className="h-8 w-8 mx-auto rounded animate-pulse" style={{ background: GOLD_DIM }} />
          <div className="h-2 w-14 mx-auto rounded animate-pulse" style={{ background: GOLD_DIM }} />
        </div>
      </div>
    </div>
  );
}

export default function StatsCards({ events, selectedEventId, isLoading }: Props) {
  const at = useAdminTranslation();

  if (isLoading || events.length === 0) return <SkeletonBar />;

  let stats: AdminEvent['stats'];
  if (selectedEventId !== null) {
    const ev = events.find((e) => e.id === selectedEventId);
    stats = ev?.stats ?? { total: 0, attending: 0, declined: 0, maybe: 0, pending: 0, totalHeadcount: 0 };
  } else {
    stats = events.reduce(
      (acc, ev) => ({
        total:          acc.total          + ev.stats.total,
        attending:      acc.attending      + ev.stats.attending,
        declined:       acc.declined       + ev.stats.declined,
        maybe:          acc.maybe          + ev.stats.maybe,
        pending:        acc.pending        + ev.stats.pending,
        totalHeadcount: acc.totalHeadcount + ev.stats.totalHeadcount,
      }),
      { total: 0, attending: 0, declined: 0, maybe: 0, pending: 0, totalHeadcount: 0 },
    );
  }

  const safeTotal = stats.total || 1;

  const segments = [
    { key: 'attending', value: stats.attending, label: at.statsAttending },
    { key: 'declined',  value: stats.declined,  label: at.statsDeclined  },
    { key: 'maybe',     value: stats.maybe,     label: at.statsMaybe     },
    { key: 'pending',   value: stats.pending,   label: at.statsPending   },
  ] as const;

  const activeSegments = segments.filter((s) => s.value > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="rounded-xl px-5 py-4 shadow-sm"
      style={{ background: PARCHMENT, border: `1px solid ${GOLD_DIM}` }}
      aria-label="Event statistics"
    >
      <div className="flex items-center gap-5 sm:gap-8">

        {/* ── Invited ─────────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 text-center min-w-[44px]">
          <p
            className="font-sans text-3xl font-bold tabular-nums leading-none"
            style={{ color: ESPRESSO }}
          >
            {stats.total}
          </p>
          <p
            className="text-[10px] font-sans uppercase tracking-widest mt-1.5"
            style={{ color: ESPRESSO_DIM }}
          >
            {at.statsInvited}
          </p>
        </div>

        {/* ── Breakdown bar + legend ──────────────────────────────────────── */}
        <div className="flex-1 min-w-0">

          {/* Bar */}
          <div
            className="flex h-2 rounded-full overflow-hidden mb-3"
            style={{ gap: '2px' }}
            role="img"
            aria-label={`${stats.attending} attending, ${stats.declined} declined, ${stats.maybe} maybe, ${stats.pending} no response`}
          >
            {stats.total === 0 ? (
              <div className="flex-1 rounded-full" style={{ background: GOLD_DIM }} />
            ) : (
              activeSegments.map((seg, idx) => {
                const pct = (seg.value / safeTotal) * 100;
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
                      background: SEGMENT_COLORS[seg.key],
                      borderRadius: radius,
                      minWidth: 4,
                    }}
                  />
                );
              })
            )}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-x-5 gap-y-1.5">
            {segments.map((seg) => (
              <div key={seg.key} className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full flex-shrink-0"
                  style={{ background: SEGMENT_COLORS[seg.key] }}
                />
                <span
                  className="text-xs font-sans font-semibold tabular-nums"
                  style={{ color: STATUS_TEXT_COLORS[seg.key] }}
                >
                  {seg.value}
                </span>
                <span className="text-xs font-sans" style={{ color: ESPRESSO_DIM }}>
                  {seg.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Headcount ────────────────────────────────────────────────────── */}
        <div
          className="flex-shrink-0 text-center pl-5 sm:pl-8 min-w-[60px]"
          style={{ borderLeft: `1px solid ${GOLD_DIM}` }}
        >
          <p
            className="font-sans text-3xl font-bold tabular-nums leading-none"
            style={{ color: '#9A7535' }}
          >
            {stats.totalHeadcount}
          </p>
          <p
            className="text-[10px] font-sans uppercase tracking-widest mt-1.5"
            style={{ color: ESPRESSO_DIM }}
          >
            {at.statsHeadcount}
          </p>
          <p
            className="text-[10px] font-sans mt-0.5 whitespace-nowrap"
            style={{ color: 'rgba(42,31,26,0.38)' }}
          >
            {at.statsAttendingGuests}
          </p>
        </div>

      </div>
    </motion.div>
  );
}
