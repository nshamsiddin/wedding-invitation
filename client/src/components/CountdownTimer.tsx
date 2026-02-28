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

interface FlipDigitProps {
  value: number;
  label: string;
}

function FlipUnit({ value, label }: FlipDigitProps) {
  const padded = String(value).padStart(2, '0');

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3">
      <div
        className="relative w-[4.5rem] h-[4.5rem] sm:w-24 sm:h-24 rounded-2xl overflow-hidden noise"
        style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px) saturate(1.4)',
          WebkitBackdropFilter: 'blur(20px) saturate(1.4)',
          border: '1px solid var(--glass-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)',
        }}
      >
        {/* Horizontal divider for split-flap look */}
        <div
          className="absolute inset-x-0 z-10 pointer-events-none"
          style={{
            top: '50%',
            height: '1px',
            background: 'var(--border)',
          }}
          aria-hidden="true"
        />
        {/* Subtle top gradient */}
        <div
          className="absolute inset-x-0 top-0 h-1/3 z-10 pointer-events-none"
          style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.15), transparent)' }}
          aria-hidden="true"
        />

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={padded}
            initial={{ y: -40, opacity: 0, filter: 'blur(4px)' }}
            animate={{ y: 0, opacity: 1, filter: 'blur(0px)' }}
            exit={{ y: 40, opacity: 0, filter: 'blur(4px)' }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0 flex items-center justify-center"
            style={{
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontSize: 'clamp(1.75rem, 5vw, 2.75rem)',
              fontWeight: 300,
              color: 'var(--text-primary)',
              letterSpacing: '-0.02em',
              tabularNums: 'tabular-nums' as never,
            } as React.CSSProperties}
            aria-live="off"
          >
            {padded}
          </motion.span>
        </AnimatePresence>
      </div>
      <span
        className="text-overline"
        style={{ color: 'var(--text-tertiary)' }}
      >
        {label}
      </span>
    </div>
  );
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
    const id = setInterval(() => setTimeLeft(calculateTimeLeft(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (!mounted) return null;

  if (isZero(timeLeft)) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="inline-flex items-center gap-3 px-6 py-4 rounded-2xl glass"
        role="status"
        aria-live="polite"
      >
        <span style={{ color: 'var(--accent-rose)' }} aria-hidden="true">♡</span>
        <p style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontStyle: 'italic',
          color: 'var(--accent-rose)',
        }}>
          {t.celebrationBegun}
        </p>
        <span style={{ color: 'var(--accent-rose)' }} aria-hidden="true">♡</span>
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
        <FlipUnit key={label} value={value} label={label} />
      ))}
    </div>
  );
}
