import type { Translations } from './en';

export const tr: Translations = {
  lang: 'TR',

  // Hero
  cordiallyInvited: 'Sizi düğünümüze davet etmekten onur duyuyoruz',
  rsvpButton: 'Onayla',
  scrollDown: 'Aşağı kaydırın',
  scrollCta: 'Hikayemizi keşfedin',
  scrollToRsvp: 'Aşağıda yanıtlayın',

  // Event details section
  aboutEvent: 'Kutlama',
  eventSubheading: 'Büyülü Bir Akşam',
  venue: 'Mekan',
  date: 'Tarih',
  time: 'Saat',
  dressCode: 'Kıyafet Kodu',
  rsvpDeadline: 'Son Yanıt Tarihi',

  // Countdown
  days: 'Gün',
  hours: 'Saat',
  minutes: 'Dakika',
  seconds: 'Saniye',

  // RSVP section
  kindlyReply: 'Lütfen Yanıt Verin',
  rsvpHeading: 'Katılım Onayı',
  rsvpDeadlineNote: 'Lütfen şu tarihe kadar yanıtlayın:',

  // RSVP form fields
  emailLabel: 'E-posta Adresi',
  emailPlaceholder: 'eposta@adresiniz.com',
  nameLabel: 'Ad Soyad',
  namePlaceholder: 'Adınız ve soyadınız',
  attendanceLabel: 'Katılacak mısınız?',
  attendingOption: 'Katılıyorum',
  decliningOption: 'Katılamıyorum',
  maybeOption: 'Belki',
  guestCountLabel: 'Misafir sayısı (kendiniz dahil)',
  guestCountSingle: 'misafir',
  guestCountPlural: 'misafir',
  dietaryLabel: 'Diyet Kısıtlamaları',
  dietaryPlaceholder: 'Örn: Vejetaryen, Glutensiz, Fındık alerjisi',
  dietaryOptional: '(isteğe bağlı)',
  messageLabel: 'Çifte Mesajınız',
  messagePlaceholder: 'İyi dileklerinizi veya kişisel bir not paylaşın…',
  messageOptional: '(isteğe bağlı)',

  // RSVP form actions
  sendRsvp: 'RSVP Gönder',
  updateRsvp: 'RSVP\'yi Güncelle',
  sending: 'Gönderiliyor…',

  // Update banner
  rsvpFoundTitle: 'RSVP\'nizi bulduk!',
  rsvpFoundSub: 'Aşağıdan yanıtınızı güncelleyebilirsiniz.',

  // Errors
  errorGeneric: 'Bir şeyler ters gitti. Lütfen tekrar deneyin.',
  rsvpDeadlineHint: 'Lütfen son tarihe kadar yanıt verin.',

  // Success screen
  rsvpConfirmed: 'RSVP Onaylandı',
  rsvpUpdated: 'RSVP Güncellendi',
  attendingHeadline: 'Sizinle kutlamayı sabırsızlıkla bekliyoruz!',
  attendingSub: (count: number) =>
    `${count} kişilik katılımınızı onayladınız. Daha fazla ayrıntı için sizinle iletişime geçeceğiz.`,
  declinedHeadline: 'Sizi özleyeceğiz!',
  declinedSub: 'Bize bildirdiğiniz için teşekkür ederiz. Kutlamada yanımızda olmanızı çok isterdik.',
  maybeHeadline: 'Umarız katılabilirsiniz!',
  maybeSub: 'Geçici yanıtınızı not ettik. Kesin olarak öğrendiğinizde lütfen RSVP\'nizi güncelleyin.',
  defaultHeadline: 'RSVP Alındı!',
  defaultSub: 'Yanıtınız için teşekkür ederiz.',
  yourDetails: 'Bilgileriniz',
  detailName: 'Ad',
  detailEvent: 'Etkinlik',
  detailDate: 'Tarih',
  updateRsvpLink: 'RSVP\'nizi güncellemek mi istiyorsunuz?',

  // Footer
  allRightsReserved: 'Tüm hakları saklıdır.',

  // Loading / error states
  loadingInvitation: 'Davetiye yükleniyor…',
  invitationNotFound: 'Davetiye Bulunamadı',
  invitationNotFoundSub: 'Bu etkinlik sayfası yüklenemedi.',
  invitationExpired: 'Bu davetiye bağlantısı süresi dolmuş veya geçersiz olabilir.',

  // EventPage — public page CTA
  learnMore: 'Etkinlik Detayları',

  // EventPage — RSVP notice (no personal link)
  personalInviteRequired: 'Kişisel Davetiye Gerekli',
  personalInviteRequiredSub:
    'Katılımınızı onaylamak için davetiyenizde yer alan kişisel bağlantıyı kullanın. Her misafir kendi RSVP sayfası için benzersiz bir bağlantı alır.',
  personalLinkHint: 'Kişisel bağlantınız size SMS, WhatsApp veya basılı davetiye ile gönderildi.',

  // HomePage
  chooseCity: 'Düğün kutlamanızı seçin',
  viewInvitation: 'Daveti Görüntüle',

  // CountdownTimer completion
  celebrationBegun: 'Kutlama başladı!',

  // Footer
  madeWithLove: 'Berfin & Shamsiddin için ♡ ile yapıldı',

  // EventPage / InvitePage — garden additions
  countingDown: 'Geri Sayım',
  untilTheDay: 'Birlikte Kutlayana Kadar',
  personalInvitationFor: 'Kişisel Davetiyeniz',
  youveBeenInvited: 'Davetlisiniz',
  pleaseRegister: 'Lütfen Kayıt Olun',
  invitationAlreadyClaimed: 'Bu davetiye zaten kullanılmış',
  invitationAlreadyClaimedSub: 'Bu bağlantı daha önce kullanılmış. Hata olduğunu düşünüyorsanız lütfen çift ile iletişime geçin.',

  editName: 'Düzenle',
  lockName: 'Kilitle',

  writtenInBlooms: 'Çiçeklerle Yazılmış',
  coupleQuote: '"İki ruh, bir aşk, birlikte sonsuza dek çiçekleniyor."',
  joinUsInGarden: 'Bahçemize Katılın',
  foreverAndAlways: 'Sonsuza Dek · 2026',

  whosComing: 'Kimler Geliyor',
  aNoteToUs: 'Bize Bir Not',
  partnerNameLabel: 'Eşinizin Adı',
  partnerNamePlaceholder: 'Eşinizin tam adı',
  guestsShortLabel: 'Misafirler',
  attendanceShortLabel: 'Katılım',
  phoneLabel: 'Telefon',
  phoneHint: 'Güncellemeler için sizi arayabilelim',
  chapter: 'Bölüm',
  returnToHomepage: 'Ana sayfaya dön',
  needHelp: 'Yardım mı lazım? Bize ulaşın',
  rsvpReceived: 'Katılım onayı alındı!',
  submitFailed: 'Gönderilemedi. Lütfen tekrar deneyin.',
  registrationComplete: 'Kayıt tamamlandı!',
  registerFailed: 'Kayıt başarısız. Lütfen tekrar deneyin.',
  confirmRegistration: 'Kaydı Onayla',
  registering: 'Kaydediliyor…',
  youreRegistered: 'Kaydınız tamamlandı!',
  thankYouRegistering: 'Kaydınız için teşekkür ederiz. Sizinle kutlamayı dört gözle bekliyoruz.',
  happyCoupleAlt: 'Mutlu çift',
  partnerDietaryLabel: 'Eşinizin Diyet Kısıtlamaları',
  addToCalendar: 'Takvime Ekle',
  cardYoureInvited: 'DAVETLİSİNİZ',
  cardWeInviteYou: 'Sizi aramızda görmekten onur duyarız,',
  cardScanRsvp: 'RSVP için tarayın',
  cardTable: 'MASA',
};
