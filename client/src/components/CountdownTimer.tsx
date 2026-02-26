import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

function isZero(t: TimeLeft) {
  return t.days === 0 && t.hours === 0 && t.minutes === 0 && t.seconds === 0;
}

interface Props {
  targetDate: string;
}

export default function CountdownTimer({ targetDate }: Props) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() =>
    calculateTimeLeft(targetDate)
  );
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

  if (isZero(timeLeft)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="flex items-center justify-center gap-3 px-6 py-4 rounded-2xl"
        style={{
          background: 'rgba(255,255,255,0.75)',
          border: '1px solid rgba(201,112,122,0.3)',
          boxShadow: '0 4px 24px rgba(201,112,122,0.12)',
        }}
        role="status"
        aria-live="polite"
      >
        <span className="text-tulip-400 text-xl" aria-hidden="true">♡</span>
        <p className="font-serif text-lg text-tulip-600 italic">
          {t.celebrationBegun}
        </p>
        <span className="text-tulip-400 text-xl" aria-hidden="true">♡</span>
      </motion.div>
    );
  }

  const units = [
    { label: t.days,    value: timeLeft.days },
    { label: t.hours,   value: timeLeft.hours },
    { label: t.minutes, value: timeLeft.minutes },
    { label: t.seconds, value: timeLeft.seconds },
  ];

  return (
    <div
      className="flex flex-wrap justify-center gap-3 sm:gap-5"
      role="timer"
      aria-label="Countdown to the event"
    >
      {units.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center">
          <div
            className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-2xl overflow-hidden relative"
            style={{
              background: 'rgba(255,255,255,0.75)',
              border: '1px solid rgba(196,154,108,0.25)',
              boxShadow:
                '0 4px 16px rgba(201,112,122,0.10), 0 1px 4px rgba(196,154,108,0.10)',
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={value}
                initial={{ y: -28, opacity: 0 }}
                animate={{ y: 0,   opacity: 1 }}
                exit={{   y:  28,  opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                className="font-serif text-3xl sm:text-4xl font-bold tabular-nums absolute"
                style={{ color: '#C9707A' }}
                aria-live="off"
              >
                {String(value).padStart(2, '0')}
              </motion.span>
            </AnimatePresence>
          </div>
          <span className="mt-2 text-xs font-sans font-bold uppercase tracking-widest text-stone-400">
            {label}
          </span>
        </div>
      ))}
    </div>
  );
}
