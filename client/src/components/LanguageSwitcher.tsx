import { useContext } from 'react';
import { motion } from 'framer-motion';
import { LanguageContext } from '../context/LanguageContext';
import type { Language } from '../lib/i18n';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'tr', label: 'TR' },
  { code: 'uz', label: 'UZ' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useContext(LanguageContext);

  return (
    <div
      className="flex items-center gap-0.5 p-1 rounded-full glass"
      style={{ border: '1px solid var(--border-warm)' }}
      role="group"
      aria-label="Language selection"
    >
      {LANGUAGES.map(({ code, label }) => {
        const active = language === code;
        return (
          <div key={code} className="relative">
            {active && (
          <motion.div
            layoutId="lang-pill"
            className="absolute inset-0 rounded-full"
            style={{ backgroundColor: 'var(--accent-gold)' }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          />
            )}
            <button
              onClick={() => setLanguage(code)}
              className="relative z-10 px-3 py-1 rounded-full transition-colors"
              style={{
                fontFamily: '"DM Sans", system-ui, sans-serif',
                fontSize: '0.6rem',
                fontWeight: 600,
                letterSpacing: '0.1em',
                color: active ? '#0C0A09' : 'var(--text-secondary)',
                background: 'none',
                border: 'none',
                outline: 'none',
                transition: 'color 0.2s',
              }}
              aria-label={`Switch to ${label}`}
              aria-pressed={active}
            >
              {label}
            </button>
          </div>
        );
      })}
    </div>
  );
}
