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
  openInMaps: 'Lokatsiyani xaritada ochish',
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
  guestCountLabel: 'Mehmonlar soni',
  guestCountHint: "Sizning o'zingiz ham songa kiritilgansiz",
  guestCountSingle: 'mehmon',
  guestCountPlural: 'mehmon',
  optionalLabel: '(ixtiyoriy)',
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
  personalInvitationFor: 'Taklifnoma',
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
  tableLabel: 'Stol',
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
  addToCalendar: "Taqvimga Qo'shish",
  addToAppleCalendar: 'Apple Calendar',
  addToGoogleCalendar: 'Google Calendar',
  shareInvitation: 'Taklifnomani ulashing',
  shareCopied: 'Havola nusxalandi',
  shareTitle: 'Sizni taklif qilamiz',
  shareText: (couple: string) => `${couple} to'yiga taklif etilgansiz.`,
  yourTableLabel: 'Stolingiz',
  seatingPreferenceNote: "To'yga tashrif buyurishingizni tasdiqlashtingizni iltifot bilan so'rab qolamiz.",
  nudgeRibbonText: "Bayram joyini rejalashtirishga yordam bering — iltimos, ishtirokingizni tasdiqlang.",
  nudgeRibbonCta: 'Tasdiqlash',
  nudgeRibbonDismiss: 'Yopish',
  phonePlaceholder: '+998 90 123 4567',
  preConfirmedOverline: 'Joyingiz tayyor',
  preConfirmedHeadline: "Siz bilan nishonlashni sabrsizlik bilan kutamiz!",
  preConfirmedSub: "Taklifnomangiz tasdiqlangan. Quyidagi tugmalar orqali kunni taqvimga qo'shing, stolingizni ko'ring yoki javobingizni yangilang.",
  loadingHint: "Taklifnomangiz tayyorlanmoqda…",
  invitationOffline: "Taklifni yuklab bo'lmadi",
  invitationOfflineSub: "Iltimos, internet aloqangizni tekshirib, qayta urinib ko'ring.",
  retryAction: "Qayta urinib ko'rish",
  reservedFor: 'Atalgan',

  // /redirect — to'y fotoalbomi sahifasi
  albumOverline: "To'y Albomi",
  albumComingTitle: "Albomimiz tez kunda tayyor bo'ladi",
  albumComingDate: '2026-yil 20-mayda ochiladi',
  albumComingBody:
    "Bayramimizdan qolgan har bir lahza mehr bilan yig'ilmoqda. To'liq fotoalbom shu sahifada 2026-yil 20-mayda ochiladi — o'sha kunni biz bilan birga qayta yashash uchun, iltimos, qayting.",
  albumComingHint: "Ushbu sahifani saqlab qo'ying — albom faollashishi bilan xuddi shu havola sizni to'g'ridan-to'g'ri unga olib boradi.",
  albumReadyTitle: 'Deyarli tayyor',
  albumReadyBody:
    "Albom tez orada shu yerda paydo bo'ladi. Sabringiz uchun rahmat — iltimos, bir oz keyinroq qayta urinib ko'ring.",
  albumRedirecting: 'Albom ochilmoqda…',
};
