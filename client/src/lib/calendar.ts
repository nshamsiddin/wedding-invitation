/**
 * Calendar helpers for the post-RSVP success screen.
 *
 * We build both a Google Calendar deep-link and a downloadable .ics blob so
 * guests on Apple Calendar / Outlook / Fantastical can add the event natively.
 * The .ics format is a single-event VCALENDAR document with DTSTART/DTEND in
 * floating local time (no TZID) — the venue's local clock is the source of
 * truth for "when" the wedding starts, regardless of where the guest opens
 * the file. This keeps the export portable across phones that travel across
 * time zones in the lead-up to the day.
 */

export interface CalendarEventInput {
  title: string;
  startDate: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationHours?: number; // defaults to 4
  location?: string | null;
  description?: string | null;
}

const DEFAULT_DURATION_HOURS = 4;

function padTwo(n: number): string {
  return String(n).padStart(2, '0');
}

function formatDateTimeForIcs(date: string, time: string): string {
  // YYYY-MM-DDTHH:MM:SS → YYYYMMDDTHHMMSS (floating local, no Z suffix)
  const [y, mo, d] = date.split('-');
  const [h, mi] = time.split(':');
  return `${y}${mo}${d}T${padTwo(parseInt(h, 10))}${padTwo(parseInt(mi, 10))}00`;
}

function addHoursToDateTime(date: string, time: string, hours: number): { date: string; time: string } {
  const [y, mo, d] = date.split('-').map((s) => parseInt(s, 10));
  const [h, mi] = time.split(':').map((s) => parseInt(s, 10));
  const dt = new Date(y, mo - 1, d, h, mi, 0, 0);
  dt.setHours(dt.getHours() + hours);
  const yy = dt.getFullYear();
  const mm = padTwo(dt.getMonth() + 1);
  const dd = padTwo(dt.getDate());
  const hh = padTwo(dt.getHours());
  const mii = padTwo(dt.getMinutes());
  return { date: `${yy}-${mm}-${dd}`, time: `${hh}:${mii}` };
}

/**
 * Build a Google Calendar render URL. The action=TEMPLATE form opens the
 * compose screen so the guest can review before saving — a more forgiving
 * UX than a direct insert.
 */
export function buildGoogleCalendarUrl(input: CalendarEventInput): string {
  const duration = input.durationHours ?? DEFAULT_DURATION_HOURS;
  const start = formatDateTimeForIcs(input.startDate, input.startTime);
  const endParts = addHoursToDateTime(input.startDate, input.startTime, duration);
  const end = formatDateTimeForIcs(endParts.date, endParts.time);
  const qs = new URLSearchParams({
    action: 'TEMPLATE',
    text: input.title,
    dates: `${start}/${end}`,
    ...(input.location ? { location: input.location } : {}),
    ...(input.description ? { details: input.description } : {}),
  });
  return `https://calendar.google.com/calendar/render?${qs.toString()}`;
}

/**
 * Escape special characters per RFC 5545 §3.3.11 (TEXT type).
 * Newlines must be encoded as backslash-n; commas, semicolons and backslashes
 * are escaped with a leading backslash.
 */
function icsEscape(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\r?\n/g, '\\n')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;');
}

/**
 * Build an .ics document string. The UID is derived from a deterministic
 * fingerprint so importing the same export twice does not create duplicate
 * events in the guest's calendar.
 */
export function buildIcsContent(input: CalendarEventInput): string {
  const duration = input.durationHours ?? DEFAULT_DURATION_HOURS;
  const start = formatDateTimeForIcs(input.startDate, input.startTime);
  const endParts = addHoursToDateTime(input.startDate, input.startTime, duration);
  const end = formatDateTimeForIcs(endParts.date, endParts.time);

  // Stable UID — derived from the event's date+time+title rather than Date.now()
  // so re-downloading the same .ics doesn't multiply the event in the calendar.
  const uidSeed = `${start}-${icsEscape(input.title)}`.replace(/[^a-zA-Z0-9-]/g, '');
  const uid = `${uidSeed}@invitation`;

  // DTSTAMP must be UTC per RFC 5545. We use the current UTC time.
  const now = new Date();
  const dtStamp =
    now.getUTCFullYear().toString() +
    padTwo(now.getUTCMonth() + 1) +
    padTwo(now.getUTCDate()) +
    'T' +
    padTwo(now.getUTCHours()) +
    padTwo(now.getUTCMinutes()) +
    padTwo(now.getUTCSeconds()) +
    'Z';

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//invitation//RSVP//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtStamp}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:${icsEscape(input.title)}`,
  ];
  if (input.location) lines.push(`LOCATION:${icsEscape(input.location)}`);
  if (input.description) lines.push(`DESCRIPTION:${icsEscape(input.description)}`);
  lines.push('END:VEVENT', 'END:VCALENDAR');
  return lines.join('\r\n');
}

/**
 * Return a Blob URL the browser can open or download. The caller is
 * responsible for revoking the URL when the component unmounts to avoid
 * leaking the underlying Blob.
 */
export function buildIcsBlobUrl(input: CalendarEventInput): string {
  const blob = new Blob([buildIcsContent(input)], { type: 'text/calendar;charset=utf-8' });
  return URL.createObjectURL(blob);
}
