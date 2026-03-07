export const EVENT_CONFIG = {
  names: {
    en: "Berfin & Shamsiddin",
    tr: "Berfin & Shamsiddin",
    uz: "Berfin & Shamsiddin",
  },
  // Tashkent reception — must stay in sync with the DB seed in server/src/index.ts
  date: '2026-04-24T18:00:00',
  displayDate: {
    en: 'Friday, 24 April 2026',
    tr: 'Cuma, 24 Nisan 2026',
    uz: 'Juma, 24 Aprel 2026',
  },
  displayTime: '18:00',
  venue: {
    name: 'Ofarin Restaurant',
    address: "Toshkent, O'zbekiston",
    mapsEmbedUrl:
      'https://maps.google.com/maps?q=Ofarin+Restaurant+Tashkent+Uzbekistan&output=embed',
  },
  dressCode: {
    en: 'Formal Attire',
    tr: 'Resmi Kıyafet',
    uz: 'Rasmiy Kiyim',
  },
  couplePhoto: '/couple-placeholder.svg' as string | null,
  backgroundImage: null as string | null,
  rsvpDeadline: '2026-04-01',
  rsvpDeadlineDisplay: {
    en: '1 April 2026',
    tr: '1 Nisan 2026',
    uz: '1 Aprel 2026',
  },
  contactEmail: 'wedding@berfin-shamsiddin.com',
} as const;
