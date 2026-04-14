import { useContext, useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LanguageContext } from '../context/LanguageContext';
import type { Language } from '../lib/i18n';

const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'en', label: 'EN' },
  { code: 'tr', label: 'TR' },
  { code: 'uz', label: 'UZ' },
];

export default function LanguageSwitcher() {
  const { language, setLanguage } = useContext(LanguageContext);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (code: Language) => {
    setLanguage(code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative" style={{ zIndex: 500 }}>
      {/* Collapsed trigger — always visible */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-full glass"
        style={{
          border: '1px solid var(--border-warm)',
          fontFamily: '"DM Sans", system-ui, sans-serif',
          fontSize: '0.65rem',
          fontWeight: 600,
          letterSpacing: '0.1em',
          color: 'var(--text-secondary)',
          background: 'none',
          outline: 'none',
          minHeight: '32px',
          minWidth: '44px',
          padding: '0 0.6rem',
          cursor: 'pointer',
          transition: 'border-color 0.2s, color 0.2s',
        }}
        aria-label="Change language"
        aria-expanded={open}
      >
        {language.toUpperCase()}
      </button>

      {/* Expanded options */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: -4 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className="absolute right-0 top-full mt-1 flex flex-col rounded-xl glass overflow-hidden"
            style={{ border: '1px solid var(--border-warm)', minWidth: '56px' }}
            role="group"
            aria-label="Language selection"
          >
            {LANGUAGES.map(({ code, label }) => {
              const active = language === code;
              return (
                <button
                  key={code}
                  onClick={() => handleSelect(code)}
                  style={{
                    fontFamily: '"DM Sans", system-ui, sans-serif',
                    fontSize: '0.65rem',
                    fontWeight: 600,
                    letterSpacing: '0.1em',
                    color: active ? 'var(--accent-gold)' : 'var(--text-secondary)',
                    background: active ? 'rgba(184,146,74,0.10)' : 'none',
                    border: 'none',
                    outline: 'none',
                    padding: '0.55rem 0.75rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'background 0.15s, color 0.15s',
                  }}
                  aria-label={`Switch to ${label}`}
                  aria-pressed={active}
                >
                  {label}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
