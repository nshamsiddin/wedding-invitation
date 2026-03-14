import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Language } from '../../lib/i18n';
import { en, tr, uz } from '../../lib/i18n';

const T = { en, tr, uz };

// ─── Fonts ────────────────────────────────────────────────────────────────────
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
      <circle cx={cx} cy={cy} r={centreR}        fill={c.gold} opacity={0.85}/>
      <circle cx={cx} cy={cy} r={centreR * 0.42} fill={c.bg}   opacity={0.90}/>
    </g>
  );
}

// ─── Top botanical garland ────────────────────────────────────────────────────
function TopGarland({ c }: { c: ThemeColors }) {
  const flowers = [
    { x: 34,  arcY: 64, stemLen: 22, scale: 0.72 },
    { x: 100, arcY: 52, stemLen: 30, scale: 0.88 },
    { x: 172, arcY: 43, stemLen: 38, scale: 1.00 },
    { x: 230, arcY: 38, stemLen: 44, scale: 1.10 },
    { x: 288, arcY: 43, stemLen: 38, scale: 1.00 },
    { x: 360, arcY: 52, stemLen: 30, scale: 0.88 },
    { x: 426, arcY: 64, stemLen: 22, scale: 0.72 },
  ];
  const leafPairs = [
    { x: 67,  y: 60, a: -30 },
    { x: 136, y: 49, a: -22 },
    { x: 200, y: 42, a: -15 },
    { x: 260, y: 42, a:  15 },
    { x: 324, y: 49, a:  22 },
    { x: 393, y: 60, a:  30 },
  ];
  return (
    <svg width="460" height="92" viewBox="0 0 460 92" fill="none" aria-hidden="true">
      <path d="M16 70 C80 58 154 46 230 40 C306 46 380 58 444 70"
        stroke={c.stemClr} strokeWidth="0.9" strokeLinecap="round" opacity="0.55"/>
      {flowers.map((f, i) => (
        <line key={i}
          x1={f.x} y1={f.arcY + 5}
          x2={f.x} y2={f.arcY + f.stemLen}
          stroke={c.stemClr} strokeWidth="0.8" strokeLinecap="round" opacity="0.55"/>
      ))}
      {leafPairs.map((l, i) => (
        <g key={i}>
          <ellipse cx={l.x - 5} cy={l.y} rx={8} ry={3}
            fill={c.leafClr} opacity="0.50"
            transform={`rotate(${l.a - 10} ${l.x - 5} ${l.y})`}/>
          <ellipse cx={l.x + 5} cy={l.y} rx={8} ry={3}
            fill={c.leafClr} opacity="0.45"
            transform={`rotate(${-l.a + 10} ${l.x + 5} ${l.y})`}/>
        </g>
      ))}
      {flowers.map((f, i) => (
        <Flower key={i} cx={f.x} cy={f.arcY} r={f.scale} opacity={0.88 - i * 0.02} c={c} />
      ))}
    </svg>
  );
}

// ─── Bottom garland ───────────────────────────────────────────────────────────
function BottomGarland({ c }: { c: ThemeColors }) {
  const flowers = [
    { x: 90,  arcY: 28, stemLen: 18, scale: 0.80 },
    { x: 158, arcY: 20, stemLen: 24, scale: 0.95 },
    { x: 230, arcY: 15, stemLen: 28, scale: 1.05 },
    { x: 302, arcY: 20, stemLen: 24, scale: 0.95 },
    { x: 370, arcY: 28, stemLen: 18, scale: 0.80 },
  ];
  return (
    <svg width="460" height="58" viewBox="0 0 460 58" fill="none" aria-hidden="true">
      <path d="M68 44 C130 36 180 24 230 18 C280 24 330 36 392 44"
        stroke={c.stemClr} strokeWidth="0.85" strokeLinecap="round" opacity="0.50"/>
      {flowers.map((f, i) => (
        <line key={i}
          x1={f.x} y1={f.arcY + 4}
          x2={f.x} y2={f.arcY + f.stemLen}
          stroke={c.stemClr} strokeWidth="0.75" strokeLinecap="round" opacity="0.50"/>
      ))}
      {[124, 194, 266, 336].map((lx, i) => {
        const ly = 32;
        const a  = i < 2 ? -25 : 25;
        return (
          <ellipse key={i} cx={lx} cy={ly} rx={7} ry={2.5}
            fill={c.leafClr} opacity="0.42"
            transform={`rotate(${a} ${lx} ${ly})`}/>
        );
      })}
      {flowers.map((f, i) => (
        <Flower key={i} cx={f.x} cy={f.arcY} r={f.scale * 0.88} opacity={0.82} c={c}/>
      ))}
    </svg>
  );
}

