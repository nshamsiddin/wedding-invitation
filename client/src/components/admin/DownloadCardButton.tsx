import { useState, useEffect, useRef, useCallback, useContext } from 'react';
import { createPortal } from 'react-dom';
import { useQuery } from '@tanstack/react-query';
import html2canvas from 'html2canvas';
import toast from 'react-hot-toast';
import type { AdminGuest, AdminEvent, AdminInvitation } from '../../lib/api';
import { configApi } from '../../lib/api';
import InvitationCard, { CARD_THEMES } from './InvitationCard';
import type { CardTheme } from './InvitationCard';
import type { Language } from '../../lib/i18n';
import { LanguageContext } from '../../context/LanguageContext';

interface DownloadCardButtonProps {
  guest:      AdminGuest;
  invitation: AdminInvitation;
  events:     AdminEvent[];
  style?:     React.CSSProperties;
  className?: string;
}

function DownloadIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/>
      <line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  );
}

const LANG_LABELS: Record<Language, string> = { en: 'EN', tr: 'TR', uz: 'UZ' };
const LANG_OPTIONS: Language[] = ['en', 'tr', 'uz'];

const THEME_OPTIONS: CardTheme[] = ['parchment', 'noir', 'blush', 'sage'];
const THEME_LABELS: Record<CardTheme, string> = {
  parchment: 'Parchment',
  noir:      'Noir',
  blush:     'Blush',
  sage:      'Sage',
};

