import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Language } from '../../lib/i18n';
import { en, tr, uz } from '../../lib/i18n';

const T = { en, tr, uz };

const GLOSSILY  = "'GlossilyEnigmatic', 'Cormorant Garamond', cursive";
const CORMORANT = '"Cormorant Garamond", Georgia, serif';
const SANS      = '"DM Sans", system-ui, sans-serif';

// ─── Palette — exact tokens from the live invitation page ─────────────────────
const PARCHMENT      = '#FDFAF5';
const ESPRESSO       = '#2A1F1A';
const ESPRESSO_DIM   = 'rgba(42,31,26,0.68)';
const ESPRESSO_FAINT = 'rgba(42,31,26,0.26)';
const GOLD           = '#B8924A';
const GOLD_DIM       = 'rgba(184,146,74,0.42)';
const ROSE           = '#C4848C';
const ROSE_DIM       = 'rgba(196,132,140,0.55)';
const SAGE           = '#6B8F71';
const SAGE_LT        = '#A8C4AB';

export type CardTheme = 'parchment' | 'noir' | 'blush' | 'sage';

// Theme overrides for non-default themes; parchment uses the live-page tokens above.
interface ThemeColors {
  bg:           string;
  bgGrad:       string;
  ink:          string;
  inkSub:       string;
  inkFaint:     string;
  gold:         string;
  goldDim:      string;
  rose:         string;
  roseDim:      string;
  sageClr:      string;
  sageLt:       string;
}

