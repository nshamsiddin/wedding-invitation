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
  bgDeep:    string;
  bgGrad:    string;
  ink:       string;
  inkSub:    string;
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
    bgDeep:    '#F2E9D6',
    bgGrad:    'linear-gradient(175deg, #EDE3CC 0%, #FAF5EC 16%, #FAF5EC 84%, #EDE3CC 100%)',
    ink:       '#28180E',
    inkSub:    'rgba(40,24,14,0.52)',
    gold:      '#A8832E',
    goldRule:  'rgba(168,131,46,0.38)',
    petalDeep: '#C08892',
    petalLt:   '#DFBCC2',
    stemClr:   '#7A9E7C',
    leafClr:   '#96B898',
  },
  noir: {
    bg:        '#1C1408',
    bgDeep:    '#251A0A',
    bgGrad:    'linear-gradient(175deg, #0E0A04 0%, #1C1408 16%, #1C1408 84%, #0E0A04 100%)',
    ink:       '#F0E6D2',
    inkSub:    'rgba(240,230,210,0.60)',
    gold:      '#D4AA50',
    goldRule:  'rgba(212,170,80,0.35)',
    petalDeep: '#EDD4DA',
    petalLt:   '#F5E4E8',
    stemClr:   '#7AAA80',
    leafClr:   '#96C098',
  },
  blush: {
    bg:        '#FDF0F2',
    bgDeep:    '#F5D8DC',
    bgGrad:    'linear-gradient(175deg, #F4D0D6 0%, #FDF0F2 16%, #FDF0F2 84%, #F4D0D6 100%)',
    ink:       '#2A1418',
    inkSub:    'rgba(42,20,24,0.52)',
    gold:      '#B07046',
    goldRule:  'rgba(176,112,70,0.35)',
    petalDeep: '#D06878',
    petalLt:   '#E8A8B4',
    stemClr:   '#6A9E7A',
    leafClr:   '#88B898',
  },
  sage: {
    bg:        '#F0F4EE',
    bgDeep:    '#E0EAE0',
    bgGrad:    'linear-gradient(175deg, #D8E8D8 0%, #F0F4EE 16%, #F0F4EE 84%, #D8E8D8 100%)',
    ink:       '#162014',
    inkSub:    'rgba(22,32,20,0.55)',
    gold:      '#8A9840',
    goldRule:  'rgba(138,152,64,0.38)',
    petalDeep: '#C0A0A8',
    petalLt:   '#D8BCC0',
    stemClr:   '#5A8A60',
    leafClr:   '#78AC80',
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
  const pr = 4.6 * r;
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
      <circle cx={cx} cy={cy} r={pr * 0.30} fill={c.gold}  opacity={0.70} />
      <circle cx={cx} cy={cy} r={pr * 0.14} fill={c.bg}    opacity={0.82} />
    </g>
  );
}

