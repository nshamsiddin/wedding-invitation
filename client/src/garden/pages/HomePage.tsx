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

// ─── Watercolor bloom reveal ──────────────────────────────────────────────────
function WatercolorBloom({
  color, children, inView
}: {
  color: string; children: React.ReactNode; inView: boolean;
}) {
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}>
      <motion.div
        initial={{ clipPath: 'circle(0% at 50% 50%)' }}
        animate={inView
          ? { clipPath: 'circle(160% at 50% 50%)' }
          : { clipPath: 'circle(0% at 50% 50%)' }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        style={{
          position: 'absolute',
          inset: '-1.5rem',
          background: `radial-gradient(ellipse 70% 55% at 50% 50%, ${color} 0%, transparent 80%)`,
          borderRadius: '50%',
          zIndex: 0,
          pointerEvents: 'none',
        }}
        aria-hidden="true"
      />
      <div style={{ position: 'relative', zIndex: 1 }}>{children}</div>
    </div>
  );
}

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
            fontFamily: '"Cormorant Garamond", Georgia, serif',
            fontWeight: 300,
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            color: G.espresso,
            lineHeight: 1,
          }}
        >
          {str}
        </motion.span>
      </AnimatePresence>
      <span style={{
        fontFamily: '"Inter", system-ui, sans-serif',
        fontSize: '0.48rem',
        letterSpacing: '0.28em',
        textTransform: 'uppercase',
        color: G.espressoFaint,
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


// ══════════════════════════════════════════════════════════════
// OttomanArch — pointed arch for Ankara (Turkish/Ottoman style)
// Features: pointed apex, slender columns, diamond capitals,
//           inner concentric arch, crescent + star at keystone
// ══════════════════════════════════════════════════════════════
function OttomanArch({ inView }: { inView: boolean }) {
  const [apexVisible, setApexVisible] = useState(false);

  useEffect(() => {
    if (!inView) { setApexVisible(false); return; }
    const t = setTimeout(() => setApexVisible(true), 1400);
    return () => clearTimeout(t);
  }, [inView]);

  const stroke = G.goldDim;

  return (
    <svg
      viewBox="0 0 200 88"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ width: 'clamp(180px, 55%, 340px)', height: 68, display: 'block', overflow: 'visible' }}
    >
      {/* Left column + pointed arch arm */}
      <motion.path
        d="M 58,86 L 58,62 C 58,38 80,12 100,5"
        fill="none" stroke={stroke} strokeWidth="1.0" strokeLinecap="round" opacity={0.70}
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Right column + pointed arch arm */}
      <motion.path
        d="M 142,86 L 142,62 C 142,38 120,12 100,5"
        fill="none" stroke={stroke} strokeWidth="1.0" strokeLinecap="round" opacity={0.70}
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.3, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Inner concentric arch — ghost echo of main arch */}
      <motion.path
        d="M 68,86 L 68,66 C 68,46 84,18 100,12"
        fill="none" stroke={stroke} strokeWidth="0.35" strokeLinecap="round" opacity={0.35}
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.3, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M 132,86 L 132,66 C 132,46 116,18 100,12"
        fill="none" stroke={stroke} strokeWidth="0.35" strokeLinecap="round" opacity={0.35}
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.3, delay: 0.26, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Lintel — horizontal band where arch springs from columns */}
      <motion.line
        x1="46" y1="62" x2="154" y2="62"
        stroke={stroke} strokeWidth="0.7" opacity={0.45}
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '100px 62px' }}
      />
      {/* Diamond capital — left column */}
      <motion.path
        d="M 58,57 L 53,62 L 58,67 L 63,62 Z"
        fill={G.gold} stroke="none"
        initial={{ opacity: 0, scale: 0 }}
        animate={apexVisible ? { opacity: 0.60, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.4, type: 'spring', bounce: 0.4 }}
        style={{ transformOrigin: '58px 62px' }}
      />
      {/* Diamond capital — right column */}
      <motion.path
        d="M 142,57 L 137,62 L 142,67 L 147,62 Z"
        fill={G.gold} stroke="none"
        initial={{ opacity: 0, scale: 0 }}
        animate={apexVisible ? { opacity: 0.60, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.4, delay: 0.10, type: 'spring', bounce: 0.4 }}
        style={{ transformOrigin: '142px 62px' }}
      />
      {/* Stylized tulip above left capital — the Ottoman lale motif */}
      <motion.path
        d="M 58,57 C 55,51 54,45 58,41 C 62,45 61,51 58,57 Z"
        fill={G.gold} stroke="none"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={apexVisible ? { opacity: 0.38, scaleY: 1 } : { opacity: 0, scaleY: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '58px 57px' }}
      />
      {/* Left tulip side petal */}
      <motion.path
        d="M 56,51 C 52,50 51,46 53,43"
        fill="none" stroke={G.gold} strokeWidth="0.7" strokeLinecap="round" opacity={0}
        initial={{ opacity: 0, pathLength: 0 }}
        animate={apexVisible ? { opacity: 0.45, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M 60,51 C 64,50 65,46 63,43"
        fill="none" stroke={G.gold} strokeWidth="0.7" strokeLinecap="round" opacity={0}
        initial={{ opacity: 0, pathLength: 0 }}
        animate={apexVisible ? { opacity: 0.45, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
        transition={{ duration: 0.5, delay: 0.30, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Stylized tulip above right capital */}
      <motion.path
        d="M 142,57 C 139,51 138,45 142,41 C 146,45 145,51 142,57 Z"
        fill={G.gold} stroke="none"
        initial={{ opacity: 0, scaleY: 0 }}
        animate={apexVisible ? { opacity: 0.38, scaleY: 1 } : { opacity: 0, scaleY: 0 }}
        transition={{ duration: 0.6, delay: 0.20, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '142px 57px' }}
      />
      <motion.path
        d="M 140,51 C 136,50 135,46 137,43"
        fill="none" stroke={G.gold} strokeWidth="0.7" strokeLinecap="round" opacity={0}
        initial={{ opacity: 0, pathLength: 0 }}
        animate={apexVisible ? { opacity: 0.45, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
        transition={{ duration: 0.5, delay: 0.30, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M 144,51 C 148,50 149,46 147,43"
        fill="none" stroke={G.gold} strokeWidth="0.7" strokeLinecap="round" opacity={0}
        initial={{ opacity: 0, pathLength: 0 }}
        animate={apexVisible ? { opacity: 0.45, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
        transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Crescent moon at apex — Ottoman crescent */}
      <motion.path
        d="M 104,2 C 99,2 95,5 95,9 C 95,13 99,16 104,16 C 101,16 98,14 98,10 C 98,6 101,3 104,2 Z"
        fill={G.gold} stroke="none"
        initial={{ opacity: 0, scale: 0 }}
        animate={apexVisible ? { opacity: 0.88, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.45, type: 'spring', bounce: 0.5 }}
        style={{ transformOrigin: '100px 9px' }}
      />
      {/* Small star beside crescent */}
      <motion.circle
        cx={109} cy={7} r={1.3}
        fill={G.gold}
        initial={{ opacity: 0, scale: 0 }}
        animate={apexVisible ? { opacity: 0.80, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.3, delay: 0.14, type: 'spring', bounce: 0.5 }}
        style={{ transformOrigin: '109px 7px' }}
      />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// UzbekArch — Timurid dome arch for Tashkent
// Inspired by Gur-e-Amir & Shah-i-Zinda:
//   wide ribbed dome, drum with geometric tile band,
//   inner concentric iwan arch, 8-pointed Islamic star crown
// ══════════════════════════════════════════════════════════════
function BotanicalArch({ inView }: { inView: boolean }) {
  const [ornVisible, setOrnVisible] = useState(false);

  useEffect(() => {
    if (!inView) { setOrnVisible(false); return; }
    const t = setTimeout(() => setOrnVisible(true), 1400);
    return () => clearTimeout(t);
  }, [inView]);

  const stroke = G.goldDim;
  // 8-pointed star (Rub el Hizb) at (100, 4) — the quintessential Islamic geometric motif
  const star8 = 'M 100,0 L 101.3,2.7 L 104,4 L 101.3,5.3 L 100,8 L 98.7,5.3 L 96,4 L 98.7,2.7 Z';

  return (
    <svg
      viewBox="0 0 200 90"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ width: 'clamp(180px, 55%, 340px)', height: 68, display: 'block', overflow: 'visible' }}
    >
      {/* Main dome — wide Timurid hemisphere, left arm */}
      <motion.path
        d="M 36,66 C 36,34 68,8 100,4"
        fill="none" stroke={stroke} strokeWidth="1.0" strokeLinecap="round" opacity={0.70}
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Main dome — right arm */}
      <motion.path
        d="M 164,66 C 164,34 132,8 100,4"
        fill="none" stroke={stroke} strokeWidth="1.0" strokeLinecap="round" opacity={0.70}
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.3, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Inner concentric iwan arch — layered portal depth */}
      <motion.path
        d="M 52,66 C 52,38 76,12 100,8"
        fill="none" stroke={stroke} strokeWidth="0.4" strokeLinecap="round" opacity={0.32}
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.2, delay: 0.20, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.path
        d="M 148,66 C 148,38 124,12 100,8"
        fill="none" stroke={stroke} strokeWidth="0.4" strokeLinecap="round" opacity={0.32}
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.2, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Dome ribbing — left rib (Gur-e-Amir style fluted dome) */}
      <motion.path
        d="M 68,66 C 72,46 84,20 100,12"
        fill="none" stroke={stroke} strokeWidth="0.28" strokeLinecap="round" opacity={0.22}
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.0, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Dome ribbing — right rib */}
      <motion.path
        d="M 132,66 C 128,46 116,20 100,12"
        fill="none" stroke={stroke} strokeWidth="0.28" strokeLinecap="round" opacity={0.22}
        initial={{ pathLength: 0 }}
        animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.0, delay: 0.42, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Drum top band */}
      <motion.line
        x1="24" y1="66" x2="176" y2="66"
        stroke={stroke} strokeWidth="0.7" opacity={0.45}
        initial={{ scaleX: 0 }}
        animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.8, delay: 0.50, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '100px 66px' }}
      />
      {/* Drum side walls */}
      <motion.line
        x1="36" y1="66" x2="36" y2="88"
        stroke={stroke} strokeWidth="0.8" opacity={0.50}
        initial={{ scaleY: 0 }}
        animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '36px 88px' }}
      />
      <motion.line
        x1="164" y1="66" x2="164" y2="88"
        stroke={stroke} strokeWidth="0.8" opacity={0.50}
        initial={{ scaleY: 0 }}
        animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ duration: 0.5, delay: 0.60, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '164px 88px' }}
      />
      {/* Geometric tile band on drum — row of small diamonds (Registan tilework) */}
      {[48, 61, 74, 87, 100, 113, 126, 139, 152].map((x, i) => (
        <motion.path
          key={x}
          d={`M ${x},67 L ${x + 3},72 L ${x},77 L ${x - 3},72 Z`}
          fill={G.gold} stroke="none"
          initial={{ opacity: 0, scale: 0 }}
          animate={ornVisible ? { opacity: 0.38, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.3, delay: i * 0.045, type: 'spring', bounce: 0.3 }}
          style={{ transformOrigin: `${x}px 72px` }}
        />
      ))}
      {/* 8-pointed Islamic star at crown — Rub el Hizb */}
      <motion.path
        d={star8}
        fill={G.gold} stroke="none"
        initial={{ opacity: 0, scale: 0 }}
        animate={ornVisible ? { opacity: 0.85, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.45, type: 'spring', bounce: 0.5 }}
        style={{ transformOrigin: '100px 4px' }}
      />
    </svg>
  );
}

