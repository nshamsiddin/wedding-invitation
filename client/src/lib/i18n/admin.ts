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
  statsInvitations: string;
  statsPeople: string;
  statsAttending: string;
  statsDeclined: string;
  statsMaybe: string;
  statsPending: string;
  statsHeadcount: string;
  statsAttendingGuests: string;
  statsResponseRate: string;
  statsResponded: (responded: number, total: number) => string;
  statsRespondedInvitations: (responded: number, total: number) => string;
  statsExpectedHeadcount: string;

  // Shareable links section
  shareableLinksTitle: string;
  shareableLinksDesc: string;
  permanent: string;
  copyLink: string;

  // Guest wishes/messages section
  guestWishesTitle: string;
  guestWishesSubtitle: string;
  guestWishesEmpty: string;
  guestWishesEmptyHint: string;
  guestWishesFrom: string;
  guestWishesUpdated: string;
  guestWishSingular: string;
  guestWishPlural: string;
  openGuestWishes: string;
  openDuplicateDetector: string;
  backToGuestList: string;
  backToDashboard: string;

  // Guest list section
  guestList: string;
  guestSingular: string;
  guestPlural: string;
  searchPlaceholder: string;
  addGuest: string;
  colName: string;
  colNumber: string;
  colAdded: string;
  colTable: string;
  colStatus: string;
  colParty: string;
  colActions: string;
  noGuestsFound: string;
  noGuestsHint: string;
  invitationUnitSingular: string;
  invitationUnitPlural: string;
  personUnitSingular: string;
  personUnitPlural: string;
  partySizeLabel: string;
  verificationTitle: string;
  verificationHint: string;
  verificationSelected: string;
  clearSelection: string;
  duplicateDetectorTitle: string;
  duplicateDetectorHint: string;
  duplicateDetectorPlaceholder: string;
  duplicateDetectorScore: string;
  duplicateDetectorNoMatches: string;
  duplicateDetectorTooShort: string;

  // Add Guest modal
  addGuestTitle: string;
  fullName: string;
  phone: string;
  partnerName: string;
  inviteTo: string;
  statusLabel: string;
  guestCountLabel: string;
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
  messageLabel: string;

  // Edit Invitation modal
  editRsvpTitle: string;
  saveChanges: string;
  languageLabel: string;

  // Status option labels
  statusAttending: string;
  statusDeclined: string;
  statusMaybe: string;
  statusPending: string;
  /** Shown when an invitation still has legacy “maybe” in the DB — pick a new status */
  legacyMaybeStatusHint: string;

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

  // Seating planner
  seatingPlannerTitle: string;
  seatingPlannerDesc: string;
  openSeatingPlanner: string;
  seatingPickEvent: string;
  seatingPickEventHint: string;
  seatingUnassigned: string;
  seatingUnassignedCount: (count: number) => string;
  seatingUnassignedEmpty: string;
  seatingAddTable: string;
  seatingTableCount: string;
  seatingTablesCreated: (count: number) => string;
  seatingCapacity: string;
  seatingCapacityLabel: (filled: number, total: number) => string;
  seatingOverCapacity: string;
  seatingOverCapacityBy: (n: number) => string;
  seatingTableLabel: (n: number) => string;
  /** Standalone word for "Table" — used alongside the prominent number badge
   *  on the seating-planner table card when no custom label is set. */
  seatingTableWord: string;
  seatingTableLabelPlaceholder: string;
  seatingEditTable: string;
  seatingDeleteTable: string;
  seatingDeleteTableConfirm: (label: string, count: number) => string;
  seatingNoTablesYet: string;
  seatingNoTablesHint: string;
  seatingMobileBanner: string;
  seatingMobileBackToList: string;
  seatingSeatedAssignment: (name: string, table: string) => string;
  seatingUnseatedAssignment: (name: string) => string;
  seatingDragHint: string;
  seatingFreeSeats: (n: number) => string;
  seatingTotals: (seated: number, total: number) => string;
  seatingExportXlsx: string;
  seatingExportXlsxHint: string;
  seatingUnassignFromTable: string;
  seatingAddGuest: string;
  seatingAddGuestToTable: string;
  seatingNoUnassignedGuests: string;
  seatingTableFullHint: string;
  seatingFilterTablesPlaceholder: string;
  seatingFilterClear: string;
  seatingFilterMatches: (matched: number, total: number) => string;
  seatingFilterNoMatches: string;
  seatingStatusFilterHint: string;
  statusFilterLabel: (status: 'attending' | 'maybe' | 'pending' | 'declined') => string;
  seatingBulkSelectionToolbar: string;
  seatingSelectedCount: (count: number, headcount: number) => string;
  seatingSelectAllVisible: string;
  seatingDeselectAll: string;
  seatingBulkAssignTo: string;
  seatingBulkWouldOverflow: (n: number) => string;

  // Data backup / restore
  backupTitle: string;
  backupDesc: string;
  backupDownload: string;
  backupRestore: string;
  backupDownloading: string;
  backupConfirmTitle: string;
  backupConfirmDesc: string;
  backupConfirmDanger: string;
  backupRestoring: string;
  backupRestoreSuccess: (summary: string) => string;
  backupRestoreFailed: string;
  backupInvalidFile: string;
  backupConfirmAction: string;
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
  statsInvitations: 'Invitations',
  statsPeople: 'People',
  statsAttending: 'Attending',
  statsDeclined: 'Declined',
  statsMaybe: 'Maybe',
  statsPending: 'No Response',
  statsHeadcount: 'Headcount',
  statsAttendingGuests: 'attending guests',
  statsResponseRate: 'Response rate',
  statsResponded: (responded, total) => `${responded} of ${total} responded`,
  statsRespondedInvitations: (responded, total) => `${responded} of ${total} invitations responded`,
  statsExpectedHeadcount: 'Expected headcount',

  shareableLinksTitle: 'Shareable Invitation Links',
  shareableLinksDesc: '6 permanent links — 3 languages × 2 venues. Anyone can RSVP via these.',
  permanent: 'Permanent',
  copyLink: 'Copy link',
  guestWishesTitle: 'Guest Wishes',
  guestWishesSubtitle: 'All messages guests left with their RSVP responses.',
  guestWishesEmpty: 'No guest wishes yet',
  guestWishesEmptyHint: 'Messages will appear here once guests submit a note.',
  guestWishesFrom: 'From',
  guestWishesUpdated: 'Updated',
  guestWishSingular: 'message',
  guestWishPlural: 'messages',
  openGuestWishes: 'Guest Wishes',
  openDuplicateDetector: 'Duplicate Detector',
  backToGuestList: 'Back to Guest List',
  backToDashboard: 'Back to Dashboard',

  guestList: 'Guest List',
  guestSingular: 'guest',
  guestPlural: 'guests',
  searchPlaceholder: 'Search guests…',
  addGuest: 'Add Guest',
  colName: 'Name',
  colNumber: '#',
  colAdded: 'Added',
  colTable: 'Table #',
  colStatus: 'Status',
  colParty: 'Party',
  colActions: 'Actions',
  noGuestsFound: 'No guests found',
  noGuestsHint: 'Try adjusting filters or add a guest manually',
  invitationUnitSingular: 'invitation',
  invitationUnitPlural: 'invitations',
  personUnitSingular: 'person',
  personUnitPlural: 'people',
  partySizeLabel: 'Party size',
  verificationTitle: 'Verification mode',
  verificationHint: 'Select entries to verify totals from only those rows.',
  verificationSelected: 'selected',
  clearSelection: 'Clear selection',
  duplicateDetectorTitle: 'Duplicate detector',
  duplicateDetectorHint: 'Likely duplicates are detected automatically from the current guest list using fuzzy matching.',
  duplicateDetectorPlaceholder: 'Search possible duplicate name…',
  duplicateDetectorScore: 'match',
  duplicateDetectorNoMatches: 'No likely duplicates found',
  duplicateDetectorTooShort: 'Type at least 2 characters',

  addGuestTitle: 'Add Guest',
  fullName: 'Full Name',
  phone: 'Phone',
  partnerName: 'Partner Name',
  inviteTo: 'Invite to',
  statusLabel: 'Status',
  guestCountLabel: 'Guest Count',
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
  messageLabel: 'Message',

  editRsvpTitle: 'Edit RSVP',
  saveChanges: 'Save Changes',
  languageLabel: 'Invitation Language',

  statusAttending: 'Attending',
  statusDeclined: 'Declined',
  statusMaybe: 'Maybe',
  statusPending: 'Pending',
  legacyMaybeStatusHint: 'Legacy “maybe” response — choose attending, declined, or no response below.',

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

  seatingPlannerTitle: 'Seating Plan',
  seatingPlannerDesc: 'Drag guests onto tables to assign seats. Capacity and headcount update live.',
  openSeatingPlanner: 'Seating Plan',
  seatingPickEvent: 'Choose an event to plan seating',
  seatingPickEventHint: 'Tables and assignments are per-event. Pick an event tab above to start.',
  seatingUnassigned: 'Unassigned',
  seatingUnassignedCount: (count) => `${count} ${count === 1 ? 'guest' : 'guests'} unassigned`,
  seatingUnassignedEmpty: 'Everyone is seated.',
  seatingAddTable: 'Add table',
  seatingTableCount: 'Count',
  seatingTablesCreated: (count) => count === 1 ? 'Table created' : `${count} tables created`,
  seatingCapacity: 'Capacity',
  seatingCapacityLabel: (filled, total) => `${filled} / ${total} seats`,
  seatingOverCapacity: 'Over capacity',
  seatingOverCapacityBy: (n) => `Over by ${n}`,
  seatingTableLabel: (n) => `Table ${n}`,
  seatingTableWord: 'Table',
  seatingTableLabelPlaceholder: 'Optional name (e.g. Family)',
  seatingEditTable: 'Edit table',
  seatingDeleteTable: 'Delete table',
  seatingDeleteTableConfirm: (label, count) =>
    count === 0
      ? `Delete ${label}? This cannot be undone.`
      : `Delete ${label}? ${count} ${count === 1 ? 'guest will be' : 'guests will be'} unassigned.`,
  seatingNoTablesYet: 'No tables yet',
  seatingNoTablesHint: 'Add your first table to start seating guests.',
  seatingMobileBanner: 'The seating planner works best on a tablet or larger. Use the dashboard list view to assign tables on mobile.',
  seatingMobileBackToList: 'Back to dashboard',
  seatingSeatedAssignment: (name, table) => `${name} seated at ${table}`,
  seatingUnseatedAssignment: (name) => `${name} unassigned`,
  seatingDragHint: 'Drag a guest onto a table to seat them.',
  seatingFreeSeats: (n) => `${n} ${n === 1 ? 'seat' : 'seats'} free`,
  seatingTotals: (seated, total) => `${seated} / ${total} guests seated`,
  seatingExportXlsx: 'MİSAFİR LİSTESİ',
  seatingExportXlsxHint: 'Download Turkish-template guest list (HOSTES + MESAJ sheets)',
  seatingUnassignFromTable: 'Remove from this table',
  seatingAddGuest: 'Add guest',
  seatingAddGuestToTable: 'Add an unassigned guest to this table',
  seatingNoUnassignedGuests: 'No unassigned guests',
  seatingTableFullHint: 'Table is full — adding will exceed capacity',
  seatingFilterTablesPlaceholder: 'Search tables or guests…',
  seatingFilterClear: 'Clear filter',
  seatingFilterMatches: (matched, total) => `${matched} of ${total} tables`,
  seatingFilterNoMatches: 'No tables match',
  seatingStatusFilterHint: 'Click to toggle. Alt-click to show only this status.',
  statusFilterLabel: (status) =>
    status === 'attending'
      ? 'Attending'
      : status === 'maybe'
        ? 'Maybe'
        : status === 'pending'
          ? 'Pending'
          : 'Declined',
  seatingBulkSelectionToolbar: 'Bulk selection',
  seatingSelectedCount: (count, headcount) =>
    headcount === count
      ? `${count} selected`
      : `${count} selected · ${headcount} ${headcount === 1 ? 'person' : 'people'}`,
  seatingSelectAllVisible: 'Select all',
  seatingDeselectAll: 'Deselect all',
  seatingBulkAssignTo: 'Assign to table…',
  seatingBulkWouldOverflow: (n) => `Would exceed capacity by ${n}`,

  backupTitle: 'Data Backup',
  backupDesc: 'Download a snapshot of every guest, invitation, event, and notification. Restore later to roll back any changes.',
  backupDownload: 'Download Backup',
  backupRestore: 'Restore from File…',
  backupDownloading: 'Downloading backup…',
  backupConfirmTitle: 'Restore from backup?',
  backupConfirmDesc: 'This will replace every guest, invitation, event, and notification with the contents of the backup file.',
  backupConfirmDanger: 'This cannot be undone. Consider downloading a fresh backup first.',
  backupRestoring: 'Restoring…',
  backupRestoreSuccess: (summary) => `Backup restored — ${summary}`,
  backupRestoreFailed: 'Failed to restore backup',
  backupInvalidFile: 'Selected file is not a valid backup',
  backupConfirmAction: 'Restore',
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
  statsInvitations: 'Davet',
  statsPeople: 'Kişi',
  statsAttending: 'Katılıyor',
  statsDeclined: 'Katılmıyor',
  statsMaybe: 'Belki',
  statsPending: 'Yanıt Yok',
  statsHeadcount: 'Toplam Kişi',
  statsAttendingGuests: 'katılan misafir',
  statsResponseRate: 'Yanıt oranı',
  statsResponded: (responded, total) => `${total} kişiden ${responded} yanıtladı`,
  statsRespondedInvitations: (responded, total) => `${total} davetten ${responded} yanıt geldi`,
  statsExpectedHeadcount: 'Beklenen kişi sayısı',

  shareableLinksTitle: 'Paylaşılabilir Davet Bağlantıları',
  shareableLinksDesc: '6 kalıcı bağlantı — 3 dil × 2 mekan. Herkes bu bağlantılar üzerinden RSVP yapabilir.',
  permanent: 'Kalıcı',
  copyLink: 'Bağlantıyı kopyala',
  guestWishesTitle: 'Misafir Dilekleri',
  guestWishesSubtitle: 'Misafirlerin RSVP ile bıraktığı tüm mesajlar.',
  guestWishesEmpty: 'Henüz mesaj yok',
  guestWishesEmptyHint: 'Misafirler not bıraktıkça burada görünecek.',
  guestWishesFrom: 'Gönderen',
  guestWishesUpdated: 'Güncellendi',
  guestWishSingular: 'mesaj',
  guestWishPlural: 'mesaj',
  openGuestWishes: 'Misafir Dilekleri',
  openDuplicateDetector: 'Yinelenen Bulucu',
  backToGuestList: 'Misafir Listesine Dön',
  backToDashboard: 'Panele Dön',

  guestList: 'Misafir Listesi',
  guestSingular: 'misafir',
  guestPlural: 'misafir',
  searchPlaceholder: 'Misafir ara…',
  addGuest: 'Misafir Ekle',
  colName: 'Ad',
  colNumber: '#',
  colAdded: 'Eklenme',
  colTable: 'Masa #',
  colStatus: 'Durum',
  colParty: 'Grup',
  colActions: 'İşlemler',
  noGuestsFound: 'Misafir bulunamadı',
  noGuestsHint: 'Filtreleri değiştirin veya manuel olarak misafir ekleyin',
  invitationUnitSingular: 'davet',
  invitationUnitPlural: 'davet',
  personUnitSingular: 'kişi',
  personUnitPlural: 'kişi',
  partySizeLabel: 'Grup sayısı',
  verificationTitle: 'Doğrulama modu',
  verificationHint: 'Sadece seçilen satırlardan toplamları doğrulamak için girişleri seçin.',
  verificationSelected: 'seçili',
  clearSelection: 'Seçimi temizle',
  duplicateDetectorTitle: 'Yinelenen kayıt bulucu',
  duplicateDetectorHint: 'Mevcut misafir listesinde olası yinelenen kayıtlar bulanık eşleştirme ile otomatik bulunur.',
  duplicateDetectorPlaceholder: 'Olası yinelenen isim ara…',
  duplicateDetectorScore: 'eşleşme',
  duplicateDetectorNoMatches: 'Olası yinelenen kayıt bulunamadı',
  duplicateDetectorTooShort: 'En az 2 karakter yazın',

  addGuestTitle: 'Misafir Ekle',
  fullName: 'Ad Soyad',
  phone: 'Telefon',
  partnerName: "Eşinin Adı",
  inviteTo: 'Davet et',
  statusLabel: 'Durum',
  guestCountLabel: 'Misafir Sayısı',
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
  messageLabel: 'Mesaj',

  editRsvpTitle: 'RSVP Düzenle',
  saveChanges: 'Değişiklikleri Kaydet',
  languageLabel: 'Davet Dili',

  statusAttending: 'Katılıyor',
  statusDeclined: 'Katılmıyor',
  statusMaybe: 'Belki',
  statusPending: 'Bekliyor',
  legacyMaybeStatusHint: 'Eski “belki” yanıtı — aşağıdan katılıyor, katılmıyor veya yanıt yok seçin.',

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

  seatingPlannerTitle: 'Masa Düzeni',
  seatingPlannerDesc: 'Misafirleri masalara sürükleyerek yer atayın. Kapasite ve kişi sayısı anlık güncellenir.',
  openSeatingPlanner: 'Masa Düzeni',
  seatingPickEvent: 'Masa düzenini planlamak için bir etkinlik seçin',
  seatingPickEventHint: 'Masalar ve atamalar etkinliğe özeldir. Başlamak için yukarıdan bir etkinlik sekmesi seçin.',
  seatingUnassigned: 'Atanmamış',
  seatingUnassignedCount: (count) => `${count} misafir atanmamış`,
  seatingUnassignedEmpty: 'Herkes oturtuldu.',
  seatingAddTable: 'Masa ekle',
  seatingTableCount: 'Adet',
  seatingTablesCreated: (count) => count === 1 ? 'Masa oluşturuldu' : `${count} masa oluşturuldu`,
  seatingCapacity: 'Kapasite',
  seatingCapacityLabel: (filled, total) => `${filled} / ${total} kişi`,
  seatingOverCapacity: 'Kapasite aşıldı',
  seatingOverCapacityBy: (n) => `${n} fazla`,
  seatingTableLabel: (n) => `Masa ${n}`,
  seatingTableWord: 'Masa',
  seatingTableLabelPlaceholder: 'İsteğe bağlı ad (örn. Aile)',
  seatingEditTable: 'Masayı düzenle',
  seatingDeleteTable: 'Masayı sil',
  seatingDeleteTableConfirm: (label, count) =>
    count === 0
      ? `${label} silinsin mi? Bu işlem geri alınamaz.`
      : `${label} silinsin mi? ${count} misafir atanmamış duruma geçecek.`,
  seatingNoTablesYet: 'Henüz masa yok',
  seatingNoTablesHint: 'Misafirleri oturtmak için ilk masanızı ekleyin.',
  seatingMobileBanner: 'Masa düzeni planlayıcısı tablet veya daha büyük ekranda en iyi çalışır. Mobilde masa atamak için liste görünümünü kullanın.',
  seatingMobileBackToList: 'Panele dön',
  seatingSeatedAssignment: (name, table) => `${name} ${table} masasına oturtuldu`,
  seatingUnseatedAssignment: (name) => `${name} atamadan kaldırıldı`,
  seatingDragHint: 'Bir misafiri masaya sürükleyerek oturtun.',
  seatingFreeSeats: (n) => `${n} boş yer`,
  seatingTotals: (seated, total) => `${seated} / ${total} misafir oturtuldu`,
  seatingExportXlsx: 'MİSAFİR LİSTESİ',
  seatingExportXlsxHint: 'Misafir listesini Excel olarak indir (HOSTES + MESAJ sayfaları)',
  seatingUnassignFromTable: 'Bu masadan kaldır',
  seatingAddGuest: 'Misafir ekle',
  seatingAddGuestToTable: 'Atanmamış bir misafiri bu masaya ekle',
  seatingNoUnassignedGuests: 'Atanmamış misafir yok',
  seatingTableFullHint: 'Masa dolu — eklemek kapasiteyi aşacak',
  seatingFilterTablesPlaceholder: 'Masa veya misafir ara…',
  seatingFilterClear: 'Filtreyi temizle',
  seatingFilterMatches: (matched, total) => `${total} masadan ${matched} eşleşti`,
  seatingFilterNoMatches: 'Eşleşen masa yok',
  seatingStatusFilterHint: 'Açıp kapatmak için tıklayın. Sadece bu durumu göstermek için Alt+tıklayın.',
  statusFilterLabel: (status) =>
    status === 'attending'
      ? 'Geliyor'
      : status === 'maybe'
        ? 'Belki'
        : status === 'pending'
          ? 'Bekliyor'
          : 'Gelmiyor',
  seatingBulkSelectionToolbar: 'Toplu seçim',
  seatingSelectedCount: (count, headcount) =>
    headcount === count
      ? `${count} seçili`
      : `${count} seçili · ${headcount} kişi`,
  seatingSelectAllVisible: 'Tümünü seç',
  seatingDeselectAll: 'Seçimi kaldır',
  seatingBulkAssignTo: 'Masaya ata…',
  seatingBulkWouldOverflow: (n) => `Kapasiteyi ${n} aşar`,

  backupTitle: 'Veri Yedekleme',
  backupDesc: 'Tüm misafirler, davetler, etkinlikler ve bildirimlerin anlık görüntüsünü indirin. Daha sonra geri yükleyerek değişiklikleri geri alabilirsiniz.',
  backupDownload: 'Yedeği İndir',
  backupRestore: 'Dosyadan Geri Yükle…',
  backupDownloading: 'Yedek indiriliyor…',
  backupConfirmTitle: 'Yedekten geri yüklensin mi?',
  backupConfirmDesc: 'Tüm misafir, davet, etkinlik ve bildirim verileri yedek dosyasıyla değiştirilecek.',
  backupConfirmDanger: 'Bu işlem geri alınamaz. Önce yeni bir yedek indirmeyi düşünün.',
  backupRestoring: 'Geri yükleniyor…',
  backupRestoreSuccess: (summary) => `Yedek geri yüklendi — ${summary}`,
  backupRestoreFailed: 'Yedek geri yüklenemedi',
  backupInvalidFile: 'Seçilen dosya geçerli bir yedek değil',
  backupConfirmAction: 'Geri yükle',
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
  statsInvitations: 'Takliflar',
  statsPeople: 'Kishilar',
  statsAttending: 'Qatnashadi',
  statsDeclined: 'Rad etdi',
  statsMaybe: 'Balki',
  statsPending: "Javob yo'q",
  statsHeadcount: 'Jami kishi',
  statsAttendingGuests: 'qatnashuvchi mehmon',
  statsResponseRate: 'Javob darajasi',
  statsResponded: (responded, total) => `${total} tadan ${responded} tasi javob berdi`,
  statsRespondedInvitations: (responded, total) => `${total} taklifdan ${responded} tasi javob berdi`,
  statsExpectedHeadcount: 'Kutilayotgan kishi soni',

  shareableLinksTitle: "Ulashish Mumkin Bo'lgan Havolalar",
  shareableLinksDesc: "6 ta doimiy havola — 3 ta til × 2 ta joy. Har kim bu havolalar orqali RSVP qilishi mumkin.",
  permanent: 'Doimiy',
  copyLink: 'Havolani nusxalash',
  guestWishesTitle: 'Mehmon Tilaklari',
  guestWishesSubtitle: "Mehmonlar RSVP bilan qoldirgan barcha xabarlar.",
  guestWishesEmpty: 'Hozircha xabarlar yo‘q',
  guestWishesEmptyHint: 'Mehmonlar izoh qoldirganda bu yerda ko‘rinadi.',
  guestWishesFrom: 'Kimdan',
  guestWishesUpdated: 'Yangilangan',
  guestWishSingular: 'xabar',
  guestWishPlural: 'xabar',
  openGuestWishes: 'Mehmon Tilaklari',
  openDuplicateDetector: 'Dublikat Aniqlagich',
  backToGuestList: "Mehmonlar Ro'yxatiga Qaytish",
  backToDashboard: 'Boshqaruvga qaytish',

  guestList: "Mehmonlar Ro'yxati",
  guestSingular: 'mehmon',
  guestPlural: 'mehmon',
  searchPlaceholder: 'Mehmon qidirish…',
  addGuest: "Mehmon Qo'shish",
  colName: 'Ism',
  colNumber: '#',
  colAdded: "Qo'shilgan",
  colTable: 'Stol #',
  colStatus: 'Holat',
  colParty: 'Guruh',
  colActions: 'Amallar',
  noGuestsFound: 'Mehmon topilmadi',
  noGuestsHint: "Filtrlarni o'zgartiring yoki qo'lda mehmon qo'shing",
  invitationUnitSingular: 'taklif',
  invitationUnitPlural: 'taklif',
  personUnitSingular: 'kishi',
  personUnitPlural: 'kishi',
  partySizeLabel: 'Guruh soni',
  verificationTitle: 'Tekshirish rejimi',
  verificationHint: "Faqat tanlangan qatorlardan jami sonlarni tekshirish uchun tanlang.",
  verificationSelected: 'tanlangan',
  clearSelection: 'Tanlovni tozalash',
  duplicateDetectorTitle: 'Dublikat aniqlagich',
  duplicateDetectorHint: "Joriy mehmonlar ro'yxatida ehtimoliy dublikatlar noaniq moslash bilan avtomatik aniqlanadi.",
  duplicateDetectorPlaceholder: 'Ehtimoliy dublikat ismni qidiring…',
  duplicateDetectorScore: 'moslik',
  duplicateDetectorNoMatches: 'Ehtimoliy dublikat topilmadi',
  duplicateDetectorTooShort: 'Kamida 2 ta belgi kiriting',

  addGuestTitle: "Mehmon Qo'shish",
  fullName: "To'liq Ism",
  phone: 'Telefon',
  partnerName: 'Hamkorning Ismi',
  inviteTo: 'Taklif qilish',
  statusLabel: 'Holat',
  guestCountLabel: 'Mehmon Soni',
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
  messageLabel: 'Xabar',

  editRsvpTitle: 'RSVP Tahrirlash',
  saveChanges: "O'zgarishlarni Saqlash",
  languageLabel: "Taklif Tili",

  statusAttending: 'Qatnashadi',
  statusDeclined: 'Rad etdi',
  statusMaybe: 'Balki',
  statusPending: 'Kutmoqda',
  legacyMaybeStatusHint: 'Eski “balki” holati — quyida qatnashadi, rad yoki javob kutilmoqda tanlang.',

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

  seatingPlannerTitle: 'Stol Joylashuvi',
  seatingPlannerDesc: "Mehmonlarni stollarga olib o'tib joylashtiring. Sig'im va kishilar soni jonli yangilanadi.",
  openSeatingPlanner: 'Stol Joylashuvi',
  seatingPickEvent: 'Stol joylashuvini rejalashtirish uchun tadbirni tanlang',
  seatingPickEventHint: "Stollar va biriktirishlar tadbirga xosdir. Boshlash uchun yuqoridan tadbir tanlang.",
  seatingUnassigned: 'Biriktirilmagan',
  seatingUnassignedCount: (count) => `${count} mehmon biriktirilmagan`,
  seatingUnassignedEmpty: "Hamma o'tirgan.",
  seatingAddTable: "Stol qo'shish",
  seatingTableCount: 'Soni',
  seatingTablesCreated: (count) => count === 1 ? "Stol qo'shildi" : `${count} ta stol qo'shildi`,
  seatingCapacity: "Sig'im",
  seatingCapacityLabel: (filled, total) => `${filled} / ${total} kishi`,
  seatingOverCapacity: "Sig'imdan oshdi",
  seatingOverCapacityBy: (n) => `${n} ortiqcha`,
  seatingTableLabel: (n) => `Stol ${n}`,
  seatingTableWord: 'Stol',
  seatingTableLabelPlaceholder: "Ixtiyoriy nom (masalan, Oila)",
  seatingEditTable: 'Stolni tahrirlash',
  seatingDeleteTable: "Stolni o'chirish",
  seatingDeleteTableConfirm: (label, count) =>
    count === 0
      ? `${label} o'chirilsinmi? Bu amalni bekor qilib bo'lmaydi.`
      : `${label} o'chirilsinmi? ${count} mehmon biriktirilmagan holatga o'tadi.`,
  seatingNoTablesYet: "Hali stol yo'q",
  seatingNoTablesHint: "Mehmonlarni o'tqazish uchun birinchi stolingizni qo'shing.",
  seatingMobileBanner: "Stol joylashuvini rejalashtirgich planshet yoki kattaroq ekranda yaxshiroq ishlaydi. Mobilda stol biriktirish uchun ro'yxat ko'rinishidan foydalaning.",
  seatingMobileBackToList: 'Boshqaruvga qaytish',
  seatingSeatedAssignment: (name, table) => `${name} ${table}ga o'tqazildi`,
  seatingUnseatedAssignment: (name) => `${name} biriktirilmagan`,
  seatingDragHint: "Mehmonni stol ustiga olib o'ting.",
  seatingFreeSeats: (n) => `${n} ta bo'sh joy`,
  seatingTotals: (seated, total) => `${seated} / ${total} mehmon o'tqazildi`,
  seatingExportXlsx: 'MİSAFİR LİSTESİ',
  seatingExportXlsxHint: 'Mehmonlar ro\u02bcyxatini Excel sifatida yuklab oling (HOSTES + MESAJ varaqlari)',
  seatingUnassignFromTable: 'Stoldan olib tashlash',
  seatingAddGuest: "Mehmon qo'shish",
  seatingAddGuestToTable: "Biriktirilmagan mehmonni shu stolga qo'shish",
  seatingNoUnassignedGuests: "Biriktirilmagan mehmon yo'q",
  seatingTableFullHint: "Stol to'la — qo'shish sig'imdan oshib ketadi",
  seatingFilterTablesPlaceholder: 'Stol yoki mehmon qidirish…',
  seatingFilterClear: 'Filtrni tozalash',
  seatingFilterMatches: (matched, total) => `${total} ta stoldan ${matched} ta moslik`,
  seatingFilterNoMatches: 'Mos keluvchi stol topilmadi',
  seatingStatusFilterHint: "Bosib o'zgartirish. Faqat shu holatni ko'rsatish uchun Alt+bosing.",
  statusFilterLabel: (status) =>
    status === 'attending'
      ? 'Keladi'
      : status === 'maybe'
        ? "Ehtimol"
        : status === 'pending'
          ? 'Kutilmoqda'
          : 'Kelmaydi',
  seatingBulkSelectionToolbar: 'Toplu tanlash',
  seatingSelectedCount: (count, headcount) =>
    headcount === count
      ? `${count} ta tanlandi`
      : `${count} ta tanlandi · ${headcount} ta odam`,
  seatingSelectAllVisible: 'Hammasini tanlash',
  seatingDeselectAll: 'Tanlovni bekor qilish',
  seatingBulkAssignTo: 'Stolga biriktirish…',
  seatingBulkWouldOverflow: (n) => `Sig'imdan ${n} ta oshib ketadi`,

  backupTitle: 'Maʼlumotlar Zaxirasi',
  backupDesc: "Barcha mehmonlar, takliflar, tadbirlar va bildirishnomalarning to'liq nusxasini yuklab oling. Keyinroq qayta tiklab o'zgarishlarni bekor qilishingiz mumkin.",
  backupDownload: 'Zaxirani Yuklab olish',
  backupRestore: 'Fayldan Tiklash…',
  backupDownloading: 'Zaxira yuklab olinmoqda…',
  backupConfirmTitle: 'Zaxiradan tiklansinmi?',
  backupConfirmDesc: 'Barcha mehmon, taklif, tadbir va bildirishnoma maʼlumotlari zaxira fayl tarkibi bilan almashtiriladi.',
  backupConfirmDanger: 'Bu amalni bekor qilib boʻlmaydi. Avval yangi zaxira yuklab olishni tavsiya qilamiz.',
  backupRestoring: 'Tiklanmoqda…',
  backupRestoreSuccess: (summary) => `Zaxira tiklandi — ${summary}`,
  backupRestoreFailed: 'Zaxirani tiklab boʻlmadi',
  backupInvalidFile: 'Tanlangan fayl haqiqiy zaxira emas',
  backupConfirmAction: 'Tiklash',
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
