import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Language } from '../../lib/i18n';
import { en, tr, uz } from '../../lib/i18n';

const TRANSLATIONS = { en, tr, uz };

const PARCHMENT  = '#FDFAF5';
const ESPRESSO   = '#2A1F1A';
const ESP_DIM    = 'rgba(42,31,26,0.62)';
const GOLD       = '#B8924A';
const GOLD_SOFT  = 'rgba(184,146,74,0.35)';
const ROSE       = '#C4848C';
const GREEN_LEAF = '#A8C4AB';

const SERIF = '"Cormorant Garamond", Georgia, serif';
const SANS  = '"DM Sans", system-ui, sans-serif';

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

// ─── Botanical SVGs ───────────────────────────────────────────────────────────

function TopFloral() {
  return (
    <svg width="320" height="78" viewBox="0 0 320 78" fill="none">
      {/* Main stems */}
      <path d="M160 68 C138 56 108 44 76 24" stroke={GOLD} strokeWidth="0.9" opacity="0.55"/>
      <path d="M160 68 C182 56 212 44 244 24" stroke={GOLD} strokeWidth="0.9" opacity="0.55"/>

      {/* Left sub-branches */}
      <path d="M122 50 C114 36 110 20 106 8"  stroke={GOLD} strokeWidth="0.6" opacity="0.45"/>
      <path d="M94  38 C88  26 84  14 80  4"  stroke={GOLD} strokeWidth="0.6" opacity="0.45"/>
      <path d="M76  24 C66  18 56  16 44  10" stroke={GOLD} strokeWidth="0.5" opacity="0.4"/>

      {/* Right sub-branches (mirrored) */}
      <path d="M198 50 C206 36 210 20 214 8"  stroke={GOLD} strokeWidth="0.6" opacity="0.45"/>
      <path d="M226 38 C232 26 236 14 240 4"  stroke={GOLD} strokeWidth="0.6" opacity="0.45"/>
      <path d="M244 24 C254 18 264 16 276 10" stroke={GOLD} strokeWidth="0.5" opacity="0.4"/>

      {/* Left leaves */}
      <ellipse cx="106" cy="8"  rx="6" ry="2.5" transform="rotate(-40 106 8)"  fill={GREEN_LEAF} opacity="0.6"/>
      <ellipse cx="80"  cy="4"  rx="5.5" ry="2.5" transform="rotate(-55 80 4)" fill={GREEN_LEAF} opacity="0.55"/>
      <ellipse cx="44"  cy="10" rx="5.5" ry="2.5" transform="rotate(-20 44 10)" fill={GREEN_LEAF} opacity="0.5"/>

      {/* Right leaves */}
      <ellipse cx="214" cy="8"  rx="6"   ry="2.5" transform="rotate(40 214 8)"   fill={GREEN_LEAF} opacity="0.6"/>
      <ellipse cx="240" cy="4"  rx="5.5" ry="2.5" transform="rotate(55 240 4)"   fill={GREEN_LEAF} opacity="0.55"/>
      <ellipse cx="276" cy="10" rx="5.5" ry="2.5" transform="rotate(20 276 10)"  fill={GREEN_LEAF} opacity="0.5"/>

      {/* Left blossoms */}
      <circle cx="106" cy="7"  r="3.5" fill={ROSE} opacity="0.85"/>
      <circle cx="80"  cy="3"  r="3"   fill={ROSE} opacity="0.75"/>
      <circle cx="44"  cy="9"  r="3"   fill={ROSE} opacity="0.7"/>

      {/* Right blossoms */}
      <circle cx="214" cy="7"  r="3.5" fill={ROSE} opacity="0.85"/>
      <circle cx="240" cy="3"  r="3"   fill={ROSE} opacity="0.75"/>
      <circle cx="276" cy="9"  r="3"   fill={ROSE} opacity="0.7"/>

      {/* Centre blossom */}
      <circle cx="160" cy="63" r="5"   fill={ROSE}  opacity="0.9"/>
      <circle cx="160" cy="63" r="2.5" fill={GOLD}  opacity="0.9"/>
    </svg>
  );
}