// ─── Gold rule with diamond ornament ─────────────────────────────────────────
function OrnamentRule({ width = 300, slim = false, c }: {
  width?: number; slim?: boolean; c: ThemeColors;
}) {
  if (slim) {
    return (
      <svg width={width} height={4} viewBox={`0 0 ${width} 4`} fill="none" aria-hidden="true">
        <line x1={0} y1={2} x2={width} y2={2} stroke={c.gold} strokeWidth="0.55" opacity="0.35"/>
      </svg>
    );
  }
  const half = (width - 20) / 2;
  return (
    <svg width={width} height={22} viewBox={`0 0 ${width} 22`} fill="none" aria-hidden="true">
      <line x1={0} y1={11} x2={half - 8} y2={11} stroke={c.gold} strokeWidth="0.65" opacity="0.40"/>
      <circle cx={half - 2} cy={11} r={2} fill={c.gold} opacity="0.38"/>
      <path d={`M${width/2} 4 L${width/2+7} 11 L${width/2} 18 L${width/2-7} 11 Z`}
        fill={c.petalDeep} opacity="0.45"/>
      <path d={`M${width/2} 8 L${width/2+3} 11 L${width/2} 14 L${width/2-3} 11 Z`}
        fill={c.gold} opacity="0.62"/>
      <circle cx={half + 22} cy={11} r={2} fill={c.gold} opacity="0.38"/>
      <line x1={half + 28} y1={11} x2={width} y2={11} stroke={c.gold} strokeWidth="0.65" opacity="0.40"/>
    </svg>
  );
}

