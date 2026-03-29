/**
 * InvitationCard — static 540×960 image for sharing.
 *
 * Design: "Botanical Press"
 * - Compact top garland fills its footprint (no dead space below it)
 * - Names are a single tight visual unit, "&" uses Cormorant italic (not
 *   Glossily, whose "&" glyph renders as a mis-aligned swash)
 * - Flanking gold rules for the name-pair frame the couple's names
 * - All elements are perfectly centered; nothing asymmetric
 * - A matching bottom botanical mirrors the top for visual closure
 * - Thin single border with corner diamond marks
 */
import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Language } from '../../lib/i18n';
import { en, tr, uz } from '../../lib/i18n';

const T = { en, tr, uz };

const GLOSSILY  = "'GlossilyEnigmatic', 'Cormorant Garamond', cursive";
const CORMORANT = '"Cormorant Garamond", Georgia, serif';
const SANS      = '"DM Sans", system-ui, sans-serif';

export type CardTheme = 'parchment' | 'noir' | 'blush' | 'sage';

interface C {
  bg: string; grad: string;
  ink: string; sub: string; faint: string;
  gold: string; goldLine: string;
  p1: string; p2: string;            // petal dark / light
  stem: string; leaf: string;
}

export const CARD_THEMES: Record<CardTheme, C> = {
  parchment: {
    bg:       '#FBF7EF',
    grad:     'linear-gradient(172deg,#EDE3CB 0%,#FBF7EF 18%,#FBF7EF 82%,#EDE3CB 100%)',
    ink:      '#28180E',
    sub:      'rgba(40,24,14,0.55)',
    faint:    'rgba(40,24,14,0.24)',
    gold:     '#A8832E',
    goldLine: 'rgba(168,131,46,0.32)',
    p1:       '#C08892', p2: '#E0BEBE',
    stem:     '#6A9470', leaf: '#8AB490',
  },
  noir: {
    bg:       '#1C1408',
    grad:     'linear-gradient(172deg,#0E0A02 0%,#1C1408 18%,#1C1408 82%,#0E0A02 100%)',
    ink:      '#F0E6D2',
    sub:      'rgba(240,230,210,0.60)',
    faint:    'rgba(240,230,210,0.24)',
    gold:     '#D4AA50',
    goldLine: 'rgba(212,170,80,0.30)',
    p1:       '#EDD4DA', p2: '#F5E4E8',
    stem:     '#6A9E74', leaf: '#88B890',
  },
  blush: {
    bg:       '#FDF0F2',
    grad:     'linear-gradient(172deg,#F4D0D6 0%,#FDF0F2 18%,#FDF0F2 82%,#F4D0D6 100%)',
    ink:      '#2A1418',
    sub:      'rgba(42,20,24,0.55)',
    faint:    'rgba(42,20,24,0.24)',
    gold:     '#B07046',
    goldLine: 'rgba(176,112,70,0.30)',
    p1:       '#D06878', p2: '#E8A8B4',
    stem:     '#5A9068', leaf: '#7AAE88',
  },
  sage: {
    bg:       '#F0F4EE',
    grad:     'linear-gradient(172deg,#D8E8D8 0%,#F0F4EE 18%,#F0F4EE 78%,#D8E8D8 100%)',
    ink:      '#162014',
    sub:      'rgba(22,32,20,0.56)',
    faint:    'rgba(22,32,20,0.24)',
    gold:     '#7A9038',
    goldLine: 'rgba(122,144,56,0.32)',
    p1:       '#B8A0A8', p2: '#D0B8BC',
    stem:     '#4A8054', leaf: '#6AA074',
  },
};

export interface InvitationCardProps {
  guestName:   string;
  eventDate:   string;
  eventTime:   string | null;
  venueName:   string | null;
  eventName:   string | null;
  tableNumber: number | null | undefined;
  language:    Language;
  rsvpUrl:     string;
  theme?:      CardTheme;
}

