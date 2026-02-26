import { useContext } from 'react';
import { motion } from 'framer-motion';
import { LanguageContext } from '../context/LanguageContext';
import { LANGUAGES, LANGUAGE_LABELS, type Language } from '../lib/i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useContext(LanguageContext);

  return (
    <div
      className="flex items-center gap-1 rounded-full px-1 py-1 backdrop-blur-sm"
      style={{
        background: 'rgba(254,252,247,0.85)',
        border: '1px solid rgba(196,154,108,0.25)',
        boxShadow: '0 2px 12px rgba(140,123,110,0.12)',
      }}
      role="group"
      aria-label="Select language"
    >
      {LANGUAGES.map((lang: Language) => {
        const isActive = lang === language;
        return (
          <motion.button
            key={lang}
            onClick={() => setLanguage(lang)}
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.95 }}
            className={`relative px-3 py-2 rounded-full text-xs font-sans font-bold tracking-widest transition-colors focus:outline-none focus:ring-1 focus:ring-tulip-400 min-h-[36px] min-w-[44px] ${isActive ? 'text-ivory-100' : 'text-stone-500'}`}
            aria-label={`Switch to ${lang.toUpperCase()}`}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 rounded-full bg-gradient-to-br from-tulip-500 to-tulip-600"
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            <span className="relative z-10">{LANGUAGE_LABELS[lang]}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
