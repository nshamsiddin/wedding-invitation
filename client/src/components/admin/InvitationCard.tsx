import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Language } from '../../lib/i18n';
import { en, tr, uz } from '../../lib/i18n';

const T = { en, tr, uz };

// ─── Palette ──────────────────────────────────────────────────────────────────
const BG       = '#F3EAD8';     // warm ivory — visible, not pale
const BG_MID   = '#F9F4EC';     // lighter centre
const INK      = '#1E1410';     // deep ink, not washed out
const INK_MID  = 'rgba(30,20,16,0.55)';
const GOLD     = '#9A7535';     // accessible gold on ivory
const GOLD_HI  = '#C9A55A';     // lighter gold for ornaments
const ROSE     = '#B5737B';     // deeper rose, visible on ivory
const SAGE     = '#5C7A5E';     // proper sage green

// Single font family: Cormorant Garamond throughout for cohesion
const SERIF = '"Cormorant Garamond", "Palatino Linotype", Georgia, serif';
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

// ─── Botanical crown ───────────────────────────────────────────────────────────
// A symmetric hanging bouquet — fills the top 100px of the card.
// All strokes ≥ 1.5px so they're visible at any scale.
function BotanicalCrown() {
  return (
    <svg width="460" height="100" viewBox="0 0 460 100" fill="none" aria-hidden="true">

      {/* ── Main arcing branches ── */}
      <path d="M230 96 C208 80 178 62 145 42 C118 26 90 15 60 8"
        stroke={SAGE} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M230 96 C252 80 282 62 315 42 C342 26 370 15 400 8"
        stroke={SAGE} strokeWidth="1.8" strokeLinecap="round"/>

      {/* ── Left secondary branches ── */}
      <path d="M188 67 C180 50 174 33 170 18"
        stroke={SAGE} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M153 44 C148 29 145 16 143 5"
        stroke={SAGE} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M108 20 C100 13 88 9 74 6"
        stroke={SAGE} strokeWidth="1.0" strokeLinecap="round"/>

      {/* ── Right secondary branches (mirror) ── */}
      <path d="M272 67 C280 50 286 33 290 18"
        stroke={SAGE} strokeWidth="1.3" strokeLinecap="round"/>
      <path d="M307 44 C312 29 315 16 317 5"
        stroke={SAGE} strokeWidth="1.2" strokeLinecap="round"/>
      <path d="M352 20 C360 13 372 9 386 6"
        stroke={SAGE} strokeWidth="1.0" strokeLinecap="round"/>

      {/* ── Leaves (filled teardrop — same language as site VineCorner) ── */}
      {/* Left */}
      <path d="M170 18 C163 6, 180 2, 177 16 Z"  fill={SAGE}/>
      <path d="M143 5  C136 -5, 153 -8, 150 4 Z" fill={SAGE}/>
      <path d="M74  6  C67 -3, 84 -6, 81 5 Z"   fill={SAGE}/>
      <path d="M60  8  C52  0, 68 -3, 65 7 Z"   fill={SAGE} opacity="0.7"/>
      <path d="M188 67 C181 56, 197 53, 194 65 Z" fill={SAGE} opacity="0.8"/>
      <path d="M153 44 C147 33, 162 31, 159 43 Z" fill={SAGE} opacity="0.8"/>
      {/* Right */}
      <path d="M290 18 C297 6, 280 2, 283 16 Z"  fill={SAGE}/>
      <path d="M317 5  C324 -5, 307 -8, 310 4 Z" fill={SAGE}/>
      <path d="M386 6  C393 -3, 376 -6, 379 5 Z" fill={SAGE}/>
      <path d="M400 8  C408  0, 392 -3, 395 7 Z" fill={SAGE} opacity="0.7"/>
      <path d="M272 67 C279 56, 263 53, 266 65 Z" fill={SAGE} opacity="0.8"/>
      <path d="M307 44 C313 33, 298 31, 301 43 Z" fill={SAGE} opacity="0.8"/>

      {/* ── Blossoms ── */}
      {/* Left — rose outer ring + gold centre */}
      <circle cx="170" cy="17" r="8"   fill={ROSE}   opacity="0.85"/>
      <circle cx="170" cy="17" r="3.5" fill={GOLD_HI} opacity="0.9"/>
      <circle cx="143" cy="4"  r="7"   fill={ROSE}   opacity="0.80"/>
      <circle cx="143" cy="4"  r="3"   fill={GOLD_HI} opacity="0.88"/>
      <circle cx="74"  cy="5"  r="6"   fill={ROSE}   opacity="0.75"/>
      <circle cx="74"  cy="5"  r="2.5" fill={GOLD_HI} opacity="0.85"/>
      <circle cx="60"  cy="7"  r="4.5" fill={ROSE}   opacity="0.65"/>
      {/* Right */}
      <circle cx="290" cy="17" r="8"   fill={ROSE}   opacity="0.85"/>
      <circle cx="290" cy="17" r="3.5" fill={GOLD_HI} opacity="0.9"/>
      <circle cx="317" cy="4"  r="7"   fill={ROSE}   opacity="0.80"/>
      <circle cx="317" cy="4"  r="3"   fill={GOLD_HI} opacity="0.88"/>
      <circle cx="386" cy="5"  r="6"   fill={ROSE}   opacity="0.75"/>
      <circle cx="386" cy="5"  r="2.5" fill={GOLD_HI} opacity="0.85"/>
      <circle cx="400" cy="7"  r="4.5" fill={ROSE}   opacity="0.65"/>

      {/* ── Centre anchor blossom ── */}
      <circle cx="230" cy="91" r="11"  fill={ROSE}   opacity="0.90"/>
      <circle cx="230" cy="91" r="5"   fill={GOLD}   opacity="0.95"/>
      <circle cx="230" cy="91" r="2"   fill={BG_MID} opacity="0.9"/>
    </svg>
  );
}

