/**
 * Builds the Turkish wedding-invitation guest list workbook ("MİSAFİR LİSTESİ")
 * in the exact sheet layout used by the wedding planner template the bride and
 * groom were given:
 *
 *   • HOSTES — grouped by table. Each block opens with "MASA <N> - <K> KİŞİ"
 *     header, followed by the three columns "Ad Soyad / Kişi / Masa". A final
 *     "ATANMAMIŞ" block lists guests without a table assignment so the hostess
 *     can chase them down at the door.
 *
 *   • MESAJ  — flat list with the original 8 columns. The trailing space in
 *     the sheet name and the trailing space on the "Ad Soyad" header are
 *     preserved verbatim because the planner template (and presumably the
 *     wedding's SMS-send tooling) match against those exact strings.
 *
 * The "Mesaj" column is auto-generated per row from the event details so the
 * file is ready to feed into a bulk-SMS tool. We don't store the rendered
 * message in the database — admins update event details, not message text —
 * so the message is recomputed at export time.
 */
import type { XlsxSheet, CellValue } from './xlsx.js';
import { buildXlsx } from './xlsx.js';

export interface MisafirListesiEvent {
  name: string;
  date: string; // ISO-ish "YYYY-MM-DD"
  time: string; // "HH:MM"
  venueName: string;
  venueAddress: string;
  mapsUrl: string | null;
}

export interface MisafirListesiRow {
  name: string;
  partnerName: string | null;
  phone: string | null;
  guestCount: number;
  tableNumber: number | null;
  status: 'attending' | 'declined' | 'maybe' | 'pending';
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// Splits a person's full name into ("Ad", "Soyad") for the MESAJ sheet.
// Heuristic: last whitespace-separated token is the surname; everything before
// it is the first/middle name(s). Single-token names go entirely to "Ad".
// This is the right behaviour for both Turkish ("Berfin Birler" → "Berfin" /
// "Birler") and Uzbek/Russian guests with single-token entries.
export function splitName(full: string): { ad: string; soyad: string } {
  const trimmed = (full ?? '').trim().replace(/\s+/g, ' ');
  if (trimmed.length === 0) return { ad: '', soyad: '' };
  const lastSpace = trimmed.lastIndexOf(' ');
  if (lastSpace < 0) return { ad: trimmed, soyad: '' };
  return {
    ad: trimmed.slice(0, lastSpace),
    soyad: trimmed.slice(lastSpace + 1),
  };
}

// "2026-05-19" → "19.05.2026" (Turkish-style D.M.Y) for the SMS body.
// Falls back to the raw value if it's not in the expected ISO shape so we
// never blow up an export over a malformed date string.
export function formatTurkishDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso ?? '');
  if (!m) return iso ?? '';
  const [, y, mo, d] = m;
  return `${d}.${mo}.${y}`;
}

const STATUS_FLAG: Record<MisafirListesiRow['status'], string> = {
  attending: '*',
  pending: '*',
  maybe: '*',
  declined: '',
};

const STATUS_DISPOSITION: Record<MisafirListesiRow['status'], string> = {
  attending: 'GELİR',
  declined: 'GELMEZ',
  maybe: '',
  pending: '',
};

/**
 * Renders the SMS body for a single guest. Mirrors the structure of the
 * original template ("Sayın misafirlerimiz {date} tarihinde {venue} ...")
 * but parameterised by the live event row so the message stays accurate
 * when admins edit venue/date/time.
 *
 * Guests without an assigned table get a generic invitation line — the
 * hostess can still SMS them and follow up with the table at check-in.
 */
export function buildSmsMessage(
  event: MisafirListesiEvent,
  tableNumber: number | null,
): string {
  const date = formatTurkishDate(event.date);
  const time = event.time ? ` ${event.time}` : '';
  const seatLine =
    tableNumber != null
      ? `masa numaranız ${tableNumber} dir.`
      : 'düğünümüze davetlisiniz.';
  const addressLine = event.venueAddress ? ` ${event.venueAddress}` : '';
  const mapsLine = event.mapsUrl ? ` Konum: ${event.mapsUrl}` : '';
  return (
    `Sayın misafirlerimiz, ${date}${time} tarihinde ${event.venueName} salonunda ` +
    `gerçekleşecek ${event.name} organizasyonunda ${seatLine} ` +
    `İyi eğlenceler dileriz.${addressLine}${mapsLine}`
  );
}

