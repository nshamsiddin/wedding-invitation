import { useRef, useContext, useState, useEffect } from 'react';
import type { CSSProperties } from 'react';
import { motion, useInView } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import CountdownTimer from '../components/CountdownTimer';
import LanguageSwitcher from '../components/LanguageSwitcher';
import MagneticButton from '../components/ui/MagneticButton';
import { rsvpApi } from '../lib/api';
import { useTranslation } from '../lib/i18n';
import { LanguageContext } from '../context/LanguageContext';
import type { Language } from '../lib/i18n';
import type { EventData, PartialEventData } from '@invitation/shared';
import {
  SideVinesFirefly,
  FloatingPetals,
  VineCornerTL,
  VineCornerBR,
  generatePetals,
} from '../garden/components/GardenAtmosphere';

// ─── Palette values (inline, no G object per spec) ────────────────────────────
const PARCHMENT   = '#FDFAF5';
const CREAM       = '#F5EFE4';
const ESPRESSO    = '#2A1F1A';
const ESPRESSO_DIM   = 'rgba(42,31,26,0.6)';
const ESPRESSO_FAINT = 'rgba(42,31,26,0.28)';
const GOLD        = '#B8924A';
const GOLD_DIM    = 'rgba(184,146,74,0.45)';
const ROSE        = '#C4848C';

const serif = '"Bodoni Moda", Georgia, serif';
const sans  = '"DM Sans", system-ui, sans-serif';

const HERO_PETALS = generatePetals(14, ['#F0C8CC', '#E8B4B8', '#F9EDE8', '#A8C4AB']);

const COUPLE_PHOTO = '/IMG_2524.jpg';

// iOS 26 liquid-glass: specular on Bodoni's hairline strokes → solid stems → translucent base
const NAME_GRADIENT: CSSProperties = {
  background: `linear-gradient(
    174deg,
    rgba(253,250,245,0.68) 0%,
    ${ESPRESSO}            11%,
    rgba(42,31,26,0.92)    50%,
    rgba(42,31,26,0.60)    100%
  )`,
  WebkitBackgroundClip: 'text',
  backgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  color: 'transparent',
};

function formatEventDate(dateStr: string, lang: Language): string {
  const d = new Date(dateStr);
  const localeMap: Record<Language, string> = { en: 'en-US', tr: 'tr-TR', uz: 'uz-UZ' };
  return d.toLocaleDateString(localeMap[lang] ?? 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function parseCoupleName(rawName: string): [string, string | null] {
  const parts = rawName.split(' & ');
  return parts.length >= 2 ? [parts[0], parts[1]] : [rawName, null];
}

function buildMonogram(firstName: string, secondName: string | null): string {
  if (secondName && firstName.length > 0 && secondName.length > 0) {
    return `${firstName[0]} & ${secondName[0]} · 2026`;
  }
  return firstName.length > 0 ? `${firstName[0]} · 2026` : '· 2026';
}

// ─── Gradient section divider ─────────────────────────────────────────────────
function GardenDivider({ color = GOLD, maxWidth = '20rem', delay = 0 }: { color?: string; maxWidth?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ scaleX: 0 }}
      whileInView={{ scaleX: 1 }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 1.2, delay, ease: [0.22, 1, 0.36, 1] }}
      style={{
        height: 1,
        background: `linear-gradient(to right, transparent, ${color}, transparent)`,
        maxWidth,
        margin: '0 auto',
        transformOrigin: 'center',
      }}
      aria-hidden="true"
    />
  );
}

// ─── Flower SVG icon (garden system, replaces envelope icon) ─────────────────
function FlowerIcon({ inView }: { inView: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={inView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.8, type: 'spring' }}
      style={{ marginBottom: '1.25rem' }}
      aria-hidden="true"
    >
      <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
        {[0, 60, 120, 180, 240, 300].map((angle, i) => (
          <motion.ellipse
            key={i}
            cx="24" cy="24" rx="10" ry="5"
            fill={ROSE}
            transform={`rotate(${angle} 24 24)`}
            initial={{ opacity: 0, scale: 0 }}
            animate={inView ? { opacity: 0.75, scale: 1 } : { opacity: 0, scale: 0 }}
            transition={{ duration: 0.35, delay: 0.1 + i * 0.07, type: 'spring' }}
            style={{ transformOrigin: '24px 24px' }}
          />
        ))}
        <circle cx="24" cy="24" r="5" fill={GOLD} opacity="0.9" />
      </svg>
    </motion.div>
  );
}