// ─── Small bottom sprig ───────────────────────────────────────────────────────
function BottomSprig() {
  return (
    <svg width="240" height="56" viewBox="0 0 240 56" fill="none" aria-hidden="true">
      <path d="M120 52 L120 24"
        stroke={SAGE} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M120 40 C103 32 84 26 62 20"
        stroke={SAGE} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M120 40 C137 32 156 26 178 20"
        stroke={SAGE} strokeWidth="1.4" strokeLinecap="round"/>
      <path d="M84  28 C76 18 70 10 66 3"
        stroke={SAGE} strokeWidth="1.1" strokeLinecap="round"/>
      <path d="M156 28 C164 18 170 10 174 3"
        stroke={SAGE} strokeWidth="1.1" strokeLinecap="round"/>
      {/* Leaves */}
      <path d="M66  3  C59 -5, 75 -7, 72 3 Z" fill={SAGE}/>
      <path d="M174 3  C181 -5, 165 -7, 168 3 Z" fill={SAGE}/>
      <path d="M62  20 C55 11, 71 9, 68 19 Z" fill={SAGE} opacity="0.75"/>
      <path d="M178 20 C185 11, 169 9, 172 19 Z" fill={SAGE} opacity="0.75"/>
      {/* Blossoms */}
      <circle cx="66"  cy="2"  r="7"   fill={ROSE} opacity="0.80"/>
      <circle cx="66"  cy="2"  r="3"   fill={GOLD_HI} opacity="0.88"/>
      <circle cx="174" cy="2"  r="7"   fill={ROSE} opacity="0.80"/>
      <circle cx="174" cy="2"  r="3"   fill={GOLD_HI} opacity="0.88"/>
      <circle cx="62"  cy="20" r="5"   fill={ROSE} opacity="0.68"/>
      <circle cx="178" cy="20" r="5"   fill={ROSE} opacity="0.68"/>
      {/* Centre flower */}
      <circle cx="120" cy="23" r="8"   fill={ROSE} opacity="0.82"/>
      <circle cx="120" cy="23" r="3.5" fill={GOLD} opacity="0.90"/>
      {/* Tail diamond */}
      <path d="M120 48 L123 51 L120 54 L117 51 Z" fill={GOLD} opacity="0.6"/>
    </svg>
  );
}