// ─── InvitationCard ───────────────────────────────────────────────────────────
const InvitationCard = forwardRef<HTMLDivElement, InvitationCardProps>(
  ({ guestName, eventDate, eventTime, venueName, eventName, tableNumber, language, rsvpUrl, theme = 'parchment' }, ref) => {
    const t = T[language];
    const c = CARD_THEMES[theme];

    const formattedDate = (() => {
      try {
        const d = new Date(eventDate.includes('T') ? eventDate : `${eventDate}T12:00:00`);
        if (language === 'uz') {
          const M = ['Yanvar','Fevral','Mart','Aprel','May','Iyun','Iyul','Avgust','Sentabr','Oktabr','Noyabr','Dekabr'];
          return `${d.getDate()} ${M[d.getMonth()]}, ${d.getFullYear()}`;
        }
        return d.toLocaleDateString(language === 'tr' ? 'tr-TR' : 'en-US', {
          day: 'numeric', month: 'long', year: 'numeric',
        });
      } catch { return eventDate; }
    })();

    return (
      <div
        ref={ref}
        style={{
          width:         540,
          height:        960,
          position:      'relative',
          overflow:      'hidden',
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          background:    c.bgGrad,
        }}
      >
        {/* Thin border */}
        <div style={{ position:'absolute', inset:16, border:`0.75px solid ${c.goldRule}`, pointerEvents:'none' }}/>

        {/* ══ TOP GARLAND ══════════════════════════════════════════════ */}
        <div style={{ marginTop: 34, flexShrink: 0 }}>
          <TopGarland c={c} />
        </div>

        {/* ── Overline ── */}
        <div style={{ marginTop: 10, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:32, height:0.55, background:c.gold, opacity:0.40 }}/>
          <span style={{ fontFamily:SANS, fontSize:8.5, fontWeight:500, letterSpacing:'0.42em', color:c.gold, textTransform:'uppercase' }}>
            {t.cardWeddingInvitation}
          </span>
          <div style={{ width:32, height:0.55, background:c.gold, opacity:0.40 }}/>
        </div>

        {/* ══ NAMES — HERO ════════════════════════════════════════════ */}
        <div style={{
          marginTop:     20,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          flexShrink:    0,
        }}>
          <span style={{ fontFamily:GLOSSILY, fontSize:88, color:c.ink, lineHeight:0.88 }}>
            Berfin
          </span>
          <span style={{
            display:      'block',
            fontFamily:   CORMORANT,
            fontStyle:    'italic',
            fontWeight:   400,
            fontSize:     22,
            color:        c.gold,
            lineHeight:   1,
            letterSpacing:'0.12em',
            marginTop:    6,
            marginBottom: 6,
            textAlign:    'center',
            width:        '100%',
          }}>
            &amp;
          </span>
          <span style={{ fontFamily:GLOSSILY, fontSize:88, color:c.ink, lineHeight:0.88 }}>
            Shamsiddin
          </span>
        </div>

        {/* ── Primary ornament rule ── */}
        <div style={{ marginTop:22, flexShrink:0 }}>
          <OrnamentRule width={300} c={c} />
        </div>

        {/* ══ GUEST SECTION ═══════════════════════════════════════════ */}
        <div style={{
          marginTop:     16,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           8,
          flexShrink:    0,
          paddingInline: 60,
        }}>
          <span style={{ fontFamily:CORMORANT, fontStyle:'italic', fontSize:19, color:c.inkSub, textAlign:'center', lineHeight:1.5 }}>
            {t.cardWeInviteYou}
          </span>
          <span style={{ fontFamily:CORMORANT, fontWeight:600, fontSize:26, color:c.ink, textAlign:'center', letterSpacing:'0.02em' }}>
            {guestName}
          </span>
        </div>

        {/* ── Slim rule ── */}
        <div style={{ marginTop:18, flexShrink:0 }}>
          <OrnamentRule width={180} slim c={c} />
        </div>

        {/* ══ EVENT DETAILS ════════════════════════════════════════════ */}
        <div style={{
          marginTop:     16,
          width:         460,
          flexShrink:    0,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           8,
          padding:       '16px 28px',
          background:    c.bgDeep,
          border:        `0.75px solid ${c.goldRule}`,
        }}>
          {eventName && (
            <>
              <span style={{ fontFamily:SANS, fontSize:8, fontWeight:500, letterSpacing:'0.38em', color:c.petalDeep, textTransform:'uppercase' }}>
                {eventName}
              </span>
              <div style={{ width:24, height:0.5, background:c.gold, opacity:0.32 }}/>
            </>
          )}
          <span style={{ fontFamily:CORMORANT, fontWeight:600, fontSize:22, color:c.ink, letterSpacing:'0.01em' }}>
            {formattedDate}
          </span>
          {(eventTime || venueName) && (
            <span style={{ fontFamily:CORMORANT, fontStyle:'italic', fontSize:17, color:c.inkSub, textAlign:'center' }}>
              {[eventTime, venueName].filter(Boolean).join('  ·  ')}
            </span>
          )}
          {tableNumber != null && (
            <div style={{
              marginTop:4, paddingInline:18, paddingBlock:5,
              border:`0.75px solid ${c.goldRule}`, borderRadius:20,
              display:'flex', alignItems:'center', gap:8,
              background:`${c.gold}0F`,
            }}>
              <span style={{ fontFamily:SANS, fontSize:7.5, letterSpacing:'0.34em', color:c.gold, textTransform:'uppercase', fontWeight:500 }}>
                {t.cardTable}
              </span>
              <span style={{ fontFamily:CORMORANT, fontSize:20, color:c.gold, fontWeight:600, lineHeight:1 }}>
                {tableNumber}
              </span>
            </div>
          )}
        </div>

        {/* ══ QR CODE ══════════════════════════════════════════════════ */}
        <div style={{ marginTop:22, display:'flex', flexDirection:'column', alignItems:'center', gap:11, flexShrink:0 }}>
          <div style={{ padding:8, border:`0.75px solid ${c.goldRule}`, background:c.bg }}>
            <QRCodeSVG value={rsvpUrl} size={84} bgColor={c.bg} fgColor={c.ink} level="M"/>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:20, height:0.55, background:c.gold, opacity:0.38 }}/>
            <span style={{ fontFamily:SANS, fontSize:8, fontWeight:400, letterSpacing:'0.34em', color:c.inkSub, textTransform:'uppercase' }}>
              {t.cardScanRsvp}
            </span>
            <div style={{ width:20, height:0.55, background:c.gold, opacity:0.38 }}/>
          </div>
        </div>

        {/* ── Year ── */}
        <div style={{ marginTop:8, fontFamily:SANS, fontSize:8.5, letterSpacing:'0.34em', color:c.inkSub, opacity:0.45, textTransform:'uppercase', flexShrink:0 }}>
          · 2026 ·
        </div>

        {/* ══ BOTTOM GARLAND ═══════════════════════════════════════════ */}
        <div style={{ marginTop:12, flexShrink:0, paddingBottom:34 }}>
          <BottomGarland c={c} />
        </div>
      </div>
    );
  }
);

InvitationCard.displayName = 'InvitationCard';
export default InvitationCard;
