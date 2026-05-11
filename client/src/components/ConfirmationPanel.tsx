import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from '../lib/i18n';

interface Props {
  guestName: string;
  partnerName?: string | null;
  guestCount: number;
  tableNumber?: number | null;
  calendarUrl?: string;
  icsUrl?: string;
  shareUrl?: string;
  shareCoupleName?: string;
  onUpdateRsvp: () => void;
}

/**
 * Slide content for guests whose RSVP was pre-confirmed by the admin
 * (`invitation.status === 'attending'`). Replaces the previous flow that
 * dropped these guests on the "Kindly reply" RSVP slide with the standard
 * SuccessScreen rendered inside it — the header still said "Kindly reply",
 * which conflicted with their status.
 *
 * The panel reframes the slide as a confirmation:
 *   - Headline + supporting copy explicitly say "your seat is reserved"
 *   - Table assignment surfaced as a gold pill (operational essential)
 *   - Calendar export (Apple + Google) elevated to primary affordances
 *   - "Update RSVP" remains as a tertiary ghost button
 */
export default function ConfirmationPanel({
  guestName,
  partnerName,
  tableNumber,
  calendarUrl,
  icsUrl,
  shareUrl,
  shareCoupleName,
  onUpdateRsvp,
}: Props) {
  const t = useTranslation();
  const reduce = useReducedMotion();

  const handleShare = async () => {
    if (!shareUrl) return;
    const text = shareCoupleName ? t.shareText(shareCoupleName) : t.shareText('');
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ title: t.shareTitle, text, url: shareUrl });
        return;
      }
    } catch { /* user cancelled */ }
    try { await navigator.clipboard?.writeText?.(shareUrl); } catch { /* blocked */ }
  };

  const stagger = (delay: number) => ({
    initial: reduce ? false : { opacity: 0, y: 8 },
    animate: { opacity: 1, y: 0 },
    transition: { delay: reduce ? 0 : delay, duration: reduce ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] as const },
  });

  const displayName = partnerName ? `${guestName} & ${partnerName}` : guestName;

  return (
    <div className="text-center" style={{ padding: '1.5rem 0 0.5rem' }}>
      {/* Overline */}
      <motion.p
        {...stagger(0)}
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: '0.7rem',
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'var(--accent-gold)',
          fontWeight: 600,
          marginBottom: '0.5rem',
        }}
      >
        {t.preConfirmedOverline}
      </motion.p>

      {/* Name */}
      <motion.h2
        {...stagger(0.06)}
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontStyle: 'italic',
          fontSize: 'clamp(2.4rem, 10vw, 4.5rem)',
          fontWeight: 400,
          lineHeight: 1.1,
          color: 'var(--text-primary)',
          margin: '0 0 0.75rem',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          padding: '0 0.5rem',
        }}
      >
        {displayName}
      </motion.h2>

      {/* Headline + sub */}
      <motion.p
        {...stagger(0.14)}
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 'clamp(1rem, 3vw, 1.15rem)',
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
        }}
      >
        {t.preConfirmedHeadline}
      </motion.p>
      <motion.p
        {...stagger(0.2)}
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: '0.82rem',
          lineHeight: 1.65,
          color: 'var(--text-secondary)',
          maxWidth: '30rem',
          margin: '0 auto 1.25rem',
        }}
      >
        {t.preConfirmedSub}
      </motion.p>

      {/* Table pill */}
      {tableNumber != null && (
        <motion.div
          {...stagger(0.26)}
          style={{ marginBottom: '1.25rem', display: 'flex', justifyContent: 'center' }}
        >
          <span
            aria-label={`${t.yourTableLabel} ${tableNumber}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.55rem',
              padding: '0.5rem 1rem',
              borderRadius: '999px',
              border: '1px solid var(--accent-gold)',
              background: 'rgba(184,146,74,0.10)',
              fontFamily: '"DM Sans", system-ui, sans-serif',
            }}
          >
            <span style={{ fontSize: '0.62rem', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--accent-gold)', fontWeight: 600 }}>
              {t.yourTableLabel}
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
              {tableNumber}
            </span>
          </span>
        </motion.div>
      )}

      {/* Calendar CTAs */}
      {(icsUrl || calendarUrl) && (
        <motion.div
          {...stagger(0.32)}
          style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '0.75rem' }}
        >
          {icsUrl && (
            <a href={icsUrl} download="invitation.ics" className="success-pill" aria-label={t.addToAppleCalendar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              {t.addToAppleCalendar}
            </a>
          )}
          {calendarUrl && (
            <a href={calendarUrl} target="_blank" rel="noopener noreferrer" className="success-pill" aria-label={t.addToGoogleCalendar}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
                <line x1="12" y1="14" x2="12" y2="18" />
                <line x1="10" y1="16" x2="14" y2="16" />
              </svg>
              {t.addToGoogleCalendar}
            </a>
          )}
        </motion.div>
      )}

      {/* Share with partner */}
      {shareUrl && (
        <motion.div {...stagger(0.36)} style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.75rem' }}>
          <button type="button" onClick={handleShare} className="success-pill success-pill--ghost" aria-label={t.shareInvitation}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            {t.shareInvitation}
          </button>
        </motion.div>
      )}

      {/* Update RSVP */}
      <motion.button
        {...stagger(0.42)}
        type="button"
        onClick={onUpdateRsvp}
        className="success-pill success-pill--ghost"
      >
        {t.updateRsvpLink}
      </motion.button>
    </div>
  );
}
