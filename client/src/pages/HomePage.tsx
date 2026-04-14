import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LanguageSwitcher from '../components/LanguageSwitcher';
import DarkModeToggle from '../components/ui/DarkModeToggle';
import { useTranslation } from '../lib/i18n';
import { LanguageContext } from '../context/LanguageContext';
import type { Language } from '../lib/i18n';
import { EVENT_CONFIG } from '../config/event';

const events = [
  {
    slug: 'tashkent',
    city: { en: 'Tashkent', tr: 'Taşkent', uz: 'Toshkent' },
    country: { en: 'Uzbekistan', tr: 'Özbekistan', uz: "O'zbekiston" },
    date: { en: '12 September 2026', tr: '12 Eylül 2026', uz: '12 Sentyabr 2026' },
    venue: 'Yulduzli Saroy',
    index: '01',
  },
  {
    slug: 'ankara',
    city: 'Ankara',
    country: { en: 'Türkiye', tr: 'Türkiye', uz: 'Turkiya' },
    date: { en: '19 May 2026', tr: '19 Mayıs 2026', uz: '19 May 2026' },
    venue: 'Sheraton Grand Ankara',
    index: '02',
  },
];

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
};

const item = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] } },
};

export default function HomePage() {
  const t = useTranslation();
  const { language } = useContext(LanguageContext);
  const lang = language as Language;
  const coupleName = EVENT_CONFIG.names[lang] ?? EVENT_CONFIG.names.en;

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--bg)', color: 'var(--text-primary)', position: 'relative' }}
    >
      {/* Ambient background orbs */}
      <div aria-hidden="true" style={{ position: 'fixed', inset: 0, pointerEvents: 'none', overflow: 'hidden', zIndex: 0 }}>
        <div className="orb" style={{ width: 600, height: 600, top: '-10%', left: '-15%', background: 'radial-gradient(circle, rgba(196,151,90,0.08) 0%, transparent 70%)' }} />
        <div className="orb" style={{ width: 500, height: 500, bottom: '-5%', right: '-10%', background: 'radial-gradient(circle, rgba(201,128,138,0.07) 0%, transparent 70%)' }} />
      </div>

      {/* Top bar */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ background: 'transparent' }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-overline"
          style={{ color: 'var(--text-tertiary)' }}
        >
          Wedding 2026
        </motion.p>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <DarkModeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6 py-24 relative z-10">
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="w-full max-w-3xl"
        >
          {/* Eyebrow */}
          <motion.p
            variants={item}
            className="text-overline text-center mb-6"
            style={{ color: 'var(--accent-gold)' }}
          >
            {t.cordiallyInvited}
          </motion.p>

          {/* Names */}
          <motion.div variants={item} className="text-center mb-4 overflow-hidden">
            <h1
              className="text-display-italic"
              style={{
                fontFamily: '"Bodoni Moda", Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 400,
                fontSize: 'clamp(3rem, 10vw, 7rem)',
                lineHeight: 0.95,
                color: 'var(--text-primary)',
                letterSpacing: '-0.02em',
              }}
            >
              {coupleName}
            </h1>
          </motion.div>

          {/* Thin divider line */}
          <motion.div
            variants={item}
            className="flex items-center justify-center gap-4 my-8"
            aria-hidden="true"
          >
            <div style={{ height: 1, width: 80, background: 'linear-gradient(to right, transparent, var(--border-warm))' }} />
            <span style={{ color: 'var(--accent-rose)', fontSize: '0.7rem' }}>♡</span>
            <div style={{ height: 1, width: 80, background: 'linear-gradient(to left, transparent, var(--border-warm))' }} />
          </motion.div>

          {/* Subtitle */}
          <motion.p
            variants={item}
            className="text-center mb-14"
            style={{
              fontFamily: '"DM Sans", system-ui, sans-serif',
              fontSize: '0.8rem',
              letterSpacing: '0.06em',
              color: 'var(--text-secondary)',
            }}
          >
            {t.chooseCity}
          </motion.p>

          {/* Event cards */}
          <div className="grid sm:grid-cols-2 gap-5">
            {events.map((ev, i) => (
              <motion.div
                key={ev.slug}
                variants={item}
                custom={i}
              >
                <Link
                  to={`/${ev.slug}`}
                  style={{ display: 'block', textDecoration: 'none' }}
                  aria-label={`View invitation for ${typeof ev.city === 'string' ? ev.city : ev.city[lang] ?? ev.city.en} celebration`}
                >
                  <motion.div
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                    className="relative overflow-hidden rounded-3xl p-8"
                    style={{
                      background: 'var(--glass-bg)',
                      backdropFilter: 'blur(20px)',
                      WebkitBackdropFilter: 'blur(20px)',
                      border: '1px solid var(--glass-border)',
                      boxShadow: 'var(--shadow-md)',
                    }}
                  >
                    {/* Card index number */}
                    <span
                      className="absolute top-6 right-6 text-overline"
                      style={{ color: 'var(--text-tertiary)', fontSize: '0.6rem' }}
                      aria-hidden="true"
                    >
                      {ev.index}
                    </span>

                    {/* City name */}
                    <h2
                      style={{
                        fontFamily: '"Bodoni Moda", Georgia, serif',
                        fontStyle: 'italic',
                        fontWeight: 300,
                        fontSize: 'clamp(2rem, 5vw, 2.75rem)',
                        lineHeight: 1,
                        color: 'var(--text-primary)',
                        marginBottom: '0.25rem',
                        letterSpacing: '-0.01em',
                      }}
                    >
                      {typeof ev.city === 'string' ? ev.city : ev.city[lang] ?? ev.city.en}
                    </h2>

                    {/* Country */}
                    <p
                      className="text-overline mb-6"
                      style={{ color: 'var(--text-tertiary)' }}
                    >
                      {ev.country[lang] ?? ev.country.en}
                    </p>

                    {/* Divider */}
                    <div style={{ height: 1, background: 'var(--border-warm)', marginBottom: '1.25rem' }} aria-hidden="true" />

                    {/* Date */}
                    <p
                      style={{
                        fontFamily: '"DM Sans", system-ui, sans-serif',
                        fontSize: '0.8rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '0.25rem',
                      }}
                    >
                      {ev.date[lang] ?? ev.date.en}
                    </p>

                    {/* Venue */}
                    <p
                      style={{
                        fontFamily: '"DM Sans", system-ui, sans-serif',
                        fontSize: '0.72rem',
                        color: 'var(--text-tertiary)',
                        marginBottom: '2rem',
                      }}
                    >
                      {ev.venue}
                    </p>

                    {/* CTA row */}
                    <div className="flex items-center justify-between">
                      <span
                        className="text-overline"
                        style={{ color: 'var(--accent-gold)' }}
                      >
                        {t.viewInvitation}
                      </span>
                      <motion.span
                        whileHover={{ x: 4 }}
                        style={{ color: 'var(--accent-gold)', fontSize: '1rem' }}
                        aria-hidden="true"
                      >
                        →
                      </motion.span>
                    </div>

                    {/* Hover glow */}
                    <motion.div
                      className="absolute inset-0 rounded-3xl pointer-events-none"
                      style={{ background: 'radial-gradient(circle at 50% 0%, rgba(196,151,90,0.06) 0%, transparent 60%)' }}
                      aria-hidden="true"
                    />
                  </motion.div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 py-8 text-center">
        <p
          style={{
            fontFamily: '"DM Sans", system-ui, sans-serif',
            fontSize: '0.7rem',
            color: 'var(--text-tertiary)',
          }}
        >
          {t.madeWithLove}
        </p>
      </footer>
    </div>
  );
}
