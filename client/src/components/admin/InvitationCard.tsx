import { forwardRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import type { Language } from '../../lib/i18n';
import { en, tr, uz } from '../../lib/i18n';

const T = { en, tr, uz };

// ─── Palette — warm European stationery ──────────────────────────────────────
const BG        = '#F6EFE2';   // warm beige paper
const BG_PANEL  = '#F0E8D5';   // slightly deeper for event box
const INK       = '#2A1F14';   // dark warm brown — primary text
const INK_GREY  = 'rgba(42,31,20,0.50)'; // supporting text
const GOLD      = '#B8924A';   // gold accents
const GOLD_RULE = 'rgba(184,146,74,0.40)'; // rules / borders
const PINK      = '#D4A0A7';   // pastel pink florals
const PINK_LT   = '#EAC5C9';   // lighter petals
const STEM      = '#8FAB90';   // muted sage stems & leaves

// ─── Fonts ────────────────────────────────────────────────────────────────────
// Playfair Display: the Didot/Canela editorial serif the art direction calls for
const PLAYFAIR  = '"Playfair Display", "Cormorant Garamond", Georgia, serif';
// Cormorant italic: used ONLY for the "&" refined script accent
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

// ─── Delicate top botanical garland ───────────────────────────────────────────
// Art direction: "minimal and airy, pastel pink flowers with muted green stems,
// gentle framing without overpowering the typography"
// 7 evenly-spaced flowers on a gentle horizontal arc — nothing denser.
function TopGarland() {
  // Flower positions along a gentle curve across 460px width
  const flowers = [
    { x: 28,  y: 62, stemH: 24, scale: 0.75 },
    { x: 96,  y: 50, stemH: 30, scale: 0.90 },
    { x: 166, y: 42, stemH: 36, scale: 1.00 },
    { x: 230, y: 38, stemH: 40, scale: 1.10 },  // centre — tallest
    { x: 294, y: 42, stemH: 36, scale: 1.00 },
    { x: 364, y: 50, stemH: 30, scale: 0.90 },
    { x: 432, y: 62, stemH: 24, scale: 0.75 },
  ];

  // Leaf positions — small pairs on the main branch
  const leaves = [
    { x: 62,  y: 58, angle: -35 },
    { x: 130, y: 48, angle: -28 },
    { x: 196, y: 42, angle: -22 },
    { x: 268, y: 42, angle:  22 },
    { x: 330, y: 48, angle:  28 },
    { x: 398, y: 58, angle:  35 },
  ];

  return (
    <svg width="460" height="80" viewBox="0 0 460 80" fill="none" aria-hidden="true">
      {/* ── Main horizontal branch (gentle arc) ── */}
      <path
        d="M20 66 C80 56 150 46 230 40 C310 46 380 56 440 66"
        stroke={STEM} strokeWidth="1.0" strokeLinecap="round" opacity="0.65"
      />

      {/* ── Vertical flower stems ── */}
      {flowers.map((f, i) => (
        <line key={i}
          x1={f.x} y1={f.y + 6}
          x2={f.x} y2={f.y + f.stemH}
          stroke={STEM} strokeWidth="0.85" strokeLinecap="round" opacity="0.60"
        />
      ))}

      {/* ── Small leaves on the main branch ── */}
      {leaves.map((l, i) => (
        <ellipse key={i}
          cx={l.x} cy={l.y}
          rx="7" ry="3"
          fill={STEM} opacity="0.45"
          transform={`rotate(${l.angle} ${l.x} ${l.y})`}
        />
      ))}

      {/* ── Flowers — 5-petal daisy style ── */}
      {flowers.map((f, i) => {
        const r  = 5.5 * f.scale;   // petal radius
        const cr = 7   * f.scale;   // petal dist from centre
        const cc = 3   * f.scale;   // centre circle
        const angles = [0, 72, 144, 216, 288];
        return (
          <g key={i}>
            {/* 5 petals */}
            {angles.map((a, j) => {
              const rad = (a * Math.PI) / 180;
              return (
                <ellipse key={j}
                  cx={f.x + cr * Math.sin(rad)}
                  cy={f.y - cr * Math.cos(rad)}
                  rx={r * 0.6} ry={r}
                  fill={j === 0 ? PINK : PINK_LT}
                  opacity="0.82"
                  transform={`rotate(${a} ${f.x + cr * Math.sin(rad)} ${f.y - cr * Math.cos(rad)})`}
                />
              );
            })}
            {/* Gold centre */}
            <circle cx={f.x} cy={f.y} r={cc} fill={GOLD} opacity="0.80"/>
            <circle cx={f.x} cy={f.y} r={cc * 0.45} fill={BG} opacity="0.9"/>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Small bottom botanical mirror ───────────────────────────────────────────
// Simpler — 3 flowers only, same language
function BottomGarland() {
  const flowers = [
    { x: 90,  y: 22, stemH: 22, scale: 0.85 },
    { x: 160, y: 16, stemH: 28, scale: 1.00 },
    { x: 230, y: 13, stemH: 30, scale: 1.10 },
    { x: 300, y: 16, stemH: 28, scale: 1.00 },
    { x: 370, y: 22, stemH: 22, scale: 0.85 },
  ];

  return (
    <svg width="460" height="60" viewBox="0 0 460 60" fill="none" aria-hidden="true">
      {/* Branch */}
      <path
        d="M70 40 C130 34 180 26 230 22 C280 26 330 34 390 40"
        stroke={STEM} strokeWidth="0.9" strokeLinecap="round" opacity="0.55"
      />
      {/* Stems */}
      {flowers.map((f, i) => (
        <line key={i}
          x1={f.x} y1={f.y + 4}
          x2={f.x} y2={f.y + f.stemH}
          stroke={STEM} strokeWidth="0.8" strokeLinecap="round" opacity="0.55"
        />
      ))}
      {/* Flowers */}
      {flowers.map((f, i) => {
        const r = 4.5 * f.scale;
        const cr = 6  * f.scale;
        const cc = 2.5 * f.scale;
        return (
          <g key={i}>
            {[0,72,144,216,288].map((a, j) => {
              const rad = (a * Math.PI) / 180;
              return (
                <ellipse key={j}
                  cx={f.x + cr * Math.sin(rad)}
                  cy={f.y - cr * Math.cos(rad)}
                  rx={r * 0.6} ry={r}
                  fill={j === 0 ? PINK : PINK_LT}
                  opacity="0.78"
                  transform={`rotate(${a} ${f.x + cr * Math.sin(rad)} ${f.y - cr * Math.cos(rad)})`}
                />
              );
            })}
            <circle cx={f.x} cy={f.y} r={cc}        fill={GOLD} opacity="0.78"/>
            <circle cx={f.x} cy={f.y} r={cc * 0.4}  fill={BG}   opacity="0.9"/>
          </g>
        );
      })}
    </svg>
  );
}

// ─── Gold geometric ornament ──────────────────────────────────────────────────
function GoldDiamond({ size = 8 }: { size?: number }) {
  return (
    <svg width={size * 2.4} height={size * 2.4} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M12 2 L18 12 L12 22 L6 12 Z" fill={GOLD} opacity="0.45"/>
      <path d="M12 7 L15 12 L12 17 L9 12 Z" fill={GOLD} opacity="0.60"/>
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
          background:    BG,
          fontFamily:    PLAYFAIR,
        }}
      >
        {/* ── Thin gold border frame ── */}
        <div style={{
          position:      'absolute',
          inset:         16,
          border:        `0.75px solid ${GOLD_RULE}`,
          pointerEvents: 'none',
        }}/>

        {/* ══ SECTION 1 — TOP FLORAL ══════════════════════════════════ */}
        <div style={{ marginTop: 38, flexShrink: 0 }}>
          <TopGarland />
        </div>

        {/* ── "Wedding Invitation" header label ── */}
        <div style={{
          marginTop:  10,
          display:    'flex',
          alignItems: 'center',
          gap:        10,
          flexShrink: 0,
        }}>
          <div style={{ width: 36, height: 0.6, background: GOLD, opacity: 0.38 }}/>
          <span style={{
            fontFamily:    SANS,
            fontSize:      8.5,
            fontWeight:    500,
            letterSpacing: '0.42em',
            color:         GOLD,
            textTransform: 'uppercase',
          }}>
            Wedding Invitation
          </span>
          <div style={{ width: 36, height: 0.6, background: GOLD, opacity: 0.38 }}/>
        </div>

        {/* ══ SECTION 2 — NAMES (HERO) ════════════════════════════════ */}
        {/* Generous spacing above — the names are the primary visual focus */}
        <div style={{
          marginTop:     28,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          flexShrink:    0,
          gap:           0,
        }}>
          {/* Name 1 — Playfair Display, weight 600, non-italic: editorial/Didot feel */}
          <span style={{
            fontFamily:    PLAYFAIR,
            fontWeight:    600,
            fontStyle:     'normal',
            fontSize:      88,
            color:         INK,
            lineHeight:    0.92,
            letterSpacing: '-0.01em',
          }}>
            Berfin
          </span>

          {/* "&" — Cormorant Garamond italic: the ONLY script accent, per art direction */}
          <span style={{
            fontFamily:    CORMORANT,
            fontWeight:    400,
            fontStyle:     'italic',
            fontSize:      52,
            color:         GOLD,
            lineHeight:    1.05,
            letterSpacing: '0.06em',
          }}>
            &amp;
          </span>

          {/* Name 2 */}
          <span style={{
            fontFamily:    PLAYFAIR,
            fontWeight:    600,
            fontStyle:     'normal',
            fontSize:      88,
            color:         INK,
            lineHeight:    0.92,
            letterSpacing: '-0.01em',
          }}>
            Shamsiddin
          </span>
        </div>

        {/* ── Gold rule with geometric diamond ornament ── */}
        <div style={{
          marginTop:  26,
          display:    'flex',
          alignItems: 'center',
          gap:        10,
          flexShrink: 0,
        }}>
          <div style={{ width: 100, height: 0.6, background: GOLD, opacity: 0.38 }}/>
          <GoldDiamond size={7} />
          <div style={{ width: 100, height: 0.6, background: GOLD, opacity: 0.38 }}/>
        </div>

        {/* ══ SECTION 3 — GUEST INVITATION ════════════════════════════ */}
        <div style={{
          marginTop:     22,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           9,
          flexShrink:    0,
          paddingInline: 64,
        }}>
          {/* Understated grey italic — art direction: "understated grey typography" */}
          <span style={{
            fontFamily: PLAYFAIR,
            fontStyle:  'italic',
            fontWeight: 400,
            fontSize:   18,
            color:      INK_GREY,
            textAlign:  'center',
            lineHeight: 1.5,
          }}>
            {t.cardWeInviteYou}
          </span>

          {/* Guest name — "centered and slightly larger than body text" */}
          <span style={{
            fontFamily:    PLAYFAIR,
            fontWeight:    500,
            fontStyle:     'normal',
            fontSize:      26,
            color:         INK,
            textAlign:     'center',
            letterSpacing: '0.02em',
          }}>
            {guestName}
          </span>
        </div>

        {/* ── Thin separator line ── */}
        <div style={{
          marginTop: 22,
          width:     180,
          height:    0.6,
          background: GOLD,
          opacity:   0.30,
          flexShrink: 0,
        }}/>

        {/* ══ SECTION 4 — EVENT DETAILS ════════════════════════════════ */}
        {/* "Inside a soft rectangular container with subtle beige tint" */}
        <div style={{
          marginTop:     20,
          width:         460,
          flexShrink:    0,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           8,
          padding:       '18px 28px',
          background:    BG_PANEL,
          border:        `0.75px solid ${GOLD_RULE}`,
        }}>
          {/* Event label */}
          {eventName && (
            <span style={{
              fontFamily:    SANS,
              fontSize:      8,
              fontWeight:    500,
              letterSpacing: '0.38em',
              color:         PINK,
              textTransform: 'uppercase',
              opacity:       0.9,
            }}>
              {eventName}
            </span>
          )}

          {/* Short gold rule inside panel */}
          <div style={{ width: 24, height: 0.5, background: GOLD, opacity: 0.35 }}/>

          {/* Date — prominent */}
          <span style={{
            fontFamily:    PLAYFAIR,
            fontWeight:    600,
            fontSize:      22,
            color:         INK,
            letterSpacing: '0.01em',
          }}>
            {formattedDate}
          </span>

          {/* Time · Venue */}
          {(eventTime || venueName) && (
            <span style={{
              fontFamily: PLAYFAIR,
              fontStyle:  'italic',
              fontWeight: 400,
              fontSize:   16.5,
              color:      INK_GREY,
              textAlign:  'center',
            }}>
              {[eventTime, venueName].filter(Boolean).join('  ·  ')}
            </span>
          )}

          {/* Table badge */}
          {tableNumber != null && (
            <div style={{
              marginTop:     4,
              paddingInline: 18,
              paddingBlock:  6,
              border:        `0.75px solid ${GOLD_RULE}`,
              borderRadius:  20,
              display:       'flex',
              alignItems:    'center',
              gap:           8,
              background:    'rgba(184,146,74,0.06)',
            }}>
              <span style={{ fontFamily:SANS, fontSize:7.5, letterSpacing:'0.34em', color:GOLD, textTransform:'uppercase', fontWeight:500 }}>
                {t.cardTable}
              </span>
              <span style={{ fontFamily:PLAYFAIR, fontSize:20, color:GOLD, fontWeight:600, lineHeight:1 }}>
                {tableNumber}
              </span>
            </div>
          )}
        </div>

        {/* ══ SECTION 5 — QR CODE ══════════════════════════════════════ */}
        {/* "Reduce visual weight with thinner frame" — art direction */}
        <div style={{
          marginTop:     26,
          display:       'flex',
          flexDirection: 'column',
          alignItems:    'center',
          gap:           11,
          flexShrink:    0,
        }}>
          {/* Thin single-line frame — NOT the heavy previous version */}
          <div style={{
            padding:    8,
            border:     `0.75px solid ${GOLD_RULE}`,
            background: BG,
          }}>
            <QRCodeSVG
              value={rsvpUrl}
              size={84}
              bgColor={BG}
              fgColor={INK}
              level="M"
            />
          </div>

          {/* "Scan to RSVP" caption */}
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <div style={{ width: 22, height: 0.6, background: GOLD, opacity: 0.35 }}/>
            <span style={{
              fontFamily:    SANS,
              fontSize:      8,
              fontWeight:    400,
              letterSpacing: '0.34em',
              color:         INK_GREY,
              textTransform: 'uppercase',
            }}>
              {t.cardScanRsvp}
            </span>
            <div style={{ width: 22, height: 0.6, background: GOLD, opacity: 0.35 }}/>
          </div>
        </div>

        {/* ── Year ── */}
        <div style={{
          marginTop:     10,
          fontFamily:    SANS,
          fontWeight:    400,
          fontSize:      8.5,
          letterSpacing: '0.34em',
          color:         'rgba(42,31,20,0.25)',
          textTransform: 'uppercase',
          flexShrink:    0,
        }}>
          · 2026 ·
        </div>

        {/* ══ SECTION 6 — BOTTOM FLORAL ═══════════════════════════════ */}
        <div style={{ marginTop: 14, flexShrink: 0, paddingBottom: 36 }}>
          <BottomGarland />
        </div>
      </div>
    );
  }
);

InvitationCard.displayName = 'InvitationCard';
export default InvitationCard;
