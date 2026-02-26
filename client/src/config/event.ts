export const EVENT_CONFIG = {
  names: {
    en: "Berfin & Shamsiddin",
    tr: "Berfin & Şamsiddin",
    uz: "Berfin & Shamsiddin",
  },
  date: '2026-09-12T18:00:00',
  displayDate: {
    en: 'Saturday, 12 September 2026',
    tr: 'Cumartesi, 12 Eylül 2026',
    uz: 'Shanba, 12 Sentyabr 2026',
  },
  displayTime: '18:00',
  venue: {
    name: 'The Grand Ballroom at Rosewood Estate',
    address: '1234 Rosewood Lane, Beverly Hills, CA 90210',
    mapsEmbedUrl:
      'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3305.7152203584424!2d-118.4008!3d34.0689!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzTCsDA0JzA4LjAiTiAxMTjCsDI0JzAyLjkiVw!5e0!3m2!1sen!2sus!4v1620000000000!5m2!1sen!2sus',
  },
  dressCode: {
    en: 'Formal Attire',
    tr: 'Resmi Kıyafet',
    uz: 'Rasmiy Kiyim',
  },
  couplePhoto: '/couple-placeholder.svg' as string | null,
  backgroundImage: null as string | null,
  rsvpDeadline: '2026-08-15',
  rsvpDeadlineDisplay: {
    en: '15 August 2026',
    tr: '15 Ağustos 2026',
    uz: '15 Avgust 2026',
  },
} as const;