// ─── 6-petal bloom (returns <g>, safe inside any SVG) ─────────────────────────
function Bloom({ cx, cy, r = 1, op = 1, c }: {
  cx: number; cy: number; r?: number; op?: number; c: C;
}) {
  const pr = 5.2 * r;
  return (
    <g opacity={op}>
      {[0, 60, 120, 180, 240, 300].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        return (
          <ellipse key={i}
            cx={cx + pr * Math.sin(rad)} cy={cy - pr * Math.cos(rad)}
            rx={pr * 0.42} ry={pr * 0.76}
            fill={i % 2 === 0 ? c.p1 : c.p2}
            transform={`rotate(${a} ${cx + pr * Math.sin(rad)} ${cy - pr * Math.cos(rad)})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={pr * 0.27} fill={c.gold}  opacity={0.72}/>
      <circle cx={cx} cy={cy} r={pr * 0.12} fill={c.bg}    opacity={0.90}/>
    </g>
  );
}

// ─── Leaf helper ──────────────────────────────────────────────────────────────
function L({ x, y, rx, ry, a, c, op = 0.56 }: {
  x: number; y: number; rx: number; ry: number; a: number; c: C; op?: number;
}) {
  return (
    <ellipse cx={x} cy={y} rx={rx} ry={ry}
      fill={c.leaf} opacity={op}
      transform={`rotate(${a} ${x} ${y})`}
    />
  );
}

// ─── Top botanical garland (480 × 66 px) ─────────────────────────────────────
// Twin arms spread left & right from a central stem.
// Height is 66 px — exactly what it occupies, zero dead space below.
// Stems are 1.2 px (visible), blooms use r ≥ 0.9 (bold enough to read).
function TopGarland({ c }: { c: C }) {
  return (
    <svg width="480" height="66" viewBox="0 0 480 66" fill="none" aria-hidden="true">
      {/* ── stems ── */}
      <path d="M240,60 C212,54 170,46 124,38 C90,32 54,36 28,44"
        stroke={c.stem} strokeWidth="1.20" strokeLinecap="round" opacity="0.58"/>
      <path d="M240,60 C268,54 310,46 356,38 C390,32 426,36 452,44"
        stroke={c.stem} strokeWidth="1.20" strokeLinecap="round" opacity="0.58"/>
      <path d="M240,60 L240,14"
        stroke={c.stem} strokeWidth="1.00" strokeLinecap="round" opacity="0.50"/>
      {/* sub-branches */}
      <path d="M174,42 C164,28 154,18 144,10"
        stroke={c.stem} strokeWidth="0.85" strokeLinecap="round" opacity="0.44"/>
      <path d="M116,37 C104,24 94,15 84,8"
        stroke={c.stem} strokeWidth="0.85" strokeLinecap="round" opacity="0.44"/>
      <path d="M306,42 C316,28 326,18 336,10"
        stroke={c.stem} strokeWidth="0.85" strokeLinecap="round" opacity="0.44"/>
      <path d="M364,37 C376,24 386,15 396,8"
        stroke={c.stem} strokeWidth="0.85" strokeLinecap="round" opacity="0.44"/>

      {/* ── leaves – left ── */}
      <L x={208} y={54} rx={7.5} ry={3.2} a={-30} c={c} op={0.60}/>
      <L x={206} y={62} rx={6.0} ry={2.6} a={ 16} c={c} op={0.52}/>
      <L x={166} y={44} rx={8.0} ry={3.4} a={-36} c={c} op={0.62}/>
      <L x={164} y={54} rx={6.5} ry={2.8} a={ 20} c={c} op={0.54}/>
      <L x={120} y={36} rx={7.5} ry={3.0} a={-24} c={c} op={0.58}/>
      <L x={118} y={46} rx={6.0} ry={2.6} a={ 24} c={c} op={0.50}/>
      <L x={ 72} y={40} rx={6.5} ry={2.8} a={-18} c={c} op={0.54}/>
      <L x={ 70} y={50} rx={5.5} ry={2.4} a={ 28} c={c} op={0.46}/>
      <L x={154} y={20} rx={5.5} ry={2.4} a={-44} c={c} op={0.48}/>
      <L x={ 96} y={16} rx={5.0} ry={2.2} a={-38} c={c} op={0.44}/>

      {/* ── leaves – right (mirror) ── */}
      <L x={272} y={54} rx={7.5} ry={3.2} a={ 30} c={c} op={0.60}/>
      <L x={274} y={62} rx={6.0} ry={2.6} a={-16} c={c} op={0.52}/>
      <L x={314} y={44} rx={8.0} ry={3.4} a={ 36} c={c} op={0.62}/>
      <L x={316} y={54} rx={6.5} ry={2.8} a={-20} c={c} op={0.54}/>
      <L x={360} y={36} rx={7.5} ry={3.0} a={ 24} c={c} op={0.58}/>
      <L x={362} y={46} rx={6.0} ry={2.6} a={-24} c={c} op={0.50}/>
      <L x={408} y={40} rx={6.5} ry={2.8} a={ 18} c={c} op={0.54}/>
      <L x={410} y={50} rx={5.5} ry={2.4} a={-28} c={c} op={0.46}/>
      <L x={326} y={20} rx={5.5} ry={2.4} a={ 44} c={c} op={0.48}/>
      <L x={384} y={16} rx={5.0} ry={2.2} a={ 38} c={c} op={0.44}/>

      {/* ── blooms ── */}
      <Bloom cx={240} cy={10}  r={1.25} c={c}/>
      {/* left arm */}
      <Bloom cx={202} cy={48}  r={0.92} op={0.93} c={c}/>
      <Bloom cx={158} cy={36}  r={1.00} op={0.96} c={c}/>
      <Bloom cx={116} cy={22}  r={0.86} op={0.92} c={c}/>
      <Bloom cx={ 84} cy={34}  r={0.98} op={0.94} c={c}/>
      <Bloom cx={ 34} cy={43}  r={0.80} op={0.86} c={c}/>
      <Bloom cx={142} cy={ 8}  r={0.78} op={0.84} c={c}/>
      <Bloom cx={ 82} cy={ 6}  r={0.72} op={0.80} c={c}/>
      {/* right arm (mirror) */}
      <Bloom cx={278} cy={48}  r={0.92} op={0.93} c={c}/>
      <Bloom cx={322} cy={36}  r={1.00} op={0.96} c={c}/>
      <Bloom cx={364} cy={22}  r={0.86} op={0.92} c={c}/>
      <Bloom cx={396} cy={34}  r={0.98} op={0.94} c={c}/>
      <Bloom cx={446} cy={43}  r={0.80} op={0.86} c={c}/>
      <Bloom cx={338} cy={ 8}  r={0.78} op={0.84} c={c}/>
      <Bloom cx={398} cy={ 6}  r={0.72} op={0.80} c={c}/>
    </svg>
  );
}

// ─── Bottom sprig (200 × 40 px, mirrors the top) ─────────────────────────────
function BottomSprig({ c }: { c: C }) {
  return (
    <svg width="200" height="40" viewBox="0 0 200 40" fill="none" aria-hidden="true">
      <path d="M100,38 L100,10"
        stroke={c.stem} strokeWidth="0.90" strokeLinecap="round" opacity="0.46"/>
      <path d="M100,26 C82,20 64,15 46,11"
        stroke={c.stem} strokeWidth="0.75" strokeLinecap="round" opacity="0.40"/>
      <path d="M100,26 C118,20 136,15 154,11"
        stroke={c.stem} strokeWidth="0.75" strokeLinecap="round" opacity="0.40"/>
      <L x={ 68} y={16} rx={7} ry={2.6} a={-26} c={c} op={0.40}/>
      <L x={ 82} y={13} rx={5} ry={2.0} a={-14} c={c} op={0.34}/>
      <L x={132} y={16} rx={7} ry={2.6} a={ 26} c={c} op={0.40}/>
      <L x={118} y={13} rx={5} ry={2.0} a={ 14} c={c} op={0.34}/>
      <Bloom cx={ 46} cy={ 9} r={0.72} op={0.68} c={c}/>
      <Bloom cx={100} cy={ 8} r={0.84} op={0.72} c={c}/>
      <Bloom cx={154} cy={ 9} r={0.72} op={0.68} c={c}/>
    </svg>
  );
}

// ─── Thin ornamental divider ──────────────────────────────────────────────────
function Divider({ c, w = 200 }: { c: C; w?: number }) {
  const half = w / 2;
  return (
    <svg width={w} height={16} viewBox={`0 0 ${w} 16`} fill="none" aria-hidden="true">
      <line x1={0}        y1={8} x2={half - 10} y2={8} stroke={c.gold} strokeWidth="0.55" opacity="0.30"/>
      <line x1={half + 10} y1={8} x2={w}        y2={8} stroke={c.gold} strokeWidth="0.55" opacity="0.30"/>
      <path
        d={`M${half} 2 L${half + 6} 8 L${half} 14 L${half - 6} 8 Z`}
        fill={c.gold} opacity="0.50"
      />
      <circle cx={half} cy={8} r={2.2} fill={c.bg} opacity={0.90}/>
    </svg>
  );
}

// ─── Three-dot ornament ───────────────────────────────────────────────────────
function Dots({ c }: { c: C }) {
  return (
    <svg width={32} height={8} viewBox="0 0 32 8" fill="none" aria-hidden="true">
      <circle cx={ 4} cy={4} r={1.6} fill={c.gold} opacity={0.40}/>
      <circle cx={16} cy={4} r={2.2} fill={c.gold} opacity={0.50}/>
      <circle cx={28} cy={4} r={1.6} fill={c.gold} opacity={0.40}/>
    </svg>
  );
}

// ─── InvitationCard ───────────────────────────────────────────────────────────
const InvitationCard = forwardRef<HTMLDivElement, InvitationCardProps>(
  ({ guestName, eventDate, eventTime, venueName, eventName,
     tableNumber, language, rsvpUrl, theme = 'parchment' }, ref) => {

    const t = T[language];
    const c = CARD_THEMES[theme];

    const dateObj = (() => {
      try { return new Date(eventDate.includes('T') ? eventDate : `${eventDate}T12:00:00`); }
      catch { return new Date(); }
    })();

    const fmtDate = (() => {
      try {
        if (language === 'uz') {
          const M = ['Yanvar','Fevral','Mart','Aprel','May','Iyun',
                     'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
          return `${dateObj.getDate()} ${M[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
        }
        return dateObj.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US',
          { day: 'numeric', month: 'long', year: 'numeric' });
      } catch { return eventDate; }
    })();

    const year = dateObj.getFullYear();

    return (
      <div ref={ref} style={{
        width: 540, height: 960,
        position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        background: c.grad,
        WebkitFontSmoothing: 'antialiased',
      }}>

        {/* paper noise */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.024, pointerEvents: 'none', zIndex: 1,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.80' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '256px 256px',
        }}/>

        {/* single thin border */}
        <div style={{
          position: 'absolute', inset: 12,
          border: `0.65px solid ${c.goldLine}`,
          pointerEvents: 'none', zIndex: 10,
        }}/>

        {/* corner diamond marks */}
        {([
          { top: 14,    left:  14   },
          { top: 14,    right: 14   },
          { bottom: 14, left:  14   },
          { bottom: 14, right: 14   },
        ] as const).map((pos, i) => (
          <svg key={i} width={9} height={9} viewBox="0 0 9 9"
            fill="none" aria-hidden="true"
            style={{ position: 'absolute', zIndex: 11, ...pos }}
          >
            <path d="M4.5 0.8 L8.2 4.5 L4.5 8.2 L0.8 4.5 Z"
              fill={c.gold} opacity={0.42}/>
          </svg>
        ))}

        {/* ── ZONE 1 — Top garland ───────────────────────────────────── */}
        <div style={{ height: 26, flexShrink: 0 }}/>
        {/* centered: card 540, garland 480 → 30 px margin each side */}
        <TopGarland c={c}/>

        {/* ── ZONE 2 — Overline ──────────────────────────────────────── */}
        <div style={{ height: 14, flexShrink: 0 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, flexShrink: 0 }}>
          <div style={{ width: 44, height: 0.5, background: c.gold, opacity: 0.30 }}/>
          <span style={{
            fontFamily: SANS, fontSize: 7.5, fontWeight: 500,
            letterSpacing: '0.44em', color: c.gold,
            textTransform: 'uppercase' as const, lineHeight: 1,
          }}>
            {t.cardWeddingInvitation}
          </span>
          <div style={{ width: 44, height: 0.5, background: c.gold, opacity: 0.30 }}/>
        </div>

        {/* ── ZONE 3 — Names (hero) ──────────────────────────────────── */}
        {/*
          "&" uses Cormorant italic — Glossily's "&" glyph is a swash
          that renders as a superscript, breaking visual centering.
        */}
        <div style={{ height: 22, flexShrink: 0 }}/>

        {/* flanking rule above names */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ width: 80, height: 0.5, background: c.gold, opacity: 0.28 }}/>
          <Dots c={c}/>
          <div style={{ width: 80, height: 0.5, background: c.gold, opacity: 0.28 }}/>
        </div>
        <div style={{ height: 18, flexShrink: 0 }}/>

        <span style={{
          fontFamily: GLOSSILY, fontSize: 80, color: c.ink,
          lineHeight: 1.0, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>
          Berfin
        </span>

        {/* "&" row — Cormorant italic, centered, with flanking gold rules */}
        <div style={{
          height: 42, flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: 320, gap: 18,
        }}>
          <div style={{ flex: 1, height: 0.5, background: c.goldLine }}/>
          <span style={{
            fontFamily: CORMORANT, fontStyle: 'italic', fontWeight: 300,
            fontSize: 34, color: c.gold, lineHeight: 1,
            letterSpacing: '0.04em', userSelect: 'none',
          }}>
            &amp;
          </span>
          <div style={{ flex: 1, height: 0.5, background: c.goldLine }}/>
        </div>

        <span style={{
          fontFamily: GLOSSILY, fontSize: 80, color: c.ink,
          lineHeight: 1.0, letterSpacing: '-0.01em', whiteSpace: 'nowrap',
        }}>
          Shamsiddin
        </span>

        <div style={{ height: 18, flexShrink: 0 }}/>
        {/* flanking rule below names */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          <div style={{ width: 80, height: 0.5, background: c.gold, opacity: 0.28 }}/>
          <Dots c={c}/>
          <div style={{ width: 80, height: 0.5, background: c.gold, opacity: 0.28 }}/>
        </div>

        {/* ── ZONE 4 — Guest address ─────────────────────────────────── */}
        <div style={{ height: 20, flexShrink: 0 }}/>
        <span style={{
          fontFamily: CORMORANT, fontStyle: 'italic',
          fontSize: 17, color: c.sub,
          textAlign: 'center', lineHeight: 1.5,
          paddingLeft: 64, paddingRight: 64,
        }}>
          {t.cardWeInviteYou}
        </span>
        <div style={{ height: 14, flexShrink: 0 }}/>
        <Divider c={c} w={130}/>
        <div style={{ height: 13, flexShrink: 0 }}/>
        <span style={{
          fontFamily: CORMORANT, fontWeight: 700,
          fontSize: 29, color: c.ink,
          textAlign: 'center', letterSpacing: '0.025em', lineHeight: 1.15,
        }}>
          {guestName}
        </span>
        <div style={{ height: 13, flexShrink: 0 }}/>
        <Divider c={c} w={130}/>

        {/* ── ZONE 5 — Event details ─────────────────────────────────── */}
        <div style={{ height: 22, flexShrink: 0 }}/>
        <div style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center',
          flexShrink: 0, width: 540, paddingLeft: 56, paddingRight: 56,
          boxSizing: 'border-box',
        }}>
          <div style={{ width: 150, height: 0.5, background: c.gold, opacity: 0.24 }}/>
          <div style={{ height: 14 }}/>
          {eventName && (
            <>
              <span style={{
                fontFamily: SANS, fontSize: 7, fontWeight: 500,
                letterSpacing: '0.42em', color: c.p1,
                textTransform: 'uppercase' as const, lineHeight: 1, opacity: 0.90,
              }}>
                {eventName}
              </span>
              <div style={{ height: 11 }}/>
            </>
          )}
          <span style={{
            fontFamily: CORMORANT, fontWeight: 700, fontSize: 25,
            color: c.ink, letterSpacing: '0.01em', lineHeight: 1.2, textAlign: 'center',
          }}>
            {fmtDate}
          </span>
          {(eventTime ?? venueName) && (
            <>
              <div style={{ height: 7 }}/>
              <span style={{
                fontFamily: CORMORANT, fontStyle: 'italic',
                fontSize: 15.5, color: c.sub,
                textAlign: 'center', lineHeight: 1.45,
              }}>
                {[eventTime, venueName].filter(Boolean).join('  ·  ')}
              </span>
            </>
          )}
          {tableNumber != null && (
            <>
              <div style={{ height: 14 }}/>
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 10,
                paddingLeft: 18, paddingRight: 18,
                paddingTop: 5, paddingBottom: 5,
                border: `0.55px solid ${c.goldLine}`,
              }}>
                <span style={{
                  fontFamily: SANS, fontSize: 6.5, fontWeight: 500,
                  letterSpacing: '0.40em', color: c.gold,
                  textTransform: 'uppercase' as const, lineHeight: 1,
                }}>
                  {t.cardTable}
                </span>
                <div style={{ width: 0.5, height: 13, background: c.goldLine }}/>
                <span style={{
                  fontFamily: CORMORANT, fontSize: 21,
                  fontWeight: 700, color: c.gold, lineHeight: 1,
                }}>
                  {tableNumber}
                </span>
              </div>
            </>
          )}
          <div style={{ height: 14 }}/>
          <div style={{ width: 150, height: 0.5, background: c.gold, opacity: 0.24 }}/>
        </div>

        {/* flex spacer — pushes QR to lower third */}
        <div style={{ flex: 1, minHeight: 16 }}/>

        {/* ── ZONE 6 — QR code ───────────────────────────────────────── */}
        <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 8, left: 8, lineHeight: 0 }}>
            <QRCodeSVG value={rsvpUrl} size={92} bgColor={c.bg} fgColor={c.ink} level="M"/>
          </div>
          {/* L-corner frame */}
          <svg width={108} height={108} viewBox="0 0 108 108" fill="none"
            style={{ position: 'absolute', top: 0, left: 0 }} aria-hidden="true">
            <rect x="1" y="1" width="106" height="106"
              stroke={c.goldLine} strokeWidth="0.60" fill="none"/>
            <path d="M16,2 L2,2 L2,16"
              stroke={c.gold} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.52"/>
            <path d="M92,2 L106,2 L106,16"
              stroke={c.gold} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.52"/>
            <path d="M16,106 L2,106 L2,92"
              stroke={c.gold} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.52"/>
            <path d="M92,106 L106,106 L106,92"
              stroke={c.gold} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.52"/>
          </svg>
        </div>

        <div style={{ height: 12, flexShrink: 0 }}/>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 24, height: 0.5, background: c.gold, opacity: 0.28 }}/>
          <span style={{
            fontFamily: SANS, fontSize: 7, fontWeight: 400,
            letterSpacing: '0.40em', color: c.sub,
            textTransform: 'uppercase' as const, lineHeight: 1,
          }}>
            {t.cardScanRsvp}
          </span>
          <div style={{ width: 24, height: 0.5, background: c.gold, opacity: 0.28 }}/>
        </div>

        {/* ── ZONE 7 — Bottom botanical + year ──────────────────────── */}
        <div style={{ height: 20, flexShrink: 0 }}/>
        <BottomSprig c={c}/>
        <div style={{ height: 8, flexShrink: 0 }}/>
        <span style={{
          fontFamily: SANS, fontSize: 7,
          letterSpacing: '0.38em', color: c.faint,
          textTransform: 'uppercase' as const, lineHeight: 1,
        }}>
          · {year} ·
        </span>
        <div style={{ height: 28, flexShrink: 0 }}/>
      </div>
    );
  },
);

InvitationCard.displayName = 'InvitationCard';
export { InvitationCard };
export default InvitationCard;
