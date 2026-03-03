import {
  useRef,
  useEffect,
  useState,
  useContext,
  useCallback,
} from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { useTranslation } from '../../lib/i18n';
import { LanguageContext } from '../../context/LanguageContext';
import type { Language } from '../../lib/i18n';
import { EVENT_CONFIG } from '../../config/event';
import LanguageSwitcher from '../../components/LanguageSwitcher';
import {
  SideVinesFirefly,
  FloatingPetals,
  VineCornerTL,
  VineCornerBR,
  generatePetals,
} from '../components/GardenAtmosphere';
import { OttomanArch, BotanicalArch } from '../components/ArchOrnaments';
// ─── Palette ──────────────────────────────────────────────────────────────────
const G = {
  parchment:    '#FDFAF5',
  cream:        '#F5EFE4',
  espresso:     '#2A1F1A',
  espressoDim:  'rgba(42,31,26,0.6)',
  espressoFaint:'rgba(42,31,26,0.28)',
  sage:         '#6B8F71',
  sageDim:      'rgba(107,143,113,0.55)',
  sageLight:    '#A8C4AB',
  rose:         '#C4848C',
  roseLight:    '#E8B4B8',
  blush:        '#F0C8CC',
  terracotta:   '#B5714A',
  gold:         '#B8924A',
  goldDim:      'rgba(184,146,74,0.45)',
};

// ─── Events ──────────────────────────────────────────────────────────────────
const EVENTS = [
  {
    slug:    'ankara',
    city:    'Ankara',
    chapter: 'I',
    country: { en: 'Türkiye', tr: 'Türkiye', uz: 'Turkiya' },
    date:    { en: '19 May 2026', tr: '19 Mayıs 2026', uz: '19 May 2026' },
    venue:   'Sheraton Grand Ankara',
    accent:  G.rose,
    bg:      `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(240,200,204,0.45) 0%, transparent 70%)`,
    flowerColor: G.rose,
  },
  {
    slug:    'tashkent',
    city:    'Tashkent',
    chapter: 'II',
    country: { en: 'Uzbekistan', tr: 'Özbekistan', uz: "O'zbekiston" },
    date:    { en: '12 September 2026', tr: '12 Eylül 2026', uz: '12 Sentyabr 2026' },
    venue:   'Yulduzli Saroy',
    accent:  G.sage,
    bg:      `radial-gradient(ellipse 80% 60% at 50% 40%, rgba(168,196,171,0.4) 0%, transparent 70%)`,
    flowerColor: G.sage,
  },
];

// ─── Global CSS (snap layout only; petals/shimmer/vines moved to index.css) ───
const GLOBAL_CSS = `
  .garden-wrap::-webkit-scrollbar { display: none; }
  .garden-wrap {
    scroll-snap-type: y mandatory;
    scroll-behavior: smooth;
  }
  .garden-slide {
    scroll-snap-align: start;
    height: 100dvh;
  }
  @keyframes gdn-fade-in-up {
    from { opacity: 0; transform: translateY(24px); }
    to   { opacity: 1; transform: translateY(0); }
  }
`;

