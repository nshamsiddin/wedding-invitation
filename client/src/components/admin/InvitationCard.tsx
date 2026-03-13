import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Language } from '../../lib/i18n';
import { en, tr, uz } from '../../lib/i18n';

const TRANSLATIONS = { en, tr, uz };

// ─── Palette ──────────────────────────────────────────────────────────────────
const PARCHMENT = '#FDFAF5';
const ESPRESSO  = '#2A1F1A';
const ESP_DIM   = 'rgba(42,31,26,0.55)';
const GOLD      = '#B8924A';
const GOLD_SOFT = 'rgba(184,146,74,0.28)';
const ROSE      = '#C4848C';
const SAGE      = '#6B8F71';          // deeper sage — actually visible
const SAGE_LT   = '#A8C4AB';

// ─── Fonts ────────────────────────────────────────────────────────────────────
const DISPLAY = "'GlossilyEnigmatic', 'Cormorant Garamond', cursive";
const SERIF   = "'Cormorant Garamond', Georgia, serif";
const SANS    = '"DM Sans", system-ui, sans-serif';

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

// ─── Rich top botanical arch ───────────────────────────────────────────────────
// Inspired by the website's VineCorner: organic bezier stems, teardrop leaves,
// rose blossoms. Much denser than before — fills the full 500px width.
function TopArch() {
  return (
    <svg width="500" height="110" viewBox="0 0 500 110" fill="none" aria-hidden="true">

      {/* ── Left wing — 4 tiers of branches ── */}
      {/* Tier 1 main */}
      <path d="M250 105 C228 88 195 68 158 48 C128 32 94 20 58 12"
        stroke={SAGE} strokeWidth="1.4" strokeLinecap="round" opacity="0.7"/>
      {/* Tier 1 side branch A */}
      <path d="M195 72 C186 56 180 40 174 26"
        stroke={SAGE} strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
      {/* Tier 1 side branch B */}
      <path d="M160 50 C153 36 148 22 144 10"
        stroke={SAGE} strokeWidth="0.9" strokeLinecap="round" opacity="0.55"/>
      {/* Tier 2 far branch */}
      <path d="M110 24 C100 16 88 11 72 7"
        stroke={SAGE_LT} strokeWidth="0.8" strokeLinecap="round" opacity="0.55"/>
      {/* Tip branch */}
      <path d="M58 12 C44 8 28 9 14 6"
        stroke={SAGE_LT} strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>

      {/* ── Left leaves (teardrop, same as website VineCorner) ── */}
      <path d="M174 26 C168 16, 183 13, 180 24 Z" fill={SAGE}    opacity="0.65"/>
      <path d="M144 10 C138 1, 153 -2, 150 9 Z"  fill={SAGE}    opacity="0.60"/>
      <path d="M72  7  C66 -1, 81 -4, 78 7 Z"   fill={SAGE_LT} opacity="0.55"/>
      <path d="M14  6  C8  -2, 22 -4, 19 6 Z"   fill={SAGE_LT} opacity="0.45"/>
      {/* Side leaves on main arc */}
      <path d="M195 72 C188 62, 202 60, 199 70 Z" fill={SAGE}   opacity="0.5"/>
      <path d="M158 50 C152 40, 166 39, 163 49 Z" fill={SAGE}   opacity="0.5"/>
      <path d="M110 24 C104 15, 118 13, 115 23 Z" fill={SAGE_LT} opacity="0.5"/>

      {/* ── Left blossoms ── */}
      <circle cx="174" cy="25" r="5.5" fill={ROSE} opacity="0.78"/>
      <circle cx="174" cy="25" r="2.2" fill={GOLD} opacity="0.85"/>
      <circle cx="144" cy="9"  r="5"   fill={ROSE} opacity="0.72"/>
      <circle cx="144" cy="9"  r="2"   fill={GOLD} opacity="0.8"/>
      <circle cx="72"  cy="6"  r="4"   fill={ROSE} opacity="0.65"/>
      <circle cx="14"  cy="5"  r="3.5" fill={ROSE} opacity="0.55"/>

      {/* ── Right wing (perfect mirror) ── */}
      <path d="M250 105 C272 88 305 68 342 48 C372 32 406 20 442 12"
        stroke={SAGE} strokeWidth="1.4" strokeLinecap="round" opacity="0.7"/>
      <path d="M305 72 C314 56 320 40 326 26"
        stroke={SAGE} strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
      <path d="M340 50 C347 36 352 22 356 10"
        stroke={SAGE} strokeWidth="0.9" strokeLinecap="round" opacity="0.55"/>
      <path d="M390 24 C400 16 412 11 428 7"
        stroke={SAGE_LT} strokeWidth="0.8" strokeLinecap="round" opacity="0.55"/>
      <path d="M442 12 C456 8 472 9 486 6"
        stroke={SAGE_LT} strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>

      {/* Right leaves */}
      <path d="M326 26 C332 16, 317 13, 320 24 Z" fill={SAGE}    opacity="0.65"/>
      <path d="M356 10 C362 1, 347 -2, 350 9 Z"   fill={SAGE}    opacity="0.60"/>
      <path d="M428 7  C434 -1, 419 -4, 422 7 Z"  fill={SAGE_LT} opacity="0.55"/>
      <path d="M486 6  C492 -2, 478 -4, 481 6 Z"  fill={SAGE_LT} opacity="0.45"/>
      <path d="M305 72 C312 62, 298 60, 301 70 Z"  fill={SAGE}   opacity="0.5"/>
      <path d="M342 50 C348 40, 334 39, 337 49 Z"  fill={SAGE}   opacity="0.5"/>
      <path d="M390 24 C396 15, 382 13, 385 23 Z"  fill={SAGE_LT} opacity="0.5"/>

      {/* Right blossoms */}
      <circle cx="326" cy="25" r="5.5" fill={ROSE} opacity="0.78"/>
      <circle cx="326" cy="25" r="2.2" fill={GOLD} opacity="0.85"/>
      <circle cx="356" cy="9"  r="5"   fill={ROSE} opacity="0.72"/>
      <circle cx="356" cy="9"  r="2"   fill={GOLD} opacity="0.8"/>
      <circle cx="428" cy="6"  r="4"   fill={ROSE} opacity="0.65"/>
      <circle cx="486" cy="5"  r="3.5" fill={ROSE} opacity="0.55"/>

      {/* ── Centre blossom — anchor of the arch ── */}
      <circle cx="250" cy="100" r="9"   fill={ROSE} opacity="0.82"/>
      <circle cx="250" cy="100" r="4"   fill={GOLD} opacity="0.90"/>
      <circle cx="250" cy="100" r="1.5" fill={PARCHMENT} opacity="0.9"/>
    </svg>
  );
}

