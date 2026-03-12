import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Language } from '../../lib/i18n';
import { en, tr, uz } from '../../lib/i18n';

const TRANSLATIONS = { en, tr, uz };

// ─── Palette (matches the website exactly) ───────────────────────────────────
const PARCHMENT  = '#FDFAF5';
const CREAM      = '#F5EFE4';
const ESPRESSO   = '#2A1F1A';
const ESP_DIM    = 'rgba(42,31,26,0.58)';
const GOLD       = '#B8924A';
const GOLD_SOFT  = 'rgba(184,146,74,0.30)';
const ROSE       = '#C4848C';
const ROSE_SOFT  = 'rgba(196,132,140,0.75)';
const SAGE       = '#A8C4AB';

// ─── Fonts (using the website's actual font stack) ────────────────────────────
// GlossilyEnigmatic is loaded via index.css @font-face from the same origin
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

// ─── Vine corner (matches VineCornerTL from GardenAtmosphere.tsx) ─────────────
function VineCorner({ rotate = 0 }: { rotate?: number }) {
  return (
    <svg
      width="120" height="120" viewBox="0 0 160 160"
      style={{ position: 'absolute', transform: `rotate(${rotate}deg)` }}
      aria-hidden="true"
    >
      {/* Main stem */}
      <path
        d="M8 8 C 20 30, 15 60, 30 90 C 45 120, 60 130, 80 140"
        fill="none" stroke={SAGE} strokeWidth="1.5" strokeLinecap="round" opacity="0.65"
      />
      {/* Side branches */}
      <path
        d="M20 40 C 35 30, 50 28, 60 20"
        fill="none" stroke={SAGE} strokeWidth="1" strokeLinecap="round" opacity="0.55"
      />
      <path
        d="M28 65 C 45 55, 60 50, 75 45"
        fill="none" stroke={SAGE} strokeWidth="1" strokeLinecap="round" opacity="0.5"
      />
      {/* Leaves */}
      <path d="M60 20 C 55 12, 68 10, 65 18 Z" fill={SAGE} opacity="0.6"/>
      <path d="M75 45 C 72 37, 84 38, 80 46 Z" fill={SAGE} opacity="0.6"/>
      <path d="M30 90 C 20 84, 22 74, 32 80 Z" fill={SAGE} opacity="0.55"/>
      {/* Rose blossom */}
      <circle cx="62" cy="19" r="5" fill={ROSE} opacity="0.75"/>
      <circle cx="62" cy="19" r="2" fill={GOLD} opacity="0.8"/>
    </svg>
  );
}