// ─── Countdown hook ───────────────────────────────────────────────────────────
function useCountdown(target: string) {
  const [t, setT] = useState({ d: 0, h: 0, m: 0, s: 0 });
  useEffect(() => {
    const tick = () => {
      const diff = new Date(target).getTime() - Date.now();
      if (diff <= 0) return;
      setT({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return t;
}

function CountdownDigit({ value, label }: { value: number; label: string }) {
  const str = String(value).padStart(2, '0');
  return (
    <div style={{ textAlign: 'center', minWidth: '3rem' }}>
      <AnimatePresence mode="wait">
        <motion.span
          key={str}
          initial={{ y: -12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 12, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          style={{
            display: 'block',
            fontFamily: 'var(--font-digits)',
            fontWeight: 500,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: G.espresso,
            lineHeight: 1,
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {str}
        </motion.span>
      </AnimatePresence>
      <span style={{
        fontFamily: '"DM Sans", system-ui, sans-serif',
        fontSize: '0.65rem',
        letterSpacing: '0.22em',
        textTransform: 'uppercase',
        color: G.espressoDim,
        display: 'block',
        marginTop: '0.3rem',
      }}>
        {label}
      </span>
    </div>
  );
}

// ─── Petal canvas (Slide 6 shower) ───────────────────────────────────────────
interface CanvasPetal {
  x: number; y: number;
  vx: number; vy: number;
  size: number;
  rotation: number;
  rotSpeed: number;
  color: string;
  opacity: number;
}

function usePetalCanvas(ref: React.RefObject<HTMLCanvasElement>, active: boolean) {
  const petals = useRef<CanvasPetal[]>([]);
  const animId = useRef(0);

  const COLORS = [G.blush, G.roseLight, G.sageLight, '#F5E6D3', G.rose];

  const build = useCallback((w: number, h: number) => {
    petals.current = Array.from({ length: 60 }, () => ({
      x: Math.random() * w,
      y: -20 - Math.random() * h * 0.5,
      vx: (Math.random() - 0.5) * 1.2,
      vy: 0.8 + Math.random() * 1.4,
      size: 6 + Math.random() * 10,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 0.04,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      opacity: 0.5 + Math.random() * 0.4,
    }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!active) return;
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = canvas.width = canvas.offsetWidth;
    let h = canvas.height = canvas.offsetHeight;
    build(w, h);

    const ro = new ResizeObserver(() => {
      w = canvas.width = canvas.offsetWidth;
      h = canvas.height = canvas.offsetHeight;
    });
    ro.observe(canvas);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const p of petals.current) {
        p.x += p.vx + Math.sin(p.rotation) * 0.5;
        p.y += p.vy;
        p.rotation += p.rotSpeed;
        if (p.y > h + 30) {
          p.y = -20;
          p.x = Math.random() * w;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size * 0.45, p.size * 0.75, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      animId.current = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId.current);
      ro.disconnect();
    };
  }, [ref, active, build]);
}

// ─── Dot navigation ───────────────────────────────────────────────────────────

// SideVinesFirefly, FloatingPetals, VineCornerTL, VineCornerBR, generatePetals
// are imported from GardenAtmosphere — see top of file.
// OttomanArch, BotanicalArch are imported from ArchOrnaments — see top of file.


const SLIDE_LABELS = [
  'The Garden Gate',
  'First Bloom',
  'Second Bloom',
  'Until We Meet',
];

// Botanical dot nav — leaf/petal shapes instead of plain circles
const DOT_ACCENTS = [G.rose, G.rose, G.sage, G.gold];

function DotNav({
  current, total, onDotClick,
}: {
  current: number; total: number; onDotClick: (i: number) => void;
}) {
  return (
    <nav
      aria-label="Slide navigation"
      style={{
        position: 'fixed',
        right: '1rem',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {Array.from({ length: total }, (_, i) => {
        const accent = DOT_ACCENTS[i] ?? G.rose;
        const isActive = current === i;
        return (
          <motion.button
            key={i}
            onClick={() => onDotClick(i)}
            aria-label={`Go to ${SLIDE_LABELS[i]}`}
            aria-current={isActive ? 'true' : undefined}
            whileHover={{ scale: 1.15 }}
            whileTap={{ scale: 0.95 }}
            style={{
              width: 44, height: 44,
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              outline: 'none',
              background: 'transparent',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <motion.svg
              viewBox="0 0 12 16"
              width={isActive ? 14 : 10}
              height={isActive ? 18 : 14}
              style={{ flexShrink: 0 }}
              animate={{
                opacity: isActive ? 0.9 : 0.4,
              }}
              transition={{ duration: 0.25 }}
            >
              <ellipse
                cx="6" cy="8" rx="5" ry="7"
                fill={accent}
                transform="rotate(-20 6 8)"
              />
            </motion.svg>
          </motion.button>
        );
      })}
    </nav>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const SLIDE_COUNT = 4;
const HERO_PETALS  = generatePetals(18, [G.blush, G.roseLight, '#F9EDE8', G.sageLight]);
const CLOSE_PETALS = generatePetals(14, [G.blush, G.rose, G.sageLight, '#EDD9C0']);

export default function GardenHomePage() {
  const tl   = useTranslation();
  const { language } = useContext(LanguageContext);
  const lang = language as Language;
  const coupleName = EVENT_CONFIG.names[lang] ?? EVENT_CONFIG.names.en;
  const [firstName, secondName] = coupleName.split(' & ');
  const countdownAnkara   = useCountdown('2026-05-19T14:00:00');
  const countdownTashkent = useCountdown(EVENT_CONFIG.date);

  // Container ref for scroll-snap
  const wrapRef    = useRef<HTMLDivElement>(null);
  const [current, setCurrent] = useState(0);

  // IntersectionObserver to track active slide
  const slide1Ref = useRef<HTMLElement>(null);
  const slide3Ref = useRef<HTMLElement>(null);
  const slide4Ref = useRef<HTMLElement>(null);
  const slide6Ref = useRef<HTMLElement>(null);

  // Stable array — defined before the effects that consume it
  const slideRefArray = [slide1Ref, slide3Ref, slide4Ref, slide6Ref];

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    slideRefArray.forEach((ref, i) => {
      const el = ref.current;
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setCurrent(i); },
        { root: wrapRef.current, threshold: 0.55 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach(o => o.disconnect());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const scrollToSlide = useCallback((i: number) => {
    slideRefArray[i]?.current?.scrollIntoView({ behavior: 'smooth' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // useInView hooks for each slide (for botanical triggers)
  const s1 = useInView(slide1Ref, { root: wrapRef, amount: 0.5, once: false });
  const s3 = useInView(slide3Ref, { root: wrapRef, amount: 0.5, once: false });
  const s4 = useInView(slide4Ref, { root: wrapRef, amount: 0.5, once: false });
  const s6 = useInView(slide6Ref, { root: wrapRef, amount: 0.5, once: false });

  // Petal canvas for slide 6
  const petalCanvasRef = useRef<HTMLCanvasElement>(null);
  usePetalCanvas(petalCanvasRef, s6);

  // Nav scroll state
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const h = () => setScrolled(el.scrollTop > 40);
    el.addEventListener('scroll', h, { passive: true });
    return () => el.removeEventListener('scroll', h);
  }, []);

  // Shared text styles — serif uses CSS custom property so FontSwitcher can hot-swap it
  const serif = 'var(--font-display)';
  const serifStyle = 'var(--font-display-style)' as 'normal' | 'italic';
  const sans  = '"DM Sans", system-ui, sans-serif';

  return (
    <div
      ref={wrapRef}
      className="garden-wrap"
      style={{
        height: '100dvh',
        overflowY: 'scroll',
        overflowX: 'hidden',
        background: G.parchment,
        color: G.espresso,
        scrollbarWidth: 'none',
        position: 'relative',
      }}
    >
      <style>{GLOBAL_CSS}</style>

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
          borderBottom: `1px solid ${scrolled ? G.espressoFaint : 'transparent'}`,
          transition: 'background 0.4s, backdrop-filter 0.4s, border-color 0.4s',
        }}
      >
        <p style={{
          fontFamily: sans, fontSize: '0.72rem', fontWeight: 500,
          letterSpacing: '0.25em', textTransform: 'uppercase', color: G.espressoDim,
        }}>
          {firstName[0]}&thinsp;&amp;&thinsp;{secondName[0]} · 2026
        </p>
        <LanguageSwitcher />
      </motion.header>

      {/* ── Dot nav ── */}
      <DotNav current={current} total={SLIDE_COUNT} onDotClick={scrollToSlide} />

      {/* ── Firefly particle system ── */}
      <SideVinesFirefly wrapRef={wrapRef} />

      {/* ════════════════════════════════════════════════════════════════
           SLIDE 1 — THE GARDEN GATE
      ════════════════════════════════════════════════════════════════ */}
      <section
        ref={slide1Ref}
        className="garden-slide"
        style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          background: G.parchment,
          padding: 'clamp(5rem, 10vh, 8rem) clamp(1.5rem, 6vw, 5rem) clamp(4rem, 9vh, 7rem)',
          textAlign: 'center',
        }}
      >
        {/* Soft background wash */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `
            radial-gradient(ellipse 65% 55% at 50% 45%, rgba(240,200,204,0.3) 0%, transparent 70%),
            radial-gradient(ellipse 50% 40% at 80% 80%, rgba(168,196,171,0.2) 0%, transparent 60%)
          `,
        }} />

        <FloatingPetals petals={HERO_PETALS} />

        {/* Botanical corners */}
        <VineCornerTL inView={s1} />
        <VineCornerBR inView={s1} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          {/* Overline */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={s1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            style={{
              display: 'flex', alignItems: 'center',
              justifyContent: 'center', gap: '1rem', marginBottom: '2.5rem',
            }}
          >
            <div style={{ width: 36, height: 1, background: G.gold, opacity: 0.7 }} aria-hidden="true" />
            <span style={{
              fontFamily: sans, fontSize: '0.72rem',
              letterSpacing: '0.28em', textTransform: 'uppercase',
              color: G.gold, fontWeight: 500,
            }}>
              {tl.cordiallyInvited}
            </span>
            <div style={{ width: 36, height: 1, background: G.gold, opacity: 0.7 }} aria-hidden="true" />
          </motion.div>

          {/* Names */}
          <div style={{ padding: '0.2em 0' }}>
            <motion.h1
              initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
              animate={s1
                ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                : { opacity: 0, y: 36, filter: 'blur(8px)' }}
              transition={{ duration: 1.3, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: serif, fontStyle: serifStyle, fontWeight: 400,
                fontSize: 'clamp(4rem, 17vw, 13rem)',
                lineHeight: 1.15, letterSpacing: '-0.02em',
                color: G.espresso, margin: 0,
              }}
            >
              {firstName}
            </motion.h1>

            <motion.div
              initial={{ opacity: 0, scaleX: 0 }}
              animate={s1 ? { opacity: 1, scaleX: 1 } : { opacity: 0, scaleX: 0 }}
              transition={{ duration: 0.7, delay: 0.9 }}
              style={{
                display: 'flex', alignItems: 'center',
                justifyContent: 'center', gap: '1.5rem',
                margin: 'clamp(0.2rem, 0.8vw, 0.7rem) 0',
                transformOrigin: 'center',
              }}
              aria-hidden="true"
            >
              <div style={{ flex: 1, maxWidth: '6rem', height: 1, background: G.goldDim }} />
              <span style={{
                fontFamily: serif, fontStyle: serifStyle,
                fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                color: G.gold,
              }}>
                &
              </span>
              <div style={{ flex: 1, maxWidth: '6rem', height: 1, background: G.goldDim }} />
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
              animate={s1
                ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                : { opacity: 0, y: 36, filter: 'blur(8px)' }}
              transition={{ duration: 1.3, delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: serif, fontStyle: serifStyle, fontWeight: 400,
                fontSize: 'clamp(3.5rem, 14vw, 11rem)',
                lineHeight: 1.15, letterSpacing: '-0.02em',
                color: G.espresso, margin: 0,
              }}
            >
              {secondName}
            </motion.h1>
          </div>

          {/* Date */}
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={s1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
            transition={{ duration: 0.8, delay: 1.1 }}
            style={{
              fontFamily: sans, fontSize: '0.75rem',
              letterSpacing: '0.25em', textTransform: 'uppercase',
              color: G.gold, marginTop: 'clamp(1rem, 2.5vh, 1.8rem)',
            }}
          >
            {EVENT_CONFIG.displayDate[lang] ?? EVENT_CONFIG.displayDate.en}
          </motion.p>

          {/* Scroll cue */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={s1 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ delay: 1.4 }}
            style={{
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', gap: '0.5rem',
              marginTop: 'clamp(2rem, 5vh, 3.5rem)',
            }}
          >
            <motion.div
              animate={{ y: [0, 6, 0] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
              style={{
                width: '1.1rem', height: '1.85rem', borderRadius: '999px',
                border: '1px solid rgba(42,31,26,0.12)',
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'center', paddingTop: '0.26rem',
              }}
              aria-hidden="true"
            >
              <div style={{ width: 3, height: 5, borderRadius: '999px', background: G.rose }} />
            </motion.div>
            <span style={{
              fontFamily: sans, fontSize: '0.65rem',
              letterSpacing: '0.22em', textTransform: 'uppercase',
              color: G.espressoDim,
            }}>
              {tl.scrollCta}
            </span>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
           SLIDES 2 & 3 — EVENT SLIDES (shared structure)
      ════════════════════════════════════════════════════════════════ */}
      {EVENTS.map((ev, idx) => {
        const isAnkara = idx === 0;
        const slideRef  = isAnkara ? slide3Ref : slide4Ref;
        const inV       = isAnkara ? s3 : s4;
        const bgShift   = isAnkara
          ? `linear-gradient(160deg, ${G.parchment} 0%, rgba(240,200,204,0.15) 100%)`
          : `linear-gradient(160deg, ${G.cream} 0%, rgba(168,196,171,0.15) 100%)`;

        return (
          <section
            key={ev.slug}
            ref={slideRef}
            className="garden-slide"
            style={{
              position: 'relative',
              display: 'flex', flexDirection: 'column',
              justifyContent: 'center', alignItems: 'center',
              background: bgShift,
              padding: '0 clamp(1.5rem, 7vw, 7rem)',
            }}
          >
            <div aria-hidden="true" style={{
              position: 'absolute', inset: 0, zIndex: 0,
              background: ev.bg,
            }} />

            <div style={{
              position: 'relative', zIndex: 10,
              maxWidth: '44rem', width: '100%', textAlign: 'center',
            }}>
              {/* Arch ornament — Ottoman pointed arch for Ankara, dome arch for Tashkent */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={inV ? { opacity: 1 } : { opacity: 0 }}
                transition={{ duration: 0.6 }}
                style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}
              >
                {isAnkara ? <OttomanArch inView={inV} /> : <BotanicalArch inView={inV} />}
              </motion.div>

              {/* Chapter */}
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={inV ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.7, delay: 0.1 }}
                style={{
                  fontFamily: sans, fontSize: '0.65rem',
                  letterSpacing: '0.3em', textTransform: 'uppercase',
                  color: ev.accent, marginBottom: '0.6rem', fontWeight: 500,
                  opacity: 0.85,
                }}
              >
                {tl.chapter} {ev.chapter} · {ev.country[lang] ?? ev.country.en}
              </motion.p>

              {/* City name */}
              <motion.h2
                initial={{ opacity: 0, y: 32 }}
                animate={inV ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
                transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontFamily: serif, fontStyle: serifStyle, fontWeight: 400,
                  fontSize: 'clamp(4rem, 14vw, 11rem)',
                  lineHeight: 1.15, letterSpacing: '-0.02em',
                  color: G.espresso, margin: '0 0 0.5rem', padding: '0.2em 0',
                }}
              >
                {ev.city}
              </motion.h2>

              {/* Divider line */}
              <motion.div
                initial={{ scaleX: 0 }}
                animate={inV ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 1.2, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  height: 1, maxWidth: '20rem', margin: '1.25rem auto',
                  background: `linear-gradient(to right, transparent, ${ev.accent}, transparent)`,
                  transformOrigin: 'center',
                }}
                aria-hidden="true"
              />

              {/* Date & Venue */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={inV ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.8, delay: 0.55 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '2rem' }}
              >
                <p style={{
                  fontFamily: sans, fontSize: '0.7rem',
                  color: G.espressoDim, letterSpacing: '0.03em',
                }}>
                  {ev.date[lang] ?? ev.date.en}
                </p>
                <p style={{
                  fontFamily: serif, fontStyle: serifStyle,
                  fontSize: 'clamp(1.1rem, 2.5vw, 1.35rem)',
                  fontWeight: 500,
                  color: G.espresso,
                }}>
                  {ev.venue}
                </p>
              </motion.div>

              {/* Countdown */}
              {(() => {
                const cd = isAnkara ? countdownAnkara : countdownTashkent;
                return (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={inV ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                    transition={{ duration: 0.8, delay: 0.7 }}
                    style={{
                      display: 'inline-flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: 'clamp(0.75rem, 2.5vw, 2rem)',
                      alignItems: 'center',
                      padding: 'clamp(0.9rem, 2vw, 1.25rem) clamp(1.25rem, 3vw, 2.5rem)',
                      background: 'linear-gradient(135deg, rgba(253,250,245,0.6) 0%, rgba(245,239,228,0.4) 100%)',
                      borderRadius: '12px',
                      border: '1px solid rgba(184,146,74,0.18)',
                      boxShadow: '0 1px 3px rgba(42,31,26,0.04)',
                      marginBottom: '2rem',
                    }}
                  >
                    <CountdownDigit value={cd.d} label={tl.days} />
                    <span style={{ color: G.goldDim, fontFamily: serif, fontSize: '1.4rem', marginBottom: '0.8rem' }} aria-hidden="true">:</span>
                    <CountdownDigit value={cd.h} label={tl.hours} />
                    <span style={{ color: G.goldDim, fontFamily: serif, fontSize: '1.4rem', marginBottom: '0.8rem' }} aria-hidden="true">:</span>
                    <CountdownDigit value={cd.m} label={tl.minutes} />
                    <span style={{ color: G.goldDim, fontFamily: serif, fontSize: '1.4rem', marginBottom: '0.8rem' }} aria-hidden="true">:</span>
                    <CountdownDigit value={cd.s} label={tl.seconds} />
                  </motion.div>
                );
              })()}

              {/* CTA */}
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={inV ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
                transition={{ duration: 0.7, delay: 0.8 }}
              >
                <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    to={`/${ev.slug}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      fontFamily: sans, fontSize: '0.75rem',
                      letterSpacing: '0.15em', textTransform: 'uppercase',
                      color: ev.accent, fontWeight: 500, textDecoration: 'none',
                      padding: '0.7rem 1.6rem',
                      minHeight: '44px',
                      border: ev.accent === G.rose
                        ? '1px solid rgba(196,132,140,0.35)'
                        : '1px solid rgba(107,143,113,0.35)',
                      borderRadius: '999px',
                      background: 'rgba(253,250,245,0.5)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
                      transition: 'background 0.4s, border-color 0.4s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(253,250,245,0.8)';
                      e.currentTarget.style.borderColor = ev.accent === G.rose
                        ? 'rgba(196,132,140,0.5)'
                        : 'rgba(107,143,113,0.5)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(253,250,245,0.5)';
                      e.currentTarget.style.borderColor = ev.accent === G.rose
                        ? 'rgba(196,132,140,0.35)'
                        : 'rgba(107,143,113,0.35)';
                    }}
                  >
                    {tl.viewInvitation} →
                  </Link>
                </motion.div>
              </motion.div>
            </div>

          </section>
        );
      })}

      {/* ════════════════════════════════════════════════════════════════
           SLIDE 4 — UNTIL WE MEET
      ════════════════════════════════════════════════════════════════ */}
      <section
        ref={slide6Ref}
        className="garden-slide"
        style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          background: G.cream,
          padding: '0 clamp(1.5rem, 6vw, 5rem)',
          textAlign: 'center',
        }}
      >
        {/* Petal shower canvas */}
        <canvas
          ref={petalCanvasRef}
          aria-hidden="true"
          style={{
            position: 'absolute', inset: 0,
            width: '100%', height: '100%',
            pointerEvents: 'none', zIndex: 1, opacity: 0.85,
          }}
        />

        {/* Additional floating petals */}
        <FloatingPetals petals={CLOSE_PETALS} />

        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `
            radial-gradient(ellipse 70% 60% at 50% 50%, rgba(240,200,204,0.28) 0%, transparent 70%),
            radial-gradient(ellipse 40% 35% at 15% 85%, rgba(168,196,171,0.22) 0%, transparent 60%)
          `,
        }} />

        {/* Corner vines */}
        <VineCornerTL inView={s6} />
        <VineCornerBR inView={s6} />

        <div style={{ position: 'relative', zIndex: 10 }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={s6 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, type: 'spring' }}
            style={{ marginBottom: '1.5rem' }}
            aria-hidden="true"
          >
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                <motion.ellipse
                  key={i}
                  cx="24" cy="24" rx="10" ry="5"
                  fill={G.rose}
                  transform={`rotate(${angle} 24 24)`}
                  initial={{ opacity: 0, scale: 0 }}
                  animate={s6 ? { opacity: 0.75, scale: 1 } : { opacity: 0, scale: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 + i * 0.07, type: 'spring' }}
                  style={{ transformOrigin: '24px 24px' }}
                />
              ))}
              <circle cx="24" cy="24" r="5" fill={G.gold} opacity="0.9" />
            </svg>
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={s6 ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
            transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: serif, fontStyle: serifStyle, fontWeight: 400,
              fontSize: 'clamp(3.5rem, 10vw, 5.5rem)',
              lineHeight: 1.05, letterSpacing: '-0.01em',
              color: G.espresso, margin: '0 0 0.5rem',
            }}
          >
            {firstName} & {secondName}
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={s6 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            style={{
              fontFamily: sans, fontSize: '0.72rem', letterSpacing: '0.22em',
              textTransform: 'uppercase', color: G.espressoDim,
              marginBottom: '2.5rem',
            }}
          >
            {tl.foreverAndAlways}
          </motion.p>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={s6 ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1.4, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: 1, maxWidth: '20rem', margin: '0 auto 2.5rem',
              background: `linear-gradient(to right, transparent, ${G.gold}, ${G.rose}, transparent)`,
              transformOrigin: 'center',
            }}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={s6 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.8, delay: 0.65 }}
            style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', flexWrap: 'wrap' }}
          >
            {EVENTS.map(ev => (
              <motion.div key={ev.slug} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                <Link
                  to={`/${ev.slug}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    fontFamily: sans, fontSize: '0.75rem',
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    color: ev.accent, fontWeight: 500, textDecoration: 'none',
                    padding: '0.65rem 1.4rem',
                    minHeight: '44px',
                    border: ev.accent === G.rose
                      ? '1px solid rgba(196,132,140,0.35)'
                      : '1px solid rgba(107,143,113,0.35)',
                    borderRadius: '999px',
                    background: 'rgba(253,250,245,0.6)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
                    transition: 'background 0.4s, border-color 0.4s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(253,250,245,0.8)';
                    e.currentTarget.style.borderColor = ev.accent === G.rose
                      ? 'rgba(196,132,140,0.5)'
                      : 'rgba(107,143,113,0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(253,250,245,0.6)';
                    e.currentTarget.style.borderColor = ev.accent === G.rose
                      ? 'rgba(196,132,140,0.35)'
                      : 'rgba(107,143,113,0.35)';
                  }}
                >
                  {ev.city} →
                </Link>
              </motion.div>
            ))}
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={s6 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.9 }}
            style={{
              fontFamily: sans, fontSize: '0.65rem', letterSpacing: '0.15em',
              textTransform: 'uppercase', color: G.espressoDim,
              marginTop: 'clamp(2rem, 5vh, 3.5rem)',
            }}
          >
            {tl.madeWithLove}
          </motion.p>
        </div>
      </section>
    </div>
  );
}
