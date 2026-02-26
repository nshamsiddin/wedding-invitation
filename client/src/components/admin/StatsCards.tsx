import { motion } from 'framer-motion';
import type { AdminEvent } from '../../lib/api';

interface Props {
  events: AdminEvent[];
  selectedEventId: number | null;
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
      <div className="h-3 w-20 rounded mb-3 bg-gray-700 animate-pulse opacity-20" />
      <div className="h-8 w-12 rounded mb-1 bg-gray-700 animate-pulse opacity-20" />
      <div className="h-2 w-24 rounded bg-gray-700 animate-pulse opacity-10" />
    </div>
  );
}

interface CardProps {
  label: string;
  value: number | string;
  sub?: string;
  accent: string;
  index: number;
}

function StatCard({ label, value, sub, accent, index }: CardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gray-900 border border-white/10 rounded-xl p-5"
    >
      <p className="text-gray-400 text-xs font-sans uppercase tracking-widest mb-2">{label}</p>
      <p className={`font-serif text-3xl font-bold ${accent} mb-0.5`}>{value}</p>
      {sub && <p className="text-gray-500 text-xs font-sans">{sub}</p>}
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

  // Aggregate stats for selected event or all events
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
    { label: 'Total Invited',   value: stats.total,          accent: 'text-white',        index: 0 },
    { label: 'Attending',       value: stats.attending,      accent: 'text-emerald-400',  index: 1 },
    { label: 'Declined',        value: stats.declined,       accent: 'text-red-400',      index: 2 },
    { label: 'Maybe',           value: stats.maybe,          accent: 'text-yellow-400',   index: 3 },
    { label: 'No Response',     value: stats.pending,        accent: 'text-gray-400',     index: 4 },
    { label: 'Total Headcount', value: stats.totalHeadcount, accent: 'text-gold-400',     index: 5, sub: 'attending guests' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" aria-label="Event statistics">
      {cards.map((card) => <StatCard key={card.label} {...card} />)}
    </div>
  );
}
