import { useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import { en } from './en';
import { tr } from './tr';
import { uz } from './uz';

export type Language = 'en' | 'tr' | 'uz';

export const LANGUAGES: Language[] = ['en', 'tr', 'uz'];

export const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  tr: 'TR',
  uz: 'UZ',
};

const translations = { en, tr, uz } as const;

export function useTranslation() {
  const { language } = useContext(LanguageContext);
  return translations[language];
}

export { en, tr, uz };
