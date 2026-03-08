import { useContext } from 'react';
import { LanguageContext } from '../../context/LanguageContext';
import type { Language } from './index';

export interface AdminTranslations {
  // Header
  adminPanel: string;
  signOut: string;
  exportCsv: string;

  // Event tabs / filters
  all: string;
  allStatuses: string;
  noResponse: string;
  atWord: string;

  // Stats cards
  statsInvited: string;
  statsAttending: string;
  statsDeclined: string;
  statsMaybe: string;
  statsPending: string;
  statsHeadcount: string;
  statsAttendingGuests: string;

  // Shareable links section
  shareableLinksTitle: string;
  shareableLinksDesc: string;
  permanent: string;
  copyLink: string;

  // Guest list section
  guestList: string;
  guestSingular: string;
  guestPlural: string;
  searchPlaceholder: string;
  addGuest: string;
  colName: string;
  colAdded: string;
  colTable: string;
  colActions: string;
  noGuestsFound: string;
  noGuestsHint: string;

  // Add Guest modal
  addGuestTitle: string;
  fullName: string;
  phone: string;
  partnerName: string;
  inviteTo: string;
  statusLabel: string;
  guestCountLabel: string;
  dietaryLabel: string;
  noteLabel: string;
  tableNumberLabel: string;
  cancel: string;
  adding: string;
  optional: string;

  // Edit Guest modal
  editGuestTitle: string;
  contactTab: string;
  saveContact: string;
  saving: string;
  saveRsvp: string;
  partnerDietaryLabel: string;
  messageLabel: string;

  // Edit Invitation modal
  editRsvpTitle: string;
  saveChanges: string;

  // Status option labels
  statusAttending: string;
  statusDeclined: string;
  statusMaybe: string;
  statusPending: string;

  // Stats
  headcountHint: string;

  // Edit Guest — add to event
  addToEvent: string;
  addToEventLabel: (eventName: string) => string;

  // Delete confirmations
  removeGuestTitle: string;
  removeGuestDesc: (name: string) => string;
  removeInvTitle: string;
  removeInvDesc: (eventName: string) => string;
  deleting: string;
  remove: string;

  // Undo delete toast
  undoRemove: string;
  guestRestored: (name: string) => string;
}

const adminEn: AdminTranslations = {
  adminPanel: 'Guest Admin',
  signOut: 'Sign out',
  exportCsv: 'Export CSV',

  all: 'All',
  allStatuses: 'All Statuses',
  noResponse: 'No Response',
  atWord: 'at',

  statsInvited: 'Invited',
  statsAttending: 'Attending',
  statsDeclined: 'Declined',
  statsMaybe: 'Maybe',
  statsPending: 'No Response',
  statsHeadcount: 'Headcount',
  statsAttendingGuests: 'attending guests',

  shareableLinksTitle: 'Shareable Invitation Links',
  shareableLinksDesc: '6 permanent links — 3 languages × 2 venues. Anyone can RSVP via these.',
  permanent: 'Permanent',
  copyLink: 'Copy link',

  guestList: 'Guest List',
  guestSingular: 'guest',
  guestPlural: 'guests',
  searchPlaceholder: 'Search guests…',
  addGuest: 'Add Guest',
  colName: 'Name',
  colAdded: 'Added',
  colTable: 'Table #',
  colActions: 'Actions',
  noGuestsFound: 'No guests found',
  noGuestsHint: 'Try adjusting filters or add a guest manually',

  addGuestTitle: 'Add Guest',
  fullName: 'Full Name',
  phone: 'Phone',
  partnerName: 'Partner Name',
  inviteTo: 'Invite to',
  statusLabel: 'Status',
  guestCountLabel: 'Guest Count',
  dietaryLabel: 'Dietary Restrictions',
  noteLabel: 'Note',
  tableNumberLabel: 'Table Number',
  cancel: 'Cancel',
  adding: 'Adding…',
  optional: '(optional)',

  editGuestTitle: 'Edit Guest',
  contactTab: 'Contact',
  saveContact: 'Save Contact',
  saving: 'Saving…',
  saveRsvp: 'Save RSVP',
  partnerDietaryLabel: 'Partner Dietary',
  messageLabel: 'Message',

  editRsvpTitle: 'Edit RSVP',
  saveChanges: 'Save Changes',

  statusAttending: 'Attending',
  statusDeclined: 'Declined',
  statusMaybe: 'Maybe',
  statusPending: 'Pending',

  headcountHint: 'Total people attending, including partners (sum of guest counts).',
  addToEvent: 'Not yet invited to',
  addToEventLabel: (eventName) => `Add to ${eventName}`,
  removeGuestTitle: 'Remove guest?',
  removeGuestDesc: (name) => `${name} and all their invitations will be permanently deleted.`,
  removeInvTitle: 'Remove from event?',
  removeInvDesc: (eventName) => `Invitation for ${eventName} will be removed. The guest record is kept.`,
  deleting: 'Removing…',
  remove: 'Remove',
  undoRemove: 'Undo',
  guestRestored: (name) => `${name} restored. Update their RSVP in the table.`,
};

