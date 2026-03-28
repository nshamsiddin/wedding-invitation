import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Language } from '../../lib/i18n';
import { en, tr, uz } from '../../lib/i18n';

const T = { en, tr, uz };

const GLOSSILY  = "'GlossilyEnigmatic', 'Cormorant Garamond', cursive";
const CORMORANT = '"Cormorant Garamond", Georgia, serif';
const SANS      = '"DM Sans", system-ui, sans-serif';

export type CardTheme = 'parchment' | 'noir' | 'blush' | 'sage';

interface ThemeColors {
  bg:        string;
  bgGrad:    string;
  ink:       string;
  inkSub:    string;
  inkFaint:  string;
  gold:      string;
  goldRule:  string;
  petalDeep: string;
  petalLt:   string;
  stemClr:   string;
  leafClr:   string;
}

export const CARD_THEMES: Record<CardTheme, ThemeColors> = {
  parchment: {
    bg:        '#FAF5EC',
    bgGrad:    'linear-gradient(175deg,#EEE4CB 0%,#FAF5EC 22%,#FAF5EC 78%,#EEE4CB 100%)',
    ink:       '#28180E',
    inkSub:    'rgba(40,24,14,0.52)',
    inkFaint:  'rgba(40,24,14,0.26)',
    gold:      '#A8832E',
    goldRule:  'rgba(168,131,46,0.30)',
    petalDeep: '#C08892',
    petalLt:   '#DFBCC2',
    stemClr:   '#6A9470',
    leafClr:   '#8AB490',
  },
  noir: {
    bg:        '#1C1408',
    bgGrad:    'linear-gradient(175deg,#100C04 0%,#1C1408 22%,#1C1408 78%,#100C04 100%)',
    ink:       '#F0E6D2',
    inkSub:    'rgba(240,230,210,0.58)',
    inkFaint:  'rgba(240,230,210,0.26)',
    gold:      '#D4AA50',
    goldRule:  'rgba(212,170,80,0.28)',
    petalDeep: '#EDD4DA',
    petalLt:   '#F5E4E8',
    stemClr:   '#6A9E74',
    leafClr:   '#88B890',
  },
  blush: {
    bg:        '#FDF0F2',
    bgGrad:    'linear-gradient(175deg,#F4D0D6 0%,#FDF0F2 22%,#FDF0F2 78%,#F4D0D6 100%)',
    ink:       '#2A1418',
    inkSub:    'rgba(42,20,24,0.52)',
    inkFaint:  'rgba(42,20,24,0.26)',
    gold:      '#B07046',
    goldRule:  'rgba(176,112,70,0.28)',
    petalDeep: '#D06878',
    petalLt:   '#E8A8B4',
    stemClr:   '#5A9068',
    leafClr:   '#7AAE88',
  },
  sage: {
    bg:        '#F0F4EE',
    bgGrad:    'linear-gradient(175deg,#D8E8D8 0%,#F0F4EE 22%,#F0F4EE 78%,#D8E8D8 100%)',
    ink:       '#162014',
    inkSub:    'rgba(22,32,20,0.54)',
    inkFaint:  'rgba(22,32,20,0.26)',
    gold:      '#7A9038',
    goldRule:  'rgba(122,144,56,0.30)',
    petalDeep: '#B8A0A8',
    petalLt:   '#D0B8BC',
    stemClr:   '#4A8054',
    leafClr:   '#6AA074',
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

// ─── 6-petal bloom ────────────────────────────────────────────────────────────
function Bloom({
  cx, cy, r = 1, opacity = 1, c,
}: {
  cx: number; cy: number; r?: number; opacity?: number; c: ThemeColors;
}) {
  const pr = 4.6 * r;
  return (
    <g opacity={opacity}>
      {[0, 60, 120, 180, 240, 300].map((a, i) => {
        const rad = (a * Math.PI) / 180;
        const px  = cx + pr * Math.sin(rad);
        const py  = cy - pr * Math.cos(rad);
        return (
          <ellipse key={i} cx={px} cy={py}
            rx={pr * 0.43} ry={pr * 0.78}
            fill={i % 2 === 0 ? c.petalDeep : c.petalLt}
            transform={`rotate(${a} ${px} ${py})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={pr * 0.28} fill={c.gold} opacity={0.72} />
      <circle cx={cx} cy={cy} r={pr * 0.13} fill={c.bg}   opacity={0.88} />
    </g>
  );
}

// ─── Dot rule ─────────────────────────────────────────────────────────────────
function DotRule({ width = 110, c }: { width?: number; c: ThemeColors }) {
  const m = width / 2;
  return (
    <svg width={width} height={10} viewBox={`0 0 ${width} 10`} fill="none" aria-hidden="true">
      <line x1={0}     y1={5} x2={m - 7} y2={5} stroke={c.gold} strokeWidth="0.50" opacity="0.28"/>
      <circle cx={m - 3} cy={5} r={1.2} fill={c.gold} opacity="0.34"/>
      <circle cx={m}     cy={5} r={2.0} fill={c.gold} opacity="0.44"/>
      <circle cx={m + 3} cy={5} r={1.2} fill={c.gold} opacity="0.34"/>
      <line x1={m + 7} y1={5} x2={width} y2={5} stroke={c.gold} strokeWidth="0.50" opacity="0.28"/>
    </svg>
  );
}

// ─── Top botanical — compact horizontal garland, 64 px tall ──────────────────
// Two arms sweep left and right from centre; sub-branches reach upward.
// Nothing arches above 64 px so there is zero dead space below.
function TopGarland({ c }: { c: ThemeColors }) {
  return (
    <svg width="540" height="64" viewBox="0 0 540 64" fill="none" aria-hidden="true">

      {/* ── main arms ─────────────────────────────────────────────────── */}
      <path d="M 270,58 C 240,52 196,46 146,38 C 108,33 68,36 44,42"
        stroke={c.stemClr} strokeWidth="0.90" strokeLinecap="round" fill="none" opacity="0.56"/>
      <path d="M 270,58 C 300,52 344,46 394,38 C 432,33 472,36 496,42"
        stroke={c.stemClr} strokeWidth="0.90" strokeLinecap="round" fill="none" opacity="0.56"/>

      {/* ── centre upward stem ─────────────────────────────────────────── */}
      <path d="M 270,58 L 270,14"
        stroke={c.stemClr} strokeWidth="0.80" strokeLinecap="round" fill="none" opacity="0.48"/>

      {/* ── left sub-branches ─────────────────────────────────────────── */}
      <path d="M 196,44 C 186,30 176,20 166,12"
        stroke={c.stemClr} strokeWidth="0.65" strokeLinecap="round" fill="none" opacity="0.42"/>
      <path d="M 132,37 C 120,24 110,15 100,8"
        stroke={c.stemClr} strokeWidth="0.65" strokeLinecap="round" fill="none" opacity="0.42"/>

      {/* ── right sub-branches (mirror) ───────────────────────────────── */}
      <path d="M 344,44 C 354,30 364,20 374,12"
        stroke={c.stemClr} strokeWidth="0.65" strokeLinecap="round" fill="none" opacity="0.42"/>
      <path d="M 408,37 C 420,24 430,15 440,8"
        stroke={c.stemClr} strokeWidth="0.65" strokeLinecap="round" fill="none" opacity="0.42"/>

      {/* ── left leaves ────────────────────────────────────────────────── */}
      <ellipse cx="238" cy="54" rx="6.5" ry="2.8" fill={c.leafClr} opacity="0.58" transform="rotate(-28 238 54)"/>
      <ellipse cx="236" cy="62" rx="5.5" ry="2.4" fill={c.leafClr} opacity="0.50" transform="rotate(14 236 62)"/>
      <ellipse cx="192" cy="44" rx="7.0" ry="3.0" fill={c.leafClr} opacity="0.60" transform="rotate(-34 192 44)"/>
      <ellipse cx="190" cy="53" rx="6.0" ry="2.6" fill={c.leafClr} opacity="0.52" transform="rotate(18 190 53)"/>
      <ellipse cx="148" cy="36" rx="7.0" ry="2.8" fill={c.leafClr} opacity="0.56" transform="rotate(-22 148 36)"/>
      <ellipse cx="146" cy="45" rx="5.5" ry="2.3" fill={c.leafClr} opacity="0.48" transform="rotate(22 146 45)"/>
      <ellipse cx="100" cy="34" rx="6.5" ry="2.6" fill={c.leafClr} opacity="0.54" transform="rotate(-18 100 34)"/>
      <ellipse cx="58"  cy="40" rx="5.5" ry="2.3" fill={c.leafClr} opacity="0.48" transform="rotate(-14 58 40)"/>
      <ellipse cx="176" cy="22" rx="5.0" ry="2.2" fill={c.leafClr} opacity="0.46" transform="rotate(-44 176 22)"/>
      <ellipse cx="112" cy="18" rx="5.0" ry="2.2" fill={c.leafClr} opacity="0.44" transform="rotate(-38 112 18)"/>

      {/* ── right leaves (mirror) ──────────────────────────────────────── */}
      <ellipse cx="302" cy="54" rx="6.5" ry="2.8" fill={c.leafClr} opacity="0.58" transform="rotate(28 302 54)"/>
      <ellipse cx="304" cy="62" rx="5.5" ry="2.4" fill={c.leafClr} opacity="0.50" transform="rotate(-14 304 62)"/>
      <ellipse cx="348" cy="44" rx="7.0" ry="3.0" fill={c.leafClr} opacity="0.60" transform="rotate(34 348 44)"/>
      <ellipse cx="350" cy="53" rx="6.0" ry="2.6" fill={c.leafClr} opacity="0.52" transform="rotate(-18 350 53)"/>
      <ellipse cx="392" cy="36" rx="7.0" ry="2.8" fill={c.leafClr} opacity="0.56" transform="rotate(22 392 36)"/>
      <ellipse cx="394" cy="45" rx="5.5" ry="2.3" fill={c.leafClr} opacity="0.48" transform="rotate(-22 394 45)"/>
      <ellipse cx="440" cy="34" rx="6.5" ry="2.6" fill={c.leafClr} opacity="0.54" transform="rotate(18 440 34)"/>
      <ellipse cx="482" cy="40" rx="5.5" ry="2.3" fill={c.leafClr} opacity="0.48" transform="rotate(14 482 40)"/>
      <ellipse cx="364" cy="22" rx="5.0" ry="2.2" fill={c.leafClr} opacity="0.46" transform="rotate(44 364 22)"/>
      <ellipse cx="428" cy="18" rx="5.0" ry="2.2" fill={c.leafClr} opacity="0.44" transform="rotate(38 428 18)"/>

      {/* ── blooms ─────────────────────────────────────────────────────── */}
      {/* centre apex */}
      <Bloom cx={270} cy={10}  r={1.22} c={c} />
      {/* left arm */}
      <Bloom cx={234} cy={48}  r={0.88} opacity={0.93} c={c} />
      <Bloom cx={188} cy={36}  r={0.96} opacity={0.95} c={c} />
      <Bloom cx={144} cy={22}  r={0.82} opacity={0.90} c={c} />
      <Bloom cx={104} cy={32}  r={0.96} opacity={0.93} c={c} />
      <Bloom cx={56}  cy={41}  r={0.78} opacity={0.86} c={c} />
      {/* left sub tips */}
      <Bloom cx={164} cy={10}  r={0.76} opacity={0.84} c={c} />
      <Bloom cx={98}  cy={6}   r={0.70} opacity={0.80} c={c} />
      {/* right arm (mirror) */}
      <Bloom cx={306} cy={48}  r={0.88} opacity={0.93} c={c} />
      <Bloom cx={352} cy={36}  r={0.96} opacity={0.95} c={c} />
      <Bloom cx={396} cy={22}  r={0.82} opacity={0.90} c={c} />
      <Bloom cx={436} cy={32}  r={0.96} opacity={0.93} c={c} />
      <Bloom cx={484} cy={41}  r={0.78} opacity={0.86} c={c} />
      {/* right sub tips */}
      <Bloom cx={376} cy={10}  r={0.76} opacity={0.84} c={c} />
      <Bloom cx={442} cy={6}   r={0.70} opacity={0.80} c={c} />
    </svg>
  );
}

// ─── Centre divider ornament ──────────────────────────────────────────────────
function CentreDivider({ c }: { c: ThemeColors }) {
  return (
    <svg width="360" height="22" viewBox="0 0 360 22" fill="none" aria-hidden="true">
      {/* left rule */}
      <line x1="0"   y1="11" x2="154" y2="11" stroke={c.gold} strokeWidth="0.50" opacity="0.30"/>
      {/* right rule */}
      <line x1="206" y1="11" x2="360" y2="11" stroke={c.gold} strokeWidth="0.50" opacity="0.30"/>
      {/* flanking dots */}
      <circle cx="160" cy="11" r="1.6" fill={c.gold} opacity="0.38"/>
      <circle cx="200" cy="11" r="1.6" fill={c.gold} opacity="0.38"/>
      {/* centre diamond */}
      <path d="M180 3 L188 11 L180 19 L172 11 Z"
        fill={c.petalDeep} opacity="0.18"/>
      <path d="M180 6 L185 11 L180 16 L175 11 Z"
        fill={c.gold} opacity="0.50"/>
      <circle cx="180" cy="11" r="2.0" fill={c.bg} opacity="0.82"/>
    </svg>
  );
}

// ─── Bottom botanical echo ────────────────────────────────────────────────────
function BottomSprig({ c }: { c: ThemeColors }) {
  return (
    <svg width="200" height="40" viewBox="0 0 200 40" fill="none" aria-hidden="true">
      {/* centre stem */}
      <path d="M 100,38 C 100,28 100,18 100,10"
        stroke={c.stemClr} strokeWidth="0.78" strokeLinecap="round" fill="none" opacity="0.42"/>
      {/* left branch */}
      <path d="M 100,24 C 82,18 66,14 50,10"
        stroke={c.stemClr} strokeWidth="0.65" strokeLinecap="round" fill="none" opacity="0.38"/>
      {/* right branch */}
      <path d="M 100,24 C 118,18 134,14 150,10"
        stroke={c.stemClr} strokeWidth="0.65" strokeLinecap="round" fill="none" opacity="0.38"/>
      {/* leaves */}
      <ellipse cx="70"  cy="15" rx="7.5" ry="2.6" fill={c.leafClr} opacity="0.38" transform="rotate(-24 70 15)"/>
      <ellipse cx="84"  cy="13" rx="6.0" ry="2.2" fill={c.leafClr} opacity="0.33" transform="rotate(-14 84 13)"/>
      <ellipse cx="130" cy="15" rx="7.5" ry="2.6" fill={c.leafClr} opacity="0.38" transform="rotate( 24 130 15)"/>
      <ellipse cx="116" cy="13" rx="6.0" ry="2.2" fill={c.leafClr} opacity="0.33" transform="rotate( 14 116 13)"/>
      {/* three blooms */}
      <Bloom cx={50}  cy={9}  r={0.72} opacity={0.65} c={c} />
      <Bloom cx={100} cy={8}  r={0.82} opacity={0.72} c={c} />
      <Bloom cx={150} cy={9}  r={0.72} opacity={0.65} c={c} />
    </svg>
  );
}

// ─── InvitationCard ───────────────────────────────────────────────────────────
const InvitationCard = forwardRef<HTMLDivElement, InvitationCardProps>(
  (
    {
      guestName, eventDate, eventTime, venueName, eventName,
      tableNumber, language, rsvpUrl, theme = 'parchment',
    },
    ref,
  ) => {
    const t = T[language];
    const c = CARD_THEMES[theme];

    const eventDateObj = (() => {
      try {
        return new Date(eventDate.includes('T') ? eventDate : `${eventDate}T12:00:00`);
      } catch {
        return new Date();
      }
    })();

    const formattedDate = (() => {
      try {
        if (language === 'uz') {
          const M = ['Yanvar','Fevral','Mart','Aprel','May','Iyun',
                     'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
          return `${eventDateObj.getDate()} ${M[eventDateObj.getMonth()]} ${eventDateObj.getFullYear()}`;
        }
        return eventDateObj.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
      } catch {
        return eventDate;
      }
    })();

    const year = eventDateObj.getFullYear();

    return (
      <div
        ref={ref}
        style={{
          width:               540,
          height:              960,
          position:            'relative',
          overflow:            'hidden',
          display:             'flex',
          flexDirection:       'column',
          alignItems:          'center',
          background:          c.bgGrad,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {/* ── Paper noise ─────────────────────────────────────────────── */}
        <div style={{
          position:        'absolute',
          inset:           0,
          opacity:         0.028,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.80' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize:  '256px 256px',
          pointerEvents:   'none',
          zIndex:          1,
        }} />

        {/* ── Frame — outer rule ──────────────────────────────────────── */}
        <div style={{
          position:      'absolute',
          inset:         12,
          border:        `0.65px solid ${c.goldRule}`,
          pointerEvents: 'none',
          zIndex:        10,
        }} />
        {/* ── Frame — inner rule ──────────────────────────────────────── */}
        <div style={{
          position:      'absolute',
          inset:         18,
          border:        `0.38px solid ${c.goldRule}`,
          opacity:       0.50,
          pointerEvents: 'none',
          zIndex:        10,
        }} />

        {/* ── Corner marks (4 corners of inner frame) ─────────────────── */}
        {([
          { top: 20,    left:  20   },
          { top: 20,    right: 20   },
          { bottom: 20, left:  20   },
          { bottom: 20, right: 20   },
        ] as const).map((pos, i) => (
          <svg key={i} width={8} height={8} viewBox="0 0 8 8"
            fill="none" aria-hidden="true"
            style={{ position: 'absolute', zIndex: 11, ...pos }}
          >
            <path d="M4 0.5 L7.5 4 L4 7.5 L0.5 4 Z"
              fill={c.gold} opacity={0.38} />
          </svg>
        ))}

        {/* ══════════════════════════════════════════════════════════════
            ZONE 1 — Top garland (64 px, no dead space above names)
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ height: 24, flexShrink: 0 }} />
        <TopGarland c={c} />

        {/* ══════════════════════════════════════════════════════════════
            ZONE 2 — Overline
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ height: 16, flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 48, height: 0.5, background: c.gold, opacity: 0.28 }} />
          <span style={{
            fontFamily:    SANS,
            fontSize:      7.5,
            fontWeight:    500,
            letterSpacing: '0.44em',
            color:         c.gold,
            textTransform: 'uppercase' as const,
            lineHeight:    1,
          }}>
            {t.cardWeddingInvitation}
          </span>
          <div style={{ width: 48, height: 0.5, background: c.gold, opacity: 0.28 }} />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ZONE 3 — Couple names (hero)
            Names sit close together; the "&" is inside the 32 px gap.
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ height: 20, flexShrink: 0 }} />

        {/* Name 1 */}
        <span style={{
          fontFamily: GLOSSILY,
          fontSize:   80,
          color:      c.ink,
          lineHeight: 0.88,
          whiteSpace: 'nowrap',
        }}>
          Berfin
        </span>

        {/* "&" — sits in a fixed-height gap between the two names */}
        <div style={{ height: 32, flexShrink: 0, position: 'relative', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <span style={{
            fontFamily:    CORMORANT,
            fontStyle:     'italic',
            fontWeight:    300,
            fontSize:      22,
            color:         c.gold,
            letterSpacing: '0.06em',
            lineHeight:    1,
          }}>
            &amp;
          </span>
        </div>

        {/* Name 2 */}
        <span style={{
          fontFamily: GLOSSILY,
          fontSize:   80,
          color:      c.ink,
          lineHeight: 0.88,
          whiteSpace: 'nowrap',
        }}>
          Shamsiddin
        </span>

        {/* ══════════════════════════════════════════════════════════════
            ZONE 4 — Centre divider
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ height: 22, flexShrink: 0 }} />
        <CentreDivider c={c} />

        {/* ══════════════════════════════════════════════════════════════
            ZONE 5 — Personal address
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ height: 18, flexShrink: 0 }} />
        <span style={{
          fontFamily: CORMORANT,
          fontStyle:  'italic',
          fontSize:   17,
          color:      c.inkSub,
          textAlign:  'center',
          lineHeight: 1.5,
          paddingLeft: 60,
          paddingRight: 60,
        }}>
          {t.cardWeInviteYou}
        </span>
        <div style={{ height: 14, flexShrink: 0 }} />
        <DotRule width={120} c={c} />
        <div style={{ height: 12, flexShrink: 0 }} />
        <span style={{
          fontFamily:    CORMORANT,
          fontWeight:    600,
          fontSize:      28,
          color:         c.ink,
          textAlign:     'center',
          letterSpacing: '0.02em',
          lineHeight:    1.15,
        }}>
          {guestName}
        </span>
        <div style={{ height: 12, flexShrink: 0 }} />
        <DotRule width={120} c={c} />

        {/* ══════════════════════════════════════════════════════════════
            ZONE 6 — Event details
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ height: 24, flexShrink: 0 }} />
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          flexShrink:    0,
          paddingLeft:   52,
          paddingRight:  52,
          width:         540,
          boxSizing:     'border-box',
          gap:           0,
        }}>
          {/* Top rule */}
          <div style={{ width: 160, height: 0.5, background: c.gold, opacity: 0.26 }} />
          <div style={{ height: 14 }} />

          {/* Event / location label */}
          {eventName && (
            <>
              <span style={{
                fontFamily:    SANS,
                fontSize:      7,
                fontWeight:    500,
                letterSpacing: '0.42em',
                color:         c.petalDeep,
                textTransform: 'uppercase' as const,
                lineHeight:    1,
                opacity:       0.88,
              }}>
                {eventName}
              </span>
              <div style={{ height: 12 }} />
            </>
          )}

          {/* Date */}
          <span style={{
            fontFamily:    CORMORANT,
            fontWeight:    600,
            fontSize:      24,
            color:         c.ink,
            letterSpacing: '0.01em',
            lineHeight:    1.2,
            textAlign:     'center',
          }}>
            {formattedDate}
          </span>

          {/* Time · Venue */}
          {(eventTime ?? venueName) && (
            <>
              <div style={{ height: 7 }} />
              <span style={{
                fontFamily: CORMORANT,
                fontStyle:  'italic',
                fontSize:   15,
                color:      c.inkSub,
                textAlign:  'center',
                lineHeight: 1.45,
              }}>
                {[eventTime, venueName].filter(Boolean).join('  ·  ')}
              </span>
            </>
          )}

          {/* Table chip */}
          {tableNumber != null && (
            <>
              <div style={{ height: 14 }} />
              <div style={{
                display:      'inline-flex',
                alignItems:   'center',
                gap:          10,
                paddingLeft:  18,
                paddingRight: 18,
                paddingTop:   5,
                paddingBottom: 5,
                border:       `0.55px solid ${c.goldRule}`,
              }}>
                <span style={{
                  fontFamily:    SANS,
                  fontSize:      6.5,
                  fontWeight:    500,
                  letterSpacing: '0.40em',
                  color:         c.gold,
                  textTransform: 'uppercase' as const,
                  lineHeight:    1,
                }}>
                  {t.cardTable}
                </span>
                <div style={{ width: 0.5, height: 13, background: c.goldRule }} />
                <span style={{
                  fontFamily: CORMORANT,
                  fontSize:   21,
                  fontWeight: 600,
                  color:      c.gold,
                  lineHeight: 1,
                }}>
                  {tableNumber}
                </span>
              </div>
            </>
          )}

          <div style={{ height: 14 }} />
          {/* Bottom rule */}
          <div style={{ width: 160, height: 0.5, background: c.gold, opacity: 0.26 }} />
        </div>

        {/* ── Flex spacer — pushes QR to lower third ──────────────────── */}
        <div style={{ flex: 1, minHeight: 14 }} />

        {/* ══════════════════════════════════════════════════════════════
            ZONE 7 — QR code
        ══════════════════════════════════════════════════════════════ */}
        <div style={{
          position:       'relative',
          width:          106,
          height:         106,
          flexShrink:     0,
        }}>
          {/* QR sits inset */}
          <div style={{ position: 'absolute', top: 7, left: 7, lineHeight: 0 }}>
            <QRCodeSVG value={rsvpUrl} size={92} bgColor={c.bg} fgColor={c.ink} level="M" />
          </div>
          {/* Frame */}
          <svg width={106} height={106} viewBox="0 0 106 106" fill="none" aria-hidden="true"
            style={{ position: 'absolute', top: 0, left: 0 }}>
            <rect x="1" y="1" width="104" height="104"
              stroke={c.goldRule} strokeWidth="0.60" fill="none"/>
            {/* L-corner marks */}
            <path d="M 16,2  L 2,2  L 2,16"
              stroke={c.gold} strokeWidth="1.10" strokeLinecap="round" strokeLinejoin="round" opacity="0.50"/>
            <path d="M 90,2  L 104,2  L 104,16"
              stroke={c.gold} strokeWidth="1.10" strokeLinecap="round" strokeLinejoin="round" opacity="0.50"/>
            <path d="M 16,104 L 2,104  L 2,90"
              stroke={c.gold} strokeWidth="1.10" strokeLinecap="round" strokeLinejoin="round" opacity="0.50"/>
            <path d="M 90,104 L 104,104 L 104,90"
              stroke={c.gold} strokeWidth="1.10" strokeLinecap="round" strokeLinejoin="round" opacity="0.50"/>
          </svg>
        </div>

        {/* Scan label */}
        <div style={{ height: 12, flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 22, height: 0.5, background: c.gold, opacity: 0.28 }} />
          <span style={{
            fontFamily:    SANS,
            fontSize:      7,
            fontWeight:    400,
            letterSpacing: '0.40em',
            color:         c.inkSub,
            textTransform: 'uppercase' as const,
            lineHeight:    1,
          }}>
            {t.cardScanRsvp}
          </span>
          <div style={{ width: 22, height: 0.5, background: c.gold, opacity: 0.28 }} />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ZONE 8 — Bottom botanical + year
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ height: 18, flexShrink: 0 }} />
        <BottomSprig c={c} />
        <div style={{ height: 8, flexShrink: 0 }} />
        <span style={{
          fontFamily:    SANS,
          fontSize:      7,
          letterSpacing: '0.38em',
          color:         c.inkFaint,
          textTransform: 'uppercase' as const,
          lineHeight:    1,
        }}>
          · {year} ·
        </span>
        <div style={{ height: 26, flexShrink: 0 }} />
      </div>
    );
  },
);

InvitationCard.displayName = 'InvitationCard';

export { InvitationCard };
export default InvitationCard;
