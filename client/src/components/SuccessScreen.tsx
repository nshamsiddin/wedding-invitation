import { useContext } from 'react';
import { motion } from 'framer-motion';
import type { Guest } from '@invitation/shared';
import { EVENT_CONFIG } from '../config/event';
import { useTranslation } from '../lib/i18n';
import { LanguageContext } from '../context/LanguageContext';
import type { Language } from '../lib/i18n';

interface Props {
  guest: Guest;
  isUpdate: boolean;
  onUpdateRsvp: () => void;
}

export default function SuccessScreen({ guest, isUpdate, onUpdateRsvp }: Props) {
  const t = useTranslation();
  const { language } = useContext(LanguageContext);
  const lang = language as Language;

  const statusMessages: Record<string, { headline: string; sub: string }> = {
    attending: {
      headline: t.attendingHeadline,
      sub: t.attendingSub(guest.guestCount),
    },
    declined: {
      headline: t.declinedHeadline,
      sub: t.declinedSub,
    },
    maybe: {
      headline: t.maybeHeadline,
      sub: t.maybeSub,
    },
  };

  const msg = statusMessages[guest.status] ?? {
    headline: t.defaultHeadline,
    sub: t.defaultSub,
  };

  const displayDate = EVENT_CONFIG.displayDate[lang];
  const coupleName = EVENT_CONFIG.names[lang];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="text-center py-8 px-4"
      role="alert"
      aria-live="polite"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
        style={{
          background: 'rgba(201,165,90,0.12)',
          border: '2px solid rgba(201,165,90,0.5)',
          boxShadow: '0 0 30px rgba(201,165,90,0.2)',
        }}
      >
        <svg
          className="w-10 h-10 text-elfgold-400"
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
        <p className="text-elfgold-400 font-serif text-xs uppercase tracking-widest mb-2">
          {isUpdate ? t.rsvpUpdated : t.rsvpConfirmed}
        </p>
        <h2 className="font-serif text-2xl sm:text-3xl text-parchment-200 mb-3">{msg.headline}</h2>
        <p className="text-parchment-400/60 font-body text-base max-w-sm mx-auto mb-6">{msg.sub}</p>

        <div
          className="rounded-xl p-4 mb-6 text-left max-w-sm mx-auto"
          style={{
            background: 'rgba(30,27,46,0.6)',
            border: '1px solid rgba(201,165,90,0.2)',
          }}
        >
          <p className="text-parchment-400/50 text-xs font-serif uppercase tracking-widest mb-3">
            {t.yourDetails}
          </p>
          <div className="space-y-1.5">
            <p className="text-parchment-200 font-body text-sm">
              <span className="text-parchment-400/50">{t.detailName}: </span>
              {guest.name}
            </p>
            <p className="text-parchment-200 font-body text-sm">
              <span className="text-parchment-400/50">{t.detailEvent}: </span>
              {coupleName}
            </p>
            <p className="text-parchment-200 font-body text-sm">
              <span className="text-parchment-400/50">{t.detailDate}: </span>
              {displayDate}
            </p>
          </div>
        </div>

        <button
          onClick={onUpdateRsvp}
          className="text-elfgold-400 hover:text-elfgold-300 font-body text-sm underline underline-offset-4 transition-colors focus:outline-none focus:ring-2 focus:ring-elfgold-400 rounded"
        >
          {t.updateRsvpLink}
        </button>
      </motion.div>
    </motion.div>
  );
}
