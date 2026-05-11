import { createContext, useState, type ReactNode } from 'react';
import type { Language } from '../lib/i18n';

interface LanguageContextValue {
  language: Language;
  /**
   * User-initiated language change. Persists the choice to localStorage AND
   * sets the "manual override" flag so subsequent invitation-driven calls
   * (`setLanguageFromInvitation`) will respect the user's decision.
   */
  setLanguage: (lang: Language) => void;
  /**
   * Invitation-driven language application. The invitation row carries a
   * preferred language that we apply once on first load — but only if the
   * guest has not already manually picked a language. This prevents the
   * personal invite from silently overriding a manual selection made on
   * the homepage or another invitation.
   */
  setLanguageFromInvitation: (lang: Language) => void;
}

const STORAGE_KEY = 'invitation-lang';
const MANUAL_OVERRIDE_KEY = 'invitation-lang-manual';

function getInitialLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'en' || stored === 'tr' || stored === 'uz') {
      document.documentElement.lang = stored;
      return stored;
    }
  } catch {
    // localStorage unavailable
  }

  // Detect from browser locale
  const browserLang = (navigator.languages?.[0] ?? navigator.language ?? '').toLowerCase();
  if (browserLang.startsWith('tr')) return 'tr';
  if (browserLang.startsWith('uz')) return 'uz';
  return 'en';
}

function hasManualOverride(): boolean {
  try {
    return localStorage.getItem(MANUAL_OVERRIDE_KEY) === '1';
  } catch {
    return false;
  }
}

export const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  setLanguageFromInvitation: () => {},
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(getInitialLanguage);

  const persist = (lang: Language) => {
    setLanguageState(lang);
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      // ignore
    }
  };

  const setLanguage = (lang: Language) => {
    try {
      localStorage.setItem(MANUAL_OVERRIDE_KEY, '1');
    } catch {
      // ignore
    }
    persist(lang);
  };

  const setLanguageFromInvitation = (lang: Language) => {
    if (hasManualOverride()) return;
    persist(lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, setLanguageFromInvitation }}>
      {children}
    </LanguageContext.Provider>
  );
}
