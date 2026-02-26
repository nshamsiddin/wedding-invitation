function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
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