// ─── Top twin branches ────────────────────────────────────────────────────────
function TopBranches({ c }: { c: ThemeColors }) {
  return (
    <svg width="460" height="86" viewBox="0 0 460 86" fill="none" aria-hidden="true">
      {/* Left main stem */}
      <path d="M 30,82 C 58,62 92,40 124,22"
        stroke={c.stemClr} strokeWidth="0.88" strokeLinecap="round" fill="none" opacity="0.55"/>
      {/* Left sub-stem A */}
      <path d="M 76,56 C 66,47 58,40 52,36"
        stroke={c.stemClr} strokeWidth="0.65" strokeLinecap="round" fill="none" opacity="0.44"/>
      {/* Left sub-stem B */}
      <path d="M 102,38 C 94,30 87,24 83,20"
        stroke={c.stemClr} strokeWidth="0.58" strokeLinecap="round" fill="none" opacity="0.40"/>

      {/* Left leaves */}
      <ellipse cx="46"  cy="63" rx="10"  ry="3.2" fill={c.leafClr} opacity="0.46" transform="rotate(-58 46 63)"/>
      <ellipse cx="57"  cy="65" rx="8.5" ry="2.8" fill={c.leafClr} opacity="0.40" transform="rotate(-44 57 65)"/>
      <ellipse cx="75"  cy="48" rx="10"  ry="3.0" fill={c.leafClr} opacity="0.50" transform="rotate(-48 75 48)"/>
      <ellipse cx="88"  cy="52" rx="8"   ry="2.6" fill={c.leafClr} opacity="0.42" transform="rotate(-36 88 52)"/>
      <ellipse cx="105" cy="32" rx="9"   ry="2.8" fill={c.leafClr} opacity="0.47" transform="rotate(-32 105 32)"/>
      <ellipse cx="50"  cy="35" rx="7"   ry="2.4" fill={c.leafClr} opacity="0.40" transform="rotate(-62 50 35)"/>
      <ellipse cx="82"  cy="19" rx="7"   ry="2.4" fill={c.leafClr} opacity="0.36" transform="rotate(-22 82 19)"/>

      {/* Right main stem (mirror) */}
      <path d="M 430,82 C 402,62 368,40 336,22"
        stroke={c.stemClr} strokeWidth="0.88" strokeLinecap="round" fill="none" opacity="0.55"/>
      {/* Right sub-stem A */}
      <path d="M 384,56 C 394,47 402,40 408,36"
        stroke={c.stemClr} strokeWidth="0.65" strokeLinecap="round" fill="none" opacity="0.44"/>
      {/* Right sub-stem B */}
      <path d="M 358,38 C 366,30 373,24 377,20"
        stroke={c.stemClr} strokeWidth="0.58" strokeLinecap="round" fill="none" opacity="0.40"/>

      {/* Right leaves */}
      <ellipse cx="414" cy="63" rx="10"  ry="3.2" fill={c.leafClr} opacity="0.46" transform="rotate(58 414 63)"/>
      <ellipse cx="403" cy="65" rx="8.5" ry="2.8" fill={c.leafClr} opacity="0.40" transform="rotate(44 403 65)"/>
      <ellipse cx="385" cy="48" rx="10"  ry="3.0" fill={c.leafClr} opacity="0.50" transform="rotate(48 385 48)"/>
      <ellipse cx="372" cy="52" rx="8"   ry="2.6" fill={c.leafClr} opacity="0.42" transform="rotate(36 372 52)"/>
      <ellipse cx="355" cy="32" rx="9"   ry="2.8" fill={c.leafClr} opacity="0.47" transform="rotate(32 355 32)"/>
      <ellipse cx="410" cy="35" rx="7"   ry="2.4" fill={c.leafClr} opacity="0.40" transform="rotate(62 410 35)"/>
      <ellipse cx="378" cy="19" rx="7"   ry="2.4" fill={c.leafClr} opacity="0.36" transform="rotate(22 378 19)"/>

      {/* Blooms — left side */}
      <Bloom cx={52}  cy={36} r={0.80} opacity={0.68} c={c} />
      <Bloom cx={83}  cy={20} r={0.70} opacity={0.62} c={c} />
      <Bloom cx={124} cy={22} r={0.86} opacity={0.76} c={c} />

      {/* Blooms — right side */}
      <Bloom cx={408} cy={36} r={0.80} opacity={0.68} c={c} />
      <Bloom cx={377} cy={20} r={0.70} opacity={0.62} c={c} />
      <Bloom cx={336} cy={22} r={0.86} opacity={0.76} c={c} />

      {/* Central starburst diamond */}
      <path d="M 230,2 L 240,14 L 230,26 L 220,14 Z" fill={c.gold} opacity="0.34"/>
      <path d="M 230,6 L 237,14 L 230,22 L 223,14 Z" fill={c.gold} opacity="0.52"/>
      <circle cx="230" cy="14" r="2.2" fill={c.bg} opacity="0.78"/>

      {/* Horizontal accent lines flanking centre diamond */}
      <line x1="178" y1="14" x2="218" y2="14"
        stroke={c.gold} strokeWidth="0.50" strokeLinecap="round" opacity="0.28"/>
      <line x1="242" y1="14" x2="282" y2="14"
        stroke={c.gold} strokeWidth="0.50" strokeLinecap="round" opacity="0.28"/>
    </svg>
  );
}

