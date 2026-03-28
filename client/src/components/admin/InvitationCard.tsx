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
    bgGrad:    'linear-gradient(170deg, #EDE3CC 0%, #FAF5EC 18%, #FAF5EC 82%, #EDE3CC 100%)',
    ink:       '#28180E',
    inkSub:    'rgba(40,24,14,0.54)',
    inkFaint:  'rgba(40,24,14,0.28)',
    gold:      '#A8832E',
    goldRule:  'rgba(168,131,46,0.32)',
    petalDeep: '#C08892',
    petalLt:   '#DFBCC2',
    stemClr:   '#6A9470',
    leafClr:   '#8AB490',
  },
  noir: {
    bg:        '#1C1408',
    bgGrad:    'linear-gradient(170deg, #100C04 0%, #1C1408 18%, #1C1408 82%, #100C04 100%)',
    ink:       '#F0E6D2',
    inkSub:    'rgba(240,230,210,0.60)',
    inkFaint:  'rgba(240,230,210,0.28)',
    gold:      '#D4AA50',
    goldRule:  'rgba(212,170,80,0.30)',
    petalDeep: '#EDD4DA',
    petalLt:   '#F5E4E8',
    stemClr:   '#6A9E74',
    leafClr:   '#88B890',
  },
  blush: {
    bg:        '#FDF0F2',
    bgGrad:    'linear-gradient(170deg, #F4D0D6 0%, #FDF0F2 18%, #FDF0F2 82%, #F4D0D6 100%)',
    ink:       '#2A1418',
    inkSub:    'rgba(42,20,24,0.54)',
    inkFaint:  'rgba(42,20,24,0.28)',
    gold:      '#B07046',
    goldRule:  'rgba(176,112,70,0.30)',
    petalDeep: '#D06878',
    petalLt:   '#E8A8B4',
    stemClr:   '#5A9068',
    leafClr:   '#7AAE88',
  },
  sage: {
    bg:        '#F0F4EE',
    bgGrad:    'linear-gradient(170deg, #D8E8D8 0%, #F0F4EE 18%, #F0F4EE 82%, #D8E8D8 100%)',
    ink:       '#162014',
    inkSub:    'rgba(22,32,20,0.56)',
    inkFaint:  'rgba(22,32,20,0.28)',
    gold:      '#7A9038',
    goldRule:  'rgba(122,144,56,0.32)',
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

// ─── 6-Petal Bloom ────────────────────────────────────────────────────────────
function Bloom({
  cx, cy, r = 1, opacity = 1, c,
}: {
  cx: number; cy: number; r?: number; opacity?: number; c: ThemeColors;
}) {
  const pr = 4.8 * r;
  const angles = [0, 60, 120, 180, 240, 300];
  return (
    <g opacity={opacity}>
      {angles.map((a, i) => {
        const rad = (a * Math.PI) / 180;
        const px  = cx + pr * Math.sin(rad);
        const py  = cy - pr * Math.cos(rad);
        return (
          <ellipse
            key={i}
            cx={px} cy={py}
            rx={pr * 0.44} ry={pr * 0.80}
            fill={i % 2 === 0 ? c.petalDeep : c.petalLt}
            transform={`rotate(${a} ${px} ${py})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={pr * 0.28} fill={c.gold}  opacity={0.72} />
      <circle cx={cx} cy={cy} r={pr * 0.13} fill={c.bg}    opacity={0.85} />
    </g>
  );
}

// ─── Arch Garland — sweeping twin arms from bottom corners to apex ────────────
function ArchGarland({ c }: { c: ThemeColors }) {
  return (
    <svg width="540" height="208" viewBox="0 0 540 208" fill="none" aria-hidden="true">

      {/* ── Main arms ──────────────────────────────────────────────────── */}
      <path d="M 16,202 C 28,90 148,26 270,14"
        stroke={c.stemClr} strokeWidth="1.05" strokeLinecap="round" fill="none" opacity="0.52"/>
      <path d="M 524,202 C 512,90 392,26 270,14"
        stroke={c.stemClr} strokeWidth="1.05" strokeLinecap="round" fill="none" opacity="0.52"/>

      {/* ── Left sub-branches ──────────────────────────────────────────── */}
      <path d="M 62,138 C 44,126 22,120 8,122"
        stroke={c.stemClr} strokeWidth="0.75" strokeLinecap="round" fill="none" opacity="0.45"/>
      <path d="M 110,86 C 88,75 68,62 54,54"
        stroke={c.stemClr} strokeWidth="0.68" strokeLinecap="round" fill="none" opacity="0.41"/>
      <path d="M 160,50 C 144,37 132,24 124,15"
        stroke={c.stemClr} strokeWidth="0.62" strokeLinecap="round" fill="none" opacity="0.37"/>
      <path d="M 36,170 C 20,162 6,160 2,164"
        stroke={c.stemClr} strokeWidth="0.55" strokeLinecap="round" fill="none" opacity="0.33"/>

      {/* ── Right sub-branches (mirror) ────────────────────────────────── */}
      <path d="M 478,138 C 496,126 518,120 532,122"
        stroke={c.stemClr} strokeWidth="0.75" strokeLinecap="round" fill="none" opacity="0.45"/>
      <path d="M 430,86 C 452,75 472,62 486,54"
        stroke={c.stemClr} strokeWidth="0.68" strokeLinecap="round" fill="none" opacity="0.41"/>
      <path d="M 380,50 C 396,37 408,24 416,15"
        stroke={c.stemClr} strokeWidth="0.62" strokeLinecap="round" fill="none" opacity="0.37"/>
      <path d="M 504,170 C 520,162 534,160 538,164"
        stroke={c.stemClr} strokeWidth="0.55" strokeLinecap="round" fill="none" opacity="0.33"/>

      {/* ── Left leaves ────────────────────────────────────────────────── */}
      <ellipse cx="46"  cy="168" rx="13" ry="4.2" fill={c.leafClr} opacity="0.44" transform="rotate(-55 46 168)"/>
      <ellipse cx="64"  cy="162" rx="11" ry="3.5" fill={c.leafClr} opacity="0.38" transform="rotate(-42 64 162)"/>
      <ellipse cx="4"   cy="120" rx="10" ry="3.0" fill={c.leafClr} opacity="0.36" transform="rotate(-68 4 120)"/>
      <ellipse cx="68"  cy="130" rx="12" ry="4.0" fill={c.leafClr} opacity="0.46" transform="rotate(-54 68 130)"/>
      <ellipse cx="88"  cy="134" rx="10" ry="3.2" fill={c.leafClr} opacity="0.40" transform="rotate(-40 88 134)"/>
      <ellipse cx="96"  cy="82"  rx="12" ry="3.8" fill={c.leafClr} opacity="0.46" transform="rotate(-42 96 82)"/>
      <ellipse cx="115" cy="86"  rx="10" ry="3.0" fill={c.leafClr} opacity="0.38" transform="rotate(-28 115 86)"/>
      <ellipse cx="50"  cy="54"  rx="10" ry="3.2" fill={c.leafClr} opacity="0.40" transform="rotate(-62 50 54)"/>
      <ellipse cx="66"  cy="48"  rx="8"  ry="2.6" fill={c.leafClr} opacity="0.34" transform="rotate(-48 66 48)"/>
      <ellipse cx="148" cy="45"  rx="10" ry="3.2" fill={c.leafClr} opacity="0.43" transform="rotate(-34 148 45)"/>
      <ellipse cx="162" cy="38"  rx="8"  ry="2.6" fill={c.leafClr} opacity="0.37" transform="rotate(-22 162 38)"/>
      <ellipse cx="120" cy="17"  rx="8"  ry="2.6" fill={c.leafClr} opacity="0.35" transform="rotate(-16 120 17)"/>
      <ellipse cx="194" cy="26"  rx="10" ry="3.0" fill={c.leafClr} opacity="0.42" transform="rotate(-10 194 26)"/>
      <ellipse cx="210" cy="20"  rx="8"  ry="2.4" fill={c.leafClr} opacity="0.36" transform="rotate(-5  210 20)"/>

      {/* ── Right leaves (mirror) ──────────────────────────────────────── */}
      <ellipse cx="494" cy="168" rx="13" ry="4.2" fill={c.leafClr} opacity="0.44" transform="rotate( 55 494 168)"/>
      <ellipse cx="476" cy="162" rx="11" ry="3.5" fill={c.leafClr} opacity="0.38" transform="rotate( 42 476 162)"/>
      <ellipse cx="536" cy="120" rx="10" ry="3.0" fill={c.leafClr} opacity="0.36" transform="rotate( 68 536 120)"/>
      <ellipse cx="472" cy="130" rx="12" ry="4.0" fill={c.leafClr} opacity="0.46" transform="rotate( 54 472 130)"/>
      <ellipse cx="452" cy="134" rx="10" ry="3.2" fill={c.leafClr} opacity="0.40" transform="rotate( 40 452 134)"/>
      <ellipse cx="444" cy="82"  rx="12" ry="3.8" fill={c.leafClr} opacity="0.46" transform="rotate( 42 444 82)"/>
      <ellipse cx="425" cy="86"  rx="10" ry="3.0" fill={c.leafClr} opacity="0.38" transform="rotate( 28 425 86)"/>
      <ellipse cx="490" cy="54"  rx="10" ry="3.2" fill={c.leafClr} opacity="0.40" transform="rotate( 62 490 54)"/>
      <ellipse cx="474" cy="48"  rx="8"  ry="2.6" fill={c.leafClr} opacity="0.34" transform="rotate( 48 474 48)"/>
      <ellipse cx="392" cy="45"  rx="10" ry="3.2" fill={c.leafClr} opacity="0.43" transform="rotate( 34 392 45)"/>
      <ellipse cx="378" cy="38"  rx="8"  ry="2.6" fill={c.leafClr} opacity="0.37" transform="rotate( 22 378 38)"/>
      <ellipse cx="420" cy="17"  rx="8"  ry="2.6" fill={c.leafClr} opacity="0.35" transform="rotate( 16 420 17)"/>
      <ellipse cx="346" cy="26"  rx="10" ry="3.0" fill={c.leafClr} opacity="0.42" transform="rotate( 10 346 26)"/>
      <ellipse cx="330" cy="20"  rx="8"  ry="2.4" fill={c.leafClr} opacity="0.36" transform="rotate(  5 330 20)"/>

      {/* ── Blooms — largest at apex, progressively smaller outward ──── */}
      <Bloom cx={270} cy={14}  r={1.18} opacity={0.88} c={c} />  {/* apex */}
      <Bloom cx={193} cy={24}  r={0.92} opacity={0.76} c={c} />  {/* upper-left */}
      <Bloom cx={347} cy={24}  r={0.92} opacity={0.76} c={c} />  {/* upper-right */}
      <Bloom cx={122} cy={15}  r={0.84} opacity={0.71} c={c} />  {/* left tip */}
      <Bloom cx={418} cy={15}  r={0.84} opacity={0.71} c={c} />  {/* right tip */}
      <Bloom cx={52}  cy={52}  r={0.78} opacity={0.66} c={c} />  {/* left mid */}
      <Bloom cx={488} cy={52}  r={0.78} opacity={0.66} c={c} />  {/* right mid */}
      <Bloom cx={6}   cy={120} r={0.68} opacity={0.59} c={c} />  {/* left outer */}
      <Bloom cx={534} cy={120} r={0.68} opacity={0.59} c={c} />  {/* right outer */}

      {/* ── Apex starburst ornament ─────────────────────────────────── */}
      <path d="M270,4 L275,12 L270,20 L265,12 Z" fill={c.gold} opacity="0.38"/>
      <path d="M270,8  L273,12 L270,16 L267,12 Z" fill={c.gold} opacity="0.56"/>
      <circle cx="270" cy="12" r="2.2" fill={c.bg} opacity="0.84"/>

      {/* ── Thin base rules flanking center ────────────────────────── */}
      <line x1="50"  y1="200" x2="228" y2="200"
        stroke={c.gold} strokeWidth="0.42" opacity="0.18" strokeLinecap="round"/>
      <circle cx="270" cy="200" r="1.6" fill={c.gold} opacity="0.24"/>
      <line x1="312" y1="200" x2="490" y2="200"
        stroke={c.gold} strokeWidth="0.42" opacity="0.18" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Elaborate ornament divider ───────────────────────────────────────────────
function ElaborateDivider({ c }: { c: ThemeColors }) {
  return (
    <svg width="360" height="22" viewBox="0 0 360 22" fill="none" aria-hidden="true">
      <line x1="0"   y1="11" x2="152" y2="11"
        stroke={c.gold} strokeWidth="0.50" opacity="0.36" strokeLinecap="round"/>
      <circle cx="156" cy="11" r="1.6" fill={c.gold} opacity="0.44"/>
      <circle cx="163" cy="11" r="1.0" fill={c.gold} opacity="0.32"/>
      {/* Central diamond with petal fill */}
      <path d="M180 2 L189 11 L180 20 L171 11 Z" fill={c.petalDeep} opacity="0.22"/>
      <path d="M180 6 L185 11 L180 16 L175 11 Z" fill={c.gold} opacity="0.54"/>
      <circle cx="180" cy="11" r="2.0" fill={c.bg} opacity="0.82"/>
      <circle cx="197" cy="11" r="1.0" fill={c.gold} opacity="0.32"/>
      <circle cx="204" cy="11" r="1.6" fill={c.gold} opacity="0.44"/>
      <line x1="208" y1="11" x2="360" y2="11"
        stroke={c.gold} strokeWidth="0.50" opacity="0.36" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Slim dot rule ────────────────────────────────────────────────────────────
function DotRule({ width = 110, c }: { width?: number; c: ThemeColors }) {
  const mid = width / 2;
  return (
    <svg width={width} height={10} viewBox={`0 0 ${width} 10`} fill="none" aria-hidden="true">
      <line x1={0}       y1={5} x2={mid - 7} y2={5}
        stroke={c.gold} strokeWidth="0.50" opacity="0.30" strokeLinecap="round"/>
      <circle cx={mid - 3} cy={5} r={1.2} fill={c.gold} opacity="0.36"/>
      <circle cx={mid}     cy={5} r={2.0} fill={c.gold} opacity="0.44"/>
      <circle cx={mid + 3} cy={5} r={1.2} fill={c.gold} opacity="0.36"/>
      <line x1={mid + 7} y1={5} x2={width} y2={5}
        stroke={c.gold} strokeWidth="0.50" opacity="0.30" strokeLinecap="round"/>
    </svg>
  );
}

// ─── Bottom garland echo — three blooms on a central branch ──────────────────
function BottomGarland({ c }: { c: ThemeColors }) {
  return (
    <svg width="280" height="46" viewBox="0 0 280 46" fill="none" aria-hidden="true">
      {/* Upward center stem */}
      <path d="M 140,44 C 140,32 140,20 140,11"
        stroke={c.stemClr} strokeWidth="0.78" strokeLinecap="round" fill="none" opacity="0.42"/>
      {/* Left branch */}
      <path d="M 140,28 C 115,22 94,18 70,13"
        stroke={c.stemClr} strokeWidth="0.70" strokeLinecap="round" fill="none" opacity="0.40"/>
      {/* Right branch */}
      <path d="M 140,28 C 165,22 186,18 210,13"
        stroke={c.stemClr} strokeWidth="0.70" strokeLinecap="round" fill="none" opacity="0.40"/>

      {/* Leaves */}
      <ellipse cx="94"  cy="20" rx="8.5" ry="2.8" fill={c.leafClr} opacity="0.40" transform="rotate(-26 94 20)"/>
      <ellipse cx="112" cy="18" rx="7.5" ry="2.4" fill={c.leafClr} opacity="0.35" transform="rotate(-16 112 18)"/>
      <ellipse cx="186" cy="20" rx="8.5" ry="2.8" fill={c.leafClr} opacity="0.40" transform="rotate( 26 186 20)"/>
      <ellipse cx="168" cy="18" rx="7.5" ry="2.4" fill={c.leafClr} opacity="0.35" transform="rotate( 16 168 18)"/>

      {/* Three blooms */}
      <Bloom cx={70}  cy={13} r={0.74} opacity={0.65} c={c} />
      <Bloom cx={140} cy={11} r={0.82} opacity={0.72} c={c} />
      <Bloom cx={210} cy={13} r={0.74} opacity={0.65} c={c} />
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
          const M = [
            'Yanvar','Fevral','Mart','Aprel','May','Iyun',
            'Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr',
          ];
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

    // Corner marks at inner inset border
    const cornerPositions = [
      { top: 20,    left:  20  },
      { top: 20,    right: 20  },
      { bottom: 20, left:  20  },
      { bottom: 20, right: 20  },
    ] as const;

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
        {/* ── Subtle paper noise texture ──────────────────────────── */}
        <div style={{
          position:      'absolute',
          inset:         0,
          opacity:       0.032,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize: '256px 256px',
          pointerEvents: 'none',
          zIndex:        1,
        }} />

        {/* ── Outer border ────────────────────────────────────────── */}
        <div style={{
          position:      'absolute',
          inset:         12,
          border:        `0.60px solid ${c.goldRule}`,
          pointerEvents: 'none',
          zIndex:        10,
        }} />

        {/* ── Inner border ────────────────────────────────────────── */}
        <div style={{
          position:      'absolute',
          inset:         19,
          border:        `0.38px solid ${c.goldRule}`,
          opacity:       0.55,
          pointerEvents: 'none',
          zIndex:        10,
        }} />

        {/* ── Corner diamond marks ─────────────────────────────────── */}
        {cornerPositions.map((pos, i) => (
          <svg
            key={i}
            width={10} height={10} viewBox="0 0 10 10"
            fill="none" aria-hidden="true"
            style={{ position: 'absolute', zIndex: 11, ...pos }}
          >
            <path d="M5 0.5 L9.5 5 L5 9.5 L0.5 5 Z"
              fill={c.gold} opacity={0.42} />
            <circle cx="5" cy="5" r="1.4" fill={c.bg} opacity={0.80} />
          </svg>
        ))}

        {/* ══════════════════════════════════════════════════════════
            ZONE 1  — Botanical arch garland
        ══════════════════════════════════════════════════════════ */}
        <div style={{ height: 30, flexShrink: 0 }} />
        <div style={{ flexShrink: 0, position: 'relative', zIndex: 2 }}>
          <ArchGarland c={c} />
        </div>

        {/* ══════════════════════════════════════════════════════════
            ZONE 2  — Overline
        ══════════════════════════════════════════════════════════ */}
        <div style={{ height: 8, flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
          <div style={{ width: 44, height: 0.50, background: c.gold, opacity: 0.32 }} />
          <span style={{
            fontFamily:    SANS,
            fontSize:      8.0,
            fontWeight:    500,
            letterSpacing: '0.42em',
            color:         c.gold,
            textTransform: 'uppercase',
            lineHeight:    1,
          }}>
            {t.cardWeddingInvitation}
          </span>
          <div style={{ width: 44, height: 0.50, background: c.gold, opacity: 0.32 }} />
        </div>

        {/* ══════════════════════════════════════════════════════════
            ZONE 3  — Couple names (hero)
        ══════════════════════════════════════════════════════════ */}
        <div style={{ height: 20, flexShrink: 0 }} />
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>

          <span style={{
            fontFamily: GLOSSILY,
            fontSize:   84,
            color:      c.ink,
            lineHeight: 0.88,
            whiteSpace: 'nowrap',
          }}>
            Berfin
          </span>

          {/* Fixed-height gap — the "&" is absolutely centred in this gap */}
          <div style={{ height: 44 }} />

          <span style={{
            fontFamily: GLOSSILY,
            fontSize:   84,
            color:      c.ink,
            lineHeight: 0.88,
            whiteSpace: 'nowrap',
          }}>
            Shamsiddin
          </span>

          {/* Ampersand — absolutely centred between the two names */}
          <span style={{
            position:      'absolute',
            top:           '50%',
            left:          '50%',
            transform:     'translate(-50%, -50%)',
            fontFamily:    CORMORANT,
            fontStyle:     'italic',
            fontWeight:    400,
            fontSize:      27,
            color:         c.gold,
            lineHeight:    1,
            letterSpacing: '0.04em',
            whiteSpace:    'nowrap',
            zIndex:        1,
          }}>
            &amp;
          </span>
        </div>

        {/* ══════════════════════════════════════════════════════════
            ZONE 4  — Divider
        ══════════════════════════════════════════════════════════ */}
        <div style={{ height: 18, flexShrink: 0 }} />
        <div style={{ flexShrink: 0 }}>
          <ElaborateDivider c={c} />
        </div>

        {/* ══════════════════════════════════════════════════════════
            ZONE 5  — Personal address
        ══════════════════════════════════════════════════════════ */}
        <div style={{ height: 22, flexShrink: 0 }} />
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          flexShrink:    0,
          paddingLeft:   56,
          paddingRight:  56,
          width:         540,
          boxSizing:     'border-box',
          gap:           8,
        }}>
          <span style={{
            fontFamily: CORMORANT,
            fontStyle:  'italic',
            fontSize:   17.5,
            color:      c.inkSub,
            textAlign:  'center',
            lineHeight: 1.55,
          }}>
            {t.cardWeInviteYou}
          </span>

          <div style={{ height: 4 }} />
          <div style={{ flexShrink: 0 }}><DotRule width={110} c={c} /></div>
          <span style={{
            fontFamily:    CORMORANT,
            fontWeight:    600,
            fontSize:      30,
            color:         c.ink,
            textAlign:     'center',
            letterSpacing: '0.02em',
            lineHeight:    1.18,
          }}>
            {guestName}
          </span>
          <div style={{ flexShrink: 0 }}><DotRule width={110} c={c} /></div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            ZONE 6  — Event details (clean typography, no panel)
        ══════════════════════════════════════════════════════════ */}
        <div style={{ height: 26, flexShrink: 0 }} />
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          flexShrink:    0,
          gap:           0,
          paddingLeft:   48,
          paddingRight:  48,
          width:         540,
          boxSizing:     'border-box',
        }}>
          {/* Thin gold top rule */}
          <div style={{ width: 180, height: 0.50, background: c.gold, opacity: 0.28, marginBottom: 14 }} />

          {/* Optional event/location label */}
          {eventName && (
            <>
              <span style={{
                fontFamily:    SANS,
                fontSize:      7.5,
                fontWeight:    500,
                letterSpacing: '0.40em',
                color:         c.petalDeep,
                textTransform: 'uppercase',
                lineHeight:    1,
                opacity:       0.85,
              }}>
                {eventName}
              </span>
              <div style={{ height: 10 }} />
            </>
          )}

          {/* Date */}
          <span style={{
            fontFamily:    CORMORANT,
            fontWeight:    600,
            fontSize:      24,
            color:         c.ink,
            letterSpacing: '0.01em',
            lineHeight:    1.18,
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
                fontSize:   16,
                color:      c.inkSub,
                textAlign:  'center',
                lineHeight: 1.40,
              }}>
                {[eventTime, venueName].filter(Boolean).join('  ·  ')}
              </span>
            </>
          )}

          {/* Table assignment — only when set */}
          {tableNumber != null && (
            <>
              <div style={{ height: 14 }} />
              <div style={{
                display:       'inline-flex',
                alignItems:    'center',
                gap:           10,
                paddingLeft:   20,
                paddingRight:  20,
                paddingTop:    6,
                paddingBottom: 6,
                border:        `0.55px solid ${c.goldRule}`,
              }}>
                <span style={{
                  fontFamily:    SANS,
                  fontSize:      7,
                  fontWeight:    500,
                  letterSpacing: '0.38em',
                  color:         c.gold,
                  textTransform: 'uppercase',
                  lineHeight:    1,
                }}>
                  {t.cardTable}
                </span>
                <div style={{ width: 0.50, height: 14, background: c.goldRule }} />
                <span style={{
                  fontFamily: CORMORANT,
                  fontSize:   22,
                  fontWeight: 600,
                  color:      c.gold,
                  lineHeight: 1,
                }}>
                  {tableNumber}
                </span>
              </div>
            </>
          )}

          {/* Thin bottom rule */}
          <div style={{ height: 14 }} />
          <div style={{ width: 180, height: 0.50, background: c.gold, opacity: 0.28 }} />
        </div>

        {/* ── Flexible spacer: pushes QR to lower third ───────────── */}
        <div style={{ flex: 1, minHeight: 14 }} />

        {/* ══════════════════════════════════════════════════════════
            ZONE 7  — QR code with elegant frame
        ══════════════════════════════════════════════════════════ */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           12,
          flexShrink:    0,
        }}>
          {/* QR inside thin border with corner L-marks */}
          <div style={{ position: 'relative', width: 112, height: 112, lineHeight: 0 }}>
            {/* QR code sits 8px inside the frame */}
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <QRCodeSVG value={rsvpUrl} size={96} bgColor={c.bg} fgColor={c.ink} level="M" />
            </div>
            {/* Thin border + corner marks */}
            <svg
              width={112} height={112} viewBox="0 0 112 112"
              fill="none" aria-hidden="true"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              {/* Thin full rect */}
              <rect x="1" y="1" width="110" height="110"
                stroke={c.goldRule} strokeWidth="0.65" fill="none"/>
              {/* Corner L-marks — slightly longer for elegance */}
              <path d="M 18,2  L 2,2  L 2,18"
                stroke={c.gold} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.52"/>
              <path d="M 94,2  L 110,2  L 110,18"
                stroke={c.gold} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.52"/>
              <path d="M 18,110 L 2,110  L 2,94"
                stroke={c.gold} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.52"/>
              <path d="M 94,110 L 110,110 L 110,94"
                stroke={c.gold} strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round" opacity="0.52"/>
            </svg>
          </div>

          {/* Scan label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 24, height: 0.50, background: c.gold, opacity: 0.32 }} />
            <span style={{
              fontFamily:    SANS,
              fontSize:      7.5,
              fontWeight:    400,
              letterSpacing: '0.38em',
              color:         c.inkSub,
              textTransform: 'uppercase',
              lineHeight:    1,
            }}>
              {t.cardScanRsvp}
            </span>
            <div style={{ width: 24, height: 0.50, background: c.gold, opacity: 0.32 }} />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            ZONE 8  — Bottom botanical echo + year
        ══════════════════════════════════════════════════════════ */}
        <div style={{ height: 20, flexShrink: 0 }} />
        <div style={{ flexShrink: 0 }}>
          <BottomGarland c={c} />
        </div>
        <div style={{ height: 8, flexShrink: 0 }} />
        <span style={{
          fontFamily:    SANS,
          fontSize:      7.5,
          letterSpacing: '0.36em',
          color:         c.inkFaint,
          textTransform: 'uppercase',
          lineHeight:    1,
        }}>
          · {year} ·
        </span>
        <div style={{ height: 28, flexShrink: 0 }} />
      </div>
    );
  },
);

InvitationCard.displayName = 'InvitationCard';
export default InvitationCard;
