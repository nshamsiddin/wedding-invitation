import type { Language } from './i18n';

// Manual Uzbek arrays — uz-UZ is not reliably supported by V8/Chromium ICU builds
const UZ_MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentyabr', 'oktyabr', 'noyabr', 'dekabr',
];
const UZ_DAYS = [
  'yakshanba', 'dushanba', 'seshanba', 'chorshanba',
  'payshanba', 'juma', 'shanba',
];

/**
 * Formats an ISO date string ("YYYY-MM-DD" or full ISO) into a human-readable
 * localized date. Uzbek dates are handled manually because the uz-UZ ICU locale
 * is absent from most Node/V8 builds and produces garbage output like "2026 M05 19, Tue".
 *
 * Appending T12:00:00 prevents UTC-midnight parsing from rolling the date back
 * one day in time zones west of UTC.
 */
export function formatEventDate(dateStr: string, lang: Language): string {
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`);

  if (lang === 'uz') {
    const weekday = UZ_DAYS[d.getDay()];
    const day     = d.getDate();
    const month   = UZ_MONTHS[d.getMonth()];
    const year    = d.getFullYear();
    return `${weekday}, ${day} ${month} ${year}`;
  }

  const locale = lang === 'tr' ? 'tr-TR' : 'en-US';
  return d.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}