// ─── Sheet builders ──────────────────────────────────────────────────────────

interface TableGroup {
  /** null = guests without a table assignment. */
  tableNumber: number | null;
  rows: MisafirListesiRow[];
  /** Sum of `guestCount` across rows — drives the "MASA N - K KİŞİ" heading. */
  headcount: number;
}

function groupByTable(rows: MisafirListesiRow[]): TableGroup[] {
  const map = new Map<number | 'unassigned', TableGroup>();
  for (const r of rows) {
    const key = r.tableNumber ?? 'unassigned';
    let g = map.get(key);
    if (!g) {
      g = { tableNumber: r.tableNumber, rows: [], headcount: 0 };
      map.set(key, g);
    }
    g.rows.push(r);
    g.headcount += r.guestCount;
  }
  // Sorted: tables ascending, unassigned at the bottom.
  return Array.from(map.values()).sort((a, b) => {
    if (a.tableNumber == null) return 1;
    if (b.tableNumber == null) return -1;
    return a.tableNumber - b.tableNumber;
  });
}

function buildHostesSheet(rows: MisafirListesiRow[]): XlsxSheet {
  const groups = groupByTable(rows);
  const sheetRows: CellValue[][] = [];

  for (const g of groups) {
    const heading =
      g.tableNumber == null
        ? `ATANMAMIŞ - ${g.headcount} KİŞİ`
        : `MASA ${g.tableNumber} - ${g.headcount} KİŞİ`;
    sheetRows.push([heading]);
    sheetRows.push(['Ad Soyad ', 'Kişi', 'Masa']);
    for (const r of g.rows) {
      sheetRows.push([r.name, r.guestCount, r.tableNumber ?? '']);
    }
    sheetRows.push([]);
  }

  if (sheetRows.length === 0) {
    sheetRows.push(['Ad Soyad ', 'Kişi', 'Masa']);
  }

  return { name: 'HOSTES', rows: sheetRows };
}

function buildMesajSheet(
  event: MisafirListesiEvent,
  rows: MisafirListesiRow[],
): XlsxSheet {
  const sheetRows: CellValue[][] = [];
  sheetRows.push([
    'Ad',
    'Soyad',
    'Kişi Sayısı',
    'Telefon',
    'Masa',
    'Geliyor/Gelmiyor',
    'GELİR / GELMEZ',
    'Mesaj',
  ]);

  // Sort: tables ascending (unassigned last), then guest name within a table.
  // Same ordering as HOSTES so the two sheets read consistently when printed
  // side by side.
  const sorted = [...rows].sort((a, b) => {
    const aT = a.tableNumber;
    const bT = b.tableNumber;
    if (aT == null && bT != null) return 1;
    if (aT != null && bT == null) return -1;
    if (aT != null && bT != null && aT !== bT) return aT - bT;
    return a.name.localeCompare(b.name, 'tr');
  });

  for (const r of sorted) {
    const { ad, soyad } = splitName(r.name);
    sheetRows.push([
      ad,
      soyad,
      r.guestCount,
      r.phone ?? '',
      r.tableNumber ?? '',
      STATUS_FLAG[r.status],
      STATUS_DISPOSITION[r.status],
      buildSmsMessage(event, r.tableNumber),
    ]);
  }

  // The sheet name in the original template has a trailing space — preserve it
  // so any downstream tooling that looks for "MESAJ " (e.g. an SMS broadcast
  // script keyed by sheet name) still finds it.
  return { name: 'MESAJ ', rows: sheetRows };
}

// ─── Public API ──────────────────────────────────────────────────────────────
/**
 * Returns the binary `.xlsx` buffer to send back to the admin's browser.
 * Throws synchronously on invalid input — the route handler turns that into
 * a 500 with a generic error message.
 */
export function buildMisafirListesi(
  event: MisafirListesiEvent,
  rows: MisafirListesiRow[],
): Buffer {
  return buildXlsx([buildHostesSheet(rows), buildMesajSheet(event, rows)]);
}
