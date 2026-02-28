import { useRef, useContext, useState } from 'react';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import CountdownTimer from '../components/CountdownTimer';
import LanguageSwitcher from '../components/LanguageSwitcher';
import DarkModeToggle from '../components/ui/DarkModeToggle';
import { SplitText, Reveal } from '../components/ui/AnimatedText';
import MagneticButton from '../components/ui/MagneticButton';
import { rsvpApi } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { LanguageContext } from '../context/LanguageContext';
import type { Language } from '../lib/i18n';

const COUPLE_PHOTO = '/IMG_2524.jpg';

function formatEventDate(dateStr: string, lang: Language): string {
  const d = new Date(dateStr);
  const localeMap: Record<Language, string> = { en: 'en-US', tr: 'tr-TR', uz: 'uz-UZ' };
  return d.toLocaleDateString(localeMap[lang] ?? 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

interface Props { slug: string }

// Animated ambient particle field
function AmbientOrbs({ scrollY }: { scrollY: ReturnType<typeof useScroll>['scrollY'] }) {
  const y1 = useTransform(scrollY, [0, 1000], [0, -200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -120]);
  const y3 = useTransform(scrollY, [0, 1000], [0, -300]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {/* Large gradient orb — top left */}
      <motion.div
        style={{ y: y1, position: 'absolute', top: '-10%', left: '-5%' }}
        className="absolute rounded-full"
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.4, 0.55, 0.4],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div style={{
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,151,90,0.12) 0%, transparent 65%)',
          filter: 'blur(60px)',
        }} />
      </motion.div>

      {/* Mid orb — right */}
      <motion.div
        style={{ y: y2 }}
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.3, 0.45, 0.3],
        }}
        transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
      >
        <div style={{
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,128,138,0.1) 0%, transparent 65%)',
          filter: 'blur(70px)',
          position: 'absolute',
          top: '15%',
          right: '-8%',
        }} />
      </motion.div>

      {/* Small orb — bottom */}
      <motion.div
        style={{ y: y3 }}
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
      >
        <div style={{
          width: 350,
          height: 350,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(196,151,90,0.09) 0%, transparent 65%)',
          filter: 'blur(50px)',
          position: 'absolute',
          bottom: '5%',
          left: '20%',
        }} />
      </motion.div>
    </div>
  );
}