const adminTr: AdminTranslations = {
  adminPanel: 'Misafir Yönetimi',
  signOut: 'Çıkış yap',
  exportCsv: 'CSV İndir',

  all: 'Tümü',
  allStatuses: 'Tüm Durumlar',
  noResponse: 'Yanıt Yok',
  atWord: 'saat',

  statsInvited: 'Davetli',
  statsAttending: 'Katılıyor',
  statsDeclined: 'Katılmıyor',
  statsMaybe: 'Belki',
  statsPending: 'Yanıt Yok',
  statsHeadcount: 'Toplam Kişi',
  statsAttendingGuests: 'katılan misafir',

  shareableLinksTitle: 'Paylaşılabilir Davet Bağlantıları',
  shareableLinksDesc: '6 kalıcı bağlantı — 3 dil × 2 mekan. Herkes bu bağlantılar üzerinden RSVP yapabilir.',
  permanent: 'Kalıcı',
  copyLink: 'Bağlantıyı kopyala',

  guestList: 'Misafir Listesi',
  guestSingular: 'misafir',
  guestPlural: 'misafir',
  searchPlaceholder: 'Misafir ara…',
  addGuest: 'Misafir Ekle',
  colName: 'Ad',
  colAdded: 'Eklenme',
  colTable: 'Masa #',
  colActions: 'İşlemler',
  noGuestsFound: 'Misafir bulunamadı',
  noGuestsHint: 'Filtreleri değiştirin veya manuel olarak misafir ekleyin',

  addGuestTitle: 'Misafir Ekle',
  fullName: 'Ad Soyad',
  phone: 'Telefon',
  partnerName: "Eşinin Adı",
  inviteTo: 'Davet et',
  statusLabel: 'Durum',
  guestCountLabel: 'Misafir Sayısı',
  dietaryLabel: 'Beslenme Kısıtlamaları',
  noteLabel: 'Not',
  tableNumberLabel: 'Masa Numarası',
  cancel: 'İptal',
  adding: 'Ekleniyor…',
  optional: '(isteğe bağlı)',

  editGuestTitle: 'Misafiri Düzenle',
  contactTab: 'İletişim',
  saveContact: 'Kaydet',
  saving: 'Kaydediliyor…',
  saveRsvp: 'RSVP Kaydet',
  partnerDietaryLabel: 'Eş Diyeti',
  messageLabel: 'Mesaj',

  editRsvpTitle: 'RSVP Düzenle',
  saveChanges: 'Değişiklikleri Kaydet',

  statusAttending: 'Katılıyor',
  statusDeclined: 'Katılmıyor',
  statusMaybe: 'Belki',
  statusPending: 'Bekliyor',

  headcountHint: 'Katılımcılar dahil toplam kişi sayısı (misafir sayılarının toplamı).',
  addToEvent: 'Henüz davet edilmedi',
  addToEventLabel: (eventName) => `${eventName} etkinliğine ekle`,
  removeGuestTitle: 'Misafiri kaldır?',
  removeGuestDesc: (name) => `${name} ve tüm davetiyeleri kalıcı olarak silinecek.`,
  removeInvTitle: 'Etkinlikten kaldır?',
  removeInvDesc: (eventName) => `${eventName} için davet kaldırılacak. Misafir kaydı korunur.`,
  deleting: 'Kaldırılıyor…',
  remove: 'Kaldır',
  undoRemove: 'Geri al',
  guestRestored: (name) => `${name} geri yüklendi. Tabloda RSVP durumunu güncelleyin.`,
};