export default function DownloadCardButton({ guest, invitation, events, style, className }: DownloadCardButtonProps) {
  const { language: contextLang } = useContext(LanguageContext);
  const [generating, setGenerating]   = useState(false);
  // Initialise from the page-level language (header EN/TR/UZ switcher) so both
  // controls stay in sync. The per-button picker still lets the admin override.
  const [cardLang, setCardLang]       = useState<Language>(contextLang);
  const [cardTheme, setCardTheme]     = useState<CardTheme>('parchment');

  // Keep card language in sync when the admin changes the header language switcher,
  // but only while the user hasn't actively picked a different per-button language.
  useEffect(() => {
    if (!generating) setCardLang(contextLang);
  }, [contextLang, generating]);
  const cardRef    = useRef<HTMLDivElement>(null);
  const triggered  = useRef(false);

  const event = events.find(e => e.id === invitation.eventId);

  // Use the server-configured BASE_URL so QR codes in downloaded cards always
  // point to the canonical production domain, even if the admin opens the
  // dashboard from a staging URL or a different origin.
  const { data: config } = useQuery({
    queryKey: ['config'],
    queryFn: configApi.getConfig,
    staleTime: Infinity,
  });
  const baseUrl = config?.baseUrl || window.location.origin;
  const rsvpUrl = `${baseUrl}/invite/${invitation.token}`;

  const slug = (guest.name.toLowerCase().replace(/\s+/g, '-') ?? 'guest');
  const filename = `invitation-${slug}-${invitation.eventSlug ?? 'event'}-${cardLang}-${cardTheme}.png`;

  const capture = useCallback(async () => {
    if (!cardRef.current || triggered.current) return;
    triggered.current = true;

    try {
      await document.fonts.ready;
      // Let the browser fully paint before capturing
      await new Promise(r => setTimeout(r, 300));

      if (!cardRef.current) throw new Error('Card element disappeared before capture');

      // html2canvas works cross-browser (including Firefox) unlike html-to-image
      // which crashes on Firefox due to getComputedStyle() returning undefined for
      // some CSS property values.
      const canvas = await html2canvas(cardRef.current, {
        scale:       2,
        useCORS:     true,
        allowTaint:  false,
        logging:     false,
        width:       540,
        height:      960,
        // Element is positioned at top:0/left:0 behind all content (z-index:-9999)
        // so we capture starting from (0,0)
        x:           0,
        y:           0,
      });

      const dataUrl = canvas.toDataURL('image/png');

      const a = document.createElement('a');
      a.download = filename;
      a.href     = dataUrl;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      console.error('[DownloadCard] Failed to generate card:', err);
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Card error: ${msg}`, { duration: 8000 });
    } finally {
      setGenerating(false);
      triggered.current = false;
    }
  }, [filename]);

  useEffect(() => {
    if (!generating) return;
    const timer = setTimeout(capture, 80);
    return () => clearTimeout(timer);
  }, [generating, capture]);

  if (!event) return null;

  const btnBase: React.CSSProperties = {
    display:    'inline-flex',
    alignItems: 'center',
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize:   12,
    background: 'transparent',
    cursor:     'pointer',
    transition: 'color 0.15s, border-color 0.15s, background 0.15s',
    whiteSpace: 'nowrap',
  };

  const divider = (
    <div style={{ width: 1, alignSelf: 'stretch', background: 'rgba(184,146,74,0.3)' }} />
  );

  return (
    <>
      {/* Grouped control: theme swatches | language tabs | download button */}
      <div
        className={className}
        style={{
          display:      'inline-flex',
          alignItems:   'center',
          border:       '1px solid rgba(184,146,74,0.3)',
          borderRadius: 6,
          overflow:     'hidden',
          ...style,
        }}
      >
        {/* Theme swatches */}
        {THEME_OPTIONS.map(th => {
          const bgColor = CARD_THEMES[th].bg;
          const isActive = cardTheme === th;
          return (
            <button
              key={th}
              disabled={generating}
              onClick={() => setCardTheme(th)}
              title={THEME_LABELS[th]}
              style={{
                ...btnBase,
                padding:     '5px 6px',
                borderRadius: 0,
                cursor:       generating ? 'default' : 'pointer',
                background:   isActive ? 'rgba(184,146,74,0.08)' : 'transparent',
                borderRight:  'none',
              }}
            >
              <span style={{
                display:      'block',
                width:        13,
                height:       13,
                borderRadius: 3,
                background:   bgColor,
                border:       isActive
                  ? '2px solid #B8924A'
                  : '1px solid rgba(184,146,74,0.45)',
                flexShrink:   0,
              }}/>
            </button>
          );
        })}

        {divider}

        {/* Language picker tabs */}
        {LANG_OPTIONS.map(lang => (
          <button
            key={lang}
            disabled={generating}
            onClick={() => setCardLang(lang)}
            title={`Generate card in ${LANG_LABELS[lang]}`}
            style={{
              ...btnBase,
              padding:     '4px 7px',
              color:       cardLang === lang ? '#B8924A' : 'rgba(42,31,26,0.35)',
              fontWeight:  cardLang === lang ? 600 : 400,
              background:  cardLang === lang ? 'rgba(184,146,74,0.08)' : 'transparent',
              borderRight: 'none',
              borderRadius: 0,
              cursor:      generating ? 'default' : 'pointer',
            }}
          >
            {LANG_LABELS[lang]}
          </button>
        ))}

        {divider}

        {/* Download button */}
        <button
          onClick={() => setGenerating(true)}
          disabled={generating}
          title="Download invitation card"
          style={{
            ...btnBase,
            gap:          5,
            padding:      '4px 10px',
            color:        generating ? 'rgba(42,31,26,0.4)' : '#B8924A',
            cursor:       generating ? 'default' : 'pointer',
            borderRadius: 0,
          }}
          onMouseEnter={e => {
            if (!generating) (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(184,146,74,0.08)';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          }}
        >
          {generating ? (
            <>
              <span style={{ fontSize: 11 }}>⟳</span>
              <span>Generating…</span>
            </>
          ) : (
            <>
              <DownloadIcon />
              <span>Card</span>
            </>
          )}
        </button>
      </div>

      {generating && createPortal(
        <div
          aria-hidden="true"
          style={{
            position:      'fixed',
            top:           0,
            left:          0,
            zIndex:        -9999,
            pointerEvents: 'none',
          }}
        >
          <div ref={cardRef}>
            {/* key forces a full remount whenever language or theme changes so
                html2canvas always captures a freshly-rendered card */}
            <InvitationCard
              key={`${cardLang}-${cardTheme}`}
              guestName={guest.name}
              eventDate={event.date}
              eventTime={event.time}
              venueName={event.venueName}
              eventName={event.name}
              tableNumber={invitation.tableNumber ?? null}
              language={cardLang}
              theme={cardTheme}
              rsvpUrl={rsvpUrl}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
