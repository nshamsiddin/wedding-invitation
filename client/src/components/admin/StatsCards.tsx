import { motion } from 'framer-motion';
import type { StatsResponse } from '../../lib/api';

interface Props {
  stats: StatsResponse | undefined;
  isLoading: boolean;
}

function SkeletonCard() {
  return (
    <div className="bg-gray-900 border border-white/10 rounded-xl p-5">
      <div className="skeleton-light h-3 w-20 rounded mb-3 opacity-20 bg-gray-700 animate-pulse" />
      <div className="skeleton-light h-8 w-12 rounded mb-1 opacity-20 bg-gray-700 animate-pulse" />
      <div className="skeleton-light h-2 w-24 rounded opacity-10 bg-gray-700 animate-pulse" />
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

export default function StatsCards({ stats, isLoading }: Props) {
  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4" aria-label="Loading statistics" aria-busy="true">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const cards: CardProps[] = [
    { label: 'Total Invited', value: stats.total, accent: 'text-white', index: 0 },
    { label: 'Attending', value: stats.attending, accent: 'text-emerald-400', index: 1 },
    { label: 'Declined', value: stats.declined, accent: 'text-red-400', index: 2 },
    { label: 'Maybe', value: stats.maybe, accent: 'text-yellow-400', index: 3 },
    { label: 'No Response', value: stats.pending, accent: 'text-gray-400', index: 4 },
    {
      label: 'Total Headcount',
      value: stats.totalHeadcount,
      sub: 'attending guests',
      accent: 'text-gold-400',
      index: 5,
    },
  ];

  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4"
      aria-label="Event statistics"
    >
      {cards.map((card) => (
        <StatCard key={card.label} {...card} />
      ))}
    </div>
  );
}
