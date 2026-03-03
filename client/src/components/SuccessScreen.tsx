import { useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTranslation } from '../lib/i18n';

// Lightweight canvas confetti fallback — no external dependencies
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

    particles.forEach(p => {
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

  setTimeout(() => { frame = requestAnimationFrame(draw); }, 250);
  setTimeout(() => { cancelAnimationFrame(frame); canvas.remove(); }, 5000);
}

interface Props {
  guestName: string;
  partnerName?: string | null;
  status: 'attending' | 'declined' | 'maybe';
  guestCount: number;
  eventName?: string;
  isUpdate: boolean;
  onUpdateRsvp: () => void;
}

export default function SuccessScreen({
  guestName,
  partnerName,
  status,
  guestCount,
  isUpdate,
  onUpdateRsvp,
}: Props) {
  const t = useTranslation();

  useEffect(() => {
    if (status !== 'attending') return;
    launchConfetti();
  }, [status]);

  const content = {
    attending: {
      icon: '♡',
      headline: t.attendingHeadline,
      sub: t.attendingSub(guestCount),
      iconColor: 'var(--accent-rose)',
    },
    declined: {
      icon: '✦',
      headline: t.declinedHeadline,
      sub: t.declinedSub,
      iconColor: 'var(--text-secondary)',
    },
    maybe: {
      icon: '◎',
      headline: t.maybeHeadline,
      sub: t.maybeSub,
      iconColor: 'var(--accent-gold)',
    },
  }[status] ?? {
    icon: '✓',
    headline: t.defaultHeadline,
    sub: t.defaultSub,
    iconColor: 'var(--accent-gold)',
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="text-center py-8"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="text-5xl mb-6"
        style={{ color: content.iconColor }}
        aria-hidden="true"
      >
        {content.icon}
      </motion.div>

      {/* Confirmation label */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="text-overline mb-3"
        style={{ color: 'var(--accent-gold)' }}
      >
        {isUpdate ? t.rsvpUpdated : t.rsvpConfirmed}
      </motion.p>

      {/* Guest name — the emotional centrepiece; large script creates warmth */}
      <motion.h3
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.6 }}
        style={{
          fontFamily: 'var(--font-display)',
          fontStyle: 'var(--font-display-style)' as 'normal' | 'italic',
          fontSize: 'clamp(4rem, 16vw, 6rem)',
          fontWeight: 400,
          lineHeight: 1.1,
          color: 'var(--text-primary)',
        }}
      >
        {guestName}{partnerName ? ` & ${partnerName}` : ''}
      </motion.h3>

      {/* Divider */}
      <motion.div
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.55, duration: 0.5, ease: 'easeOut' }}
        className="section-line my-3"
        aria-hidden="true"
      />

      {/* Headline */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.6 }}
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

      {/* Sub */}
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7, duration: 0.6 }}
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: '0.82rem',
          lineHeight: 1.7,
          color: 'var(--text-secondary)',
          maxWidth: '28rem',
          margin: '0 auto 2rem',
        }}
      >
        {content.sub}
      </motion.p>

      {/* Update link */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.85 }}
        onClick={onUpdateRsvp}
        style={{
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: '0.72rem',
          fontWeight: 500,
          letterSpacing: '0.08em',
          textDecoration: 'underline',
          textDecorationColor: 'var(--border-warm)',
          textUnderlineOffset: '3px',
          color: 'var(--text-secondary)',
          background: 'none',
          border: 'none',
          padding: 0,
          transition: 'color 0.2s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--accent-gold)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-secondary)')}
        aria-label={t.updateRsvpLink}
      >
        {t.updateRsvpLink}
      </motion.button>
    </motion.div>
  );
}
