import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GOLD, GOLD_DIM } from '../tokens';

// ══════════════════════════════════════════════════════════════
// OttomanArch — pointed arch for Ankara (Turkish/Ottoman style)
// ══════════════════════════════════════════════════════════════
export function OttomanArch({ inView }: { inView: boolean }) {
  const [apexVisible, setApexVisible] = useState(false);

  useEffect(() => {
    if (!inView) { setApexVisible(false); return; }
    const t = setTimeout(() => setApexVisible(true), 1400);
    return () => clearTimeout(t);
  }, [inView]);

  const stroke = GOLD_DIM;

  const star5 = [
    '109.0,4.4',
    '109.6,6.2',
    '111.5,6.2',
    '110.0,7.3',
    '110.5,9.1',
    '109.0,8.1',
    '107.5,9.1',
    '108.0,7.3',
    '106.5,6.2',
    '108.4,6.2',
  ].join(' ');

  return (
    <svg
      viewBox="0 0 200 88"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ width: 'clamp(180px, 55%, 340px)', height: 68, display: 'block', overflow: 'visible' }}
    >
      <defs>
        <mask id="hilal-mask">
          <circle cx="100" cy="9" r="7" fill="white" />
          <circle cx="103.2" cy="9" r="6.1" fill="black" />
        </mask>
      </defs>
      <motion.path d="M 58,86 L 58,62 C 58,38 80,12 100,5"
        fill="none" stroke={stroke} strokeWidth="1.0" strokeLinecap="round" opacity={0.70}
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d="M 142,86 L 142,62 C 142,38 120,12 100,5"
        fill="none" stroke={stroke} strokeWidth="1.0" strokeLinecap="round" opacity={0.70}
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.3, delay: 0.08, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d="M 68,86 L 68,66 C 68,46 84,18 100,12"
        fill="none" stroke={stroke} strokeWidth="0.35" strokeLinecap="round" opacity={0.35}
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.3, delay: 0.18, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d="M 132,86 L 132,66 C 132,46 116,18 100,12"
        fill="none" stroke={stroke} strokeWidth="0.35" strokeLinecap="round" opacity={0.35}
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.3, delay: 0.26, ease: [0.22, 1, 0.36, 1] }} />
      <motion.line x1="46" y1="62" x2="154" y2="62"
        stroke={stroke} strokeWidth="0.7" opacity={0.45}
        initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.7, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '100px 62px' }} />
      <motion.path d="M 58,57 L 53,62 L 58,67 L 63,62 Z"
        fill={GOLD} stroke="none"
        initial={{ opacity: 0, scale: 0 }} animate={apexVisible ? { opacity: 0.60, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.4, type: 'spring', bounce: 0.4 }}
        style={{ transformOrigin: '58px 62px' }} />
      <motion.path d="M 142,57 L 137,62 L 142,67 L 147,62 Z"
        fill={GOLD} stroke="none"
        initial={{ opacity: 0, scale: 0 }} animate={apexVisible ? { opacity: 0.60, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.4, delay: 0.10, type: 'spring', bounce: 0.4 }}
        style={{ transformOrigin: '142px 62px' }} />
      <motion.path d="M 58,57 C 55,51 54,45 58,41 C 62,45 61,51 58,57 Z"
        fill={GOLD} stroke="none"
        initial={{ opacity: 0, scaleY: 0 }} animate={apexVisible ? { opacity: 0.38, scaleY: 1 } : { opacity: 0, scaleY: 0 }}
        transition={{ duration: 0.6, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '58px 57px' }} />
      <motion.path d="M 56,51 C 52,50 51,46 53,43"
        fill="none" stroke={GOLD} strokeWidth="0.7" strokeLinecap="round"
        initial={{ opacity: 0, pathLength: 0 }} animate={apexVisible ? { opacity: 0.45, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
        transition={{ duration: 0.5, delay: 0.25, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d="M 60,51 C 64,50 65,46 63,43"
        fill="none" stroke={GOLD} strokeWidth="0.7" strokeLinecap="round"
        initial={{ opacity: 0, pathLength: 0 }} animate={apexVisible ? { opacity: 0.45, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
        transition={{ duration: 0.5, delay: 0.30, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d="M 142,57 C 139,51 138,45 142,41 C 146,45 145,51 142,57 Z"
        fill={GOLD} stroke="none"
        initial={{ opacity: 0, scaleY: 0 }} animate={apexVisible ? { opacity: 0.38, scaleY: 1 } : { opacity: 0, scaleY: 0 }}
        transition={{ duration: 0.6, delay: 0.20, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '142px 57px' }} />
      <motion.path d="M 140,51 C 136,50 135,46 137,43"
        fill="none" stroke={GOLD} strokeWidth="0.7" strokeLinecap="round"
        initial={{ opacity: 0, pathLength: 0 }} animate={apexVisible ? { opacity: 0.45, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
        transition={{ duration: 0.5, delay: 0.30, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d="M 144,51 C 148,50 149,46 147,43"
        fill="none" stroke={GOLD} strokeWidth="0.7" strokeLinecap="round"
        initial={{ opacity: 0, pathLength: 0 }} animate={apexVisible ? { opacity: 0.45, pathLength: 1 } : { opacity: 0, pathLength: 0 }}
        transition={{ duration: 0.5, delay: 0.35, ease: [0.22, 1, 0.36, 1] }} />
      <motion.circle cx={100} cy={9} r={7}
        fill={GOLD} mask="url(#hilal-mask)"
        initial={{ opacity: 0, scale: 0 }} animate={apexVisible ? { opacity: 0.92, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.5, type: 'spring', bounce: 0.35 }}
        style={{ transformOrigin: '100px 9px' }} />
      <motion.polygon points={star5}
        fill={GOLD}
        initial={{ opacity: 0, scale: 0 }} animate={apexVisible ? { opacity: 0.88, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.35, delay: 0.2, type: 'spring', bounce: 0.5 }}
        style={{ transformOrigin: '109px 7px' }} />
    </svg>
  );
}

// ══════════════════════════════════════════════════════════════
// BotanicalArch — Timurid dome arch for Tashkent
// ══════════════════════════════════════════════════════════════
export function BotanicalArch({ inView }: { inView: boolean }) {
  const [ornVisible, setOrnVisible] = useState(false);

  useEffect(() => {
    if (!inView) { setOrnVisible(false); return; }
    const t = setTimeout(() => setOrnVisible(true), 1400);
    return () => clearTimeout(t);
  }, [inView]);

  const stroke = GOLD_DIM;
  const star8 = 'M 100,0 L 101.3,2.7 L 104,4 L 101.3,5.3 L 100,8 L 98.7,5.3 L 96,4 L 98.7,2.7 Z';

  return (
    <svg
      viewBox="0 0 200 90"
      preserveAspectRatio="xMidYMid meet"
      aria-hidden="true"
      style={{ width: 'clamp(180px, 55%, 340px)', height: 68, display: 'block', overflow: 'visible' }}
    >
      <motion.path d="M 36,66 C 36,34 68,8 100,4"
        fill="none" stroke={stroke} strokeWidth="1.0" strokeLinecap="round" opacity={0.70}
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d="M 164,66 C 164,34 132,8 100,4"
        fill="none" stroke={stroke} strokeWidth="1.0" strokeLinecap="round" opacity={0.70}
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.3, delay: 0.08, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d="M 52,66 C 52,38 76,12 100,8"
        fill="none" stroke={stroke} strokeWidth="0.4" strokeLinecap="round" opacity={0.32}
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.2, delay: 0.20, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d="M 148,66 C 148,38 124,12 100,8"
        fill="none" stroke={stroke} strokeWidth="0.4" strokeLinecap="round" opacity={0.32}
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.2, delay: 0.28, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d="M 68,66 C 72,46 84,20 100,12"
        fill="none" stroke={stroke} strokeWidth="0.28" strokeLinecap="round" opacity={0.22}
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.0, delay: 0.35, ease: [0.22, 1, 0.36, 1] }} />
      <motion.path d="M 132,66 C 128,46 116,20 100,12"
        fill="none" stroke={stroke} strokeWidth="0.28" strokeLinecap="round" opacity={0.22}
        initial={{ pathLength: 0 }} animate={inView ? { pathLength: 1 } : { pathLength: 0 }}
        transition={{ duration: 1.0, delay: 0.42, ease: [0.22, 1, 0.36, 1] }} />
      <motion.line x1="24" y1="66" x2="176" y2="66"
        stroke={stroke} strokeWidth="0.7" opacity={0.45}
        initial={{ scaleX: 0 }} animate={inView ? { scaleX: 1 } : { scaleX: 0 }}
        transition={{ duration: 0.8, delay: 0.50, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '100px 66px' }} />
      <motion.line x1="36" y1="66" x2="36" y2="88"
        stroke={stroke} strokeWidth="0.8" opacity={0.50}
        initial={{ scaleY: 0 }} animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ duration: 0.5, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '36px 88px' }} />
      <motion.line x1="164" y1="66" x2="164" y2="88"
        stroke={stroke} strokeWidth="0.8" opacity={0.50}
        initial={{ scaleY: 0 }} animate={inView ? { scaleY: 1 } : { scaleY: 0 }}
        transition={{ duration: 0.5, delay: 0.60, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: '164px 88px' }} />
      {[48, 61, 74, 87, 100, 113, 126, 139, 152].map((x, i) => (
        <motion.path key={x} d={`M ${x},67 L ${x + 3},72 L ${x},77 L ${x - 3},72 Z`}
          fill={GOLD} stroke="none"
          initial={{ opacity: 0, scale: 0 }} animate={ornVisible ? { opacity: 0.38, scale: 1 } : { opacity: 0, scale: 0 }}
          transition={{ duration: 0.3, delay: i * 0.045, type: 'spring', bounce: 0.3 }}
          style={{ transformOrigin: `${x}px 72px` }} />
      ))}
      <motion.path d={star8}
        fill={GOLD} stroke="none"
        initial={{ opacity: 0, scale: 0 }} animate={ornVisible ? { opacity: 0.85, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.45, type: 'spring', bounce: 0.5 }}
        style={{ transformOrigin: '100px 4px' }} />
    </svg>
  );
}
