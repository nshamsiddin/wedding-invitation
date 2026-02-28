import type { Translations } from './en';

export const uz: Translations = {
  lang: 'UZ',

  // Hero
  cordiallyInvited: 'Sizi to\'yimizga taklif etishdan mamnunmiz',
  rsvpButton: 'RSVP',
  scrollDown: 'RSVP\'ga o\'tish',

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
  rsvpHeading: 'RSVP',
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
    `${count} ${count === 1 ? 'mehmon' : 'mehmon'} uchun kelishingizni tasdiqladingiz. Ko'proq ma'lumot uchun siz bilan bog'lanamiz.`,
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
  personalLinkHint: 'Shaxsiy havolangiz uchun taklifnomangizni tekshiring',

  // HomePage
  chooseCity: 'To\'y tantanangizni tanlang',
  viewInvitation: 'Taklifni Ko\'rish',

  // CountdownTimer completion
  celebrationBegun: 'Bayram boshlandi!',

  // Footer
  madeWithLove: 'Berfin & Shamsiddin uchun ♡ bilan yaratildi',

  // EventPage / InvitePage — garden additions
  countingDown: 'Ortigacha',
  untilTheDay: 'Birgalikda Nishonlaguncha',
  personalInvitationFor: 'Shaxsiy Taklif',
  youveBeenInvited: 'Siz taklif etildingiz',
  pleaseRegister: "Iltimos, Ro'yxatdan O'ting",
  invitationAlreadyClaimed: 'Bu taklif allaqachon ishlatilgan',
  invitationAlreadyClaimedSub: "Bu havola avval ishlatilgan. Xato deb hisoblasangiz, juftlik bilan bog'laning.",
};
