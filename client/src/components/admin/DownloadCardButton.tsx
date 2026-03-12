import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { toPng } from 'html-to-image';
import toast from 'react-hot-toast';
import type { AdminGuest, AdminEvent, AdminInvitation } from '../../lib/api';
import InvitationCard from './InvitationCard';
import type { Language } from '../../lib/i18n';

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

export default function DownloadCardButton({ guest, invitation, events, style, className }: DownloadCardButtonProps) {
  const [generating, setGenerating] = useState(false);
  const cardRef    = useRef<HTMLDivElement>(null);
  const triggered  = useRef(false);

  const event = events.find(e => e.id === invitation.eventId);

  const rsvpUrl = `${window.location.origin}/invite/${invitation.token}`;

  const slug = (guest.name.toLowerCase().replace(/\s+/g, '-') ?? 'guest');
  const filename = `invitation-${slug}-${invitation.eventSlug ?? 'event'}.png`;

  const capture = useCallback(async () => {
    if (!cardRef.current || triggered.current) return;
    triggered.current = true;

    try {
      await document.fonts.ready;
      // Let the browser fully paint the off-screen portal before capturing
      await new Promise(r => setTimeout(r, 300));

      if (!cardRef.current) throw new Error('Card element disappeared before capture');

      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 2,
        cacheBust:  true,
        // Ensure html-to-image sees the card even though it's off-screen
        width:  540,
        height: 960,
      });

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

  const language = (invitation.language ?? 'en') as Language;

  return (
    <>
      <button
        onClick={() => setGenerating(true)}
        disabled={generating}
        className={className}
        title="Download invitation card"
        style={{
          display:         'inline-flex',
          alignItems:      'center',
          gap:             5,
          padding:         '4px 10px',
          fontSize:        12,
          fontFamily:      '"DM Sans", system-ui, sans-serif',
          color:           generating ? 'rgba(42,31,26,0.4)' : '#B8924A',
          background:      'transparent',
          border:          '1px solid rgba(184,146,74,0.3)',
          borderRadius:    6,
          cursor:          generating ? 'default' : 'pointer',
          whiteSpace:      'nowrap',
          transition:      'color 0.15s, border-color 0.15s, background 0.15s',
          ...style,
        }}
        onMouseEnter={e => {
          if (!generating) {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(184,146,74,0.08)';
            (e.currentTarget as HTMLButtonElement).style.borderColor      = 'rgba(184,146,74,0.55)';
          }
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
          (e.currentTarget as HTMLButtonElement).style.borderColor      = 'rgba(184,146,74,0.3)';
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

      {generating && createPortal(
        <div
          aria-hidden="true"
          style={{
            position: 'fixed',
            top:      '-9999px',
            left:     '-9999px',
            // No visibility:hidden — html-to-image needs the element painted.
            // Off-screen position keeps it invisible to the user.
          }}
        >
          <div ref={cardRef}>
            <InvitationCard
              guestName={guest.name}
              eventDate={event.date}
              eventTime={event.time}
              venueName={event.venueName}
              eventName={event.name}
              tableNumber={invitation.tableNumber ?? null}
              language={language}
              rsvpUrl={rsvpUrl}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
