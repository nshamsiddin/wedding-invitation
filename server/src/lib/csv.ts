function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  // Neutralise CSV formula injection: spreadsheet applications (Excel, Google Sheets)
  // interpret cells that start with =, +, -, or @ as formulas. Prefix with a tab
  // character to prevent execution while keeping the value human-readable.
  const safe = /^[=+\-@\t]/.test(str) ? `\t${str}` : str;
  if (safe.includes(',') || safe.includes('"') || safe.includes('\n') || safe.includes('\r') || safe.includes('\t')) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export interface CSVRow {
  guestId: number;
  name: string;
  email: string;
  phone: string | null;
  eventName: string;
  eventSlug: string;
  status: string;
  guestCount: number;
  dietary: string | null;
  message: string | null;
  rsvpDate: string;
  updatedAt: string;
}

export function toCSV(rows: CSVRow[]): string {
  const headers = [
    'Guest ID', 'Name', 'Email', 'Phone',
    'Event', 'Event Slug', 'Status', 'Guest Count',
    'Dietary Restrictions', 'Message',
    'RSVP Date', 'Updated At',
  ];

  const dataRows = rows.map((r) => [
    r.guestId,
    r.name,
    r.email,
    r.phone ?? '',
    r.eventName,
    r.eventSlug,
    r.status,
    r.guestCount,
    r.dietary ?? '',
    r.message ?? '',
    r.rsvpDate,
    r.updatedAt,
  ]);

  const lines = [
    headers.map(escapeCsvField).join(','),
    ...dataRows.map((row) => row.map(escapeCsvField).join(',')),
  ];

  return lines.join('\r\n');
}