export const CARD_THEMES: Record<CardTheme, ThemeColors> = {
  parchment: {
    bg:      PARCHMENT,
    bgGrad:  `linear-gradient(175deg, #F5EFE4 0%, ${PARCHMENT} 20%, ${PARCHMENT} 80%, #F5EFE4 100%)`,
    ink:     ESPRESSO,
    inkSub:  ESPRESSO_DIM,
    inkFaint: ESPRESSO_FAINT,
    gold:    GOLD,
    goldDim: GOLD_DIM,
    rose:    ROSE,
    roseDim: ROSE_DIM,
    sageClr: SAGE,
    sageLt:  SAGE_LT,
  },
  noir: {
    bg:       '#1C1408',
    bgGrad:   'linear-gradient(175deg,#100C04 0%,#1C1408 20%,#1C1408 80%,#100C04 100%)',
    ink:      '#F0E6D2',
    inkSub:   'rgba(240,230,210,0.62)',
    inkFaint: 'rgba(240,230,210,0.28)',
    gold:     '#D4AA50',
    goldDim:  'rgba(212,170,80,0.38)',
    rose:     '#EDD4DA',
    roseDim:  'rgba(237,212,218,0.50)',
    sageClr:  '#6A9E74',
    sageLt:   '#88B890',
  },
  blush: {
    bg:       '#FDF0F2',
    bgGrad:   'linear-gradient(175deg,#F4D0D6 0%,#FDF0F2 20%,#FDF0F2 80%,#F4D0D6 100%)',
    ink:      '#2A1418',
    inkSub:   'rgba(42,20,24,0.65)',
    inkFaint: 'rgba(42,20,24,0.28)',
    gold:     '#B07046',
    goldDim:  'rgba(176,112,70,0.38)',
    rose:     '#D06878',
    roseDim:  'rgba(208,104,120,0.50)',
    sageClr:  '#5A9068',
    sageLt:   '#7AAE88',
  },
  sage: {
    bg:       '#F0F4EE',
    bgGrad:   'linear-gradient(175deg,#D8E8D8 0%,#F0F4EE 20%,#F0F4EE 80%,#D8E8D8 100%)',
    ink:      '#162014',
    inkSub:   'rgba(22,32,20,0.65)',
    inkFaint: 'rgba(22,32,20,0.28)',
    gold:     '#7A9038',
    goldDim:  'rgba(122,144,56,0.38)',
    rose:     '#B8A0A8',
    roseDim:  'rgba(184,160,168,0.50)',
    sageClr:  '#4A8054',
    sageLt:   '#6AA074',
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

// ─── Vine corner — top-left (static, matches VineCornerTL from the live page) ──
function VineCornerTL({ c }: { c: ThemeColors }) {
  return (
    <svg
      width="148" height="148" viewBox="0 0 160 160"
      style={{ position: 'absolute', top: 0, left: 0 }}
      aria-hidden="true"
    >
      {/* Main stem */}
      <path d="M8 8 C 20 30, 15 60, 30 90 C 45 120, 60 130, 80 140"
        fill="none" stroke={c.sageClr} strokeWidth="1.4" strokeLinecap="round" opacity="0.68"/>
      {/* Side branch 1 */}
      <path d="M20 40 C 35 30, 50 28, 60 20"
        fill="none" stroke={c.sageClr} strokeWidth="1.0" strokeLinecap="round" opacity="0.58"/>
      {/* Side branch 2 */}
      <path d="M28 65 C 45 55, 60 50, 75 45"
        fill="none" stroke={c.sageClr} strokeWidth="1.0" strokeLinecap="round" opacity="0.58"/>
      {/* Leaves */}
      <path d="M60 20 C 55 12, 68 10, 65 18 Z" fill={c.sageClr} opacity="0.62"/>
      <path d="M75 45 C 72 37, 84 38, 80 46 Z" fill={c.sageClr} opacity="0.62"/>
      <path d="M30 90 C 20 84, 22 74, 32 80 Z" fill={c.sageClr} opacity="0.55"/>
      <path d="M50 28 C 44 20, 56 18, 54 28 Z" fill={c.sageLt} opacity="0.50"/>
      {/* Small rose bloom at branch tip */}
      <circle cx="62" cy="19" r="4.5" fill={c.rose} opacity="0.70"/>
      <circle cx="62" cy="19" r="1.8" fill={c.bg}   opacity="0.80"/>
      {/* Small bloom on branch 2 */}
      <circle cx="76" cy="44" r="3.5" fill={c.rose} opacity="0.60"/>
      <circle cx="76" cy="44" r="1.4" fill={c.bg}   opacity="0.80"/>
    </svg>
  );
}

// ─── Vine corner — bottom-right ───────────────────────────────────────────────
function VineCornerBR({ c }: { c: ThemeColors }) {
  return (
    <svg
      width="148" height="148" viewBox="0 0 160 160"
      style={{ position: 'absolute', bottom: 0, right: 0, transform: 'rotate(180deg)' }}
      aria-hidden="true"
    >
      <path d="M8 8 C 20 30, 15 60, 30 90 C 45 120, 60 130, 80 140"
        fill="none" stroke={c.sageClr} strokeWidth="1.4" strokeLinecap="round" opacity="0.60"/>
      <path d="M20 40 C 35 30, 50 28, 60 20"
        fill="none" stroke={c.sageClr} strokeWidth="1.0" strokeLinecap="round" opacity="0.52"/>
      <path d="M28 65 C 45 55, 60 50, 75 45"
        fill="none" stroke={c.sageClr} strokeWidth="1.0" strokeLinecap="round" opacity="0.52"/>
      <path d="M60 20 C 55 12, 68 10, 65 18 Z" fill={c.sageClr} opacity="0.55"/>
      <path d="M75 45 C 72 37, 84 38, 80 46 Z" fill={c.sageClr} opacity="0.55"/>
      <path d="M30 90 C 20 84, 22 74, 32 80 Z" fill={c.sageClr} opacity="0.48"/>
      <path d="M50 28 C 44 20, 56 18, 54 28 Z" fill={c.sageLt} opacity="0.44"/>
      <circle cx="62" cy="19" r="4.5" fill={c.rose} opacity="0.62"/>
      <circle cx="62" cy="19" r="1.8" fill={c.bg}   opacity="0.80"/>
      <circle cx="76" cy="44" r="3.5" fill={c.rose} opacity="0.55"/>
      <circle cx="76" cy="44" r="1.4" fill={c.bg}   opacity="0.80"/>
    </svg>
  );
}

// ─── Small vine corner — top-right (mirrored TL) ─────────────────────────────
function VineCornerTR({ c }: { c: ThemeColors }) {
  return (
    <svg
      width="120" height="120" viewBox="0 0 160 160"
      style={{ position: 'absolute', top: 0, right: 0, transform: 'scaleX(-1)' }}
      aria-hidden="true"
    >
      <path d="M8 8 C 20 30, 15 60, 30 90 C 45 120, 60 130, 80 140"
        fill="none" stroke={c.sageClr} strokeWidth="1.2" strokeLinecap="round" opacity="0.45"/>
      <path d="M20 40 C 35 30, 50 28, 60 20"
        fill="none" stroke={c.sageClr} strokeWidth="0.9" strokeLinecap="round" opacity="0.40"/>
      <path d="M60 20 C 55 12, 68 10, 65 18 Z" fill={c.sageClr} opacity="0.42"/>
      <circle cx="62" cy="19" r="3.8" fill={c.rose} opacity="0.52"/>
      <circle cx="62" cy="19" r="1.5" fill={c.bg}   opacity="0.80"/>
    </svg>
  );
}

// ─── Heart divider — matches live page post-names separator ───────────────────
function HeartDivider({ c }: { c: ThemeColors }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 14, width: '100%' }}>
      {/* Fading left rule */}
      <svg width="70" height="2" viewBox="0 0 70 2" aria-hidden="true">
        <defs>
          <linearGradient id="hd-l" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c.gold} stopOpacity="0"/>
            <stop offset="100%" stopColor={c.gold} stopOpacity="0.45"/>
          </linearGradient>
        </defs>
        <line x1="0" y1="1" x2="70" y2="1" stroke="url(#hd-l)" strokeWidth="1"/>
      </svg>
      <span style={{ color: c.rose, fontSize: 14, lineHeight: 1 }} aria-hidden="true">♡</span>
      {/* Fading right rule */}
      <svg width="70" height="2" viewBox="0 0 70 2" aria-hidden="true">
        <defs>
          <linearGradient id="hd-r" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={c.gold} stopOpacity="0.45"/>
            <stop offset="100%" stopColor={c.gold} stopOpacity="0"/>
          </linearGradient>
        </defs>
        <line x1="0" y1="1" x2="70" y2="1" stroke="url(#hd-r)" strokeWidth="1"/>
      </svg>
    </div>
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
          opacity:         0.022,
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.80' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
          backgroundSize:  '256px 256px',
          pointerEvents:   'none',
          zIndex:          1,
        }} />

        {/* ── Subtle radial glow — matches live page background ───────── */}
        <div style={{
          position:   'absolute',
          inset:      0,
          background: 'radial-gradient(ellipse 70% 50% at 50% 40%, rgba(240,200,204,0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
          zIndex:     1,
        }} />

        {/* ── Corner vines ────────────────────────────────────────────── */}
        <VineCornerTL c={c} />
        <VineCornerTR c={c} />
        <VineCornerBR c={c} />

        {/* ── Thin outer frame ────────────────────────────────────────── */}
        <div style={{
          position:      'absolute',
          inset:         14,
          border:        `0.60px solid ${c.goldDim}`,
          pointerEvents: 'none',
          zIndex:        10,
        }} />

        {/* ══════════════════════════════════════════════════════════════
            ZONE 1 — Overline (rose, matches live page)
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ height: 52, flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 36, height: 1, background: c.rose, opacity: 0.55 }} />
          <span style={{
            fontFamily:    SANS,
            fontSize:      7.5,
            fontWeight:    500,
            letterSpacing: '0.28em',
            color:         c.rose,
            textTransform: 'uppercase' as const,
            lineHeight:    1,
          }}>
            {t.cardWeddingInvitation}
          </span>
          <div style={{ width: 36, height: 1, background: c.rose, opacity: 0.55 }} />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ZONE 2 — Couple names (hero, matches live CoupleNames layout)
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ height: 20, flexShrink: 0 }} />

        {/* Name 1 */}
        <span style={{
          fontFamily:    GLOSSILY,
          fontSize:      82,
          color:         c.ink,
          lineHeight:    1.15,
          letterSpacing: '-0.01em',
          whiteSpace:    'nowrap',
        }}>
          Berfin
        </span>

        {/* Gold rule ——— & ——— (matches live page between-names separator) */}
        <div style={{
          display:         'flex',
          alignItems:      'center',
          justifyContent:  'center',
          gap:             20,
          width:           '100%',
          paddingLeft:     60,
          paddingRight:    60,
          boxSizing:       'border-box',
          margin:          '4px 0',
        }}>
          <div style={{ flex: 1, maxWidth: 80, height: 1, background: c.goldDim }} />
          <span style={{
            fontFamily:    GLOSSILY,
            fontSize:      34,
            color:         c.gold,
            lineHeight:    1,
            letterSpacing: '-0.01em',
          }}>
            &amp;
          </span>
          <div style={{ flex: 1, maxWidth: 80, height: 1, background: c.goldDim }} />
        </div>

        {/* Name 2 */}
        <span style={{
          fontFamily:    GLOSSILY,
          fontSize:      82,
          color:         c.ink,
          lineHeight:    1.15,
          letterSpacing: '-0.01em',
          whiteSpace:    'nowrap',
        }}>
          Shamsiddin
        </span>

        {/* ══════════════════════════════════════════════════════════════
            ZONE 3 — ♡ divider (matches live page post-names divider)
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ height: 18, flexShrink: 0 }} />
        <HeartDivider c={c} />

        {/* ══════════════════════════════════════════════════════════════
            ZONE 4 — Personal address
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ height: 16, flexShrink: 0 }} />
        <span style={{
          fontFamily:   CORMORANT,
          fontStyle:    'italic',
          fontSize:     17,
          color:        c.inkSub,
          textAlign:    'center',
          lineHeight:   1.5,
          paddingLeft:  60,
          paddingRight: 60,
        }}>
          {t.cardWeInviteYou}
        </span>
        <div style={{ height: 14, flexShrink: 0 }} />
        <DotRule width={120} c={c} />
        <div style={{ height: 12, flexShrink: 0 }} />
        <span style={{
          fontFamily:    CORMORANT,
          fontWeight:    700,
          fontSize:      30,
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
            ZONE 5 — Event details (matches live page date/time/venue row)
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
          <div style={{ width: 140, height: 0.5, background: c.gold, opacity: 0.24 }} />
          <div style={{ height: 14 }} />

          {/* Event / location label */}
          {eventName && (
            <>
              <span style={{
                fontFamily:    SANS,
                fontSize:      7,
                fontWeight:    500,
                letterSpacing: '0.40em',
                color:         c.rose,
                textTransform: 'uppercase' as const,
                lineHeight:    1,
                opacity:       0.80,
              }}>
                {eventName}
              </span>
              <div style={{ height: 12 }} />
            </>
          )}

          {/* Date — larger, Cormorant bold */}
          <span style={{
            fontFamily:    CORMORANT,
            fontWeight:    700,
            fontSize:      26,
            color:         c.ink,
            letterSpacing: '0.01em',
            lineHeight:    1.2,
            textAlign:     'center',
          }}>
            {formattedDate}
          </span>

          {/* Time ◆ Venue — matches live page row style */}
          {(eventTime ?? venueName) && (
            <>
              <div style={{ height: 8 }} />
              <div style={{
                display:    'flex',
                alignItems: 'center',
                gap:        10,
                flexWrap:   'wrap' as const,
                justifyContent: 'center',
              }}>
                {eventTime && (
                  <span style={{ fontFamily: SANS, fontSize: 13, color: c.inkSub, letterSpacing: '0.04em' }}>
                    {eventTime}
                  </span>
                )}
                {eventTime && venueName && (
                  <span style={{ color: c.goldDim, fontSize: 9 }} aria-hidden="true">◆</span>
                )}
                {venueName && (
                  <span style={{ fontFamily: SANS, fontSize: 13, color: c.inkSub, letterSpacing: '0.04em' }}>
                    {venueName}
                  </span>
                )}
              </div>
            </>
          )}

          {/* Table chip */}
          {tableNumber != null && (
            <>
              <div style={{ height: 14 }} />
              <div style={{
                display:       'inline-flex',
                alignItems:    'center',
                gap:           10,
                paddingLeft:   18,
                paddingRight:  18,
                paddingTop:    5,
                paddingBottom: 5,
                border:        `0.55px solid ${c.goldDim}`,
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
                <div style={{ width: 0.5, height: 13, background: c.goldDim }} />
                <span style={{ fontFamily: CORMORANT, fontSize: 22, fontWeight: 700, color: c.gold, lineHeight: 1 }}>
                  {tableNumber}
                </span>
              </div>
            </>
          )}

          <div style={{ height: 14 }} />
          <div style={{ width: 140, height: 0.5, background: c.gold, opacity: 0.24 }} />
        </div>

        {/* ── Flex spacer pushes QR to lower third ────────────────────── */}
        <div style={{ flex: 1, minHeight: 14 }} />

        {/* ══════════════════════════════════════════════════════════════
            ZONE 6 — QR code with L-corner frame
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ position: 'relative', width: 108, height: 108, flexShrink: 0 }}>
          <div style={{ position: 'absolute', top: 8, left: 8, lineHeight: 0 }}>
            <QRCodeSVG value={rsvpUrl} size={92} bgColor={c.bg} fgColor={c.ink} level="M" />
          </div>
          <svg width={108} height={108} viewBox="0 0 108 108" fill="none" aria-hidden="true"
            style={{ position: 'absolute', top: 0, left: 0 }}>
            <rect x="1" y="1" width="106" height="106" stroke={c.goldDim} strokeWidth="0.60" fill="none"/>
            <path d="M 16,2  L 2,2  L 2,16"  stroke={c.gold} strokeWidth="1.10" strokeLinecap="round" strokeLinejoin="round" opacity="0.50"/>
            <path d="M 92,2  L 106,2 L 106,16" stroke={c.gold} strokeWidth="1.10" strokeLinecap="round" strokeLinejoin="round" opacity="0.50"/>
            <path d="M 16,106 L 2,106 L 2,92"  stroke={c.gold} strokeWidth="1.10" strokeLinecap="round" strokeLinejoin="round" opacity="0.50"/>
            <path d="M 92,106 L 106,106 L 106,92" stroke={c.gold} strokeWidth="1.10" strokeLinecap="round" strokeLinejoin="round" opacity="0.50"/>
          </svg>
        </div>

        {/* Scan label */}
        <div style={{ height: 12, flexShrink: 0 }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{ width: 20, height: 0.5, background: c.rose, opacity: 0.40 }} />
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
          <div style={{ width: 20, height: 0.5, background: c.rose, opacity: 0.40 }} />
        </div>

        {/* ══════════════════════════════════════════════════════════════
            ZONE 7 — Year mark
        ══════════════════════════════════════════════════════════════ */}
        <div style={{ height: 22, flexShrink: 0 }} />
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
        <div style={{ height: 30, flexShrink: 0 }} />
      </div>
    );
  },
);

InvitationCard.displayName = 'InvitationCard';

export { InvitationCard };
export default InvitationCard;