const adminUz: AdminTranslations = {
  adminPanel: 'Mehmon Boshqaruvi',
  signOut: 'Chiqish',
  exportCsv: 'CSV Yuklab olish',

  all: 'Barchasi',
  allStatuses: 'Barcha Holatlar',
  noResponse: "Javob Yo'q",
  atWord: 'soat',

  statsInvited: 'Taklif qilingan',
  statsAttending: 'Qatnashadi',
  statsDeclined: 'Rad etdi',
  statsMaybe: 'Balki',
  statsPending: "Javob yo'q",
  statsHeadcount: 'Jami kishi',
  statsAttendingGuests: 'qatnashuvchi mehmon',

  shareableLinksTitle: "Ulashish Mumkin Bo'lgan Havolalar",
  shareableLinksDesc: "6 ta doimiy havola — 3 ta til × 2 ta joy. Har kim bu havolalar orqali RSVP qilishi mumkin.",
  permanent: 'Doimiy',
  copyLink: 'Havolani nusxalash',

  guestList: "Mehmonlar Ro'yxati",
  guestSingular: 'mehmon',
  guestPlural: 'mehmon',
  searchPlaceholder: 'Mehmon qidirish…',
  addGuest: "Mehmon Qo'shish",
  colName: 'Ism',
  colAdded: "Qo'shilgan",
  colTable: 'Stol #',
  colActions: 'Amallar',
  noGuestsFound: 'Mehmon topilmadi',
  noGuestsHint: "Filtrlarni o'zgartiring yoki qo'lda mehmon qo'shing",

  addGuestTitle: "Mehmon Qo'shish",
  fullName: "To'liq Ism",
  phone: 'Telefon',
  partnerName: 'Hamkorning Ismi',
  inviteTo: 'Taklif qilish',
  statusLabel: 'Holat',
  guestCountLabel: 'Mehmon Soni',
  dietaryLabel: 'Ovqatlanish Cheklovlari',
  noteLabel: 'Izoh',
  tableNumberLabel: 'Stol Raqami',
  cancel: 'Bekor qilish',
  adding: "Qo'shilmoqda…",
  optional: '(ixtiyoriy)',

  editGuestTitle: 'Mehmonni Tahrirlash',
  contactTab: 'Aloqa',
  saveContact: 'Saqlash',
  saving: 'Saqlanmoqda…',
  saveRsvp: 'RSVP Saqlash',
  partnerDietaryLabel: 'Hamkor Diyetasi',
  messageLabel: 'Xabar',

  editRsvpTitle: 'RSVP Tahrirlash',
  saveChanges: "O'zgarishlarni Saqlash",

  statusAttending: 'Qatnashadi',
  statusDeclined: 'Rad etdi',
  statusMaybe: 'Balki',
  statusPending: 'Kutmoqda',

  headcountHint: "Hamkorlar bilan birga qatnashuvchi jami kishi soni (mehmon sonlari yig'indisi).",
  addToEvent: 'Hali taklif qilinmagan',
  addToEventLabel: (eventName) => `${eventName} ga qo'shish`,
  removeGuestTitle: "Mehmonni o'chirish?",
  removeGuestDesc: (name) => `${name} va uning barcha takliflari butunlay o'chiriladi.`,
  removeInvTitle: "Tadbirdan olib tashlash?",
  removeInvDesc: (eventName) => `${eventName} uchun taklif olib tashlanadi. Mehmon yozuvi saqlanadi.`,
  deleting: "O'chirilmoqda…",
  remove: "Olib tashlash",
  undoRemove: "Bekor qilish",
  guestRestored: (name) => `${name} tiklandi. Jadvaldagi RSVP holatini yangilang.`,
};

const adminTranslations: Record<Language, AdminTranslations> = {
  en: adminEn,
  tr: adminTr,
  uz: adminUz,
};

export function useAdminTranslation(): AdminTranslations {
  const { language } = useContext(LanguageContext);
  return adminTranslations[language];
}
