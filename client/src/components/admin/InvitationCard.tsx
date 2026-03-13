import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Language } from '../../lib/i18n';
import { en, tr, uz } from '../../lib/i18n';

const T = { en, tr, uz };

// ─── Palette — warm European stationery ──────────────────────────────────────
const BG         = '#FAF5EC';  // warm ivory parchment
const BG_DEEP    = '#F2E9D5';  // for event panel
const INK        = '#28180E';  // deep warm brown — primary
const INK_SUB    = 'rgba(40,24,14,0.52)';  // supporting grey-brown
const GOLD       = '#A8832E';  // deeper gold — visible on ivory
const GOLD_RULE  = 'rgba(168,131,46,0.38)';
const PETAL_DEEP = '#C9909A';  // pastel rose, outer petals
const PETAL_LT   = '#E8C0C6';  // soft inner petals
const STEM_CLR   = '#7A9E7C';  // muted botanical green
const LEAF_CLR   = '#9AB89B';  // lighter leaf green

// ─── Fonts ────────────────────────────────────────────────────────────────────
// Names: GlossilyEnigmatic (romantic script, same as website — loaded via index.css)
// "&": Cormorant Garamond italic (refined elegant accent)
// Body text: Cormorant Garamond (luxurious readable serif)
// Tiny labels: DM Sans
const GLOSSILY  = "'GlossilyEnigmatic', 'Cormorant Garamond', cursive";
const CORMORANT = '"Cormorant Garamond", Georgia, serif';
const SANS      = '"DM Sans", system-ui, sans-serif';

export interface InvitationCardProps {
  guestName:   string;
  eventDate:   string;
  eventTime:   string | null;
  venueName:   string | null;
  eventName:   string | null;
  tableNumber: number | null | undefined;
  language:    Language;
  rsvpUrl:     string;
}

// ─── 5-Petal flower helper ────────────────────────────────────────────────────
function Flower({ cx, cy, r = 1, opacity = 1 }: { cx: number; cy: number; r?: number; opacity?: number }) {
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
            fill={i === 0 ? PETAL_DEEP : PETAL_LT}
            transform={`rotate(${a} ${px} ${py})`}
          />
        );
      })}
      <circle cx={cx} cy={cy} r={centreR}         fill={GOLD} opacity={0.85}/>
      <circle cx={cx} cy={cy} r={centreR * 0.42}  fill={BG}   opacity={0.90}/>
    </g>
  );
}

// ─── Top botanical garland ────────────────────────────────────────────────────
// 7 flowers on a gentle horizontal arc — airy, not crowded
function TopGarland() {
  const flowers = [
    { x: 34,  arcY: 64, stemLen: 22, scale: 0.72 },
    { x: 100, arcY: 52, stemLen: 30, scale: 0.88 },
    { x: 172, arcY: 43, stemLen: 38, scale: 1.00 },
    { x: 230, arcY: 38, stemLen: 44, scale: 1.10 },  // tallest — centre
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
      {/* Main gentle arc */}
      <path d="M16 70 C80 58 154 46 230 40 C306 46 380 58 444 70"
        stroke={STEM_CLR} strokeWidth="0.9" strokeLinecap="round" opacity="0.55"/>

      {/* Vertical stems */}
      {flowers.map((f, i) => (
        <line key={i}
          x1={f.x} y1={f.arcY + 5}
          x2={f.x} y2={f.arcY + f.stemLen}
          stroke={STEM_CLR} strokeWidth="0.8" strokeLinecap="round" opacity="0.55"/>
      ))}

      {/* Paired leaves at branch nodes */}
      {leafPairs.map((l, i) => (
        <g key={i}>
          <ellipse cx={l.x - 5} cy={l.y} rx={8} ry={3}
            fill={LEAF_CLR} opacity="0.50"
            transform={`rotate(${l.a - 10} ${l.x - 5} ${l.y})`}/>
          <ellipse cx={l.x + 5} cy={l.y} rx={8} ry={3}
            fill={LEAF_CLR} opacity="0.45"
            transform={`rotate(${-l.a + 10} ${l.x + 5} ${l.y})`}/>
        </g>
      ))}

      {/* Flowers */}
      {flowers.map((f, i) => (
        <Flower key={i} cx={f.x} cy={f.arcY} r={f.scale} opacity={0.88 - i * 0.02} />
      ))}
    </svg>
  );
}