// ─── Bottom echo branches ─────────────────────────────────────────────────────
function BottomBranches({ c }: { c: ThemeColors }) {
  return (
    <svg width="460" height="54" viewBox="0 0 460 54" fill="none" aria-hidden="true">
      {/* Left mini branch */}
      <path d="M 58,50 C 82,38 106,26 132,16"
        stroke={c.stemClr} strokeWidth="0.80" strokeLinecap="round" fill="none" opacity="0.48"/>
      {/* Right mini branch */}
      <path d="M 402,50 C 378,38 354,26 328,16"
        stroke={c.stemClr} strokeWidth="0.80" strokeLinecap="round" fill="none" opacity="0.48"/>

      {/* Left leaves */}
      <ellipse cx="80"  cy="41" rx="8.5" ry="2.8" fill={c.leafClr} opacity="0.42" transform="rotate(-48 80 41)"/>
      <ellipse cx="108" cy="28" rx="7.5" ry="2.5" fill={c.leafClr} opacity="0.44" transform="rotate(-36 108 28)"/>

      {/* Right leaves */}
      <ellipse cx="380" cy="41" rx="8.5" ry="2.8" fill={c.leafClr} opacity="0.42" transform="rotate(48 380 41)"/>
      <ellipse cx="352" cy="28" rx="7.5" ry="2.5" fill={c.leafClr} opacity="0.44" transform="rotate(36 352 28)"/>

      {/* Three blooms */}
      <Bloom cx={132} cy={16} r={0.72} opacity={0.66} c={c} />
      <Bloom cx={230} cy={8}  r={0.78} opacity={0.70} c={c} />
      <Bloom cx={328} cy={16} r={0.72} opacity={0.66} c={c} />

      {/* Centre mini diamond */}
      <path d="M 230,2 L 235,8 L 230,14 L 225,8 Z"  fill={c.gold} opacity="0.30"/>
      <path d="M 230,5 L 233,8 L 230,11 L 227,8 Z"  fill={c.gold} opacity="0.46"/>
    </svg>
  );
}

// ─── Diamond ornament divider ─────────────────────────────────────────────────
function DiamondRule({ width = 300, c }: { width?: number; c: ThemeColors }) {
  const half = (width - 16) / 2;
  const mid  = width / 2;
  return (
    <svg width={width} height={20} viewBox={`0 0 ${width} 20`} fill="none" aria-hidden="true">
      <line x1={0}          y1={10} x2={half - 8}  y2={10} stroke={c.gold} strokeWidth="0.55" opacity="0.40"/>
      <circle cx={half - 2} cy={10} r={1.8} fill={c.gold} opacity="0.44"/>
      <path d={`M${mid} 3 L${mid + 8} 10 L${mid} 17 L${mid - 8} 10 Z`}
        fill={c.petalDeep} opacity="0.34"/>
      <path d={`M${mid} 7 L${mid + 3} 10 L${mid} 13 L${mid - 3} 10 Z`}
        fill={c.gold} opacity="0.58"/>
      <circle cx={half + 20} cy={10} r={1.8} fill={c.gold} opacity="0.44"/>
      <line x1={half + 26}  y1={10} x2={width}     y2={10} stroke={c.gold} strokeWidth="0.55" opacity="0.40"/>
    </svg>
  );
}

