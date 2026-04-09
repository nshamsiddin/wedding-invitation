import type { Translations } from './en';

export const uz: Translations = {
  lang: 'UZ',

  // Hero
  cordiallyInvited: "Sizi to'yimizga taklif etishdan mamnunmiz",
  rsvpButton: 'Ishtirokni Tasdiqlash',
  scrollDown: 'Tasdiqlash uchun pastga aylantiring',
  scrollCta: 'Hikoyamiz bilan tanishing',
  scrollToRsvp: 'Tasdiqlash uchun pastga aylantiring',

  // Event details section
  aboutEvent: 'Bayram',
  eventSubheading: 'Sehrli Kecha',
  venue: 'Manzil',
  date: 'Sana',
  time: 'Vaqt',
  dressCode: 'Kiyinish tartibi',
  rsvpDeadline: 'Javob Muddati',

  // Countdown
  days: 'Kun',
  hours: 'Soat',
  minutes: 'Daqiqa',
  seconds: 'Soniya',

  // RSVP section
  kindlyReply: 'Iltimos Javob Bering',
  rsvpHeading: 'Javobingiz',
  rsvpDeadlineNote: 'Iltimos shu sanagacha javob bering:',

  // RSVP form fields
  emailLabel: 'Elektron pochta',
  emailPlaceholder: 'sizning@email.com',
  nameLabel: "To'liq ism",
  namePlaceholder: 'Ismingiz va familiyangiz',
  attendanceLabel: 'Kelasizmi?',
  attendingOption: 'Ha, kelaman',
  decliningOption: 'Kela olmayman',
  maybeOption: 'Balki',
  guestCountLabel: 'Mehmonlar soni',
  guestCountHint: "Sizning o'zingiz ham songa kiritilgansiz",
  guestCountSingle: 'mehmon',
  guestCountPlural: 'mehmon',
  dietaryLabel: 'Ovqatlanish cheklovlari',
  dietaryPlaceholder: "Masalan: Vegetarian, Glutensiz, Yong'oq allergiyasi",
  dietaryOptional: '(ixtiyoriy)',
  messageLabel: "Juftlikka tabrik so'zingiz",
  messagePlaceholder: 'Tabriklaringizni yoki shaxsiy xabaringizni yozing\u2026',
  messageOptional: '(ixtiyoriy)',

  // RSVP form actions
  sendRsvp: 'Javob Yuborish',
  updateRsvp: 'Javobni Yangilash',
  sending: 'Yuborilmoqda\u2026',

  // Update banner
  rsvpFoundTitle: 'Javobingizni topdik!',
  rsvpFoundSub: 'Quyida javobingizni yangilashingiz mumkin.',

  // Errors
  errorGeneric: "Xatolik yuz berdi. Iltimos, qayta urinib ko'ring.",
  rsvpDeadlineHint: 'Iltimos, muddatgacha javob bering.',

  // Success screen
  rsvpConfirmed: 'Tasdiqlandi!',
  rsvpUpdated: 'Yangilandi!',
  attendingHeadline: 'Siz bilan nishonlashni sabrsizlik bilan kutamiz!',
  attendingSub: (count: number) =>
    `${count} mehmon uchun kelishingizni tasdiqladingiz. Sizi ko'rishni sabrsizlik bilan kutamiz!`,
  declinedHeadline: "Sizni sog'inib qolamiz!",
  declinedSub: "Xabar berganingiz uchun rahmat. Bayramda sizni ko'rishni istardik.",
  maybeHeadline: 'Kela olishingizni umid qilamiz!',
  maybeSub: "Vaqtinchalik javobingizni qayd etdik. Aniq ma'lum bo'lganda javobingizni yangilang.",
  defaultHeadline: 'Javob Qabul Qilindi!',
  defaultSub: 'Javobingiz uchun rahmat.',
  yourDetails: "Ma'lumotlaringiz",
  detailName: 'Ism',
  detailEvent: 'Tadbir',
  detailDate: 'Sana',
  updateRsvpLink: 'Javobingizni yangilamoqchimisiz?',

  // Footer
  allRightsReserved: 'Barcha huquqlar himoyalangan.',

  // Loading / error states
  loadingInvitation: 'Taklif yuklanmoqda\u2026',
  invitationNotFound: 'Taklif Topilmadi',
  invitationNotFoundSub: 'Bu tadbir sahifasi yuklanmadi.',
  invitationExpired: "Bu taklif havolasi muddati o'tgan yoki noto'g'ri bo'lishi mumkin.",

  // EventPage — public page CTA
  learnMore: 'Tadbir Tafsilotlari',

  // EventPage — RSVP notice (no personal link)
  personalInviteRequired: 'Shaxsiy Taklif Talab Etiladi',
  personalInviteRequiredSub:
    "Ishtirokingizni tasdiqlash uchun taklifnomangizda berilgan shaxsiy havoladan foydalaning. Har bir mehmon o'z shaxsiy havolasini oladi.",
  personalLinkHint: 'Shaxsiy havolangiz siz bilan SMS, WhatsApp yoki chop etilgan taklif orqali ulashildi.',

  // HomePage
  chooseCity: "To'y tantanangizni tanlang",
  viewInvitation: "Taklifni Ko'rish",

  // CountdownTimer completion
  celebrationBegun: 'Bayram boshlandi!',

  // Footer
  madeWithLove: 'Berfin & Shamsiddin uchun \u2661 bilan yaratildi',

  // EventPage / InvitePage — garden additions
  countingDown: 'Orqaga hisoblash',
  untilTheDay: 'Birgalikda Nishonlaguncha',
  personalInvitationFor: 'Shaxsiy Taklifnoma',
  youveBeenInvited: 'Siz taklif etilgansiz',
  pleaseRegister: "Iltimos, Ro'yxatdan O'ting",
  invitationAlreadyClaimed: 'Bu taklif allaqachon ishlatilgan',
  invitationAlreadyClaimedSub: "Bu havola avval ishlatilgan. Iltimos, o'zingizning shaxsiy havolangizdan foydalanayotganingizni tekshiring.",

  editName: "O'zgartirish",
  lockName: 'Qulflash',

  writtenInBlooms: 'Gullar Bilan Yozilgan',
  coupleQuote: '\u201cIkki jon, bir muhabbat, abadiy birgalikda gullaydi.\u201d',
  joinUsInGarden: "Bog'imizga Taklif Etamiz",
  foreverAndAlways: 'Abadiyatgacha \u00b7 2026',

  whosComing: 'Kimlar Keladi',
  aNoteToUs: "Bizga bir so'z",
  partnerNameLabel: 'Hamrohingiz Ismi',
  partnerNamePlaceholder: "Hamrohingizning to'liq ismi",
  guestsShortLabel: 'Mehmonlar',
  attendanceShortLabel: 'Ishtirok',
  phoneLabel: 'Telefon',
  phoneHint: "To'y kunida zarur bo'lsa foydalaniladigan shaxsiy raqamingiz",
  honorific: 'Hurmatli',
  chapter: 'Bob',
  returnToHomepage: 'Bosh sahifaga qaytish',
  needHelp: "Muammo bormi? O'zingizning shaxsiy havolangizdan foydalanayotganingizni tekshiring.",
  rsvpReceived: 'Ishtirok tasdiqlandi!',
  submitFailed: "Yuborib bo'lmadi. Iltimos, qayta urinib ko'ring.",
  registrationComplete: "Ro'yxatdan o'tish yakunlandi!",
  registerFailed: "Ro'yxatdan o'tib bo'lmadi. Iltimos, qayta urinib ko'ring.",
  confirmRegistration: "Ro'yxatdan O'tishni Tasdiqlash",
  registering: "Ro'yxatdan o'tilmoqda\u2026",
  youreRegistered: "Ro'yxatdan o'tdingiz!",
  thankYouRegistering: "Ro'yxatdan o'tganingiz uchun rahmat. Siz bilan birga nishonlashni sabrsizlik bilan kutamiz.",
  happyCoupleAlt: 'Baxtli juftlik',
  partnerDietaryLabel: 'Hamrohingizning Ovqatlanish Cheklovlari',
  addToCalendar: "Taqvimga Qo'shish",
};