// ─── Bottom garland — 5 flowers, smaller ─────────────────────────────────────
function BottomGarland() {
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
        stroke={STEM_CLR} strokeWidth="0.85" strokeLinecap="round" opacity="0.50"/>
      {flowers.map((f, i) => (
        <line key={i}
          x1={f.x} y1={f.arcY + 4}
          x2={f.x} y2={f.arcY + f.stemLen}
          stroke={STEM_CLR} strokeWidth="0.75" strokeLinecap="round" opacity="0.50"/>
      ))}
      {/* Small side leaves */}
      {[124, 194, 266, 336].map((lx, i) => {
        const ly = i < 2 ? 32 : 32;
        const a  = i < 2 ? -25 : 25;
        return (
          <ellipse key={i} cx={lx} cy={ly} rx={7} ry={2.5}
            fill={LEAF_CLR} opacity="0.42"
            transform={`rotate(${a} ${lx} ${ly})`}/>
        );
      })}
      {flowers.map((f, i) => (
        <Flower key={i} cx={f.x} cy={f.arcY} r={f.scale * 0.88} opacity={0.82}/>
      ))}
    </svg>
  );
}

// ─── Gold rule with ornament ──────────────────────────────────────────────────
function OrnamentRule({ width = 300, slim = false }: { width?: number; slim?: boolean }) {
  if (slim) {
    return (
      <svg width={width} height={4} viewBox={`0 0 ${width} 4`} fill="none" aria-hidden="true">
        <line x1={0} y1={2} x2={width} y2={2} stroke={GOLD} strokeWidth="0.55" opacity="0.35"/>
      </svg>
    );
  }
  const half = (width - 20) / 2;
  return (
    <svg width={width} height={22} viewBox={`0 0 ${width} 22`} fill="none" aria-hidden="true">
      <line x1={0} y1={11} x2={half - 8} y2={11} stroke={GOLD} strokeWidth="0.65" opacity="0.40"/>
      <circle cx={half - 2} cy={11} r={2} fill={GOLD} opacity="0.38"/>
      {/* Diamond */}
      <path d={`M${width/2} 4 L${width/2+7} 11 L${width/2} 18 L${width/2-7} 11 Z`}
        fill={PETAL_DEEP} opacity="0.45"/>
      <path d={`M${width/2} 8 L${width/2+3} 11 L${width/2} 14 L${width/2-3} 11 Z`}
        fill={GOLD} opacity="0.62"/>
      <circle cx={half + 22} cy={11} r={2} fill={GOLD} opacity="0.38"/>
      <line x1={half + 28} y1={11} x2={width} y2={11} stroke={GOLD} strokeWidth="0.65" opacity="0.40"/>
    </svg>
  );
}

// ─── InvitationCard ───────────────────────────────────────────────────────────