// ─── Decorative rule ──────────────────────────────────────────────────────────
function Rule({ width = 340, diamond = true }: { width?: number; diamond?: boolean }) {
  const cx = width / 2;
  return (
    <svg width={width} height={diamond ? 24 : 4} viewBox={`0 0 ${width} ${diamond ? 24 : 4}`}
      fill="none" aria-hidden="true">
      {diamond ? (
        <>
          <line x1={0}      y1={12} x2={cx - 16} y2={12} stroke={GOLD} strokeWidth="0.8" opacity="0.55"/>
          <circle cx={cx - 9} cy={12} r={2.5} fill={GOLD} opacity="0.50"/>
          <path d={`M${cx} 4 L${cx+8} 12 L${cx} 20 L${cx-8} 12 Z`} fill={ROSE} opacity="0.55"/>
          <path d={`M${cx} 9 L${cx+3} 12 L${cx} 15 L${cx-3} 12 Z`} fill={GOLD} opacity="0.75"/>
          <circle cx={cx + 9} cy={12} r={2.5} fill={GOLD} opacity="0.50"/>
          <line x1={cx + 16} y1={12} x2={width} y2={12} stroke={GOLD} strokeWidth="0.8" opacity="0.55"/>
        </>
      ) : (
        <line x1={0} y1={2} x2={width} y2={2} stroke={GOLD} strokeWidth="0.6" opacity="0.40"/>
      )}
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
          // Visible warm gradient — cream centre, warm ivory edges
          background:    `radial-gradient(ellipse 120% 100% at 50% 40%, ${BG_MID} 0%, ${BG} 100%)`,
          fontFamily:    SERIF,
        }}
      >
        {/* ── Gold border frame ── */}
        <div style={{
          position: 'absolute', inset: 18,
          border:   `1px solid rgba(154,117,53,0.40)`,
          pointerEvents: 'none',
        }}/>
        {/* Inner hairline */}
        <div style={{
          position: 'absolute', inset: 22,
          border:   `0.5px solid rgba(154,117,53,0.20)`,
          pointerEvents: 'none',
        }}/>
        {/* Corner dots */}
        {[{t:15,l:15},{t:15,r:15},{b:15,r:15},{b:15,l:15}].map((pos, i) => (
          <div key={i} style={{
            position: 'absolute',
            top:    't' in pos ? pos.t : undefined,
            bottom: 'b' in pos ? pos.b : undefined,
            left:   'l' in pos ? pos.l : undefined,
            right:  'r' in pos ? pos.r : undefined,
            width: 6, height: 6, borderRadius: '50%',
            background: GOLD_HI, opacity: 0.6,
          }}/>
        ))}

        {/* ══ ZONE 1 — BOTANICAL CROWN ══════════════════════════════════ */}
        <div style={{ marginTop: 38, flexShrink: 0 }}>
          <BotanicalCrown />
        </div>

        {/* ── "Wedding Invitation" label ── */}
        <div style={{ marginTop: 10, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 40, height: 0.6, background: GOLD, opacity: 0.45 }}/>
          <span style={{
            fontFamily:    SANS,
            fontSize:      9,
            letterSpacing: '0.36em',
            color:         GOLD,
            textTransform: 'uppercase',
            fontWeight:    500,
          }}>
            Wedding Invitation
          </span>
          <div style={{ width: 40, height: 0.6, background: GOLD, opacity: 0.45 }}/>
        </div>

        {/* ══ ZONE 2 — COUPLE NAMES (HERO) ══════════════════════════════ */}
        <div style={{
          marginTop:     20,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          flexShrink:    0,
        }}>
          {/* Name 1 */}
          <span style={{
            fontFamily: SERIF,
            fontStyle:  'italic',
            fontSize:   92,
            color:      INK,
            lineHeight: 0.86,
            letterSpacing: '-0.01em',
          }}>
            Berfin
          </span>
          {/* Connector */}
          <span style={{
            fontFamily:    SERIF,
            fontStyle:     'normal',
            fontSize:      36,
            color:         GOLD,
            lineHeight:    1.1,
            letterSpacing: '0.12em',
          }}>
            &amp;
          </span>
          {/* Name 2 */}
          <span style={{
            fontFamily: SERIF,
            fontStyle:  'italic',
            fontSize:   92,
            color:      INK,
            lineHeight: 0.86,
            letterSpacing: '-0.01em',
          }}>
            Shamsiddin
          </span>
        </div>

        {/* ── Main rule ── */}
        <div style={{ marginTop: 22, flexShrink: 0 }}>
          <Rule width={340} diamond />
        </div>

        {/* ══ ZONE 3 — GUEST SECTION ════════════════════════════════════ */}
        <div style={{
          marginTop:     16,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           6,
          flexShrink:    0,
          paddingInline: 60,
        }}>
          <span style={{
            fontFamily: SERIF,
            fontStyle:  'italic',
            fontSize:   19,
            color:      INK_MID,
            textAlign:  'center',
            lineHeight: 1.45,
          }}>
            {t.cardWeInviteYou}
          </span>
          <span style={{
            fontFamily:    SERIF,
            fontStyle:     'normal',
            fontWeight:    600,
            fontSize:      26,
            color:         INK,
            textAlign:     'center',
            letterSpacing: '0.02em',
          }}>
            {guestName}
          </span>
        </div>

        {/* ── Sub rule ── */}
        <div style={{ marginTop: 16, flexShrink: 0 }}>
          <Rule width={200} diamond={false} />
        </div>

        {/* ══ ZONE 4 — EVENT DETAILS ════════════════════════════════════ */}
        <div style={{
          marginTop:     16,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           8,
          flexShrink:    0,
          width:         460,
          padding:       '16px 24px',
          background:    'rgba(154,117,53,0.05)',
          border:        `0.75px solid rgba(154,117,53,0.22)`,
        }}>
          {/* Event badge */}
          {eventName && (
            <>
              <span style={{
                fontFamily:    SANS,
                fontSize:      8.5,
                letterSpacing: '0.34em',
                color:         ROSE,
                textTransform: 'uppercase',
                fontWeight:    500,
              }}>
                {eventName}
              </span>
              <div style={{ width: 28, height: 0.5, background: GOLD, opacity: 0.4 }}/>
            </>
          )}
          {/* Date */}
          <span style={{
            fontFamily: SERIF,
            fontSize:   22,
            fontWeight: 600,
            color:      INK,
            letterSpacing: '0.02em',
          }}>
            {formattedDate}
          </span>
          {/* Time · Venue */}
          {(eventTime || venueName) && (
            <span style={{
              fontFamily: SERIF,
              fontStyle:  'italic',
              fontSize:   17,
              color:      INK_MID,
              textAlign:  'center',
            }}>
              {[eventTime, venueName].filter(Boolean).join('  ·  ')}
            </span>
          )}
          {/* Table */}
          {tableNumber != null && (
            <div style={{
              marginTop:     4,
              paddingInline: 18,
              paddingBlock:  6,
              border:        `0.75px solid rgba(154,117,53,0.35)`,
              borderRadius:  24,
              display:       'flex',
              alignItems:    'center',
              gap:           8,
              background:    'rgba(154,117,53,0.06)',
            }}>
              <span style={{ fontFamily:SANS, fontSize:8, letterSpacing:'0.32em', color:GOLD, textTransform:'uppercase', fontWeight:500 }}>
                {t.cardTable}
              </span>
              <span style={{ fontFamily:SERIF, fontSize:22, color:GOLD, fontWeight:600, lineHeight:1 }}>
                {tableNumber}
              </span>
            </div>
          )}
        </div>

        {/* ══ ZONE 5 — QR CODE ══════════════════════════════════════════ */}
        <div style={{
          marginTop:     24,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           10,
          flexShrink:    0,
        }}>
          {/* Frame with corner ornaments */}
          <div style={{
            position: 'relative',
            padding:  3,
            border:   `1px solid rgba(154,117,53,0.40)`,
            background: BG_MID,
          }}>
            {/* Tiny corner dots */}
            {[{t:-3,l:-3},{t:-3,r:-3},{b:-3,r:-3},{b:-3,l:-3}].map((p,i)=>(
              <div key={i} style={{
                position:'absolute',
                top:    't' in p ? p.t : undefined,
                bottom: 'b' in p ? p.b : undefined,
                left:   'l' in p ? p.l : undefined,
                right:  'r' in p ? p.r : undefined,
                width:5, height:5, borderRadius:'50%',
                background: GOLD_HI, opacity:0.65,
              }}/>
            ))}
            <div style={{ padding: 10, background: BG_MID }}>
              <QRCodeSVG value={rsvpUrl} size={84} bgColor={BG_MID} fgColor={INK} level="M"/>
            </div>
          </div>
          {/* Scan label */}
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width:18, height:0.6, background:GOLD, opacity:0.45 }}/>
            <span style={{ fontFamily:SANS, fontSize:8, letterSpacing:'0.32em', color:INK_MID, textTransform:'uppercase' }}>
              {t.cardScanRsvp}
            </span>
            <div style={{ width:18, height:0.6, background:GOLD, opacity:0.45 }}/>
          </div>
        </div>

        {/* ── Year tag ── */}
        <div style={{
          marginTop:     10,
          fontFamily:    SANS,
          fontSize:      9,
          letterSpacing: '0.34em',
          color:         `rgba(30,20,16,0.28)`,
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
