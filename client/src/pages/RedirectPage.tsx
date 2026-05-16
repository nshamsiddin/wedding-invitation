import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../lib/i18n';
import LanguageSwitcher from '../components/LanguageSwitcher';

/* ──────────────────────────────────────────────────────────────────────────
 * Configuration
 * ──────────────────────────────────────────────────────────────────────────
 * REDIRECT_URL: paste the photographer's archive URL here once it is ready.
 *   - When non-empty, this page immediately forwards guests to that URL.
 *   - When empty, the elegant "coming soon" view below is rendered instead.
 * ACTIVATION_DATE: only used for the human-readable date label and the
 *   countdown on the coming-soon view.
 * Must be an absolute https URL to avoid open-redirect / mixed-content
 * surprises; relative paths and javascript: URIs are rejected at runtime.
 */
const REDIRECT_URL = '';
const ACTIVATION_DATE = '2026-05-20T12:00:00+05:00';

function isSafeHttpsUrl(value: string): boolean {
  if (!value) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
}

function calculateTimeLeft(target: string): TimeLeft {
  const diff = new Date(target).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0 };
  return {
    days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours:   Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / (1000 * 60)) % 60),
  };
}

function isZero(t: TimeLeft) {
  return t.days === 0 && t.hours === 0 && t.minutes === 0;
}

export default function RedirectPage() {
  const tl = useTranslation();
  const redirectActive = isSafeHttpsUrl(REDIRECT_URL);
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft(ACTIVATION_DATE));

  // When the photographer archive URL has been configured, forward guests
  // immediately. Uses replace() so the back button still lands on the page
  // that linked them here (or the homepage), not on this transient stub.
  useEffect(() => {
    if (redirectActive) {
      window.location.replace(REDIRECT_URL);
    }
  }, [redirectActive]);

  // Tick the countdown once a minute (no need for seconds at this scale).
  useEffect(() => {
    if (redirectActive) return;
    const id = window.setInterval(
      () => setTimeLeft(calculateTimeLeft(ACTIVATION_DATE)),
      60_000,
    );
    return () => window.clearInterval(id);
  }, [redirectActive]);

  if (redirectActive) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.spinner} role="status" aria-label={tl.albumRedirecting} />
          <p style={{ ...styles.body, marginTop: '1.25rem', marginBottom: 0 }}>
            {tl.albumRedirecting}
          </p>
        </div>
      </div>
    );
  }

  const ready = isZero(timeLeft);

  return (
    <div style={styles.page}>
      <header style={styles.nav}>
        <Link to="/" style={{ ...styles.link, textDecoration: 'none' }}>
          ← {tl.returnToHomepage}
        </Link>
        <LanguageSwitcher />
      </header>

      <div style={styles.card}>
        <p style={styles.label}>{tl.albumOverline}</p>

        <h1 style={styles.title}>
          {ready ? tl.albumReadyTitle : tl.albumComingTitle}
        </h1>

        {!ready && <p style={styles.date}>{tl.albumComingDate}</p>}

        <div style={styles.divider} aria-hidden="true" />

        <p style={styles.body}>{ready ? tl.albumReadyBody : tl.albumComingBody}</p>

        {!ready && (
          <div style={styles.countdown} role="timer" aria-label={tl.albumComingDate}>
            <CountdownCell value={timeLeft.days}    label={tl.days} />
            <CountdownCell value={timeLeft.hours}   label={tl.hours} />
            <CountdownCell value={timeLeft.minutes} label={tl.minutes} />
          </div>
        )}

        {!ready && <p style={styles.hint}>{tl.albumComingHint}</p>}

        <Link to="/" style={styles.link}>← {tl.returnToHomepage}</Link>
      </div>
    </div>
  );
}

function CountdownCell({ value, label }: { value: number; label: string }) {
  return (
    <div style={styles.countdownCell}>
      <span style={styles.countdownValue}>{String(value).padStart(2, '0')}</span>
      <span style={styles.countdownLabel}>{label}</span>
    </div>
  );
}

const G = {
  parchment:    '#FDFAF5',
  espresso:     '#2A1F1A',
  espressoDim:  'rgba(42,31,26,0.55)',
  espressoFaint:'rgba(42,31,26,0.35)',
  gold:         '#B8924A',
  goldDim:      'rgba(184,146,74,0.4)',
  rose:         '#C4848C',
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: G.parchment,
    padding: '2rem 1.5rem',
  },
  nav: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem clamp(1.5rem, 5vw, 3rem)',
    background: 'rgba(253,250,245,0.88)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    borderBottom: '1px solid rgba(42,31,26,0.08)',
    zIndex: 400,
  },
  card: {
    maxWidth: '32rem',
    width: '100%',
    textAlign: 'center',
    padding: '3rem 2rem',
    background: 'rgba(253,250,245,0.8)',
    border: '1px solid rgba(184,146,74,0.18)',
    borderRadius: '16px',
    boxShadow: '0 2px 24px rgba(42,31,26,0.06)',
  },
  label: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize: '0.7rem',
    letterSpacing: '0.28em',
    textTransform: 'uppercase' as const,
    color: G.gold,
    fontWeight: 500,
    marginBottom: '1.25rem',
  },
  title: {
    fontFamily: 'var(--font-display)',
    fontStyle: 'var(--font-display-style)' as 'normal' | 'italic',
    fontWeight: 400,
    fontSize: 'clamp(1.8rem, 5vw, 2.6rem)',
    lineHeight: 1.2,
    color: G.espresso,
    margin: '0 0 0.75rem',
  },
  date: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize: '0.75rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: G.espressoDim,
    margin: '0 0 0.5rem',
  },
  divider: {
    height: 1,
    maxWidth: '8rem',
    margin: '1.5rem auto',
    background: `linear-gradient(to right, transparent, ${G.goldDim}, transparent)`,
  },
  body: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize: '0.95rem',
    lineHeight: 1.7,
    color: G.espressoDim,
    margin: '0 0 1.75rem',
  },
  countdown: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.75rem',
    margin: '0 0 1.5rem',
  },
  countdownCell: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    minWidth: '4.25rem',
    padding: '0.85rem 0.75rem',
    background: 'rgba(184,146,74,0.06)',
    border: '1px solid rgba(184,146,74,0.16)',
    borderRadius: '12px',
  },
  countdownValue: {
    fontFamily: 'var(--font-digits)',
    fontSize: '1.6rem',
    fontWeight: 500,
    color: G.espresso,
    letterSpacing: '-0.02em',
    fontVariantNumeric: 'tabular-nums',
    lineHeight: 1,
  },
  countdownLabel: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize: '0.6rem',
    letterSpacing: '0.18em',
    textTransform: 'uppercase' as const,
    color: G.espressoFaint,
    fontWeight: 500,
    marginTop: '0.5rem',
  },
  hint: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize: '0.78rem',
    lineHeight: 1.6,
    color: G.espressoFaint,
    fontStyle: 'italic' as const,
    margin: '0 0 1.75rem',
  },
  link: {
    display: 'inline-block',
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize: '0.75rem',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    color: G.rose,
    textDecoration: 'none',
    fontWeight: 500,
  },
  spinner: {
    width: '2rem',
    height: '2rem',
    border: `2px solid rgba(184,146,74,0.25)`,
    borderTopColor: G.gold,
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
    margin: '0 auto',
  },
};
