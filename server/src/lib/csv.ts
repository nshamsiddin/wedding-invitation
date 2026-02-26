import type { GuestRow } from '../db/schema.js';

function escapeCsvField(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function guestsToCSV(guests: GuestRow[]): string {
  const headers = [
    'ID',
    'Name',
    'Email',
    'Status',
    'Guest Count',
    'Dietary Restrictions',
    'Message',
    'RSVP Date',
    'Updated At',
  ];

  const rows = guests.map((g) => [
    g.id,
    g.name,
    g.email,
    g.status,
    g.guestCount,
    g.dietary ?? '',
    g.message ?? '',
    g.createdAt,
    g.updatedAt,
  ]);

  const lines = [
    headers.map(escapeCsvField).join(','),
    ...rows.map((row) => row.map(escapeCsvField).join(',')),
  ];

  return lines.join('\r\n');
}
