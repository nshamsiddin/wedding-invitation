import type { Translations } from './en';

export const uz: Translations = {
  lang: 'UZ',

  // Hero
  cordiallyInvited: 'Sizi to\'yimizga taklif etishdan mamnunmiz',
  rsvpButton: 'Tasdiqlash',
  scrollDown: 'Pastga aylantiring',
  scrollCta: 'Hikoyamizni kashf eting',
  scrollToRsvp: 'Quyida javob bering',

  // Event details section
  aboutEvent: 'Bayram',
  eventSubheading: 'Sehrli Kecha',
  venue: 'Manzil',
  date: 'Sana',
  time: 'Vaqt',
  dressCode: 'Kiyim Kodi',
  rsvpDeadline: 'Javob Muddati',

  // Countdown
  days: 'Kun',
  hours: 'Soat',
  minutes: 'Daqiqa',
  seconds: 'Soniya',

  // RSVP section
  kindlyReply: 'Iltimos Javob Bering',
  rsvpHeading: 'Ishtirokni Tasdiqlash',
  rsvpDeadlineNote: 'Iltimos shu sanagacha javob bering:',

  // RSVP form fields
  emailLabel: 'Elektron pochta',
  emailPlaceholder: 'sizning@email.com',
  nameLabel: 'To\'liq ism',
  namePlaceholder: 'Ismingiz va familiyangiz',
  attendanceLabel: 'Kelasizmi?',
  attendingOption: 'Ha, kelaman',
  decliningOption: 'Kela olmayman',
  maybeOption: 'Balki',
  guestCountLabel: 'Mehmonlar soni (o\'zingiz bilan)',
  guestCountSingle: 'mehmon',
  guestCountPlural: 'mehmon',
  dietaryLabel: 'Ovqatlanish cheklovlari',
  dietaryPlaceholder: 'Masalan: Vegetarian, Glutensiz, Yong\'oq allergiyasi',
  dietaryOptional: '(ixtiyoriy)',
  messageLabel: 'Juftlikka xabar',
  messagePlaceholder: 'Tabriklaringizni yoki shaxsiy xabaringizni yozing…',
  messageOptional: '(ixtiyoriy)',

  // RSVP form actions
  sendRsvp: 'RSVP Yuborish',
  updateRsvp: 'RSVP\'ni Yangilash',
  sending: 'Yuborilmoqda…',

  // Update banner
  rsvpFoundTitle: 'RSVP\'ingizni topdik!',
  rsvpFoundSub: 'Quyida javobingizni yangilashingiz mumkin.',

  // Errors
  errorGeneric: 'Xatolik yuz berdi. Iltimos, qayta urinib ko\'ring.',
  rsvpDeadlineHint: 'Iltimos, muddatgacha javob bering.',

  // Success screen
  rsvpConfirmed: 'RSVP Tasdiqlandi',
  rsvpUpdated: 'RSVP Yangilandi',
  attendingHeadline: 'Siz bilan nishonlashni sabrsizlik bilan kutamiz!',
  attendingSub: (count: number) =>
    `${count} mehmon uchun kelishingizni tasdiqladingiz. Ko'proq ma'lumot uchun siz bilan bog'lanamiz.`,
  declinedHeadline: 'Sizni sog\'inib qolamiz!',
  declinedSub: 'Xabar berganingiz uchun rahmat. Bayramda sizni ko\'rishni istardik.',
  maybeHeadline: 'Kela olishingizni umid qilamiz!',
  maybeSub: 'Vaqtinchalik javobingizni qayd etdik. Aniq ma\'lum bo\'lganda RSVP\'ingizni yangilang.',
  defaultHeadline: 'RSVP Qabul Qilindi!',
  defaultSub: 'Javobingiz uchun rahmat.',
  yourDetails: 'Ma\'lumotlaringiz',
  detailName: 'Ism',
  detailEvent: 'Tadbir',
  detailDate: 'Sana',
  updateRsvpLink: 'RSVP\'ingizni yangilamoqchimisiz?',

  // Footer
  allRightsReserved: 'Barcha huquqlar himoyalangan.',

  // Loading / error states
  loadingInvitation: 'Taklif yuklanmoqda…',
  invitationNotFound: 'Taklif Topilmadi',
  invitationNotFoundSub: 'Bu tadbir sahifasi yuklanmadi.',
  invitationExpired: 'Bu taklif havolasi muddati o\'tgan yoki noto\'g\'ri bo\'lishi mumkin.',

  // EventPage — public page CTA
  learnMore: 'Tadbir Tafsilotlari',

  // EventPage — RSVP notice (no personal link)
  personalInviteRequired: 'Shaxsiy Taklif Talab Etiladi',
  personalInviteRequiredSub:
    'Ishtirokingizni tasdiqlash uchun taklifnomangizda berilgan shaxsiy havoladan foydalaning. Har bir mehmon o\'z RSVP sahifasi uchun noyob havola oladi.',
  personalLinkHint: 'Shaxsiy havolangiz siz bilan SMS, WhatsApp yoki chop etilgan taklif orqali ulashildi.',

  // HomePage
  chooseCity: 'To\'y tantanangizni tanlang',
  viewInvitation: 'Taklifni Ko\'rish',

  // CountdownTimer completion
  celebrationBegun: 'Bayram boshlandi!',

  // Footer
  madeWithLove: 'Berfin & Shamsiddin uchun ♡ bilan yaratildi',

  // EventPage / InvitePage — garden additions
  countingDown: 'Orqaga hisoblash',
  untilTheDay: 'Birgalikda Nishonlaguncha',
  personalInvitationFor: 'Shaxsiy Taklifnoma',
  youveBeenInvited: 'Siz taklif etilgansiz',
  pleaseRegister: "Iltimos, Ro'yxatdan O'ting",
  invitationAlreadyClaimed: 'Bu taklif allaqachon ishlatilgan',
  invitationAlreadyClaimedSub: "Bu havola avval ishlatilgan. Xato deb hisoblasangiz, juftlik bilan bog'laning.",

  editName: "O'zgartirish",
  lockName: 'Qulflash',

  writtenInBlooms: 'Gullar Bilan Yozilgan',
  coupleQuote: '"Ikki jon, bir muhabbat, abadiy birgalikda gullaydi."',
  joinUsInGarden: "Bog'imizga Taklif Etamiz",
  foreverAndAlways: 'Abadiyatgacha · 2026',

  whosComing: 'Kimlar Keladi',
  aNoteToUs: 'Bizga Xabar',
  partnerNameLabel: 'Hamrohingiz Ismi',
  partnerNamePlaceholder: 'Hamrohingizning to\'liq ismi',
  guestsShortLabel: 'Mehmonlar',
  attendanceShortLabel: 'Ishtirok',
  phoneLabel: 'Telefon',
  phoneHint: "Yangiliklar uchun siz bilan bog'lanishimiz uchun",
  chapter: 'Bob',
  returnToHomepage: 'Bosh sahifaga qaytish',
  needHelp: 'Yordam kerakmi? Biz bilan bog\'laning',
  rsvpReceived: 'Ishtirok tasdiqlandi!',
  submitFailed: 'Yuborib bo\'lmadi. Iltimos, qayta urinib ko\'ring.',
  registrationComplete: 'Ro\'yxatdan o\'tish yakunlandi!',
  registerFailed: 'Ro\'yxatdan o\'tib bo\'lmadi. Iltimos, qayta urinib ko\'ring.',
  confirmRegistration: 'Ro\'yxatdan O\'tishni Tasdiqlash',
  registering: 'Ro\'yxatdan o\'tilmoqda…',
  youreRegistered: 'Ro\'yxatdan o\'tdingiz!',
  thankYouRegistering: 'Ro\'yxatdan o\'tganingiz uchun rahmat. Siz bilan birga nishonlashni sabrsizlik bilan kutamiz.',
  happyCoupleAlt: 'Baxtli juftlik',
  partnerDietaryLabel: 'Hamrohingizning Ovqatlanish Cheklovlari',
  addToCalendar: 'Taqvimga Qo\'shish',
  cardYoureInvited: 'TAKLIFLANASIZ',
  cardWeInviteYou: 'Sizi bayramimizda ko\'rishdan mamnun bo\'lamiz,',
  cardScanRsvp: 'RSVP uchun skan qiling',
  cardTable: 'STOL',
  cardWeddingInvitation: 'To\'y Taklifi',
};
