function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Neutralise CSV formula injection: spreadsheet apps (Excel, Google Sheets) interpret
  // cells starting with =, +, -, or @ as formulas. Prefix with a single-quote per the
  // OWASP recommendation — most spreadsheet apps hide the leading apostrophe in display
  // and treat the cell as plain text, avoiding the stray-whitespace issue caused by \t.
  const safe = /^[=+\-@]/.test(str) ? `'${str}` : str;
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes('\r')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export interface CSVRow {
  guestId: number;
  name: string;
  partnerName: string | null;
  phone: string | null;
  eventName: string;
  eventSlug: string;
  status: string;
  guestCount: number;
  dietary: string | null;
  partnerDietary: string | null;
  message: string | null;
  tableNumber: number | null;
  rsvpDate: string;
  updatedAt: string;
}

export function toCSV(rows: CSVRow[]): string {
  const headers = [
    'Guest ID', 'Name', 'Partner Name', 'Phone',
    'Event', 'Event Slug', 'Status', 'Guest Count',
    'Dietary Restrictions', 'Partner Dietary', 'Message',
    'Table Number', 'RSVP Date', 'Updated At',
  ];

  const dataRows = rows.map((r) => [
    r.guestId,
    r.name,
    r.partnerName ?? '',
    r.phone ?? '',
    r.eventName,
    r.eventSlug,
    r.status,
    r.guestCount,
    r.dietary ?? '',
    r.partnerDietary ?? '',
    r.message ?? '',
    r.tableNumber ?? '',
    r.rsvpDate,
    r.updatedAt,
  ]);

  const lines = [
    headers.map(escapeCsvField).join(','),
    ...dataRows.map((row) => row.map(escapeCsvField).join(',')),
  ];

  return lines.join('\r\n');
}
