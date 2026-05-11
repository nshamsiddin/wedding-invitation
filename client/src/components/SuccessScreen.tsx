import { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { useTranslation } from '../lib/i18n';

// Lightweight canvas confetti fallback — no external dependencies.
// Skipped entirely when the user prefers reduced motion or when the
// caller passes `skip: true` (typically on revisits).
function launchConfetti() {
  if (typeof window === 'undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9990;';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d')!;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;

  const colors = ['#C4975A', '#C9808A', '#E8D0A0', '#F5EDD7', '#D4A870', '#FFFFFF'];
  const particles = Array.from({ length: 80 }, () => ({
    x: Math.random() * canvas.width,
    y: canvas.height * (0.3 + Math.random() * 0.5),
    vx: (Math.random() - 0.5) * 6,
    vy: -(Math.random() * 8 + 4),
    color: colors[Math.floor(Math.random() * colors.length)],
    size: Math.random() * 6 + 3,
    angle: Math.random() * Math.PI * 2,
    spin: (Math.random() - 0.5) * 0.2,
    gravity: 0.15,
    opacity: 1,
  }));

  let frame: number;
  let tick = 0;

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    tick++;

    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.angle += p.spin;
      p.opacity -= 0.008;

      if (p.opacity <= 0) return;

      ctx.save();
      ctx.globalAlpha = Math.max(0, p.opacity);
      ctx.translate(p.x, p.y);
      ctx.rotate(p.angle);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.5);
      ctx.restore();
    });

    if (tick < 200) {
      frame = requestAnimationFrame(draw);
    } else {
      canvas.remove();
    }
  }

  setTimeout(() => {
    frame = requestAnimationFrame(draw);
  }, 250);
  setTimeout(() => {
    cancelAnimationFrame(frame);
    canvas.remove();
  }, 5000);
}

interface Props {
  guestName: string;
  partnerName?: string | null;
  /**
   * Guest-facing status is intentionally narrowed to attending/declined.
   * Legacy `maybe` values stored from earlier UI versions fall through to
   * the default copy rather than throwing.
   */
  status: 'attending' | 'declined' | string;
  guestCount: number;
  eventName?: string;
  isUpdate: boolean;
  /** Pre-built Google Calendar URL — shown only when attending */
  calendarUrl?: string;
  /** Pre-built .ics blob URL — shown only when attending */
  icsUrl?: string;
  /** Assigned table number — shown as a small pill when attending and provided */
  tableNumber?: number | null;
  /** Sharable URL of the current invite/page; enables the "Share invitation" CTA */
  shareUrl?: string;
  /** Couple/event name used in the share text */
  shareCoupleName?: string;
  /** Suppress confetti (e.g. revisits, declined responses) */
  suppressConfetti?: boolean;
  onUpdateRsvp: () => void;
}

