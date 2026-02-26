import { motion } from 'framer-motion';
import { useTranslation } from '../lib/i18n';

interface Props {
  guestName: string;
  status: 'attending' | 'declined' | 'maybe';
  guestCount: number;
  eventName: string;
  isUpdate: boolean;
  onUpdateRsvp: () => void;
}

export default function SuccessScreen({ guestName, status, guestCount, eventName, isUpdate, onUpdateRsvp }: Props) {
  const t = useTranslation();

  const statusMessages: Record<string, { headline: string; sub: string }> = {
    attending: { headline: t.attendingHeadline, sub: t.attendingSub(guestCount) },
    declined:  { headline: t.declinedHeadline,  sub: t.declinedSub },
    maybe:     { headline: t.maybeHeadline,     sub: t.maybeSub },
  };

  const msg = statusMessages[status] ?? { headline: t.defaultHeadline, sub: t.defaultSub };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="text-center py-8 px-4"
      role="alert"
      aria-live="polite"
    >
      {/* Check icon ring */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(201,112,122,0.10)',
          border: '2px solid rgba(201,112,122,0.40)',
          boxShadow: '0 4px 20px rgba(201,112,122,0.18)',
        }}
      >
        <svg
          className="w-9 h-9"
          style={{ color: '#C9707A' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <p className="text-tulip-500 font-sans text-xs uppercase tracking-widest font-bold mb-2">
          {isUpdate ? t.rsvpUpdated : t.rsvpConfirmed}
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl font-bold text-stone-700 italic mb-3">
          {msg.headline}
        </h2>
        <p className="text-stone-400 font-sans text-sm leading-relaxed max-w-sm mx-auto mb-6">
          {msg.sub}
        </p>

        {/* Detail card */}
        <div
          className="rounded-2xl p-4 mb-6 text-left max-w-sm mx-auto"
          style={{
            background: 'rgba(253,248,240,0.9)',
            border: '1px solid rgba(196,154,108,0.25)',
            boxShadow: '0 2px 12px rgba(196,154,108,0.10)',
          }}
        >
          <p className="text-gold-600 text-xs font-sans font-bold uppercase tracking-widest mb-3">
            {t.yourDetails}
          </p>
          <div className="space-y-1.5">
            <p className="text-stone-600 font-sans text-sm">
              <span className="text-stone-400">{t.detailName}: </span>
              {guestName}
            </p>
            {eventName && (
              <p className="text-stone-600 font-sans text-sm">
                <span className="text-stone-400">{t.detailEvent}: </span>
                {eventName}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={onUpdateRsvp}
          className="text-tulip-500 hover:text-tulip-600 font-sans text-sm underline underline-offset-4 transition-colors focus:outline-none focus:ring-2 focus:ring-tulip-400 rounded"
        >
          {t.updateRsvpLink}
        </button>
      </motion.div>
    </motion.div>
  );
}