// Floating particles
function FloatingParticles() {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 2 + 1,
    delay: Math.random() * 8,
    duration: Math.random() * 12 + 14,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
      {particles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.y}%`,
            width: p.size,
            height: p.size,
            background: p.id % 3 === 0
              ? 'rgba(196,151,90,0.5)'
              : p.id % 3 === 1
              ? 'rgba(201,128,138,0.4)'
              : 'rgba(245,237,215,0.3)',
          }}
          animate={{
            y: [0, -40, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0, 0.8, 0],
          }}
          transition={{
            duration: p.duration,
            repeat: Infinity,
            delay: p.delay,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

export default function EventPage({ slug }: Props) {
  const detailsRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLElement>(null);
  const t = useTranslation();
  const { language } = useContext(LanguageContext);
  const lang = language as Language;
  const [detailsOpen, setDetailsOpen] = useState(true);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['events', slug],
    queryFn: () => rsvpApi.getEvent(slug),
    staleTime: 5 * 60 * 1000,
  });

  const { scrollY } = useScroll();

  // Parallax layers
  const bgY    = useTransform(scrollY, [0, 800], [0, -200]);
  const midY   = useTransform(scrollY, [0, 800], [0, -100]);
  const textY  = useTransform(scrollY, [0, 600], [0, -60]);
  const photoScale = useTransform(scrollY, [0, 500], [1, 1.08]);
  const titleOpacity = useTransform(scrollY, [0, 350], [1, 0]);

  const scrollToDetails = () =>
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 40,
            height: 40,
            border: '2px solid var(--border-warm)',
            borderTopColor: 'var(--accent-gold)',
            borderRadius: '50%',
          }}
          aria-label={t.loadingInvitation}
        />
      </div>
    );
  }

  // ── Error ──
  if (isError || !event) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: '2rem', marginBottom: '1rem', color: 'var(--accent-rose)' }} aria-hidden="true">◎</p>
          <h1 style={{ fontFamily: '"Cormorant Garamond", Georgia, serif', fontStyle: 'italic', fontSize: '1.8rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>
            {t.invitationNotFound}
          </h1>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{t.invitationNotFoundSub}</p>
        </div>
      </div>
    );
  }

  const displayDate = formatEventDate(event.date, lang);
  const targetDateTime = `${event.date}T${event.time}:00`;
  const [coupleName, eventCity] = event.name.includes(' \u2014 ')
    ? event.name.split(' \u2014 ')
    : [event.name, null];

  const detailItems = [
    {
      icon: '◈',
      label: t.date,
      value: displayDate,
      sub: event.time,
    },
    {
      icon: '◉',
      label: t.venue,
      value: event.venueName,
      sub: event.venueAddress,
    },
    {
      icon: '◇',
      label: t.dressCode,
      value: event.dressCode ?? '—',
      sub: null,
    },
  ];

  return (
    <div
      style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text-primary)', overflowX: 'hidden' }}
    >
      {/* Grain */}
      <div className="grain-overlay" aria-hidden="true" />

      {/* Fixed nav */}
      <header
        className="fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-6 py-4"
        style={{ background: 'transparent' }}
      >
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-overline"
          style={{ color: 'var(--text-tertiary)' }}
        >
          {eventCity ?? coupleName}
        </motion.p>
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <DarkModeToggle />
        </div>
      </header>

      {/* ════════════════════ HERO ════════════════════ */}
      <section
        ref={heroRef}
        style={{ position: 'relative', height: '100vh', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        aria-label="Wedding hero"
      >
        {/* Background layer — parallax slowest */}
        <motion.div
          style={{ y: bgY, position: 'absolute', inset: '-20% -5%' }}
          aria-hidden="true"
        >
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'var(--bg)',
          }} />
          {/* Diagonal gradient overlay */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 80% 70% at 50% 30%, rgba(196,151,90,0.07) 0%, transparent 60%)',
          }} />
        </motion.div>

        {/* Ambient orbs layer */}
        <motion.div style={{ y: bgY, position: 'absolute', inset: 0 }} aria-hidden="true">
          <AmbientOrbs scrollY={scrollY} />
          <FloatingParticles />
        </motion.div>

        {/* Content layer — parallax medium */}
        <motion.div
          style={{ y: textY, position: 'relative', zIndex: 10, width: '100%', maxWidth: '72rem', padding: '0 1.5rem', textAlign: 'center' }}
        >
          {/* Eyebrow */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-overline mb-8"
            style={{ color: 'var(--accent-gold)' }}
          >
            {t.cordiallyInvited}
          </motion.p>

          {/* Couple names — oversized hero type */}
          <motion.div style={{ opacity: titleOpacity }}>
            <div
              style={{
                overflow: 'hidden',
                marginBottom: eventCity ? '0.25rem' : '0',
              }}
            >
              <h1
                aria-label={coupleName}
                style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 'clamp(3.5rem, 10vw, 9rem)',
                  lineHeight: 0.92,
                  color: 'var(--text-primary)',
                  letterSpacing: '-0.02em',
                  display: 'block',
                  margin: '0 auto',
                }}
              >
                <SplitText text={coupleName} delay={0.4} staggerChildren={0.06} />
              </h1>
            </div>

            {eventCity && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0, duration: 0.8 }}
                className="text-overline mt-3 mb-1"
                style={{ color: 'var(--text-tertiary)' }}
              >
                {eventCity}
              </motion.p>
            )}
          </motion.div>

          {/* Photo card — mid parallax */}
          <motion.div
            style={{ y: midY }}
            className="flex justify-center my-10"
          >
            <motion.div
              initial={{ opacity: 0, y: 30, rotate: -2 }}
              animate={{ opacity: 1, y: 0, rotate: -2 }}
              whileHover={{ rotate: 0, scale: 1.03, y: -8 }}
              transition={{ opacity: { duration: 0.8, delay: 0.8 }, y: { duration: 0.8, delay: 0.8 }, rotate: { type: 'spring', stiffness: 200 } }}
              style={{
                position: 'relative',
                display: 'inline-block',
              }}
            >
              {/* Card frame */}
              <div
                style={{
                  padding: '0.75rem',
                  paddingBottom: '3rem',
                  background: 'var(--glass-bg)',
                  backdropFilter: 'blur(20px)',
                  WebkitBackdropFilter: 'blur(20px)',
                  border: '1px solid var(--glass-border)',
                  borderRadius: '0.75rem',
                  boxShadow: '0 30px 80px rgba(0,0,0,0.35), 0 8px 20px rgba(0,0,0,0.2)',
                }}
              >
                <motion.img
                  src={COUPLE_PHOTO}
                  alt="The happy couple"
                  style={{
                    scale: photoScale,
                    width: 'clamp(180px, 28vw, 300px)',
                    height: 'clamp(200px, 32vw, 360px)',
                    objectFit: 'cover',
                    objectPosition: 'center 40%',
                    borderRadius: '0.375rem',
                    display: 'block',
                  }}
                />
                {/* Photo label */}
                <div
                  style={{
                    position: 'absolute',
                    bottom: '0.75rem',
                    left: 0,
                    right: 0,
                    textAlign: 'center',
                    fontFamily: '"Cormorant Garamond", Georgia, serif',
                    fontStyle: 'italic',
                    fontWeight: 300,
                    fontSize: '0.8rem',
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.05em',
                  }}
                  aria-hidden="true"
                >
                  {coupleName}
                </div>
              </div>

              {/* Glow behind card */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-20px',
                  borderRadius: '1rem',
                  background: 'radial-gradient(circle, rgba(196,151,90,0.15) 0%, transparent 70%)',
                  filter: 'blur(20px)',
                  zIndex: -1,
                  pointerEvents: 'none',
                }}
                aria-hidden="true"
              />
            </motion.div>
          </motion.div>

          {/* Date / Time / Dress Code quick stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            className="flex flex-wrap justify-center gap-8 sm:gap-16 mb-10"
          >
            {[
              { label: t.date,      value: displayDate },
              { label: t.time,      value: event.time },
              { label: t.dressCode, value: event.dressCode ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} style={{ textAlign: 'center' }}>
                <p className="text-overline mb-1.5" style={{ color: 'var(--text-tertiary)' }}>{label}</p>
                <p style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontStyle: 'italic',
                  fontSize: 'clamp(0.9rem, 2vw, 1.1rem)',
                  fontWeight: 400,
                  color: 'var(--text-primary)',
                }}>
                  {value}
                </p>
              </div>
            ))}
          </motion.div>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.3 }}
          >
            <MagneticButton
              onClick={scrollToDetails}
              className="btn-primary"
              aria-label={t.learnMore}
            >
              {t.learnMore}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 9l-7 7-7-7"/>
              </svg>
            </MagneticButton>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2 }}
          style={{
            position: 'absolute',
            bottom: '2.5rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.5rem',
          }}
          aria-hidden="true"
        >
          <span className="text-overline" style={{ color: 'var(--text-tertiary)', fontSize: '0.55rem' }}>SCROLL</span>
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, var(--border-warm), transparent)' }}
          />
        </motion.div>

        {/* Bottom fade */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: 160,
            background: 'linear-gradient(to top, var(--bg), transparent)',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />
      </section>

      {/* ════════════════════ COUNTDOWN ════════════════════ */}
      <section
        style={{ padding: '6rem 1.5rem', position: 'relative', overflow: 'hidden' }}
        aria-label="Countdown timer"
      >
        <div style={{ maxWidth: '56rem', margin: '0 auto' }}>
          <Reveal delay={0}>
            <p className="text-overline text-center mb-3" style={{ color: 'var(--accent-gold)' }}>
              Counting Down
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <h2 style={{
              textAlign: 'center',
              fontFamily: '"Cormorant Garamond", Georgia, serif',
              fontStyle: 'italic',
              fontWeight: 300,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              letterSpacing: '-0.02em',
              color: 'var(--text-primary)',
              marginBottom: '3.5rem',
            }}>
              Until We Say <em>I Do</em>
            </h2>
          </Reveal>
          <Reveal delay={0.2}>
            <CountdownTimer targetDate={targetDateTime} />
          </Reveal>
        </div>
      </section>

      {/* ════════════════════ EVENT DETAILS ════════════════════ */}
      <section
        ref={detailsRef}
        style={{ padding: '6rem 1.5rem', position: 'relative' }}
        aria-label="Event details"
      >
        {/* Section background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse 60% 50% at 50% 50%, rgba(196,151,90,0.04) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
          aria-hidden="true"
        />

        <div style={{ maxWidth: '60rem', margin: '0 auto' }}>
          {/* Section header */}
          <Reveal delay={0}>
            <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
              <p className="text-overline mb-3" style={{ color: 'var(--accent-gold)' }}>
                {t.aboutEvent}
              </p>
              <h2 style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                marginBottom: '1.5rem',
              }}>
                {t.eventSubheading}
              </h2>
              <div className="section-line" aria-hidden="true" />
            </div>
          </Reveal>

          {/* Detail cards accordion */}
          <Reveal delay={0.1}>
            <div
              className="glass rounded-3xl overflow-hidden"
              style={{ boxShadow: 'var(--shadow-lg)' }}
            >
              {/* Header with toggle */}
              <button
                onClick={() => setDetailsOpen(v => !v)}
                className="w-full flex items-center justify-between p-6 sm:p-8"
                style={{ background: 'none', border: 'none', color: 'var(--text-primary)', textAlign: 'left' }}
                aria-expanded={detailsOpen}
              >
                <div className="flex items-center gap-3">
                  <span style={{ color: 'var(--accent-gold)', fontSize: '1rem' }} aria-hidden="true">◈</span>
                  <span style={{
                    fontFamily: '"Inter", system-ui, sans-serif',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    color: 'var(--text-secondary)',
                  }}>
                    Event Details
                  </span>
                </div>
                <motion.span
                  animate={{ rotate: detailsOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                  style={{ color: 'var(--text-tertiary)', fontSize: '1.2rem' }}
                  aria-hidden="true"
                >
                  ↓
                </motion.span>
              </button>

              <AnimatePresence initial={false}>
                {detailsOpen && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    {/* Border top */}
                    <div style={{ height: 1, background: 'var(--border)' }} aria-hidden="true" />

                    {/* Detail grid */}
                    <div
                      className="grid sm:grid-cols-3 gap-0"
                      style={{ padding: '0' }}
                    >
                      {detailItems.map((detail, i) => (
                        <div
                          key={i}
                          style={{
                            padding: '1.75rem 2rem',
                            borderRight: i < 2 ? '1px solid var(--border)' : 'none',
                            borderBottom: 0,
                          }}
                        >
                          <div className="flex items-center gap-2 mb-3">
                            <span style={{ color: 'var(--accent-gold)', fontSize: '0.75rem' }} aria-hidden="true">
                              {detail.icon}
                            </span>
                            <p className="text-overline" style={{ color: 'var(--text-tertiary)' }}>
                              {detail.label}
                            </p>
                          </div>
                          <p style={{
                            fontFamily: '"Cormorant Garamond", Georgia, serif',
                            fontStyle: 'italic',
                            fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
                            fontWeight: 400,
                            color: 'var(--text-primary)',
                            marginBottom: detail.sub ? '0.25rem' : 0,
                            lineHeight: 1.3,
                          }}>
                            {detail.value}
                          </p>
                          {detail.sub && (
                            <p style={{
                              fontFamily: '"Inter", system-ui, sans-serif',
                              fontSize: '0.75rem',
                              color: 'var(--text-secondary)',
                              lineHeight: 1.5,
                            }}>
                              {detail.sub}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════ VENUE MAP ════════════════════ */}
      {event.mapsUrl && (
        <section
          style={{ padding: '0 1.5rem 6rem', position: 'relative' }}
          aria-label="Venue location"
        >
          <div style={{ maxWidth: '60rem', margin: '0 auto' }}>
            <Reveal delay={0}>
              <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
                <p className="text-overline mb-3" style={{ color: 'var(--accent-gold)' }}>
                  {t.venue}
                </p>
                <h2 style={{
                  fontFamily: '"Cormorant Garamond", Georgia, serif',
                  fontStyle: 'italic',
                  fontWeight: 300,
                  fontSize: 'clamp(1.8rem, 4vw, 2.8rem)',
                  letterSpacing: '-0.02em',
                  color: 'var(--text-primary)',
                }}>
                  {event.venueName}
                </h2>
                <p style={{
                  fontFamily: '"Inter", system-ui, sans-serif',
                  fontSize: '0.8rem',
                  color: 'var(--text-secondary)',
                  marginTop: '0.5rem',
                }}>
                  {event.venueAddress}
                </p>
              </div>
            </Reveal>

            <Reveal delay={0.15}>
              <div
                className="glass map-container rounded-3xl overflow-hidden"
                style={{
                  height: 'clamp(250px, 40vw, 420px)',
                  boxShadow: 'var(--shadow-lg)',
                }}
              >
                <iframe
                  src={event.mapsUrl}
                  className="w-full h-full border-0"
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title={`Map showing ${event.venueName}`}
                  aria-label={`Map of ${event.venueAddress}`}
                />
              </div>
            </Reveal>
          </div>
        </section>
      )}

      {/* ════════════════════ RSVP NOTICE ════════════════════ */}
      <section
        style={{ padding: '6rem 1.5rem', position: 'relative' }}
        aria-labelledby="rsvp-notice-heading"
      >
        <div style={{ maxWidth: '40rem', margin: '0 auto', textAlign: 'center' }}>
          <Reveal delay={0}>
            <p className="text-overline mb-3" style={{ color: 'var(--accent-rose)' }}>
              {t.kindlyReply}
            </p>
            <h2
              id="rsvp-notice-heading"
              style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontStyle: 'italic',
                fontWeight: 300,
                fontSize: 'clamp(2rem, 5vw, 3.5rem)',
                letterSpacing: '-0.02em',
                color: 'var(--text-primary)',
                marginBottom: '1.5rem',
              }}
            >
              {t.rsvpHeading}
            </h2>
          </Reveal>

          <Reveal delay={0.15}>
            <div
              className="glass rounded-3xl p-8 sm:p-10"
              style={{ boxShadow: 'var(--shadow-lg)', textAlign: 'center' }}
            >
              {/* Envelope icon */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
                style={{
                  width: 64,
                  height: 64,
                  borderRadius: '50%',
                  background: 'rgba(201,128,138,0.08)',
                  border: '1px solid rgba(201,128,138,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.5rem',
                }}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ color: 'var(--accent-rose)' }}
                  aria-hidden="true"
                >
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
              </motion.div>

              <h3 style={{
                fontFamily: '"Cormorant Garamond", Georgia, serif',
                fontStyle: 'italic',
                fontSize: 'clamp(1.2rem, 3vw, 1.6rem)',
                color: 'var(--text-primary)',
                marginBottom: '0.75rem',
              }}>
                {t.personalInviteRequired}
              </h3>
              <p style={{
                fontFamily: '"Inter", system-ui, sans-serif',
                fontSize: '0.82rem',
                lineHeight: 1.7,
                color: 'var(--text-secondary)',
                maxWidth: '28rem',
                margin: '0 auto 2rem',
              }}>
                {t.personalInviteRequiredSub}
              </p>
              <div
                className="inline-flex items-center gap-2"
                style={{
                  padding: '0.6rem 1.25rem',
                  borderRadius: '100px',
                  background: 'rgba(196,151,90,0.08)',
                  border: '1px solid var(--border-warm)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                  strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  style={{ color: 'var(--accent-gold)' }} aria-hidden="true"
                >
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <span className="text-overline" style={{ color: 'var(--accent-gold)' }}>
                  {t.personalLinkHint}
                </span>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ════════════════════ FOOTER ════════════════════ */}
      <footer
        style={{
          padding: '3rem 1.5rem',
          textAlign: 'center',
          borderTop: '1px solid var(--border)',
        }}
      >
        <div className="section-line mb-6" aria-hidden="true" />
        <p style={{
          fontFamily: '"Inter", system-ui, sans-serif',
          fontSize: '0.7rem',
          color: 'var(--text-tertiary)',
        }}>
          {t.madeWithLove}
        </p>
      </footer>
    </div>
  );
}