// ─── Slim dot rule ────────────────────────────────────────────────────────────
function DotRule({ width = 120, c }: { width?: number; c: ThemeColors }) {
  const mid = width / 2;
  return (
    <svg width={width} height={10} viewBox={`0 0 ${width} 10`} fill="none" aria-hidden="true">
      <line x1={0}       y1={5} x2={mid - 6} y2={5} stroke={c.gold} strokeWidth="0.48" opacity="0.30"/>
      <circle cx={mid}   cy={5} r={2.0} fill={c.gold} opacity="0.36"/>
      <line x1={mid + 6} y1={5} x2={width}   y2={5} stroke={c.gold} strokeWidth="0.48" opacity="0.30"/>
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
          return `${eventDateObj.getDate()} ${M[eventDateObj.getMonth()]}, ${eventDateObj.getFullYear()}`;
        }
        return eventDateObj.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
      } catch {
        return eventDate;
      }
    })();

    const year = eventDateObj.getFullYear();

    const cornerMarks = [
      { top: 28,    left:  28 },
      { top: 28,    right: 28 },
      { bottom: 28, left:  28 },
      { bottom: 28, right: 28 },
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
        {/* ── Outer inset border ──────────────────────────────────────── */}
        <div style={{
          position:      'absolute',
          inset:         14,
          border:        `0.65px solid ${c.goldRule}`,
          pointerEvents: 'none',
          zIndex:        10,
        }} />

        {/* ── Inner inset border ──────────────────────────────────────── */}
        <div style={{
          position:      'absolute',
          inset:         21,
          border:        `0.45px solid ${c.goldRule}`,
          pointerEvents: 'none',
          zIndex:        10,
          opacity:       0.60,
        }} />

        {/* ── Corner diamond marks at inner border ────────────────────── */}
        {cornerMarks.map((pos, i) => (
          <svg
            key={i}
            width={10} height={10} viewBox="0 0 10 10"
            fill="none" aria-hidden="true"
            style={{ position: 'absolute', zIndex: 10, ...pos }}
          >
            <path d="M5 0.5 L9.5 5 L5 9.5 L0.5 5 Z" fill={c.gold} opacity={0.46} />
            <path d="M5 3.2 L6.8 5 L5 6.8 L3.2 5 Z" fill={c.gold} opacity={0.28} />
          </svg>
        ))}

        {/* ══ TOP PADDING ════════════════════════════════════════════════ */}
        <div style={{ height: 30, flexShrink: 0 }} />

        {/* ══ ZONE 1 — Botanical header ══════════════════════════════════ */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           10,
          flexShrink:    0,
        }}>
          <TopBranches c={c} />

          {/* Overline: "WEDDING INVITATION" */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 38, height: 0.55, background: c.gold, opacity: 0.36 }} />
            <span style={{
              fontFamily:    SANS,
              fontSize:      8.5,
              fontWeight:    500,
              letterSpacing: '0.44em',
              color:         c.gold,
              textTransform: 'uppercase',
              lineHeight:    1,
            }}>
              {t.cardWeddingInvitation}
            </span>
            <div style={{ width: 38, height: 0.55, background: c.gold, opacity: 0.36 }} />
          </div>
        </div>

        {/* ── Gap ─────────────────────────────────────────────────────── */}
        <div style={{ height: 26, flexShrink: 0 }} />

        {/* ══ ZONE 2 — Couple names (hero) ═══════════════════════════════ */}
        <div style={{
          position:      'relative',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          flexShrink:    0,
        }}>
          <span style={{
            fontFamily: GLOSSILY,
            fontSize:   88,
            color:      c.ink,
            lineHeight: 0.88,
            whiteSpace: 'nowrap',
          }}>
            Berfin
          </span>

          {/* Fixed-height gap — the "&" is absolutely centred inside this space */}
          <div style={{ height: 44 }} />

          <span style={{
            fontFamily: GLOSSILY,
            fontSize:   88,
            color:      c.ink,
            lineHeight: 0.88,
            whiteSpace: 'nowrap',
          }}>
            Shamsiddin
          </span>

          {/* Absolutely centred ampersand */}
          <span style={{
            position:      'absolute',
            top:           '50%',
            left:          '50%',
            transform:     'translate(-50%, -50%)',
            fontFamily:    CORMORANT,
            fontStyle:     'italic',
            fontWeight:    400,
            fontSize:      28,
            color:         c.gold,
            lineHeight:    1,
            letterSpacing: '0.05em',
            whiteSpace:    'nowrap',
            zIndex:        1,
          }}>
            &amp;
          </span>
        </div>

        {/* ── Gap ─────────────────────────────────────────────────────── */}
        <div style={{ height: 16, flexShrink: 0 }} />

        {/* Diamond ornament rule */}
        <div style={{ flexShrink: 0 }}>
          <DiamondRule width={300} c={c} />
        </div>

        {/* ── Gap ─────────────────────────────────────────────────────── */}
        <div style={{ height: 22, flexShrink: 0 }} />

        {/* ══ ZONE 3 — Personal address ══════════════════════════════════ */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          flexShrink:    0,
          paddingLeft:   52,
          paddingRight:  52,
          width:         540,
          boxSizing:     'border-box',
        }}>
          <span style={{
            fontFamily:  CORMORANT,
            fontStyle:   'italic',
            fontSize:    19,
            color:       c.inkSub,
            textAlign:   'center',
            lineHeight:  1.50,
          }}>
            {t.cardWeInviteYou}
          </span>

          <div style={{ height: 12 }} />

          {/* Guest name flanked by DotRules for an intimate, hand-picked feel */}
          <div style={{
            display:       'flex',
            flexDirection: 'column',
            alignItems:    'center',
            gap:           7,
          }}>
            <div style={{ flexShrink: 0 }}>
              <DotRule width={120} c={c} />
            </div>
            <span style={{
              fontFamily:    CORMORANT,
              fontWeight:    600,
              fontSize:      27,
              color:         c.ink,
              textAlign:     'center',
              letterSpacing: '0.02em',
              lineHeight:    1.20,
            }}>
              {guestName}
            </span>
            <div style={{ flexShrink: 0 }}>
              <DotRule width={120} c={c} />
            </div>
          </div>
        </div>

        {/* ── Gap ─────────────────────────────────────────────────────── */}
        <div style={{ height: 18, flexShrink: 0 }} />

        {/* ══ ZONE 4 — Event details panel ═══════════════════════════════ */}
        <div style={{
          width:         460,
          flexShrink:    0,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           7,
          paddingTop:    18,
          paddingBottom: 18,
          paddingLeft:   32,
          paddingRight:  32,
          background:    c.bgDeep,
          border:        `0.65px solid ${c.goldRule}`,
          boxSizing:     'border-box',
        }}>
          {eventName && (
            <>
              <span style={{
                fontFamily:    SANS,
                fontSize:      7.5,
                fontWeight:    500,
                letterSpacing: '0.38em',
                color:         c.petalDeep,
                textTransform: 'uppercase',
                lineHeight:    1,
              }}>
                {eventName}
              </span>
              <div style={{ width: 22, height: 0.5, background: c.gold, opacity: 0.28 }} />
            </>
          )}

          <span style={{
            fontFamily:    CORMORANT,
            fontWeight:    600,
            fontSize:      22,
            color:         c.ink,
            letterSpacing: '0.01em',
            lineHeight:    1.20,
            textAlign:     'center',
          }}>
            {formattedDate}
          </span>

          {(eventTime ?? venueName) && (
            <span style={{
              fontFamily:  CORMORANT,
              fontStyle:   'italic',
              fontSize:    16.5,
              color:       c.inkSub,
              textAlign:   'center',
              lineHeight:  1.35,
            }}>
              {[eventTime, venueName].filter(Boolean).join('  ·  ')}
            </span>
          )}

          {tableNumber != null && (
            <div style={{
              marginTop:     4,
              paddingLeft:   18,
              paddingRight:  18,
              paddingTop:    5,
              paddingBottom: 5,
              border:        `0.65px solid ${c.goldRule}`,
              display:       'flex',
              alignItems:    'center',
              gap:           8,
              background:    `${c.gold}14`,
            }}>
              <span style={{
                fontFamily:    SANS,
                fontSize:      7,
                fontWeight:    500,
                letterSpacing: '0.36em',
                color:         c.gold,
                textTransform: 'uppercase',
                lineHeight:    1,
              }}>
                {t.cardTable}
              </span>
              <span style={{
                fontFamily: CORMORANT,
                fontSize:   20,
                fontWeight: 600,
                color:      c.gold,
                lineHeight: 1,
              }}>
                {tableNumber}
              </span>
            </div>
          )}
        </div>

        {/* ── Flexible spacer: absorbs variance in content height ─────── */}
        <div style={{ flex: 1, minHeight: 8 }} />

        {/* ══ ZONE 5 — QR code ═══════════════════════════════════════════ */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           10,
          flexShrink:    0,
        }}>
          {/* QR wrapped in L-bracket corner frame */}
          <div style={{ position: 'relative', width: 104, height: 104, lineHeight: 0 }}>
            <div style={{ position: 'absolute', top: 10, left: 10 }}>
              <QRCodeSVG value={rsvpUrl} size={84} bgColor={c.bg} fgColor={c.ink} level="M" />
            </div>
            <svg
              width={104} height={104} viewBox="0 0 104 104"
              fill="none" aria-hidden="true"
              style={{ position: 'absolute', top: 0, left: 0 }}
            >
              {/* Top-left */}
              <path d="M 15,4 L 4,4 L 4,15"
                stroke={c.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.54"/>
              {/* Top-right */}
              <path d="M 89,4 L 100,4 L 100,15"
                stroke={c.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.54"/>
              {/* Bottom-left */}
              <path d="M 15,100 L 4,100 L 4,89"
                stroke={c.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.54"/>
              {/* Bottom-right */}
              <path d="M 89,100 L 100,100 L 100,89"
                stroke={c.gold} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.54"/>
            </svg>
          </div>

          {/* "Scan to RSVP" */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 22, height: 0.55, background: c.gold, opacity: 0.34 }} />
            <span style={{
              fontFamily:    SANS,
              fontSize:      7.5,
              fontWeight:    400,
              letterSpacing: '0.36em',
              color:         c.inkSub,
              textTransform: 'uppercase',
              lineHeight:    1,
            }}>
              {t.cardScanRsvp}
            </span>
            <div style={{ width: 22, height: 0.55, background: c.gold, opacity: 0.34 }} />
          </div>

          {/* Year */}
          <span style={{
            fontFamily:    SANS,
            fontSize:      7.5,
            letterSpacing: '0.34em',
            color:         c.inkSub,
            opacity:       0.50,
            textTransform: 'uppercase',
            lineHeight:    1,
          }}>
            · {year} ·
          </span>
        </div>

        {/* ── Gap ─────────────────────────────────────────────────────── */}
        <div style={{ height: 12, flexShrink: 0 }} />

        {/* Bottom botanical echo */}
        <div style={{ flexShrink: 0 }}>
          <BottomBranches c={c} />
        </div>

        {/* ══ BOTTOM PADDING ═════════════════════════════════════════════ */}
        <div style={{ height: 26, flexShrink: 0 }} />
      </div>
    );
  },
);

InvitationCard.displayName = 'InvitationCard';
export default InvitationCard;