// ─── Pill-mouse scroll cue ────────────────────────────────────────────────────
function ScrollCue({ inView }: { inView: boolean }) {
  const t = useTranslation();
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={inView ? { opacity: 1 } : { opacity: 0 }}
      transition={{ delay: 1.6 }}
      style={{
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', gap: '0.5rem',
        marginTop: 'clamp(1.5rem, 4vh, 2.5rem)',
      }}
    >
      <motion.div
        animate={{ y: [0, 6, 0] }}
        transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        style={{
          width: '1.1rem', height: '1.85rem', borderRadius: '999px',
          border: `1px solid ${ESPRESSO_FAINT}`,
          display: 'flex', alignItems: 'flex-start',
          justifyContent: 'center', paddingTop: '0.26rem',
        }}
        aria-hidden="true"
      >
        <div style={{ width: 3, height: 5, borderRadius: '999px', background: ROSE }} />
      </motion.div>
      <span style={{
        fontFamily: sans, fontSize: '0.48rem',
        letterSpacing: '0.32em', textTransform: 'uppercase',
        color: ESPRESSO_FAINT,
      }}>
        {t.scrollDown}
      </span>
    </motion.div>
  );
}

interface Props { slug: string }

export default function EventPage({ slug }: Props) {
  const wrapRef      = useRef<HTMLDivElement>(null);
  const heroRef      = useRef<HTMLElement>(null);
  const countdownRef = useRef<HTMLElement>(null);
  const detailsRef   = useRef<HTMLElement>(null);
  const rsvpRef      = useRef<HTMLElement>(null);

  const countdownInView = useInView(countdownRef, { root: wrapRef, once: true, amount: 0.3 });
  const rsvpInView     = useInView(rsvpRef,       { root: wrapRef, once: true, amount: 0.3 });

  const t    = useTranslation();
  const { language } = useContext(LanguageContext);
  const lang = language as Language;

  // Frosted-glass nav — snap container scroll when wrapRef mounted, else window
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (el) {
      const h = () => setScrolled(el.scrollTop > 40);
      el.addEventListener('scroll', h, { passive: true });
      return () => el.removeEventListener('scroll', h);
    }
    // Fallback for teaser / error views that don't use garden-wrap
    const h = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', h, { passive: true });
    return () => window.removeEventListener('scroll', h);
  }, []);

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['events', slug],
    queryFn: () => rsvpApi.getEvent(slug),
    staleTime: 5 * 60 * 1000,
  });

  const scrollToDetails = () =>
    detailsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  // ── Loading ──
  if (isLoading) {
    return (
      <div style={{ minHeight: '100vh', background: PARCHMENT, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 40, height: 40,
            border: `2px solid ${GOLD_DIM}`,
            borderTopColor: GOLD,
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
      <div style={{ minHeight: '100vh', background: PARCHMENT, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>
          <svg width="40" height="40" viewBox="0 0 48 48" fill="none" style={{ margin: '0 auto 1rem' }} aria-hidden="true">
            {[0, 60, 120, 180, 240, 300].map((angle, i) => (
              <ellipse key={i} cx="24" cy="24" rx="10" ry="5" fill={ROSE} opacity="0.5" transform={`rotate(${angle} 24 24)`} />
            ))}
            <circle cx="24" cy="24" r="5" fill={GOLD} opacity="0.7" />
          </svg>
          <h1 style={{ fontFamily: serif, fontStyle: 'italic', fontSize: '1.8rem', color: ESPRESSO, marginBottom: '0.5rem' }}>
            {t.invitationNotFound}
          </h1>
          <p style={{ fontSize: '0.85rem', color: ESPRESSO_DIM }}>{t.invitationNotFoundSub}</p>
        </div>
      </div>
    );
  }

  // ── Restricted (teaser) view ──
  if ('restricted' in event && (event as PartialEventData).restricted) {
    const teaser = event as PartialEventData;
    const [rawCoupleName, eventCity] = teaser.name.includes(' \u2014 ')
      ? teaser.name.split(' \u2014 ')
      : [teaser.name, null];
    const [firstName, secondName] = parseCoupleName(rawCoupleName);
    const monogram = buildMonogram(firstName, secondName);
    const displayDateTeaser = formatEventDate(teaser.date, lang);

    return (
      <div style={{ minHeight: '100vh', background: PARCHMENT, color: ESPRESSO, overflowX: 'hidden' }}>
        <div className="grain-overlay" aria-hidden="true" />
        <SideVinesFirefly />

        {/* Nav */}
        <motion.header
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400,
            padding: '1rem clamp(1.5rem, 5vw, 3rem)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            background: scrolled ? 'rgba(253,250,245,0.88)' : 'transparent',
            backdropFilter: scrolled ? 'blur(16px)' : 'none',
            WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
            borderBottom: `1px solid ${scrolled ? ESPRESSO_FAINT : 'transparent'}`,
            transition: 'background 0.4s, backdrop-filter 0.4s, border-color 0.4s',
          }}
        >
          <p style={{ fontFamily: sans, fontSize: '0.5rem', fontWeight: 500, letterSpacing: '0.38em', textTransform: 'uppercase', color: ESPRESSO_FAINT }}>
            {monogram}
          </p>
          <LanguageSwitcher />
        </motion.header>

        {/* Teaser hero */}
        <section style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '6rem 1.5rem 4rem', position: 'relative', overflow: 'hidden' }}>
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(240,200,204,0.3) 0%, transparent 70%)' }} />
          <FloatingPetals petals={HERO_PETALS} />
          <VineCornerTL inView={true} />
          <VineCornerBR inView={true} />

          <div style={{ maxWidth: '36rem', width: '100%', textAlign: 'center', position: 'relative', zIndex: 10 }}>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}
            >
              <div style={{ width: 36, height: 1, background: GOLD, opacity: 0.7 }} aria-hidden="true" />
              <span style={{ fontFamily: sans, fontSize: '0.5rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: GOLD, fontWeight: 500 }}>
                {t.cordiallyInvited}
              </span>
              <div style={{ width: 36, height: 1, background: GOLD, opacity: 0.7 }} aria-hidden="true" />
            </motion.div>

            {secondName ? (
              <>
                <motion.h1
                  initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.3, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                  style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(3rem, 11vw, 11rem)', lineHeight: 0.88, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
                >
                  {firstName}
                </motion.h1>
                <motion.div
                  initial={{ opacity: 0, scaleX: 0 }}
                  animate={{ opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.7, delay: 0.9 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', margin: 'clamp(0.2rem, 0.8vw, 0.7rem) 0', transformOrigin: 'center' }}
                  aria-hidden="true"
                >
                  <div style={{ flex: 1, maxWidth: '6rem', height: 1, background: GOLD_DIM }} />
                  <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(1.5rem, 4.5vw, 3.5rem)', color: GOLD }}>&</span>
                  <div style={{ flex: 1, maxWidth: '6rem', height: 1, background: GOLD_DIM }} />
                </motion.div>
                <motion.h1
                  initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 1.3, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(3rem, 11vw, 11rem)', lineHeight: 0.88, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
                >
                  {secondName}
                </motion.h1>
              </>
            ) : (
              <motion.h1
                initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.3, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(3rem, 11vw, 11rem)', lineHeight: 0.88, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
              >
                {rawCoupleName}
              </motion.h1>
            )}

            {eventCity && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.0 }}
                style={{ fontFamily: sans, fontSize: '0.54rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginTop: 'clamp(0.5rem, 1.5vh, 1rem)' }}
              >
                {eventCity}
              </motion.p>
            )}

            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={{ scaleX: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: 1.1 }}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', margin: '2rem 0' }}
              aria-hidden="true"
            >
              <div style={{ height: 1, width: 50, background: `linear-gradient(to right, transparent, ${GOLD_DIM})` }} />
              <span style={{ color: ROSE, fontSize: '0.6rem' }}>♡</span>
              <div style={{ height: 1, width: 50, background: `linear-gradient(to left, transparent, ${GOLD_DIM})` }} />
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(1rem, 3vw, 1.25rem)', color: ESPRESSO_DIM, marginBottom: '3rem' }}
            >
              {displayDateTeaser}
            </motion.p>

            {/* Garden-style RSVP notice */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              style={{ textAlign: 'center' }}
            >
              <FlowerIcon inView={true} />
              <p style={{ fontFamily: sans, fontSize: '0.5rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: ROSE, fontWeight: 500, marginBottom: '0.75rem' }}>
                {t.kindlyReply}
              </p>
              <h2 style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(1.4rem, 3.5vw, 2rem)', lineHeight: 1.2, color: ESPRESSO, marginBottom: '1.25rem' }}>
                {t.personalInviteRequired}
              </h2>
              <GardenDivider color={ROSE} maxWidth="16rem" />
              <p style={{ fontFamily: sans, fontSize: '0.78rem', lineHeight: 1.7, color: ESPRESSO_DIM, marginTop: '1.25rem', maxWidth: '26rem', marginLeft: 'auto', marginRight: 'auto' }}>
                {t.personalInviteRequiredSub}
              </p>
              <p style={{ fontFamily: sans, fontSize: '0.62rem', color: ESPRESSO_FAINT, lineHeight: 1.6, marginTop: '1rem' }}>
                {t.personalLinkHint}
              </p>
            </motion.div>
          </div>
        </section>

        <footer style={{ padding: '2.5rem 1.5rem', textAlign: 'center', borderTop: `1px solid ${ESPRESSO_FAINT}` }}>
          <p style={{ fontFamily: sans, fontSize: '0.7rem', color: ESPRESSO_FAINT }}>{t.madeWithLove}</p>
        </footer>
      </div>
    );
  }

  // ── Full event page ──
  const fullEvent = event as EventData;
  const displayDate = formatEventDate(fullEvent.date, lang);
  const targetDateTime = `${fullEvent.date}T${fullEvent.time}:00`;
  const [rawCoupleName, eventCity] = fullEvent.name.includes(' \u2014 ')
    ? fullEvent.name.split(' \u2014 ')
    : [fullEvent.name, null];
  const [firstName, secondName] = parseCoupleName(rawCoupleName);
  const monogram = buildMonogram(firstName, secondName);

  const detailItems = [
    { label: t.date,      value: displayDate,              sub: fullEvent.time },
    { label: t.venue,     value: fullEvent.venueName,      sub: fullEvent.venueAddress },
    { label: t.dressCode, value: fullEvent.dressCode ?? '—', sub: null },
  ];

  return (
    <div
      ref={wrapRef}
      className="garden-wrap"
      style={{ background: PARCHMENT, color: ESPRESSO }}
    >
      <div className="grain-overlay" aria-hidden="true" />

      {/* Firefly canvas — fixed, covers all sections */}
      <SideVinesFirefly wrapRef={wrapRef} />

      {/* ── Fixed nav ── */}
      <motion.header
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 400,
          padding: '1rem clamp(1.5rem, 5vw, 3rem)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          background: scrolled ? 'rgba(253,250,245,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(16px)' : 'none',
          WebkitBackdropFilter: scrolled ? 'blur(16px)' : 'none',
          borderBottom: `1px solid ${scrolled ? ESPRESSO_FAINT : 'transparent'}`,
          transition: 'background 0.4s, backdrop-filter 0.4s, border-color 0.4s',
        }}
      >
        <p style={{ fontFamily: sans, fontSize: '0.5rem', fontWeight: 500, letterSpacing: '0.38em', textTransform: 'uppercase', color: ESPRESSO_FAINT }}>
          {monogram}
        </p>
        <LanguageSwitcher />
      </motion.header>

      {/* ════════════════════ HERO ════════════════════ */}
      <section
        ref={heroRef}
        className="garden-slide"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: PARCHMENT }}
        aria-label="Wedding hero"
      >
        {/* Background wash */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: 'radial-gradient(ellipse 65% 55% at 50% 45%, rgba(240,200,204,0.3) 0%, transparent 70%)',
        }} />

        <FloatingPetals petals={HERO_PETALS} />
        <VineCornerTL inView={true} />
        <VineCornerBR inView={true} />

        <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '72rem', padding: 'clamp(5rem, 10vh, 8rem) clamp(1.5rem, 6vw, 4rem) clamp(3rem, 7vh, 5rem)', textAlign: 'center' }}>
          {/* Overline with gold lines */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem' }}
          >
            <div style={{ width: 36, height: 1, background: GOLD, opacity: 0.7 }} aria-hidden="true" />
            <span style={{ fontFamily: sans, fontSize: '0.5rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: GOLD, fontWeight: 500 }}>
              {t.cordiallyInvited}
            </span>
            <div style={{ width: 36, height: 1, background: GOLD, opacity: 0.7 }} aria-hidden="true" />
          </motion.div>

          {/* Couple names */}
          {secondName ? (
            <>
              <motion.h1
                initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.3, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(3rem, 11vw, 11rem)', lineHeight: 0.88, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
              >
                {firstName}
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.7, delay: 0.9 }}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', margin: 'clamp(0.2rem, 0.8vw, 0.7rem) 0', transformOrigin: 'center' }}
                aria-hidden="true"
              >
                <div style={{ flex: 1, maxWidth: '6rem', height: 1, background: GOLD_DIM }} />
                <span style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(1.5rem, 4.5vw, 3.5rem)', color: GOLD }}>&</span>
                <div style={{ flex: 1, maxWidth: '6rem', height: 1, background: GOLD_DIM }} />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{ duration: 1.3, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(3rem, 11vw, 11rem)', lineHeight: 0.88, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
              >
                {secondName}
              </motion.h1>
            </>
          ) : (
            <motion.h1
              initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ duration: 1.3, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 400, fontSize: 'clamp(3rem, 11vw, 11rem)', lineHeight: 0.88, letterSpacing: '-0.02em', margin: 0, ...NAME_GRADIENT }}
            >
              {rawCoupleName}
            </motion.h1>
          )}

          {eventCity && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0, duration: 0.8 }}
              style={{ fontFamily: sans, fontSize: '0.54rem', letterSpacing: '0.38em', textTransform: 'uppercase', color: GOLD, marginTop: 'clamp(0.5rem, 1.5vh, 1rem)' }}
            >
              {eventCity}
            </motion.p>
          )}

          {/* Photo card — tilted polaroid */}
          <motion.div
            initial={{ opacity: 0, y: 30, rotate: -2 }}
            animate={{ opacity: 1, y: 0, rotate: -2 }}
            whileHover={{ rotate: 0, scale: 1.02, y: -5 }}
            transition={{
              opacity: { duration: 0.8, delay: 0.8 },
              y: { duration: 0.8, delay: 0.8 },
              rotate: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
              scale:  { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
            }}
            style={{ display: 'inline-block', marginTop: 'clamp(1.5rem, 3vh, 2.5rem)', marginBottom: 'clamp(1rem, 2.5vh, 2rem)', position: 'relative' }}
          >
            <div style={{
              padding: '0.75rem', paddingBottom: '3rem',
              background: 'var(--glass-bg)',
              backdropFilter: 'blur(20px)',
              WebkitBackdropFilter: 'blur(20px)',
              border: '1px solid var(--glass-border)',
              borderRadius: '0.75rem',
              boxShadow: '0 30px 80px rgba(0,0,0,0.25), 0 8px 20px rgba(0,0,0,0.12)',
            }}>
              <img
                src={COUPLE_PHOTO}
                alt="The happy couple"
                style={{
                  width: 'clamp(140px, 22vw, 260px)',
                  height: 'clamp(170px, 28vw, 320px)',
                  objectFit: 'cover',
                  objectPosition: 'center 40%',
                  borderRadius: '0.375rem',
                  display: 'block',
                }}
              />
              <div style={{
                position: 'absolute', bottom: '0.75rem', left: 0, right: 0, textAlign: 'center',
                fontFamily: serif, fontStyle: 'italic', fontWeight: 300,
                fontSize: '0.75rem', color: ESPRESSO_DIM, letterSpacing: '0.05em',
              }} aria-hidden="true">
                {rawCoupleName}
              </div>
            </div>
            <div style={{
              position: 'absolute', inset: '-20px', borderRadius: '1rem',
              background: `radial-gradient(circle, ${GOLD_DIM} 0%, transparent 70%)`,
              filter: 'blur(20px)', zIndex: -1, pointerEvents: 'none',
            }} aria-hidden="true" />
          </motion.div>

          {/* CTA */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 1.1 }}
          >
            <MagneticButton onClick={scrollToDetails} className="btn-primary" aria-label={t.learnMore}>
              {t.learnMore}
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 9l-7 7-7-7"/>
              </svg>
            </MagneticButton>
          </motion.div>

          <ScrollCue inView={true} />
        </div>
      </section>

      {/* ════════════════════ COUNTDOWN ════════════════════ */}
      <section
        ref={countdownRef}
        className="garden-slide"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM }}
        aria-label="Countdown timer"
      >
        {/* Rose wash */}
        <div aria-hidden="true" style={{ position: 'absolute', inset: 0, zIndex: 0, background: 'radial-gradient(ellipse 60% 55% at 50% 50%, rgba(240,200,204,0.2) 0%, transparent 70%)' }} />
        <VineCornerTL inView={countdownInView} />

        <div style={{ maxWidth: '56rem', margin: '0 auto', width: '100%', padding: '0 1.5rem', position: 'relative', zIndex: 5 }}>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            style={{ textAlign: 'center', fontFamily: sans, fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.75rem' }}
          >
            {t.countingDown}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{
              textAlign: 'center', fontFamily: serif, fontStyle: 'italic', fontWeight: 300,
              fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.02em',
              color: ESPRESSO, marginBottom: '3.5rem',
            }}
          >
            {t.untilTheDay}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <CountdownTimer targetDate={targetDateTime} />
          </motion.div>
        </div>
      </section>

      {/* ════════════════════ EVENT DETAILS ════════════════════ */}
      <section
        ref={detailsRef}
        className="garden-slide"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: PARCHMENT, overflowY: 'auto' }}
        aria-label="Event details"
      >
        <div style={{ maxWidth: '60rem', margin: '0 auto', width: '100%', padding: '0 1.5rem' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 0.8 }}
              style={{ fontFamily: sans, fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.75rem' }}
            >
              {t.aboutEvent}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.5 }}
              transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2rem, 5vw, 3.5rem)', letterSpacing: '-0.02em', color: ESPRESSO, marginBottom: '1.5rem' }}
            >
              {t.eventSubheading}
            </motion.h2>
            <GardenDivider />
          </div>

          {/* 3 separate glass detail cards — always visible, no accordion */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(14rem, 1fr))',
              gap: '1rem',
            }}
          >
            {detailItems.map((detail, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.7, delay: 0.05 * i }}
                style={{
                  background: 'rgba(255,252,248,0.85)',
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${GOLD_DIM}`,
                  borderRadius: '18px',
                  padding: 'clamp(1.25rem, 3vw, 2rem)',
                  boxShadow: '0 4px 20px rgba(42,31,26,0.06)',
                }}
              >
                <p style={{ fontFamily: sans, fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: ESPRESSO_FAINT, marginBottom: '0.75rem' }}>
                  {detail.label}
                </p>
                <p style={{ fontFamily: serif, fontStyle: 'italic', fontSize: 'clamp(1rem, 2.5vw, 1.25rem)', fontWeight: 400, color: ESPRESSO, marginBottom: detail.sub ? '0.25rem' : 0, lineHeight: 1.3 }}>
                  {detail.value}
                </p>
                {detail.sub && (
                  <p style={{ fontFamily: sans, fontSize: '0.78rem', color: ESPRESSO_DIM, lineHeight: 1.5 }}>
                    {detail.sub}
                  </p>
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ════════════════════ VENUE MAP ════════════════════ */}
      {fullEvent.mapsUrl && (
        <section
          className="garden-slide"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: CREAM }}
          aria-label="Venue location"
        >
          <div style={{ maxWidth: '60rem', margin: '0 auto', width: '100%', padding: '0 1.5rem' }}>
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 0.8 }}
                style={{ fontFamily: sans, fontSize: '0.55rem', fontWeight: 500, letterSpacing: '0.2em', textTransform: 'uppercase', color: GOLD, marginBottom: '0.75rem' }}
              >
                {t.venue}
              </motion.p>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{ duration: 1.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', letterSpacing: '-0.02em', color: ESPRESSO }}
              >
                {fullEvent.venueName}
              </motion.h2>
              <p style={{ fontFamily: sans, fontSize: '0.8rem', color: ESPRESSO_DIM, marginTop: '0.5rem' }}>
                {fullEvent.venueAddress}
              </p>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.8, delay: 0.15 }}
              className="glass map-container rounded-3xl overflow-hidden"
              style={{ height: 'clamp(250px, 40vw, 420px)', boxShadow: 'var(--shadow-lg)' }}
            >
              <iframe
                src={fullEvent.mapsUrl}
                className="w-full h-full border-0"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title={`Map showing ${fullEvent.venueName}`}
                aria-label={`Map of ${fullEvent.venueAddress}`}
              />
            </motion.div>
          </div>
        </section>
      )}

      {/* ════════════════════ RSVP NOTICE ════════════════════ */}
      <section
        ref={rsvpRef}
        className="garden-slide"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: PARCHMENT }}
        aria-labelledby="rsvp-notice-heading"
      >
        <VineCornerBR inView={rsvpInView} />

        <div style={{ maxWidth: '40rem', margin: '0 auto', width: '100%', padding: '0 1.5rem', textAlign: 'center', position: 'relative', zIndex: 5 }}>
          <FlowerIcon inView={rsvpInView} />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{ fontFamily: sans, fontSize: '0.5rem', letterSpacing: '0.4em', textTransform: 'uppercase', color: ROSE, fontWeight: 500, marginBottom: '0.75rem' }}
          >
            {t.kindlyReply}
          </motion.p>

          <motion.h2
            id="rsvp-notice-heading"
            initial={{ opacity: 0, y: 28 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ fontFamily: serif, fontStyle: 'italic', fontWeight: 300, fontSize: 'clamp(2rem, 5vw, 3.5rem)', lineHeight: 1.1, color: ESPRESSO, margin: '0 0 1rem' }}
          >
            {t.rsvpHeading}
          </motion.h2>

          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: 1, maxWidth: '16rem', margin: '0 auto 1.5rem', background: `linear-gradient(to right, transparent, ${ROSE}, transparent)`, transformOrigin: 'center' }}
            aria-hidden="true"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{ fontFamily: sans, fontSize: '0.78rem', color: ESPRESSO_DIM, lineHeight: 1.7, marginBottom: '0.75rem' }}
          >
            {t.personalInviteRequired}
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            style={{ fontFamily: sans, fontSize: '0.7rem', color: ESPRESSO_FAINT, lineHeight: 1.6 }}
          >
            {t.personalInviteRequiredSub}
          </motion.p>
        </div>

        {/* Footer note inside the last slide — no wasted full-screen slide */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 1, delay: 1 }}
          style={{ position: 'absolute', bottom: 'clamp(1.5rem, 4vh, 2.5rem)', left: 0, right: 0, textAlign: 'center' }}
        >
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: 1, maxWidth: '12rem', margin: '0 auto 0.75rem', background: `linear-gradient(to right, transparent, ${GOLD_DIM}, transparent)`, transformOrigin: 'center' }}
            aria-hidden="true"
          />
          <p style={{ fontFamily: sans, fontSize: '0.62rem', letterSpacing: '0.12em', color: ESPRESSO_FAINT }}>
            {t.madeWithLove}
          </p>
        </motion.div>
      </section>
    </div>
  );
}