const InvitationCard = forwardRef<HTMLDivElement, InvitationCardProps>(
  ({ guestName, eventDate, eventTime, venueName, eventName, tableNumber, language, rsvpUrl }, ref) => {
    const t = T[language];

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
          // Warm parchment — very subtle gradient for printed-paper depth
          background: `linear-gradient(170deg, #EEE4CC 0%, ${BG} 18%, ${BG} 82%, #EEE4CC 100%)`,
        }}
      >
        {/* ── Thin gold border ── */}
        <div style={{ position:'absolute', inset:16, border:`0.75px solid ${GOLD_RULE}`, pointerEvents:'none' }}/>

        {/* ══ TOP GARLAND ══════════════════════════════════════════════ */}
        <div style={{ marginTop: 34, flexShrink: 0 }}>
          <TopGarland />
        </div>

        {/* ── "Wedding Invitation" overline ── */}
        <div style={{ marginTop: 10, display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
          <div style={{ width:32, height:0.55, background:GOLD, opacity:0.40 }}/>
          <span style={{ fontFamily:SANS, fontSize:8.5, fontWeight:500, letterSpacing:'0.42em', color:GOLD, textTransform:'uppercase' }}>
            Wedding Invitation
          </span>
          <div style={{ width:32, height:0.55, background:GOLD, opacity:0.40 }}/>
        </div>

        {/* ══ NAMES — HERO ════════════════════════════════════════════ */}
        <div style={{
          marginTop:     24,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          flexShrink:    0,
          lineHeight:    1,
        }}>
          {/* GlossilyEnigmatic — the romantic script from the website */}
          <span style={{ fontFamily:GLOSSILY, fontSize:88, color:INK, lineHeight:0.90 }}>
            Berfin
          </span>
          {/* Cormorant italic — refined script accent ONLY for "&" */}
          <span style={{ fontFamily:CORMORANT, fontStyle:'italic', fontWeight:400, fontSize:52, color:GOLD, lineHeight:1.05, letterSpacing:'0.08em' }}>
            &amp;
          </span>
          <span style={{ fontFamily:GLOSSILY, fontSize:88, color:INK, lineHeight:0.90 }}>
            Shamsiddin
          </span>
        </div>

        {/* ── Primary ornament rule ── */}
        <div style={{ marginTop:24, flexShrink:0 }}>
          <OrnamentRule width={300} />
        </div>

        {/* ══ GUEST SECTION ═══════════════════════════════════════════ */}
        <div style={{
          marginTop:     18,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           8,
          flexShrink:    0,
          paddingInline: 60,
        }}>
          <span style={{ fontFamily:CORMORANT, fontStyle:'italic', fontSize:19, color:INK_SUB, textAlign:'center', lineHeight:1.5 }}>
            {t.cardWeInviteYou}
          </span>
          <span style={{ fontFamily:CORMORANT, fontWeight:600, fontSize:26, color:INK, textAlign:'center', letterSpacing:'0.02em' }}>
            {guestName}
          </span>
        </div>

        {/* ── Slim rule ── */}
        <div style={{ marginTop:20, flexShrink:0 }}>
          <OrnamentRule width={180} slim />
        </div>

        {/* ══ EVENT DETAILS ════════════════════════════════════════════ */}
        <div style={{
          marginTop:     18,
          width:         460,
          flexShrink:    0,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           8,
          padding:       '16px 28px',
          background:    BG_DEEP,
          border:        `0.75px solid ${GOLD_RULE}`,
        }}>
          {eventName && (
            <>
              <span style={{ fontFamily:SANS, fontSize:8, fontWeight:500, letterSpacing:'0.38em', color:PETAL_DEEP, textTransform:'uppercase' }}>
                {eventName}
              </span>
              <div style={{ width:24, height:0.5, background:GOLD, opacity:0.32 }}/>
            </>
          )}
          <span style={{ fontFamily:CORMORANT, fontWeight:600, fontSize:22, color:INK, letterSpacing:'0.01em' }}>
            {formattedDate}
          </span>
          {(eventTime || venueName) && (
            <span style={{ fontFamily:CORMORANT, fontStyle:'italic', fontSize:17, color:INK_SUB, textAlign:'center' }}>
              {[eventTime, venueName].filter(Boolean).join('  ·  ')}
            </span>
          )}
          {tableNumber != null && (
            <div style={{
              marginTop:4, paddingInline:18, paddingBlock:5,
              border:`0.75px solid ${GOLD_RULE}`, borderRadius:20,
              display:'flex', alignItems:'center', gap:8,
              background:'rgba(168,131,46,0.06)',
            }}>
              <span style={{ fontFamily:SANS, fontSize:7.5, letterSpacing:'0.34em', color:GOLD, textTransform:'uppercase', fontWeight:500 }}>
                {t.cardTable}
              </span>
              <span style={{ fontFamily:CORMORANT, fontSize:20, color:GOLD, fontWeight:600, lineHeight:1 }}>
                {tableNumber}
              </span>
            </div>
          )}
        </div>

        {/* ══ QR CODE ══════════════════════════════════════════════════ */}
        <div style={{ marginTop:24, display:'flex', flexDirection:'column', alignItems:'center', gap:11, flexShrink:0 }}>
          <div style={{ padding:8, border:`0.75px solid ${GOLD_RULE}`, background:BG }}>
            <QRCodeSVG value={rsvpUrl} size={84} bgColor={BG} fgColor={INK} level="M"/>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:20, height:0.55, background:GOLD, opacity:0.38 }}/>
            <span style={{ fontFamily:SANS, fontSize:8, fontWeight:400, letterSpacing:'0.34em', color:INK_SUB, textTransform:'uppercase' }}>
              {t.cardScanRsvp}
            </span>
            <div style={{ width:20, height:0.55, background:GOLD, opacity:0.38 }}/>
          </div>
        </div>

        {/* ── Year ── */}
        <div style={{ marginTop:10, fontFamily:SANS, fontSize:8.5, letterSpacing:'0.34em', color:'rgba(40,24,14,0.24)', textTransform:'uppercase', flexShrink:0 }}>
          · 2026 ·
        </div>

        {/* ══ BOTTOM GARLAND ═══════════════════════════════════════════ */}
        <div style={{ marginTop:14, flexShrink:0, paddingBottom:34 }}>
          <BottomGarland />
        </div>
      </div>
    );
  }
);

InvitationCard.displayName = 'InvitationCard';
export default InvitationCard;
