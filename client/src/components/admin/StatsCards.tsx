import { motion } from 'framer-motion';
import type { AdminEvent } from '../../lib/api';

interface Props {
  events: AdminEvent[];
  selectedEventId: number | null;
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
      <div className="h-3 w-20 rounded mb-3 bg-gray-200 animate-pulse" />
      <div className="h-8 w-12 rounded mb-1 bg-gray-200 animate-pulse" />
      <div className="h-2 w-24 rounded bg-gray-100 animate-pulse" />
    </div>
  );
}

const ICONS: Record<string, JSX.Element> = {
  total: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  attending: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  declined: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  maybe: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  pending: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  headcount: (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  ),
};

interface CardProps {
  label: string;
  value: number | string;
  sub?: string;
  valueColor: string;
  iconColor: string;
  iconKey: string;
  index: number;
}

function StatCard({ label, value, sub, valueColor, iconColor, iconKey, index }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm"
    >
      <p className={`flex items-center gap-1.5 ${iconColor} text-xs font-sans uppercase tracking-wider mb-2`}>
        {ICONS[iconKey]}
        <span className="text-gray-500">{label}</span>
      </p>
      <p className={`font-sans text-3xl font-bold tabular-nums ${valueColor} mb-0.5`}>{value}</p>
      {sub && <p className="text-gray-400 text-xs font-sans">{sub}</p>}
    </motion.div>
  );
}

export default function StatsCards({ events, selectedEventId, isLoading }: Props) {
  if (isLoading || events.length === 0) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" aria-label="Loading statistics" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
      </div>
    );
  }

  let stats: AdminEvent['stats'];
  if (selectedEventId !== null) {
    const ev = events.find((e) => e.id === selectedEventId);
    stats = ev?.stats ?? { total: 0, attending: 0, declined: 0, maybe: 0, pending: 0, totalHeadcount: 0 };
  } else {
    stats = events.reduce(
      (acc, ev) => ({
        total: acc.total + ev.stats.total,
        attending: acc.attending + ev.stats.attending,
        declined: acc.declined + ev.stats.declined,
        maybe: acc.maybe + ev.stats.maybe,
        pending: acc.pending + ev.stats.pending,
        totalHeadcount: acc.totalHeadcount + ev.stats.totalHeadcount,
      }),
      { total: 0, attending: 0, declined: 0, maybe: 0, pending: 0, totalHeadcount: 0 }
    );
  }

  const cards: CardProps[] = [
    { label: 'Invited',    value: stats.total,          valueColor: 'text-gray-900',    iconColor: 'text-gray-400',    iconKey: 'total',     index: 0 },
    { label: 'Attending',  value: stats.attending,      valueColor: 'text-emerald-700', iconColor: 'text-emerald-500', iconKey: 'attending', index: 1 },
    { label: 'Declined',   value: stats.declined,       valueColor: 'text-red-700',     iconColor: 'text-red-400',     iconKey: 'declined',  index: 2 },
    { label: 'Maybe',      value: stats.maybe,          valueColor: 'text-yellow-700',  iconColor: 'text-yellow-500',  iconKey: 'maybe',     index: 3 },
    { label: 'No Response',value: stats.pending,        valueColor: 'text-gray-500',    iconColor: 'text-gray-400',    iconKey: 'pending',   index: 4 },
    { label: 'Headcount',  value: stats.totalHeadcount, valueColor: 'text-blue-600',    iconColor: 'text-blue-500',    iconKey: 'headcount', index: 5, sub: 'attending guests' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" aria-label="Event statistics">
      {cards.map((card) => <StatCard key={card.label} {...card} />)}
    </div>
  );
}
