import { useTranslation } from '../lib/i18n';
import { PARCHMENT } from '../garden/tokens';

/**
 * Hero-shaped skeleton shown while the invitation data is loading.
 *
 * The previous loading state was a small spinner centred on a parchment
 * background, which read as a "blank parchment + dot" — felt slower and
 * disconnected from the design language. This skeleton preserves the
 * parchment palette and mimics the hero layout (overline, two name lines,
 * a divider, a microline of details, and a CTA), so the transition into
 * the loaded hero is a polish step rather than a mode flip.
 */
export default function InviteSkeleton() {
  const t = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '100dvh',
        background: PARCHMENT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <span className="sr-only">{t.loadingHint}</span>
      <div
        style={{
          width: '100%',
          maxWidth: '32rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '0.85rem',
        }}
        aria-hidden="true"
      >
        <div className="invite-skeleton" style={{ height: 12, width: 160, borderRadius: 6 }} />
        <div className="invite-skeleton" style={{ height: 56, width: '80%', borderRadius: 12 }} />
        <div className="invite-skeleton" style={{ height: 16, width: 80, borderRadius: 8 }} />
        <div className="invite-skeleton" style={{ height: 56, width: '85%', borderRadius: 12 }} />
        <div className="invite-skeleton" style={{ height: 12, width: 200, borderRadius: 6, marginTop: '1rem' }} />
        <div className="invite-skeleton" style={{ height: 80, width: '70%', borderRadius: 12, marginTop: '1rem' }} />
        <div className="invite-skeleton" style={{ height: 40, width: 180, borderRadius: 999, marginTop: '1rem' }} />
      </div>
    </div>
  );
}
