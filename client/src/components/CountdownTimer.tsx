import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../lib/i18n';

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculateTimeLeft(targetDate: string): TimeLeft {
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

interface Props {
  targetDate: string;
}

export default function CountdownTimer({ targetDate }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(targetDate));
  const [mounted, setMounted] = useState(false);
  const t = useTranslation();

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [targetDate]);

  if (!mounted) return null;

  const units = [
    { label: t.days,    value: timeLeft.days },
    { label: t.hours,   value: timeLeft.hours },
    { label: t.minutes, value: timeLeft.minutes },
    { label: t.seconds, value: timeLeft.seconds },
  ];

  return (
    <div
      className="flex flex-wrap justify-center gap-4 sm:gap-6"
      role="timer"
      aria-label="Countdown to the event"
    >
      {units.map(({ label, value }) => (
        <motion.div
          key={label}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="flex flex-col items-center"
        >
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-xl"
            style={{
              background: 'rgba(30,27,46,0.7)',
              border: '1px solid rgba(201,165,90,0.25)',
              boxShadow: '0 0 20px rgba(201,165,90,0.06), inset 0 1px 0 rgba(201,165,90,0.08)',
            }}
          >
            <span className="font-serif text-3xl sm:text-4xl font-bold text-elfgold-300 tabular-nums text-glow-gold">
              {String(value).padStart(2, '0')}
            </span>
          </div>
          <span className="mt-2 text-xs sm:text-sm font-serif uppercase tracking-widest text-silver-400/80">
            {label}
          </span>
        </motion.div>
      ))}
    </div>
  );
}