// ─── Top botanical arch ───────────────────────────────────────────────────────
function TopArch() {
  return (
    <svg width="460" height="96" viewBox="0 0 460 96" fill="none" aria-hidden="true">
      {/* Left main arc */}
      <path d="M230 86 C208 72 175 56 138 38 C108 24 76 14 44 8"
        stroke={SAGE} strokeWidth="1.2" strokeLinecap="round" opacity="0.55"/>
      {/* Right main arc (mirror) */}
      <path d="M230 86 C252 72 285 56 322 38 C352 24 384 14 416 8"
        stroke={SAGE} strokeWidth="1.2" strokeLinecap="round" opacity="0.55"/>

      {/* Left branches */}
      <path d="M185 62 C178 48 172 34 166 22"
        stroke={SAGE} strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
      <path d="M152 42 C146 30 142 18 138 8"
        stroke={SAGE} strokeWidth="0.8" strokeLinecap="round" opacity="0.45"/>
      <path d="M108 22 C100 16 90 12 78 8"
        stroke={SAGE} strokeWidth="0.7" strokeLinecap="round" opacity="0.4"/>

      {/* Right branches (mirror) */}
      <path d="M275 62 C282 48 288 34 294 22"
        stroke={SAGE} strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
      <path d="M308 42 C314 30 318 18 322 8"
        stroke={SAGE} strokeWidth="0.8" strokeLinecap="round" opacity="0.45"/>
      <path d="M352 22 C360 16 370 12 382 8"
        stroke={SAGE} strokeWidth="0.7" strokeLinecap="round" opacity="0.4"/>

      {/* Left leaves */}
      <path d="M166 22 C160 12, 174 10, 171 20 Z" fill={SAGE} opacity="0.55"/>
      <path d="M138 8  C132 0, 146 -2, 143 8 Z" fill={SAGE} opacity="0.5"/>
      <path d="M78  8  C72  0, 86 -2, 82  8 Z"  fill={SAGE} opacity="0.45"/>
      {/* Right leaves (mirror) */}
      <path d="M294 22 C300 12, 286 10, 289 20 Z" fill={SAGE} opacity="0.55"/>
      <path d="M322 8  C328 0, 314 -2, 317 8 Z"  fill={SAGE} opacity="0.5"/>
      <path d="M382 8  C388 0, 374 -2, 378 8 Z"  fill={SAGE} opacity="0.45"/>

      {/* Left blossoms */}
      <circle cx="166" cy="21" r="4.5" fill={ROSE} opacity="0.72"/>
      <circle cx="166" cy="21" r="1.8" fill={GOLD} opacity="0.8"/>
      <circle cx="140" cy="7"  r="4"   fill={ROSE} opacity="0.68"/>
      <circle cx="78"  cy="7"  r="3.5" fill={ROSE} opacity="0.62"/>
      <circle cx="44"  cy="8"  r="3"   fill={ROSE_SOFT} opacity="0.7"/>

      {/* Right blossoms (mirror) */}
      <circle cx="294" cy="21" r="4.5" fill={ROSE} opacity="0.72"/>
      <circle cx="294" cy="21" r="1.8" fill={GOLD} opacity="0.8"/>
      <circle cx="320" cy="7"  r="4"   fill={ROSE} opacity="0.68"/>
      <circle cx="382" cy="7"  r="3.5" fill={ROSE} opacity="0.62"/>
      <circle cx="416" cy="8"  r="3"   fill={ROSE_SOFT} opacity="0.7"/>

      {/* Centre blossom at join */}
      <circle cx="230" cy="82" r="7"   fill={ROSE} opacity="0.82"/>
      <circle cx="230" cy="82" r="3"   fill={GOLD} opacity="0.9"/>
    </svg>
  );
}

// ─── Ornamental divider ───────────────────────────────────────────────────────
function Divider() {
  return (
    <svg width="300" height="20" viewBox="0 0 300 20" fill="none" aria-hidden="true">
      <line x1="0"   y1="10" x2="120" y2="10" stroke={GOLD} strokeWidth="0.5" opacity="0.4"/>
      <circle cx="127" cy="10" r="2"   fill={GOLD} opacity="0.45"/>
      <path d="M150 3 L157 10 L150 17 L143 10 Z" fill={ROSE} opacity="0.55"/>
      <path d="M150 7 L154 10 L150 13 L146 10 Z" fill={GOLD} opacity="0.65"/>
      <circle cx="173" cy="10" r="2"   fill={GOLD} opacity="0.45"/>
      <line x1="180" y1="10" x2="300" y2="10" stroke={GOLD} strokeWidth="0.5" opacity="0.4"/>
    </svg>
  );
}