export default function SuccessScreen({
  guestName,
  partnerName,
  status,
  guestCount,
  isUpdate,
  calendarUrl,
  icsUrl,
  tableNumber,
  shareUrl,
  shareCoupleName,
  suppressConfetti,
  onUpdateRsvp,
}: Props) {
  const t = useTranslation();
  const reduceMotion = useReducedMotion();
  const [shareState, setShareState] = useState<'idle' | 'copied'>('idle');
  const shareResetTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Confetti: only when newly attending, not an update, not suppressed, and
  // not within the same session for the same status (revisits should feel
  // calm, not festive every time).
  useEffect(() => {
    if (status !== 'attending') return;
    if (suppressConfetti) return;
    if (isUpdate) return;
    try {
      const key = 'rsvp-confetti-shown';
      if (sessionStorage.getItem(key) === '1') return;
      sessionStorage.setItem(key, '1');
    } catch {
      // sessionStorage unavailable (private mode) — still ok to fire
    }
    launchConfetti();
  }, [status, isUpdate, suppressConfetti]);

  // Cleanup share-toast timer on unmount.
  useEffect(() => {
    return () => {
      if (shareResetTimer.current) clearTimeout(shareResetTimer.current);
    };
  }, []);

  const content = status === 'attending'
    ? {
        icon: '♡',
        headline: t.attendingHeadline,
        sub: t.attendingSub(guestCount),
        iconColor: 'var(--accent-rose)',
      }
    : status === 'declined'
      ? {
          icon: '✦',
          headline: t.declinedHeadline,
          sub: t.declinedSub,
          iconColor: 'var(--text-secondary)',
        }
      : {
          icon: '✓',
          headline: t.defaultHeadline,
          sub: t.defaultSub,
          iconColor: 'var(--accent-gold)',
        };

  const handleShare = async () => {
    if (!shareUrl) return;
    const shareText = shareCoupleName ? t.shareText(shareCoupleName) : t.shareText('');
    const sharePayload = { title: t.shareTitle, text: shareText, url: shareUrl };

    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share(sharePayload);
        return;
      }
    } catch {
      // User cancelled the share sheet — fall through to clipboard fallback.
    }

    try {
      await navigator.clipboard?.writeText?.(shareUrl);
      setShareState('copied');
      if (shareResetTimer.current) clearTimeout(shareResetTimer.current);
      shareResetTimer.current = setTimeout(() => setShareState('idle'), 2500);
    } catch {
      // Clipboard blocked — silently no-op rather than annoying the user.
    }
  };

  // Animation choreography — capped at ≤500ms total, respects reduced motion.
  const t0 = reduceMotion ? 0 : 0;
  const t1 = reduceMotion ? 0 : 0.08;
  const t2 = reduceMotion ? 0 : 0.16;
  const t3 = reduceMotion ? 0 : 0.24;
  const t4 = reduceMotion ? 0 : 0.32;
  const t5 = reduceMotion ? 0 : 0.4;

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: reduceMotion ? 0 : 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="text-center py-8"
    >
      <motion.div
        initial={reduceMotion ? false : { scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: t0, type: 'spring', stiffness: 220, damping: 16, mass: 0.5 }}
        className="text-5xl mb-6"
        style={{ color: content.iconColor }}
        aria-hidden="true"
      >
        {content.icon}
      </motion.div>

      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: t1, duration: 0.3 }}
        className="text-overline mb-3"
        style={{ color: 'var(--accent-gold)' }}
      >
        {isUpdate ? t.rsvpUpdated : t.rsvpConfirmed}
      </motion.p>

      <motion.h3
        initial={reduceMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: t2, duration: 0.4 }}
        style={{
          fontFamily: '"Cormorant Garamond", Georgia, serif',
          fontStyle: 'italic',
          // Cap on small phones to prevent overflow for compound names.
          fontSize: 'clamp(2.6rem, 12vw, 5.5rem)',
          fontWeight: 400,
          lineHeight: 1.1,
          color: 'var(--text-primary)',
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
          padding: '0 0.5rem',
        }}
      >
        {guestName}{partnerName ? ` & ${partnerName}` : ''}
      </motion.h3>

      <motion.div
        initial={reduceMotion ? false : { scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: t3, duration: 0.3, ease: 'easeOut' }}
        className="section-line my-3"
        aria-hidden="true"
      />

      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: t3, duration: 0.35 }}
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: 'clamp(1rem, 3vw, 1.2rem)',
          fontWeight: 500,
          color: 'var(--text-primary)',
          marginBottom: '0.5rem',
        }}
      >
        {content.headline}
      </motion.p>

      <motion.p
        initial={reduceMotion ? false : { opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: t4, duration: 0.35 }}
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: '0.82rem',
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
          maxWidth: '28rem',
          margin: status === 'attending' && tableNumber != null ? '0 auto 1.25rem' : '0 auto 2rem',
        }}
      >
        {content.sub}
      </motion.p>

      {/* Table pill — only when attending and pre-assigned. */}
      {status === 'attending' && tableNumber != null && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: t4, duration: 0.35 }}
          style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'center' }}
        >
          <span
            className="success-table-pill"
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
            <span
              style={{
                fontSize: '0.62rem',
                letterSpacing: '0.22em',
                textTransform: 'uppercase',
                color: 'var(--accent-gold)',
                fontWeight: 600,
              }}
            >
              {t.yourTableLabel}
            </span>
            <span
              style={{
                fontFamily: 'var(--font-digits, "DM Sans"), system-ui, sans-serif',
                fontSize: '1.1rem',
                fontWeight: 600,
                color: 'var(--text-primary)',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {tableNumber}
            </span>
          </span>
        </motion.div>
      )}

      {/* Calendar CTAs — only when attending and calendar links are available. */}
      {status === 'attending' && (calendarUrl || icsUrl) && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: t5, duration: 0.35 }}
          style={{
            marginBottom: '0.75rem',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.5rem',
            justifyContent: 'center',
          }}
        >
          {icsUrl && (
            <a
              href={icsUrl}
              download="invitation.ics"
              className="success-pill"
              aria-label={t.addToAppleCalendar}
            >
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
            <a
              href={calendarUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="success-pill"
              aria-label={t.addToGoogleCalendar}
            >
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

      {/* Share with partner / family — appears whenever a shareUrl is provided. */}
      {shareUrl && status === 'attending' && (
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: t5, duration: 0.35 }}
          style={{ marginBottom: '0.75rem', display: 'flex', justifyContent: 'center' }}
        >
          <button
            type="button"
            onClick={handleShare}
            className="success-pill success-pill--ghost"
            aria-label={t.shareInvitation}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="18" cy="5" r="3" />
              <circle cx="6" cy="12" r="3" />
              <circle cx="18" cy="19" r="3" />
              <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
              <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
            </svg>
            {shareState === 'copied' ? t.shareCopied : t.shareInvitation}
          </button>
        </motion.div>
      )}

      {/* Update RSVP — ghost pill, accessible focus + hover via CSS. */}
      <motion.button
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: t5 + 0.1 }}
        onClick={onUpdateRsvp}
        className="success-pill success-pill--ghost"
        aria-label={t.updateRsvpLink}
      >
        {t.updateRsvpLink}
      </motion.button>
    </motion.div>
  );
}
