import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Language } from '../../lib/i18n';
import { en, tr, uz } from '../../lib/i18n';

const T = { en, tr, uz };

// ─── Font stacks ──────────────────────────────────────────────────────────────
const GLOSSILY  = "'GlossilyEnigmatic', 'Cormorant Garamond', cursive";
const CORMORANT = '"Cormorant Garamond", Georgia, serif';
const SANS      = '"DM Sans", system-ui, sans-serif';

// ─── Theme system ─────────────────────────────────────────────────────────────
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
    bgDeep:    '#F2E9D5',
    bgGrad:    'linear-gradient(170deg, #EEE4CC 0%, #FAF5EC 18%, #FAF5EC 82%, #EEE4CC 100%)',
    ink:       '#28180E',
    inkSub:    'rgba(40,24,14,0.52)',
    gold:      '#A8832E',
    goldRule:  'rgba(168,131,46,0.38)',
    petalDeep: '#C9909A',
    petalLt:   '#E8C0C6',
    stemClr:   '#7A9E7C',
    leafClr:   '#9AB89B',
  },
  noir: {
    bg:        '#1C1408',
    bgDeep:    '#261C0E',
    bgGrad:    'linear-gradient(170deg, #0E0A04 0%, #1C1408 18%, #1C1408 82%, #0E0A04 100%)',
    ink:       '#F0E6D2',
    inkSub:    'rgba(240,230,210,0.60)',
    gold:      '#D4AA50',
    goldRule:  'rgba(212,170,80,0.35)',
    petalDeep: '#EDD4DA',
    petalLt:   '#F5E4E8',
    stemClr:   '#7AAA80',
    leafClr:   '#98C09A',
  },
  blush: {
    bg:        '#FDF0F2',
    bgDeep:    '#F5DBDF',
    bgGrad:    'linear-gradient(170deg, #F5D8DC 0%, #FDF0F2 18%, #FDF0F2 82%, #F5D8DC 100%)',
    ink:       '#2A1418',
    inkSub:    'rgba(42,20,24,0.52)',
    gold:      '#B07046',
    goldRule:  'rgba(176,112,70,0.35)',
    petalDeep: '#D97080',
    petalLt:   '#EAABB5',
    stemClr:   '#6A9E7A',
    leafClr:   '#8AB89A',
  },
  sage: {
    bg:        '#F0F4EE',
    bgDeep:    '#E2EAE0',
    bgGrad:    'linear-gradient(170deg, #DDEADB 0%, #F0F4EE 18%, #F0F4EE 82%, #DDEADB 100%)',
    ink:       '#162014',
    inkSub:    'rgba(22,32,20,0.55)',
    gold:      '#8A9840',
    goldRule:  'rgba(138,152,64,0.38)',
    petalDeep: '#C8A0A8',
    petalLt:   '#DFC0C8',
    stemClr:   '#5A8A60',
    leafClr:   '#7AAC80',
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

// ─── 5-Petal flower ───────────────────────────────────────────────────────────
function Flower({ cx, cy, r = 1, opacity = 1, c }: {
  cx: number; cy: number; r?: number; opacity?: number; c: ThemeColors;
}) {
  const petalR  = 5.5 * r;
  const petalD  = 7.5 * r;
  const centreR = 3.0 * r;
  const angles  = [0, 72, 144, 216, 288];
  return (
    <g opacity={opacity}>
      {angles.map((a, i) => {
        const rad = (a * Math.PI) / 180;
        const px  = cx + petalD * Math.sin(rad);
        const py  = cy - petalD * Math.cos(rad);
        return (
          <ellipse
            key={i}
            cx={px} cy={py}
            rx={petalR * 0.55} ry={petalR}
            fill={i === 0 ? c.petalDeep : c.petalLt}
            transform={`rotate(${a} ${px} ${py})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={centreR}         fill={c.gold} opacity={0.80} />
      <circle cx={cx} cy={cy} r={centreR * 0.42}  fill={c.bg}   opacity={0.88} />
    </g>
  );
}

// ─── Top botanical arch garland ───────────────────────────────────────────────
function TopGarland({ c }: { c: ThemeColors }) {
  const flowers = [
    { x: 46,  y: 72, r: 0.60 },
    { x: 108, y: 48, r: 0.73 },
    { x: 172, y: 28, r: 0.85 },
    { x: 230, y: 13, r: 0.97 },
    { x: 288, y: 28, r: 0.85 },
    { x: 352, y: 48, r: 0.73 },
    { x: 414, y: 72, r: 0.60 },
  ];
  const leaves = [
    { x: 77,  y: 58, a: -38 },
    { x: 140, y: 37, a: -28 },
    { x: 201, y: 19, a: -16 },
    { x: 259, y: 19, a:  16 },
    { x: 320, y: 37, a:  28 },
    { x: 383, y: 58, a:  38 },
  ];
  return (
    <svg width="460" height="96" viewBox="0 0 460 96" fill="none" aria-hidden="true">
      {/* Main arch */}
      <path
        d="M 8,89 C 68,43 150,17 230,11 C 310,17 392,43 452,89"
        stroke={c.stemClr} strokeWidth="0.9" strokeLinecap="round" fill="none" opacity="0.54"
      />
      {/* Hanging stems from blooms */}
      {flowers.map((f, i) => (
        <line
          key={i}
          x1={f.x} y1={f.y + 7  * f.r}
          x2={f.x} y2={f.y + 18 * f.r}
          stroke={c.stemClr} strokeWidth="0.65" strokeLinecap="round" opacity="0.46"
        />
      ))}
      {/* Leaf pairs between blooms */}
      {leaves.map((l, i) => (
        <g key={i}>
          <ellipse
            cx={l.x - 7} cy={l.y} rx={9} ry={3.2}
            fill={c.leafClr} opacity="0.46"
            transform={`rotate(${l.a - 10} ${l.x - 7} ${l.y})`}
          />
          <ellipse
            cx={l.x + 7} cy={l.y} rx={9} ry={3.2}
            fill={c.leafClr} opacity="0.42"
            transform={`rotate(${-(l.a - 10)} ${l.x + 7} ${l.y})`}
          />
        </g>
      ))}
      {/* Blooms — centre is largest and most opaque */}
      {flowers.map((f, i) => (
        <Flower
          key={i}
          cx={f.x} cy={f.y} r={f.r}
          opacity={0.70 + 0.20 * (1 - Math.abs(i - 3) / 3.5)}
          c={c}
        />
      ))}
    </svg>
  );
}

// ─── Bottom botanical arch (smaller echo) ─────────────────────────────────────
function BottomGarland({ c }: { c: ThemeColors }) {
  const flowers = [
    { x: 100, y: 36, r: 0.64 },
    { x: 164, y: 21, r: 0.77 },
    { x: 230, y: 12, r: 0.90 },
    { x: 296, y: 21, r: 0.77 },
    { x: 360, y: 36, r: 0.64 },
  ];
  const leafXs = [132, 197, 263, 328] as const;
  return (
    <svg width="460" height="52" viewBox="0 0 460 52" fill="none" aria-hidden="true">
      <path
        d="M 68,47 C 130,33 180,17 230,10 C 280,17 330,33 392,47"
        stroke={c.stemClr} strokeWidth="0.80" strokeLinecap="round" fill="none" opacity="0.50"
      />
      {leafXs.map((lx, i) => {
        const ly = 27;
        const a  = i < 2 ? -28 : 28;
        return (
          <g key={lx}>
            <ellipse cx={lx - 5} cy={ly} rx={7.5} ry={2.6}
              fill={c.leafClr} opacity="0.40"
              transform={`rotate(${a} ${lx - 5} ${ly})`} />
            <ellipse cx={lx + 5} cy={ly} rx={7.5} ry={2.6}
              fill={c.leafClr} opacity="0.37"
              transform={`rotate(${-a} ${lx + 5} ${ly})`} />
          </g>
        );
      })}
      {flowers.map((f, i) => (
        <Flower key={i} cx={f.x} cy={f.y} r={f.r * 0.88} opacity={0.76} c={c} />
      ))}
    </svg>
  );
}

// ─── Gold ornament rule (full or slim) ───────────────────────────────────────
function OrnamentRule({ width = 300, slim = false, c }: {
  width?: number; slim?: boolean; c: ThemeColors;
}) {
  if (slim) {
    return (
      <svg width={width} height={4} viewBox={`0 0 ${width} 4`} fill="none" aria-hidden="true">
        <line x1={0} y1={2} x2={width} y2={2} stroke={c.gold} strokeWidth="0.55" opacity="0.34" />
      </svg>
    );
  }
  const half = (width - 20) / 2;
  const mid  = width / 2;
  return (
    <svg width={width} height={22} viewBox={`0 0 ${width} 22`} fill="none" aria-hidden="true">
      <line x1={0} y1={11} x2={half - 8} y2={11}
        stroke={c.gold} strokeWidth="0.65" opacity="0.38" />
      <circle cx={half - 2} cy={11} r={2} fill={c.gold} opacity="0.40" />
      {/* Outer diamond */}
      <path d={`M${mid} 4 L${mid + 8} 11 L${mid} 18 L${mid - 8} 11 Z`}
        fill={c.petalDeep} opacity="0.36" />
      {/* Inner diamond */}
      <path d={`M${mid} 8 L${mid + 3} 11 L${mid} 14 L${mid - 3} 11 Z`}
        fill={c.gold} opacity="0.62" />
      <circle cx={half + 22} cy={11} r={2} fill={c.gold} opacity="0.40" />
      <line x1={half + 28} y1={11} x2={width} y2={11}
        stroke={c.gold} strokeWidth="0.65" opacity="0.38" />
    </svg>
  );
}

// ─── InvitationCard ───────────────────────────────────────────────────────────
const InvitationCard = forwardRef<HTMLDivElement, InvitationCardProps>(
  (
    { guestName, eventDate, eventTime, venueName, eventName, tableNumber, language, rsvpUrl, theme = 'parchment' },
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
          const M = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
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

    // Four corner diamond positions (inside the inset border)
    const corners = [
      { top: 22,      left:  22                  },
      { top: 22,      right: 22                  },
      { bottom: 22,   left:  22                  },
      { bottom: 22,   right: 22                  },
    ];

    return (
      <div
        ref={ref}
        style={{
          width:           540,
          height:          960,
          position:        'relative',
          overflow:        'hidden',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          background:      c.bgGrad,
          WebkitFontSmoothing: 'antialiased',
        }}
      >
        {/* ── Inset border ───────────────────────────────────────────────── */}
        <div style={{
          position:     'absolute',
          inset:        16,
          border:       `0.75px solid ${c.goldRule}`,
          pointerEvents:'none',
          zIndex:       10,
        }} />

        {/* ── Corner diamond marks ─────────────────────────────────────── */}
        {corners.map((pos, i) => (
          <svg
            key={i}
            width={8} height={8} viewBox="0 0 8 8"
            fill="none" aria-hidden="true"
            style={{ position: 'absolute', zIndex: 10, ...pos }}
          >
            <path d="M4 0.5 L7.5 4 L4 7.5 L0.5 4 Z" fill={c.gold} opacity={0.50} />
          </svg>
        ))}

        {/* ══ TOP PADDING ═══════════════════════════════════════════════ */}
        <div style={{ height: 26, flexShrink: 0 }} />

        {/* ══ ZONE 1 — Botanical header ════════════════════════════════ */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           8,
          flexShrink:    0,
        }}>
          <TopGarland c={c} />

          {/* Overline: "WEDDING INVITATION" */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 0.55, background: c.gold, opacity: 0.38 }} />
            <span style={{
              fontFamily:    SANS,
              fontSize:      8.5,
              fontWeight:    500,
              letterSpacing: '0.42em',
              color:         c.gold,
              textTransform: 'uppercase',
              lineHeight:    1,
            }}>
              {t.cardWeddingInvitation}
            </span>
            <div style={{ width: 30, height: 0.55, background: c.gold, opacity: 0.38 }} />
          </div>
        </div>

        {/* ── Gap ──────────────────────────────────────────────────────── */}
        <div style={{ height: 26, flexShrink: 0 }} />

        {/* ══ ZONE 2 — Couple names (hero) ═════════════════════════════ */}
        {/* "&" is absolutely pinned dead-centre between both name lines */}
        <div style={{
          position:      'relative',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          flexShrink:    0,
        }}>
          <span style={{
            fontFamily: GLOSSILY,
            fontSize:   90,
            color:      c.ink,
            lineHeight: 0.88,
            whiteSpace: 'nowrap',
          }}>
            Berfin
          </span>

          {/* Fixed-height gap — the "&" floats in this space */}
          <div style={{ height: 36 }} />

          <span style={{
            fontFamily: GLOSSILY,
            fontSize:   90,
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
            letterSpacing: '0.06em',
            whiteSpace:    'nowrap',
            zIndex:        1,
          }}>
            &amp;
          </span>
        </div>

        {/* ── Gap ──────────────────────────────────────────────────────── */}
        <div style={{ height: 18, flexShrink: 0 }} />

        {/* Primary ornament rule */}
        <div style={{ flexShrink: 0 }}>
          <OrnamentRule width={300} c={c} />
        </div>

        {/* ── Gap ──────────────────────────────────────────────────────── */}
        <div style={{ height: 18, flexShrink: 0 }} />

        {/* ══ ZONE 3 — Personal address ════════════════════════════════ */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           8,
          flexShrink:    0,
          paddingLeft:   56,
          paddingRight:  56,
          width:         540,
          boxSizing:     'border-box',
        }}>
          <span style={{
            fontFamily:  CORMORANT,
            fontStyle:   'italic',
            fontSize:    19,
            color:       c.inkSub,
            textAlign:   'center',
            lineHeight:  1.55,
          }}>
            {t.cardWeInviteYou}
          </span>
          <span style={{
            fontFamily:    CORMORANT,
            fontWeight:    600,
            fontSize:      26,
            color:         c.ink,
            textAlign:     'center',
            letterSpacing: '0.02em',
            lineHeight:    1.2,
          }}>
            {guestName}
          </span>
        </div>

        {/* ── Gap ──────────────────────────────────────────────────────── */}
        <div style={{ height: 16, flexShrink: 0 }} />

        {/* Slim rule */}
        <div style={{ flexShrink: 0 }}>
          <OrnamentRule width={180} slim c={c} />
        </div>

        {/* ── Gap ──────────────────────────────────────────────────────── */}
        <div style={{ height: 14, flexShrink: 0 }} />

        {/* ══ ZONE 4 — Event details panel ════════════════════════════ */}
        <div style={{
          width:         460,
          flexShrink:    0,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           8,
          paddingTop:    16,
          paddingBottom: 16,
          paddingLeft:   32,
          paddingRight:  32,
          background:    c.bgDeep,
          border:        `0.75px solid ${c.goldRule}`,
          boxSizing:     'border-box',
        }}>
          {eventName && (
            <>
              <span style={{
                fontFamily:    SANS,
                fontSize:      8,
                fontWeight:    500,
                letterSpacing: '0.38em',
                color:         c.petalDeep,
                textTransform: 'uppercase',
                lineHeight:    1,
              }}>
                {eventName}
              </span>
              <div style={{ width: 24, height: 0.5, background: c.gold, opacity: 0.30 }} />
            </>
          )}

          <span style={{
            fontFamily:    CORMORANT,
            fontWeight:    600,
            fontSize:      22,
            color:         c.ink,
            letterSpacing: '0.01em',
            lineHeight:    1.2,
            textAlign:     'center',
          }}>
            {formattedDate}
          </span>

          {(eventTime ?? venueName) && (
            <span style={{
              fontFamily:  CORMORANT,
              fontStyle:   'italic',
              fontSize:    17,
              color:       c.inkSub,
              textAlign:   'center',
              lineHeight:  1.3,
            }}>
              {[eventTime, venueName].filter(Boolean).join('  ·  ')}
            </span>
          )}

          {tableNumber != null && (
            <div style={{
              marginTop:    4,
              paddingLeft:  18,
              paddingRight: 18,
              paddingTop:   5,
              paddingBottom:5,
              border:       `0.75px solid ${c.goldRule}`,
              borderRadius: 20,
              display:      'flex',
              alignItems:   'center',
              gap:          8,
              background:   `${c.gold}12`,
            }}>
              <span style={{
                fontFamily:    SANS,
                fontSize:      7.5,
                fontWeight:    500,
                letterSpacing: '0.34em',
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

        {/* ── Flexible spacer: absorbs height variance across content lengths */}
        <div style={{ flex: 1, minHeight: 10 }} />

        {/* ══ ZONE 5 — QR code ═════════════════════════════════════════ */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           10,
          flexShrink:    0,
        }}>
          {/* QR frame */}
          <div style={{
            padding:    9,
            border:     `0.75px solid ${c.goldRule}`,
            background: c.bg,
            lineHeight: 0,
          }}>
            <QRCodeSVG value={rsvpUrl} size={86} bgColor={c.bg} fgColor={c.ink} level="M" />
          </div>

          {/* "Scan to RSVP" label */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div style={{ width: 22, height: 0.55, background: c.gold, opacity: 0.36 }} />
            <span style={{
              fontFamily:    SANS,
              fontSize:      8,
              fontWeight:    400,
              letterSpacing: '0.34em',
              color:         c.inkSub,
              textTransform: 'uppercase',
              lineHeight:    1,
            }}>
              {t.cardScanRsvp}
            </span>
            <div style={{ width: 22, height: 0.55, background: c.gold, opacity: 0.36 }} />
          </div>

          {/* Year */}
          <div style={{
            fontFamily:    SANS,
            fontSize:      8,
            letterSpacing: '0.34em',
            color:         c.inkSub,
            opacity:       0.50,
            textTransform: 'uppercase',
            lineHeight:    1,
          }}>
            · {year} ·
          </div>
        </div>

        {/* ── Gap ──────────────────────────────────────────────────────── */}
        <div style={{ height: 10, flexShrink: 0 }} />

        {/* Bottom botanical echo */}
        <div style={{ flexShrink: 0 }}>
          <BottomGarland c={c} />
        </div>

        {/* ══ BOTTOM PADDING ════════════════════════════════════════════ */}
        <div style={{ height: 24, flexShrink: 0 }} />
      </div>
    );
  },
);

InvitationCard.displayName = 'InvitationCard';
export default InvitationCard;