function BottomFloral() {
  return (
    <svg width="220" height="44" viewBox="0 0 220 44" fill="none">
      <path d="M110 34 C94 26 74 20 52 10"  stroke={GOLD} strokeWidth="0.8" opacity="0.5"/>
      <path d="M110 34 C126 26 146 20 168 10" stroke={GOLD} strokeWidth="0.8" opacity="0.5"/>
      <path d="M78 22 C70 14 64 8 58 3"  stroke={GOLD} strokeWidth="0.5" opacity="0.4"/>
      <path d="M142 22 C150 14 156 8 162 3" stroke={GOLD} strokeWidth="0.5" opacity="0.4"/>

      <ellipse cx="58" cy="3"  rx="5" ry="2" transform="rotate(-45 58 3)"  fill={GREEN_LEAF} opacity="0.55"/>
      <ellipse cx="162" cy="3" rx="5" ry="2" transform="rotate(45 162 3)"  fill={GREEN_LEAF} opacity="0.55"/>

      <circle cx="52"  cy="10" r="2.8" fill={ROSE} opacity="0.7"/>
      <circle cx="168" cy="10" r="2.8" fill={ROSE} opacity="0.7"/>
      <circle cx="58"  cy="2"  r="2"   fill={ROSE} opacity="0.65"/>
      <circle cx="162" cy="2"  r="2"   fill={ROSE} opacity="0.65"/>

      {/* Centre diamond */}
      <path d="M110 28 L114 32 L110 36 L106 32 Z" fill={GOLD} opacity="0.65"/>
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
          width:          540,
          height:         960,
          backgroundColor: PARCHMENT,
          fontFamily:     SANS,
          position:       'relative',
          overflow:       'hidden',
          display:        'flex',
          flexDirection:  'column',
          alignItems:     'center',
        }}
      >
        {/* ── Outer decorative frame ── */}
        <div style={{
          position:     'absolute',
          inset:        22,
          border:       `0.75px solid ${GOLD_SOFT}`,
          pointerEvents: 'none',
        }} />
        {/* Corner ornaments */}
        {(['0 0','0 auto','auto 0','auto auto'] as const).map((_pos, i) => (
          <div key={i} style={{
            position:        'absolute',
            top:    i < 2 ? 18 : 'auto',
            bottom: i < 2 ? 'auto' : 18,
            left:   i % 2 === 0 ? 18 : 'auto',
            right:  i % 2 === 0 ? 'auto' : 18,
            width:  12,
            height: 12,
            borderTop:    i < 2  ? `1px solid ${GOLD_SOFT}` : undefined,
            borderBottom: i >= 2 ? `1px solid ${GOLD_SOFT}` : undefined,
            borderLeft:   i % 2 === 0 ? `1px solid ${GOLD_SOFT}` : undefined,
            borderRight:  i % 2 !== 0 ? `1px solid ${GOLD_SOFT}` : undefined,
          }} />
        ))}

        {/* ── Top botanical ── */}
        <div style={{ marginTop: 38, flexShrink: 0 }}>
          <TopFloral />
        </div>

        {/* ── Overline ── */}
        <div style={{
          marginTop:      14,
          display:        'flex',
          alignItems:     'center',
          gap:            10,
          flexShrink:     0,
        }}>
          <div style={{ width: 36, height: 0.5, backgroundColor: ROSE, opacity: 0.5 }} />
          <span style={{
            fontFamily:     SANS,
            fontSize:       9.5,
            letterSpacing:  '0.32em',
            color:          ROSE,
            opacity:        0.85,
            textTransform:  'uppercase',
          }}>
            {t.cardYoureInvited}
          </span>
          <div style={{ width: 36, height: 0.5, backgroundColor: ROSE, opacity: 0.5 }} />
        </div>

        {/* ── Couple names ── */}
        <div style={{
          marginTop:    22,
          display:      'flex',
          flexDirection: 'column',
          alignItems:   'center',
          flexShrink:   0,
          lineHeight:   1,
          gap:          2,
        }}>
          <span style={{
            fontFamily:  SERIF,
            fontStyle:   'italic',
            fontSize:    76,
            color:       ESPRESSO,
            lineHeight:  0.92,
          }}>
            Berfin
          </span>
          <span style={{
            fontFamily: SERIF,
            fontSize:   42,
            color:      GOLD,
            lineHeight: 1,
            letterSpacing: '0.05em',
          }}>
            &amp;
          </span>
          <span style={{
            fontFamily: SERIF,
            fontStyle:  'italic',
            fontSize:   76,
            color:      ESPRESSO,
            lineHeight: 0.92,
          }}>
            Shamsiddin
          </span>
        </div>

        {/* ── Divider ── */}
        <div style={{ marginTop: 28, width: 260, height: 0.5, backgroundColor: GOLD, opacity: 0.4, flexShrink: 0 }} />

        {/* ── Invite copy ── */}
        <div style={{
          marginTop:   16,
          display:     'flex',
          flexDirection: 'column',
          alignItems:  'center',
          gap:         8,
          flexShrink:  0,
          paddingInline: 40,
        }}>
          <span style={{
            fontFamily:  SANS,
            fontStyle:   'italic',
            fontSize:    12.5,
            color:       ESP_DIM,
            textAlign:   'center',
            lineHeight:  1.45,
          }}>
            {t.cardWeInviteYou}
          </span>
          <span style={{
            fontFamily:  SANS,
            fontWeight:  600,
            fontSize:    20,
            color:       ESPRESSO,
            textAlign:   'center',
            letterSpacing: '0.02em',
            lineHeight:  1.2,
          }}>
            {guestName}
          </span>
        </div>

        {/* ── Second divider ── */}
        <div style={{ marginTop: 18, width: 200, height: 0.5, backgroundColor: GOLD, opacity: 0.35, flexShrink: 0 }} />

        {/* ── Event details ── */}
        <div style={{
          marginTop:    18,
          display:      'flex',
          flexDirection: 'column',
          alignItems:   'center',
          gap:          5,
          flexShrink:   0,
        }}>
          {eventName && (
            <span style={{
              fontFamily:    SANS,
              fontSize:      9.5,
              letterSpacing: '0.3em',
              color:         ROSE,
              textTransform: 'uppercase',
              opacity:       0.8,
            }}>
              {eventName}
            </span>
          )}
          <span style={{
            fontFamily:    SANS,
            fontSize:      14,
            color:         ESPRESSO,
            fontWeight:    500,
            letterSpacing: '0.01em',
          }}>
            {formattedDate}
          </span>
          {(eventTime || venueName) && (
            <span style={{
              fontFamily: SANS,
              fontSize:   12.5,
              color:      ESP_DIM,
              letterSpacing: '0.01em',
            }}>
              {[eventTime, venueName].filter(Boolean).join('  ·  ')}
            </span>
          )}
        </div>

        {/* ── Table badge ── */}
        {tableNumber != null && (
          <div style={{
            marginTop:    16,
            paddingInline: 20,
            paddingBlock:  6,
            border:       `0.75px solid ${GOLD_SOFT}`,
            borderRadius:  20,
            display:      'flex',
            alignItems:   'center',
            gap:          8,
            flexShrink:   0,
          }}>
            <span style={{
              fontFamily:    SANS,
              fontSize:      8.5,
              letterSpacing: '0.3em',
              color:         GOLD,
              textTransform: 'uppercase',
              opacity:       0.9,
            }}>
              {t.cardTable}
            </span>
            <span style={{
              fontFamily: SERIF,
              fontSize:   22,
              color:      GOLD,
              fontWeight: 600,
              lineHeight: 1,
            }}>
              {tableNumber}
            </span>
          </div>
        )}

        {/* ── QR code ── */}
        <div style={{
          marginTop:    tableNumber != null ? 20 : 26,
          display:      'flex',
          flexDirection: 'column',
          alignItems:   'center',
          gap:          10,
          flexShrink:   0,
        }}>
          <div style={{
            padding:         12,
            border:          `0.75px solid ${GOLD_SOFT}`,
            backgroundColor: PARCHMENT,
          }}>
            <QRCodeSVG
              value={rsvpUrl}
              size={112}
              bgColor={PARCHMENT}
              fgColor={ESPRESSO}
              level="M"
            />
          </div>
          <span style={{
            fontFamily:    SANS,
            fontSize:      9,
            letterSpacing: '0.22em',
            color:         ESP_DIM,
            textTransform: 'uppercase',
          }}>
            {t.cardScanRsvp}
          </span>
        </div>

        {/* ── Bottom botanical ── */}
        <div style={{ marginTop: 'auto', paddingBottom: 38, flexShrink: 0 }}>
          <BottomFloral />
        </div>
      </div>
    );
  }
);

InvitationCard.displayName = 'InvitationCard';

export default InvitationCard;