const SLIDE_LABELS = [
  'The Garden Gate',
  'Written in Blooms',
  'First Bloom',
  'Second Bloom',
  'The Bower',
  'Until We Meet',
];

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
        right: 'clamp(0rem, 1vw, 0.25rem)',
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 500,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      {Array.from({ length: total }, (_, i) => (
        <motion.button
          key={i}
          onClick={() => onDotClick(i)}
          aria-label={`Go to ${SLIDE_LABELS[i]}`}
          aria-current={current === i ? 'true' : undefined}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          style={{
            width: 44, height: 44,
            borderRadius: '50%',
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
          <motion.div
            animate={{
              width: current === i ? 8 : 6,
              height: current === i ? 8 : 6,
              backgroundColor: current === i ? G.rose : G.espressoFaint,
            }}
            transition={{ duration: 0.25 }}
            style={{ borderRadius: '50%', flexShrink: 0 }}
          />
        </motion.button>
      ))}
    </nav>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
const SLIDE_COUNT = 6;
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
  const slide2Ref = useRef<HTMLElement>(null);
  const slide3Ref = useRef<HTMLElement>(null);
  const slide4Ref = useRef<HTMLElement>(null);
  const slide5Ref = useRef<HTMLElement>(null);
  const slide6Ref = useRef<HTMLElement>(null);

  // Stable array — defined before the effects that consume it
  const slideRefArray = [slide1Ref, slide2Ref, slide3Ref, slide4Ref, slide5Ref, slide6Ref];

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
  const s2 = useInView(slide2Ref, { root: wrapRef, amount: 0.5, once: false });
  const s3 = useInView(slide3Ref, { root: wrapRef, amount: 0.5, once: false });
  const s4 = useInView(slide4Ref, { root: wrapRef, amount: 0.5, once: false });
  const s5 = useInView(slide5Ref, { root: wrapRef, amount: 0.5, once: false });
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

  // Shared text styles
  const serif = '"Cormorant Garamond", Georgia, serif';
  const sans  = '"Inter", system-ui, sans-serif';

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
          fontFamily: sans, fontSize: '0.5rem', fontWeight: 500,
          letterSpacing: '0.38em', textTransform: 'uppercase', color: G.espressoFaint,
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
              fontFamily: sans, fontSize: '0.5rem',
              letterSpacing: '0.4em', textTransform: 'uppercase',
              color: G.gold, fontWeight: 500,
            }}>
              {tl.cordiallyInvited}
            </span>
            <div style={{ width: 36, height: 1, background: G.gold, opacity: 0.7 }} aria-hidden="true" />
          </motion.div>

          {/* Names */}
          <div>
            <motion.h1
              initial={{ opacity: 0, y: 36, filter: 'blur(8px)' }}
              animate={s1
                ? { opacity: 1, y: 0, filter: 'blur(0px)' }
                : { opacity: 0, y: 36, filter: 'blur(8px)' }}
              transition={{ duration: 1.3, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: serif, fontStyle: 'italic', fontWeight: 300,
                fontSize: 'clamp(3rem, 13vw, 13rem)',
                lineHeight: 0.88, letterSpacing: '-0.02em',
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
                fontFamily: serif, fontStyle: 'italic',
                fontSize: 'clamp(1.5rem, 4.5vw, 3.5rem)',
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
                fontFamily: serif, fontStyle: 'italic', fontWeight: 300,
                fontSize: 'clamp(2.8rem, 10.5vw, 11rem)',
                lineHeight: 0.88, letterSpacing: '-0.02em',
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
              fontFamily: sans, fontSize: '0.54rem',
              letterSpacing: '0.38em', textTransform: 'uppercase',
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
                border: `1px solid ${G.espressoFaint}`,
                display: 'flex', alignItems: 'flex-start',
                justifyContent: 'center', paddingTop: '0.26rem',
              }}
              aria-hidden="true"
            >
              <div style={{ width: 3, height: 5, borderRadius: '999px', background: G.rose }} />
            </motion.div>
            <span style={{
              fontFamily: sans, fontSize: '0.48rem',
              letterSpacing: '0.32em', textTransform: 'uppercase',
              color: G.espressoFaint,
            }}>
              {tl.scrollDown}
            </span>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
           SLIDE 2 — WRITTEN IN BLOOMS
      ════════════════════════════════════════════════════════════════ */}
      <section
        ref={slide2Ref}
        className="garden-slide"
        style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          background: G.cream,
          overflow: 'hidden',
          padding: '0 clamp(1.5rem, 8vw, 8rem)',
          textAlign: 'center',
        }}
      >
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `
            radial-gradient(ellipse 55% 50% at 20% 75%, rgba(168,196,171,0.25) 0%, transparent 65%),
            radial-gradient(ellipse 45% 40% at 80% 25%, rgba(240,200,204,0.28) 0%, transparent 60%)
          `,
        }} />

        <div style={{ position: 'relative', zIndex: 5, maxWidth: '56rem', width: '100%' }}>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={s2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.8 }}
            style={{
              fontFamily: sans, fontSize: '0.5rem', letterSpacing: '0.4em',
              textTransform: 'uppercase', color: G.sageDim, marginBottom: '2.5rem',
            }}
          >
            Written in blooms
          </motion.p>

          <WatercolorBloom color="rgba(240,200,204,0.35)" inView={s2}>
            <motion.h2
              initial={{ opacity: 0, y: 24 }}
              animate={s2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 }}
              transition={{ duration: 1.1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              style={{
                fontFamily: serif, fontStyle: 'italic', fontWeight: 300,
                fontSize: 'clamp(2rem, 5vw, 4rem)',
                lineHeight: 1.3, letterSpacing: '0.01em',
                color: G.espresso, margin: 0, padding: '0.5rem',
              }}
            >
              "Two souls, one love,
              <br />
              <span style={{ color: G.rose }}>blooming together</span>
              <br />
              forever."
            </motion.h2>
          </WatercolorBloom>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={s2 ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1.4, delay: 0.6, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: 1,
              background: `linear-gradient(to right, transparent, ${G.rose}, transparent)`,
              margin: '2.5rem 0',
              transformOrigin: 'center',
            }}
            aria-hidden="true"
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={s2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.9, delay: 0.7 }}
          >
            <p style={{
              fontFamily: serif, fontStyle: 'italic', fontWeight: 300,
              fontSize: 'clamp(3rem, 8vw, 6rem)',
              lineHeight: 0.95, letterSpacing: '-0.01em',
              color: G.espresso, margin: 0,
            }}>
              <span className="gdn-gold-shimmer">{firstName}</span>
              <span style={{ color: G.gold, margin: '0 0.3em' }}>&</span>
              <span className="gdn-gold-shimmer">{secondName}</span>
            </p>
            <p style={{
              fontFamily: sans, fontSize: '0.56rem',
              letterSpacing: '0.25em', textTransform: 'uppercase',
              color: G.espressoFaint, marginTop: '1.2rem',
            }}>
              {EVENT_CONFIG.displayDate[lang] ?? EVENT_CONFIG.displayDate.en}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
           SLIDES 3 & 4 — EVENT SLIDES (shared structure)
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
              overflow: 'hidden',
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
                  fontFamily: sans, fontSize: '0.5rem',
                  letterSpacing: '0.4em', textTransform: 'uppercase',
                  color: ev.accent, marginBottom: '0.6rem', fontWeight: 500,
                }}
              >
                Chapter {ev.chapter} · {ev.country[lang] ?? ev.country.en}
              </motion.p>

              {/* City name */}
              <motion.h2
                initial={{ opacity: 0, y: 32 }}
                animate={inV ? { opacity: 1, y: 0 } : { opacity: 0, y: 32 }}
                transition={{ duration: 1.1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                style={{
                  fontFamily: serif, fontStyle: 'italic', fontWeight: 300,
                  fontSize: 'clamp(3rem, 11vw, 11rem)',
                  lineHeight: 0.88, letterSpacing: '-0.02em',
                  color: G.espresso, margin: '0 0 0.5rem',
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
                  fontFamily: sans, fontSize: '0.72rem',
                  color: G.espressoDim, letterSpacing: '0.03em',
                }}>
                  {ev.date[lang] ?? ev.date.en}
                </p>
                <p style={{
                  fontFamily: serif, fontStyle: 'italic',
                  fontSize: '1rem', color: G.espressoFaint,
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
                      background: 'rgba(253,250,245,0.7)',
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      borderRadius: '18px',
                      border: `1px solid ${G.goldDim}`,
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
                <motion.div whileHover={{ scale: 1.04, y: -2 }} whileTap={{ scale: 0.97 }}>
                  <Link
                    to={`/${ev.slug}`}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                      fontFamily: sans, fontSize: '0.56rem',
                      letterSpacing: '0.2em', textTransform: 'uppercase',
                      color: ev.accent, fontWeight: 500, textDecoration: 'none',
                      padding: '0.7rem 1.6rem',
                      minHeight: '44px',
                      border: `1px solid ${ev.accent}55`,
                      borderRadius: '999px',
                      background: 'rgba(253,250,245,0.5)',
                      backdropFilter: 'blur(8px)',
                      WebkitBackdropFilter: 'blur(8px)',
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
           SLIDE 5 — THE RSVP BOWER
      ════════════════════════════════════════════════════════════════ */}
      <section
        ref={slide5Ref}
        className="garden-slide"
        style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          background: G.parchment,
          overflow: 'hidden',
          padding: '0 clamp(1.5rem, 6vw, 5rem)',
          textAlign: 'center',
        }}
      >
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, zIndex: 0,
          background: `
            radial-gradient(ellipse 60% 55% at 50% 50%, rgba(240,200,204,0.22) 0%, transparent 70%),
            radial-gradient(ellipse 40% 35% at 85% 15%, rgba(168,196,171,0.2) 0%, transparent 60%)
          `,
        }} />

        {/* Climbing vine borders — left */}
        <svg
          aria-hidden="true"
          className="gdn-side-vine"
          viewBox="0 0 60 400"
          style={{
            position: 'absolute', left: 'clamp(0.5rem, 2vw, 2rem)',
            top: '50%', transform: 'translateY(-50%)',
            height: '70vh', width: 'auto',
          }}
        >
          <motion.path
            d="M30 400 C 20 360, 40 320, 25 280 C 10 240, 42 200, 28 160 C 14 120, 38 80, 30 40"
            fill="none" stroke={G.sage} strokeWidth="1.5" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={s5 ? { pathLength: 1, opacity: 0.55 } : { pathLength: 0, opacity: 0 }}
            transition={{ duration: 2.0, ease: [0.22, 1, 0.36, 1] }}
          />
          {[80, 160, 240, 320].map((y, i) => (
            <motion.circle
              key={i}
              cx={i % 2 === 0 ? 18 : 42} cy={y} r={4}
              fill={i % 2 === 0 ? G.rose : G.sageLight}
              initial={{ opacity: 0, scale: 0 }}
              animate={s5 ? { opacity: 0.7, scale: 1 } : { opacity: 0, scale: 0 }}
              transition={{ duration: 0.4, delay: 0.4 + i * 0.25, type: 'spring' }}
            />
          ))}
        </svg>

        {/* Climbing vine borders — right */}
        <svg
          aria-hidden="true"
          className="gdn-side-vine"
          viewBox="0 0 60 400"
          style={{
            position: 'absolute', right: 'clamp(0.5rem, 2vw, 2rem)',
            top: '50%', transform: 'translateY(-50%) scaleX(-1)',
            height: '70vh', width: 'auto',
          }}
        >
          <motion.path
            d="M30 400 C 20 360, 40 320, 25 280 C 10 240, 42 200, 28 160 C 14 120, 38 80, 30 40"
            fill="none" stroke={G.sage} strokeWidth="1.5" strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={s5 ? { pathLength: 1, opacity: 0.55 } : { pathLength: 0, opacity: 0 }}
            transition={{ duration: 2.0, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          />
          {[80, 160, 240, 320].map((y, i) => (
            <motion.circle
              key={i}
              cx={i % 2 === 0 ? 18 : 42} cy={y} r={4}
              fill={i % 2 === 0 ? G.blush : G.sage}
              initial={{ opacity: 0, scale: 0 }}
              animate={s5 ? { opacity: 0.7, scale: 1 } : { opacity: 0, scale: 0 }}
              transition={{ duration: 0.4, delay: 0.6 + i * 0.25, type: 'spring' }}
            />
          ))}
        </svg>

        <div style={{ position: 'relative', zIndex: 10, maxWidth: '36rem', width: '100%' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={s5 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.8, type: 'spring' }}
            style={{ marginBottom: '1.25rem' }}
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
                  animate={s5 ? { opacity: 0.75, scale: 1 } : { opacity: 0, scale: 0 }}
                  transition={{ duration: 0.35, delay: 0.1 + i * 0.07, type: 'spring' }}
                  style={{ transformOrigin: '24px 24px' }}
                />
              ))}
              <circle cx="24" cy="24" r="5" fill={G.gold} opacity="0.9" />
            </svg>
          </motion.div>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={s5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            style={{
              fontFamily: sans, fontSize: '0.5rem', letterSpacing: '0.4em',
              textTransform: 'uppercase', color: G.rose, fontWeight: 500,
              marginBottom: '0.75rem',
            }}
          >
            {tl.kindlyReply}
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 28 }}
            animate={s5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 28 }}
            transition={{ duration: 1.0, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{
              fontFamily: serif, fontStyle: 'italic', fontWeight: 300,
              fontSize: 'clamp(2.2rem, 6vw, 4rem)',
              lineHeight: 1.1, color: G.espresso, margin: '0 0 1rem',
            }}
          >
            Join us in the garden
          </motion.h2>

          <motion.div
            initial={{ scaleX: 0 }}
            animate={s5 ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 1.2, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            style={{
              height: 1, maxWidth: '16rem', margin: '0 auto 1.5rem',
              background: `linear-gradient(to right, transparent, ${G.rose}, transparent)`,
              transformOrigin: 'center',
            }}
            aria-hidden="true"
          />

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={s5 ? { opacity: 1, y: 0 } : { opacity: 0, y: 16 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            style={{
              fontFamily: sans, fontSize: '0.7rem', color: G.espressoDim,
              lineHeight: 1.7, marginBottom: '1.5rem',
            }}
          >
            {tl.rsvpDeadlineNote}{' '}
            <strong style={{ color: G.espresso }}>
              {EVENT_CONFIG.rsvpDeadlineDisplay[lang] ?? EVENT_CONFIG.rsvpDeadlineDisplay.en}
            </strong>
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={s5 ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            style={{
              fontFamily: sans, fontSize: '0.62rem', color: G.espressoFaint,
              lineHeight: 1.6,
            }}
          >
            {tl.personalInviteRequiredSub}
          </motion.p>
        </div>
      </section>

      {/* ════════════════════════════════════════════════════════════════
           SLIDE 6 — UNTIL WE MEET
      ════════════════════════════════════════════════════════════════ */}
      <section
        ref={slide6Ref}
        className="garden-slide"
        style={{
          position: 'relative',
          display: 'flex', flexDirection: 'column',
          justifyContent: 'center', alignItems: 'center',
          background: G.cream,
          overflow: 'hidden',
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
              fontFamily: serif, fontStyle: 'italic', fontWeight: 300,
              fontSize: 'clamp(2.5rem, 7vw, 5.5rem)',
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
              fontFamily: sans, fontSize: '0.52rem', letterSpacing: '0.35em',
              textTransform: 'uppercase', color: G.espressoFaint,
              marginBottom: '2.5rem',
            }}
          >
            Forever & Always · 2026
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
              <motion.div key={ev.slug} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to={`/${ev.slug}`}
                  style={{
                    display: 'inline-flex', alignItems: 'center',
                    fontFamily: sans, fontSize: '0.54rem',
                    letterSpacing: '0.2em', textTransform: 'uppercase',
                    color: ev.accent, fontWeight: 500, textDecoration: 'none',
                    padding: '0.65rem 1.4rem',
                    minHeight: '44px',
                    border: `1px solid ${ev.accent}55`,
                    borderRadius: '999px',
                    background: 'rgba(253,250,245,0.6)',
                    backdropFilter: 'blur(10px)',
                    WebkitBackdropFilter: 'blur(10px)',
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
              fontFamily: sans, fontSize: '0.48rem', letterSpacing: '0.2em',
              textTransform: 'uppercase', color: G.espressoFaint,
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
