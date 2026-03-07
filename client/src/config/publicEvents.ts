import type { Language } from '../lib/i18n';

export const PUBLIC_EVENT_CONFIGS = {
  tashkent: {
    slug: 'tashkent' as const,
    city: { en: 'Toshkent', tr: 'Taşkent', uz: 'Toshkent' },
    date: '2026-04-24',
    time: '18:00',
    venueName: 'Ofarin Restaurant',
    venueAddress: "Toshkent, O'zbekiston",
    displayDate: {
      en: 'Friday, 24 April 2026',
      tr: 'Cuma, 24 Nisan 2026',
      uz: 'Juma, 24 Aprel 2026',
    },
    dressCode: {
      en: 'Formal Attire',
      tr: 'Resmi Kıyafet',
      uz: 'Rasmiy Kiyim',
    },
    targetDateTime: '2026-04-24T18:00:00',
  },
  ankara: {
    slug: 'ankara' as const,
    city: { en: 'Ankara', tr: 'Ankara', uz: 'Ankara' },
    date: '2026-05-19',
    time: '18:00',
    venueName: "Park L'Amore",
    venueAddress: 'İncek, Turgut Özal Blv. No:48, 06830 Gölbaşı/Ankara, Türkiye',
    displayDate: {
      en: 'Tuesday, 19 May 2026',
      tr: 'Salı, 19 Mayıs 2026',
      uz: 'Seshanba, 19 may 2026',
    },
    dressCode: {
      en: 'Formal Attire',
      tr: 'Resmi Kıyafet',
      uz: 'Rasmiy Kiyim',
    },
    targetDateTime: '2026-05-19T18:00:00',
  },
} as const;

export type VenueSlug = keyof typeof PUBLIC_EVENT_CONFIGS;
export const VALID_VENUES: VenueSlug[] = ['tashkent', 'ankara'];
export const VALID_LANGS: Language[] = ['en', 'tr', 'uz'];
