import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { rsvpApi } from '../lib/api';
import { useTranslation } from '../lib/i18n';

export default function EventPage() {
  const { slug } = useParams<{ slug: string }>();
  const tl = useTranslation();

  const { data: event, isLoading, isError } = useQuery({
    queryKey: ['event', slug],
    queryFn: () => rsvpApi.getEvent(slug!),
    enabled: Boolean(slug),
    retry: false,
  });

  if (isLoading) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div style={styles.spinner} role="status" aria-label="Loading" />
        </div>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <p style={styles.label}>Not Found</p>
          <h1 style={styles.title}>Event not found</h1>
          <p style={styles.body}>
            This event does not exist or the link may be incorrect.
          </p>
          <Link to="/" style={styles.link}>← Back to home</Link>
        </div>
      </div>
    );
  }

  const displayDate = 'date' in event ? event.date : null;
  const eventName = event.name;

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <p style={styles.label}>{tl.cordiallyInvited}</p>

        <h1 style={styles.title}>{eventName}</h1>

        {displayDate && (
          <p style={styles.date}>{displayDate}</p>
        )}

        <div style={styles.divider} aria-hidden="true" />

        <p style={styles.body}>
          Please use your personal invitation link to view full event details and RSVP.
          Check your email or contact the couple if you have not received yours.
        </p>

        <Link to="/" style={styles.link}>← Back to home</Link>
      </div>
    </div>
  );
}

const G = {
  parchment: '#FDFAF5',
  espresso:  '#2A1F1A',
  espressoDim: 'rgba(42,31,26,0.55)',
  gold:      '#B8924A',
  goldDim:   'rgba(184,146,74,0.4)',
  rose:      '#C4848C',
};

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100dvh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: G.parchment,
    padding: '2rem 1.5rem',
  },
  card: {
    maxWidth: '28rem',
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
    fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
    lineHeight: 1.2,
    color: G.espresso,
    margin: '0 0 0.5rem',
  },
  date: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize: '0.75rem',
    letterSpacing: '0.15em',
    textTransform: 'uppercase' as const,
    color: G.espressoDim,
    margin: '0 0 1.5rem',
  },
  divider: {
    height: 1,
    maxWidth: '8rem',
    margin: '1.5rem auto',
    background: `linear-gradient(to right, transparent, ${G.goldDim}, transparent)`,
  },
  body: {
    fontFamily: '"DM Sans", system-ui, sans-serif',
    fontSize: '0.9rem',
    lineHeight: 1.65,
    color: G.espressoDim,
    margin: '0 0 2rem',
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
