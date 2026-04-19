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

export interface EventTableCSVGroup {
  eventName: string;
  eventSlug: string;
  tableNumber: number | null;
  rows: CSVRow[];
}

const CSV_HEADERS = [
  'Guest ID', 'Name', 'Partner Name', 'Phone',
  'Event', 'Event Slug', 'Status', 'Guest Count',
  'Dietary Restrictions', 'Partner Dietary', 'Message',
  'Table Number', 'RSVP Date', 'Updated At',
];

export function toCSV(rows: CSVRow[]): string {
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
    CSV_HEADERS.map(escapeCsvField).join(','),
    ...dataRows.map((row) => row.map(escapeCsvField).join(',')),
  ];

  return lines.join('\r\n');
}

export function toEventTableCSV(groups: EventTableCSVGroup[]): string {
  const sections: string[] = [];

  for (const group of groups) {
    const tableLabel = group.tableNumber === null ? 'Unassigned' : `Table ${group.tableNumber}`;

    sections.push(`Event,${escapeCsvField(group.eventName)}`);
    sections.push(`Event Slug,${escapeCsvField(group.eventSlug)}`);
    sections.push(`Table,${escapeCsvField(tableLabel)}`);
    sections.push(CSV_HEADERS.map(escapeCsvField).join(','));

    for (const row of group.rows) {
      const csvRow = [
        row.guestId,
        row.name,
        row.partnerName ?? '',
        row.phone ?? '',
        row.eventName,
        row.eventSlug,
        row.status,
        row.guestCount,
        row.dietary ?? '',
        row.partnerDietary ?? '',
        row.message ?? '',
        row.tableNumber ?? '',
        row.rsvpDate,
        row.updatedAt,
      ];
      sections.push(csvRow.map(escapeCsvField).join(','));
    }

    sections.push('');
  }

  return sections.join('\r\n');
}
