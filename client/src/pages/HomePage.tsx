import { useContext } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import LanguageSwitcher from '../components/LanguageSwitcher';
import { TulipSVG } from '../components/decorative';
import { useTranslation } from '../lib/i18n';
import { LanguageContext } from '../context/LanguageContext';
import type { Language } from '../lib/i18n';
import { EVENT_CONFIG } from '../config/event';

const events = [
  {
    slug: 'tashkent',
    city: 'Toshkent',
    country: {
      en: 'Uzbekistan',
      tr: 'Özbekistan',
      uz: 'O\'zbekiston',
    },
    flag: '🇺🇿',
    date: {
      en: '12 September 2026',
      tr: '12 Eylül 2026',
      uz: '12 Sentyabr 2026',
    },
    venue: 'Yulduzli Saroy',
    color: '#C9707A',
  },
  {
    slug: 'ankara',
    city: 'Ankara',
    country: {
      en: 'Türkiye',
      tr: 'Türkiye',
      uz: 'Turkiya',
    },
    flag: '🇹🇷',
    date: {
      en: '19 May 2026',
      tr: '19 Mayıs 2026',
      uz: '19 May 2026',
    },
    venue: 'Sheraton Grand Ankara',
    color: '#C49A6C',
  },
];

export default function HomePage() {
  const t = useTranslation();
  const { language } = useContext(LanguageContext);
  const lang = language as Language;

  const coupleName = EVENT_CONFIG.names[lang] ?? EVENT_CONFIG.names.en;

  return (
    <div
      className="min-h-screen bg-ivory-100 text-stone-600 flex flex-col"
      style={{
        background:
          'linear-gradient(160deg, #FEFCF7 0%, #FDF8F0 50%, #F9EAE4 100%)',
      }}
    >
      <div className="fixed top-4 right-4 z-50">
        <LanguageSwitcher />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className="text-center max-w-2xl w-full"
        >
          <p className="font-sans text-tulip-600 uppercase tracking-[0.45em] text-xs sm:text-sm mb-6">
            {t.cordiallyInvited}
          </p>
          <h1 className="font-serif text-4xl sm:text-6xl font-bold text-stone-700 italic mb-4 leading-tight">
            {coupleName}
          </h1>

          <div
            className="flex items-center justify-center gap-4 my-6"
            aria-hidden="true"
          >
            <div
              className="h-px w-16"
              style={{
                background:
                  'linear-gradient(to right, transparent, rgba(201,112,122,0.4))',
              }}
            />
            <TulipSVG size={20} color="#C9707A" />
            <span className="text-tulip-400 text-xl font-serif">♡</span>
            <TulipSVG size={20} color="#C9707A" />
            <div
              className="h-px w-16"
              style={{
                background:
                  'linear-gradient(to left, transparent, rgba(201,112,122,0.4))',
              }}
            />
          </div>

          <p className="text-stone-400 font-sans text-sm mb-12">{t.chooseCity}</p>

          <div className="grid sm:grid-cols-2 gap-6 mt-4">
            {events.map((ev, i) => (
              <motion.div
                key={ev.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.15, duration: 0.7 }}
              >
                <Link
                  to={`/${ev.slug}`}
                  className="block rounded-3xl p-8 text-center transition-all duration-300 hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-tulip-400 focus:ring-offset-2"
                  style={{
                    background: 'rgba(255,255,255,0.7)',
                    border: '1px solid rgba(196,154,108,0.2)',
                    boxShadow: '0 4px 24px rgba(140,123,110,0.10)',
                    backdropFilter: 'blur(8px)',
                  }}
                >
                  <span
                    className="text-4xl mb-3 block"
                    role="img"
                    aria-label={ev.country[lang] ?? ev.country.en}
                  >
                    {ev.flag}
                  </span>
                  <p className="font-serif text-2xl font-bold text-stone-700 italic mb-1">
                    {ev.city}
                  </p>
                  <p className="text-stone-400 font-sans text-xs uppercase tracking-widest mb-4">
                    {ev.country[lang] ?? ev.country.en}
                  </p>
                  <div
                    className="w-full h-px mb-4"
                    style={{
                      background:
                        'linear-gradient(to right, transparent, rgba(196,154,108,0.3), transparent)',
                    }}
                  />
                  <p className="text-stone-500 font-sans text-sm mb-1">
                    {ev.date[lang] ?? ev.date.en}
                  </p>
                  <p className="text-stone-400 font-sans text-xs">{ev.venue}</p>
                  <div
                    className="mt-5 inline-flex items-center gap-2 px-5 py-2 rounded-full font-sans text-xs font-bold uppercase tracking-widest text-ivory-100"
                    style={{
                      background: `linear-gradient(135deg, ${ev.color}, ${ev.color}cc)`,
                    }}
                  >
                    {t.viewInvitation}
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </main>

      <footer className="py-6 text-center">
        <p className="text-stone-300 font-sans text-xs">{t.madeWithLove}</p>
      </footer>
    </div>
  );
}