// ─── Ornamental divider ────────────────────────────────────────────────────────
function Divider({ width = 280 }: { width?: number }) {
  const half = (width - 24) / 2;
  return (
    <svg width={width} height="22" viewBox={`0 0 ${width} 22`} fill="none" aria-hidden="true">
      <line x1="0"              y1="11" x2={half - 8}    y2="11" stroke={GOLD} strokeWidth="0.6" opacity="0.45"/>
      <circle cx={half - 2}     cy="11" r="2.2" fill={GOLD} opacity="0.40"/>
      {/* Centre diamond */}
      <path d={`M${width/2} 4 L${width/2+7} 11 L${width/2} 18 L${width/2-7} 11 Z`}
        fill={ROSE} opacity="0.50"/>
      <path d={`M${width/2} 8 L${width/2+3} 11 L${width/2} 14 L${width/2-3} 11 Z`}
        fill={GOLD} opacity="0.65"/>
      <circle cx={half + 26}    cy="11" r="2.2" fill={GOLD} opacity="0.40"/>
      <line x1={half + 32}      y1="11" x2={width}         y2="11" stroke={GOLD} strokeWidth="0.6" opacity="0.45"/>
    </svg>
  );
}

// ─── Bottom botanical ─────────────────────────────────────────────────────────
function BottomSprig() {
  return (
    <svg width="260" height="52" viewBox="0 0 260 52" fill="none" aria-hidden="true">
      {/* Central stem */}
      <path d="M130 48 L130 22" stroke={SAGE} strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
      {/* Left branch */}
      <path d="M130 36 C114 28 96 22 74 16"  stroke={SAGE}    strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
      <path d="M98  24 C89 14 82 7 76 2"     stroke={SAGE}    strokeWidth="0.8" strokeLinecap="round" opacity="0.55"/>
      <path d="M74  16 C60 12 46 12 30 10"   stroke={SAGE_LT} strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
      {/* Right branch */}
      <path d="M130 36 C146 28 164 22 186 16" stroke={SAGE}    strokeWidth="1.0" strokeLinecap="round" opacity="0.6"/>
      <path d="M162 24 C171 14 178 7  184 2"  stroke={SAGE}    strokeWidth="0.8" strokeLinecap="round" opacity="0.55"/>
      <path d="M186 16 C200 12 214 12 230 10" stroke={SAGE_LT} strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
      {/* Leaves */}
      <path d="M76  2  C70 -5, 85 -7, 82 3 Z"   fill={SAGE}    opacity="0.60"/>
      <path d="M184 2  C190 -5, 175 -7, 178 3 Z" fill={SAGE}    opacity="0.60"/>
      <path d="M30  10 C24 3, 38 1, 36 10 Z"     fill={SAGE_LT} opacity="0.48"/>
      <path d="M230 10 C236 3, 222 1, 224 10 Z"  fill={SAGE_LT} opacity="0.48"/>
      {/* Blossoms */}
      <circle cx="76"  cy="1"  r="4.5" fill={ROSE} opacity="0.70"/>
      <circle cx="76"  cy="1"  r="1.8" fill={GOLD} opacity="0.78"/>
      <circle cx="184" cy="1"  r="4.5" fill={ROSE} opacity="0.70"/>
      <circle cx="184" cy="1"  r="1.8" fill={GOLD} opacity="0.78"/>
      <circle cx="30"  cy="10" r="3.5" fill={ROSE} opacity="0.58"/>
      <circle cx="230" cy="10" r="3.5" fill={ROSE} opacity="0.58"/>
      {/* Centre top flower */}
      <circle cx="130" cy="21" r="6"   fill={ROSE} opacity="0.76"/>
      <circle cx="130" cy="21" r="2.5" fill={GOLD} opacity="0.88"/>
      {/* Diamond base */}
      <path d="M130 44 L133 47 L130 50 L127 47 Z" fill={GOLD} opacity="0.50"/>
    </svg>
  );
}

