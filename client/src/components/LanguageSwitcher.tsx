import { useContext } from 'react';
import { motion } from 'framer-motion';
import { LanguageContext } from '../context/LanguageContext';
import { LANGUAGES, LANGUAGE_LABELS, type Language } from '../lib/i18n';

export default function LanguageSwitcher() {
  const { language, setLanguage } = useContext(LanguageContext);

  return (
    <div
      className="flex items-center gap-1 bg-mystic-800/60 border border-silver-300/15 rounded-full px-1 py-1 backdrop-blur-sm"
      role="group"
      aria-label="Select language"
    >
      {LANGUAGES.map((lang: Language) => {
        const isActive = lang === language;
        return (
          <motion.button
            key={lang}
            onClick={() => setLanguage(lang)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`relative px-3 py-1 rounded-full text-xs font-serif font-medium tracking-widest transition-colors focus:outline-none focus:ring-1 focus:ring-elfgold-400 ${
              isActive
                ? 'text-mystic-950'
                : 'text-silver-400 hover:text-parchment-200'
            }`}
            aria-label={`Switch to ${lang.toUpperCase()}`}
            aria-pressed={isActive}
          >
            {isActive && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 rounded-full bg-elfgold-600"
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