// ─── Small bottom botanical ───────────────────────────────────────────────────
function BottomSprig() {
  return (
    <svg width="220" height="48" viewBox="0 0 220 48" fill="none" aria-hidden="true">
      {/* Vertical stem */}
      <path d="M110 44 L110 18" stroke={SAGE} strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
      {/* Left branch */}
      <path d="M110 32 C95 26 78 22 60 18"  stroke={SAGE} strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
      <path d="M82 24 C74 16 68 10 62 4"    stroke={SAGE} strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
      {/* Right branch */}
      <path d="M110 32 C125 26 142 22 160 18" stroke={SAGE} strokeWidth="0.9" strokeLinecap="round" opacity="0.5"/>
      <path d="M138 24 C146 16 152 10 158 4"  stroke={SAGE} strokeWidth="0.7" strokeLinecap="round" opacity="0.45"/>
      {/* Leaves */}
      <path d="M62 4 C56 -3, 70 -5, 67 5 Z"  fill={SAGE} opacity="0.5"/>
      <path d="M158 4 C164 -3, 150 -5, 153 5 Z" fill={SAGE} opacity="0.5"/>
      {/* Blossoms */}
      <circle cx="62"  cy="3"  r="3.5" fill={ROSE} opacity="0.65"/>
      <circle cx="158" cy="3"  r="3.5" fill={ROSE} opacity="0.65"/>
      <circle cx="60"  cy="18" r="2.5" fill={ROSE_SOFT} opacity="0.6"/>
      <circle cx="160" cy="18" r="2.5" fill={ROSE_SOFT} opacity="0.6"/>
      {/* Center flower at top of stem */}
      <circle cx="110" cy="17" r="5.5" fill={ROSE} opacity="0.78"/>
      <circle cx="110" cy="17" r="2.2" fill={GOLD} opacity="0.85"/>
      {/* Diamond at base */}
      <path d="M110 40 L113 43 L110 46 L107 43 Z" fill={GOLD} opacity="0.55"/>
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
          const UZ_MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentyabr','oktyabr','noyabr','dekabr'];
          return `${d.getDate()} ${UZ_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
        }
        const locale = language === 'tr' ? 'tr-TR' : 'en-US';
        return d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
      } catch {
        return eventDate;
      }
    })();

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
          // Warm gradient — slightly deeper cream at edges, lighter in centre
          background: `linear-gradient(160deg, ${CREAM} 0%, ${PARCHMENT} 18%, ${PARCHMENT} 82%, ${CREAM} 100%)`,
          fontFamily:      SANS,
        }}
      >
        {/* ── Decorative outer frame ── */}
        <div style={{
          position: 'absolute', inset: 20,
          border:   `0.8px solid ${GOLD_SOFT}`,
          pointerEvents: 'none',
        }} />

        {/* ── Vine corner decorations (all 4) ── */}
        <div style={{ position: 'absolute', top: 0,    left: 0   }}><VineCorner rotate={0}   /></div>
        <div style={{ position: 'absolute', top: 0,    right: 0  }}><VineCorner rotate={90}  /></div>
        <div style={{ position: 'absolute', bottom: 0, right: 0  }}><VineCorner rotate={180} /></div>
        <div style={{ position: 'absolute', bottom: 0, left: 0   }}><VineCorner rotate={270} /></div>

        {/* ══ CONTENT COLUMN ══ */}

        {/* ── Top botanical arch ── */}
        <div style={{ marginTop: 42, flexShrink: 0 }}>
          <TopArch />
        </div>

        {/* ── Overline ── */}
        <div style={{
          marginTop:  10,
          display:    'flex',
          alignItems: 'center',
          gap:        9,
          flexShrink: 0,
        }}>
          <div style={{ width: 32, height: 0.5, background: ROSE, opacity: 0.45 }}/>
          <span style={{
            fontFamily:    SANS,
            fontSize:      9,
            letterSpacing: '0.35em',
            color:         ROSE,
            opacity:       0.82,
            textTransform: 'uppercase',
          }}>
            {t.cardYoureInvited}
          </span>
          <div style={{ width: 32, height: 0.5, background: ROSE, opacity: 0.45 }}/>
        </div>

        {/* ── Couple names ── */}
        <div style={{
          marginTop:     16,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          flexShrink:    0,
          gap:           0,
          lineHeight:    1,
        }}>
          <span style={{
            fontFamily: DISPLAY,
            fontSize:   78,
            color:      ESPRESSO,
            lineHeight: 0.90,
          }}>
            Berfin
          </span>
          <span style={{
            fontFamily:    SERIF,
            fontSize:      38,
            color:         GOLD,
            lineHeight:    1.1,
            letterSpacing: '0.08em',
            fontStyle:     'normal',
          }}>
            &amp;
          </span>
          <span style={{
            fontFamily: DISPLAY,
            fontSize:   78,
            color:      ESPRESSO,
            lineHeight: 0.90,
          }}>
            Shamsiddin
          </span>
        </div>

        {/* ── Ornamental divider ── */}
        <div style={{ marginTop: 22, flexShrink: 0 }}>
          <Divider />
        </div>

        {/* ── Guest invite copy ── */}
        <div style={{
          marginTop:     14,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           7,
          flexShrink:    0,
          paddingInline: 50,
        }}>
          <span style={{
            fontFamily: SANS,
            fontStyle:  'italic',
            fontSize:   12.5,
            color:      ESP_DIM,
            textAlign:  'center',
            lineHeight: 1.4,
          }}>
            {t.cardWeInviteYou}
          </span>
          <span style={{
            fontFamily:    SANS,
            fontWeight:    600,
            fontSize:      20,
            color:         ESPRESSO,
            textAlign:     'center',
            letterSpacing: '0.015em',
            lineHeight:    1.2,
          }}>
            {guestName}
          </span>
        </div>

        {/* ── Event details panel ── */}
        <div style={{
          marginTop:       22,
          width:           440,
          background:      `rgba(245,239,228,0.55)`,
          border:          `0.75px solid ${GOLD_SOFT}`,
          borderRadius:    2,
          padding:         '14px 22px',
          display:         'flex',
          flexDirection:   'column',
          alignItems:      'center',
          gap:             6,
          flexShrink:      0,
        }}>
          {/* Event name label */}
          {eventName && (
            <span style={{
              fontFamily:    SANS,
              fontSize:      8.5,
              letterSpacing: '0.32em',
              color:         ROSE,
              textTransform: 'uppercase',
              opacity:       0.85,
            }}>
              {eventName}
            </span>
          )}

          {/* Thin gold line under event name */}
          {eventName && (
            <div style={{ width: 36, height: 0.5, background: GOLD, opacity: 0.3 }}/>
          )}

          {/* Date */}
          <span style={{
            fontFamily:    SANS,
            fontSize:      15,
            color:         ESPRESSO,
            fontWeight:    600,
            letterSpacing: '0.01em',
          }}>
            {formattedDate}
          </span>

          {/* Time · Venue */}
          {(eventTime || venueName) && (
            <span style={{
              fontFamily:    SANS,
              fontSize:      12.5,
              color:         ESP_DIM,
              letterSpacing: '0.01em',
            }}>
              {[eventTime, venueName].filter(Boolean).join('  ·  ')}
            </span>
          )}

          {/* Table badge */}
          {tableNumber != null && (
            <div style={{
              marginTop:     6,
              paddingInline: 16,
              paddingBlock:  5,
              border:        `0.75px solid rgba(184,146,74,0.4)`,
              borderRadius:  20,
              display:       'flex',
              alignItems:    'center',
              gap:           7,
              background:    'rgba(184,146,74,0.06)',
            }}>
              <span style={{
                fontFamily:    SANS,
                fontSize:      8,
                letterSpacing: '0.3em',
                color:         GOLD,
                textTransform: 'uppercase',
              }}>
                {t.cardTable}
              </span>
              <span style={{
                fontFamily: SERIF,
                fontSize:   20,
                color:      GOLD,
                fontWeight: 600,
                lineHeight: 1,
              }}>
                {tableNumber}
              </span>
            </div>
          )}
        </div>

        {/* ── Flex spacer ── */}
        <div style={{ flex: 1, minHeight: 18 }} />

        {/* ── QR code ── */}
        <div style={{
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           10,
          flexShrink:    0,
        }}>
          {/* Outer gold frame */}
          <div style={{
            padding:      2,
            border:       `0.75px solid ${GOLD_SOFT}`,
            background:   PARCHMENT,
          }}>
            {/* Inner cream padding */}
            <div style={{ padding: 10, background: PARCHMENT }}>
              <QRCodeSVG
                value={rsvpUrl}
                size={96}
                bgColor={PARCHMENT}
                fgColor={ESPRESSO}
                level="M"
              />
            </div>
          </div>

          {/* Scan to RSVP */}
          <div style={{
            display:    'flex',
            alignItems: 'center',
            gap:        8,
          }}>
            <div style={{ width: 24, height: 0.5, background: GOLD, opacity: 0.35 }}/>
            <span style={{
              fontFamily:    SANS,
              fontSize:      8.5,
              letterSpacing: '0.28em',
              color:         ESP_DIM,
              textTransform: 'uppercase',
            }}>
              {t.cardScanRsvp}
            </span>
            <div style={{ width: 24, height: 0.5, background: GOLD, opacity: 0.35 }}/>
          </div>
        </div>

        {/* ── Year footer ── */}
        <div style={{
          marginTop:     14,
          fontFamily:    SANS,
          fontSize:      9,
          letterSpacing: '0.3em',
          color:         `rgba(42,31,26,0.28)`,
          textTransform: 'uppercase',
          flexShrink:    0,
        }}>
          · 2026 ·
        </div>

        {/* ── Bottom botanical ── */}
        <div style={{ marginTop: 12, flexShrink: 0, paddingBottom: 36 }}>
          <BottomSprig />
        </div>
      </div>
    );
  }
);

InvitationCard.displayName = 'InvitationCard';

export default InvitationCard;