// ─── InvitationCard ───────────────────────────────────────────────────────────

const InvitationCard = forwardRef<HTMLDivElement, InvitationCardProps>(
  ({ guestName, eventDate, eventTime, venueName, eventName, tableNumber, language, rsvpUrl }, ref) => {
    const t = TRANSLATIONS[language];

    const formattedDate = (() => {
      try {
        const d = new Date(eventDate.includes('T') ? eventDate : `${eventDate}T12:00:00`);
        if (language === 'uz') {
          const M = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentyabr','oktyabr','noyabr','dekabr'];
          return `${d.getDate()} ${M[d.getMonth()]} ${d.getFullYear()}`;
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
          // Warm parchment — noticeably warmer at edges for depth
          background:    `linear-gradient(175deg, #EDE4D3 0%, ${PARCHMENT} 22%, ${PARCHMENT} 78%, #EDE4D3 100%)`,
          fontFamily:    SANS,
        }}
      >
        {/* ── Double decorative frame ─────────────────────────────────────── */}
        <div style={{ position:'absolute', inset:16, border:`1px solid ${GOLD_SOFT}`,    pointerEvents:'none' }}/>
        <div style={{ position:'absolute', inset:20, border:`0.5px solid ${GOLD_SOFT}`,  pointerEvents:'none' }}/>

        {/* ══ CONTENT ══════════════════════════════════════════════════════ */}

        {/* ── Top botanical arch ── */}
        <div style={{ marginTop: 36, flexShrink: 0 }}>
          <TopArch />
        </div>

        {/* ── Overline ── */}
        <div style={{ marginTop: 8, display:'flex', alignItems:'center', gap:8, flexShrink:0 }}>
          <div style={{ width:28, height:0.6, background:ROSE, opacity:0.5 }}/>
          <span style={{ fontFamily:SANS, fontSize:8.5, letterSpacing:'0.38em', color:ROSE, opacity:0.85, textTransform:'uppercase' }}>
            {t.cardYoureInvited}
          </span>
          <div style={{ width:28, height:0.6, background:ROSE, opacity:0.5 }}/>
        </div>

        {/* ── Couple names — tight, unified ── */}
        <div style={{ marginTop:18, display:'flex', flexDirection:'column', alignItems:'center', flexShrink:0 }}>
          <span style={{ fontFamily:DISPLAY, fontSize:82, color:ESPRESSO, lineHeight:0.88 }}>
            Berfin
          </span>
          {/* & sits on the baseline of first name, visually connecting them */}
          <span style={{ fontFamily:SERIF, fontSize:36, color:GOLD, lineHeight:1.05, letterSpacing:'0.1em' }}>
            &amp;
          </span>
          <span style={{ fontFamily:DISPLAY, fontSize:82, color:ESPRESSO, lineHeight:0.88 }}>
            Shamsiddin
          </span>
        </div>

        {/* ── Primary divider ── */}
        <div style={{ marginTop:20, flexShrink:0 }}>
          <Divider width={300} />
        </div>

        {/* ── Guest invite section ── */}
        <div style={{ marginTop:14, display:'flex', flexDirection:'column', alignItems:'center', gap:7, flexShrink:0, paddingInline:56 }}>
          <span style={{ fontFamily:SANS, fontStyle:'italic', fontSize:13, color:ESP_DIM, textAlign:'center', lineHeight:1.45 }}>
            {t.cardWeInviteYou}
          </span>
          <span style={{ fontFamily:SANS, fontWeight:600, fontSize:20, color:ESPRESSO, textAlign:'center', letterSpacing:'0.015em' }}>
            {guestName}
          </span>
        </div>

        {/* ── Secondary divider ── */}
        <div style={{ marginTop:18, flexShrink:0 }}>
          <Divider width={200} />
        </div>

        {/* ── Event details ── */}
        <div style={{
          marginTop:     18,
          width:         460,
          flexShrink:    0,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           7,
          padding:       '16px 24px',
          background:    'rgba(237,228,211,0.45)',
          border:        `0.75px solid ${GOLD_SOFT}`,
        }}>
          {/* Optional event name */}
          {eventName && (
            <>
              <span style={{ fontFamily:SANS, fontSize:8, letterSpacing:'0.36em', color:ROSE, textTransform:'uppercase', opacity:0.88 }}>
                {eventName}
              </span>
              <div style={{ width:30, height:0.5, background:GOLD, opacity:0.35 }}/>
            </>
          )}
          <span style={{ fontFamily:SANS, fontWeight:600, fontSize:15.5, color:ESPRESSO, letterSpacing:'0.01em' }}>
            {formattedDate}
          </span>
          {(eventTime || venueName) && (
            <span style={{ fontFamily:SANS, fontSize:12.5, color:ESP_DIM }}>
              {[eventTime, venueName].filter(Boolean).join('  ·  ')}
            </span>
          )}
          {/* Table badge */}
          {tableNumber != null && (
            <div style={{
              marginTop: 6,
              paddingInline:16, paddingBlock:5,
              border:`0.75px solid rgba(184,146,74,0.38)`,
              borderRadius:20,
              display:'flex', alignItems:'center', gap:7,
              background:'rgba(184,146,74,0.07)',
            }}>
              <span style={{ fontFamily:SANS, fontSize:7.5, letterSpacing:'0.32em', color:GOLD, textTransform:'uppercase' }}>
                {t.cardTable}
              </span>
              <span style={{ fontFamily:SERIF, fontSize:20, color:GOLD, fontWeight:600, lineHeight:1 }}>
                {tableNumber}
              </span>
            </div>
          )}
        </div>

        {/* ── QR section ── */}
        <div style={{ marginTop:26, display:'flex', flexDirection:'column', alignItems:'center', gap:11, flexShrink:0 }}>
          {/* Outer decorative frame */}
          <div style={{ position:'relative', padding:3, border:`1px solid ${GOLD_SOFT}` }}>
            {/* Corner accent dots */}
            {[[-3,-3],[-3,'auto'],['auto',-3],['auto','auto']].map(([t2,l],i)=>(
              <div key={i} style={{
                position:'absolute',
                top: typeof t2==='number' ? t2 : undefined,
                bottom: t2==='auto' ? -3 : undefined,
                left: typeof l==='number' ? l : undefined,
                right: l==='auto' ? -3 : undefined,
                width:6, height:6, borderRadius:'50%',
                background:GOLD, opacity:0.5,
              }}/>
            ))}
            <div style={{ padding:10, background:PARCHMENT }}>
              <QRCodeSVG value={rsvpUrl} size={88} bgColor={PARCHMENT} fgColor={ESPRESSO} level="M"/>
            </div>
          </div>
          {/* Scan label */}
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:20, height:0.5, background:GOLD, opacity:0.4 }}/>
            <span style={{ fontFamily:SANS, fontSize:8, letterSpacing:'0.3em', color:ESP_DIM, textTransform:'uppercase' }}>
              {t.cardScanRsvp}
            </span>
            <div style={{ width:20, height:0.5, background:GOLD, opacity:0.4 }}/>
          </div>
        </div>

        {/* ── Year monogram ── */}
        <div style={{ marginTop:14, fontFamily:SANS, fontSize:9, letterSpacing:'0.32em', color:`rgba(42,31,26,0.3)`, textTransform:'uppercase', flexShrink:0 }}>
          · 2026 ·
        </div>

        {/* ── Bottom botanical ── */}
        <div style={{ marginTop:12, flexShrink:0, paddingBottom:34 }}>
          <BottomSprig />
        </div>
      </div>
    );
  }
);

InvitationCard.displayName = 'InvitationCard';
export default InvitationCard;
