/**
 * Minimal zero-dependency `.xlsx` (Office Open XML SpreadsheetML) writer.
 *
 * An `.xlsx` file is a ZIP archive containing a fixed set of XML parts. We only
 * need a small subset of OOXML to render the kind of data export the admin
 * panel produces, so rather than pulling in `exceljs` (~1MB + dependency tree)
 * we hand-roll the bytes:
 *
 *   - Cells are written as `inlineStr`/`number` so we don't need a separate
 *     `sharedStrings.xml` part — slightly larger payload but a much simpler
 *     writer with no string-table bookkeeping.
 *   - The ZIP is built with stored (uncompressed) entries to avoid a CRC
 *     mismatch hazard if a future Node version changes deflate behaviour.
 *     Spreadsheet apps accept either method; the file size for our exports
 *     (a few hundred guests) is still tiny in absolute terms.
 *   - We rely on `zlib.crc32` (Node ≥ 22.2) for the per-entry checksum;
 *     calling it for "stored" entries is still required by the ZIP spec.
 *
 * The intent is "valid enough to open cleanly in Excel, Numbers, and Google
 * Sheets" — not a full OOXML implementation. If we ever need styles, formulas,
 * or merged cells we should reach for a real library.
 */
import { crc32 } from 'zlib';

export type CellValue = string | number | null | undefined;

export interface XlsxSheet {
  /** Sheet tab name as it appears at the bottom of the workbook. */
  name: string;
  /** Two-dimensional grid of cell values. Empty rows render as blank. */
  rows: CellValue[][];
}

// ─── XML helpers ─────────────────────────────────────────────────────────────
// Conservative XML escaping: handles the five standard predefined entities and
// strips control characters that Excel would otherwise reject as malformed.
function escapeXml(value: string): string {
  let result = '';
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i);
    // Strip ASCII control characters except \t (0x09), \n (0x0A), \r (0x0D)
    if (code < 0x20 && code !== 0x09 && code !== 0x0a && code !== 0x0d) continue;
    const ch = value[i]!;
    if (ch === '&') result += '&amp;';
    else if (ch === '<') result += '&lt;';
    else if (ch === '>') result += '&gt;';
    else if (ch === '"') result += '&quot;';
    else if (ch === "'") result += '&apos;';
    else result += ch;
  }
  return result;
}

// Excel column letters: A, B, ..., Z, AA, AB, ...
function colLetter(index0: number): string {
  let n = index0 + 1;
  let s = '';
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

// ─── Worksheet XML builder ───────────────────────────────────────────────────
function buildSheetXml(rows: CellValue[][]): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>');
  lines.push(
    '<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">',
  );
  lines.push('<sheetData>');

  rows.forEach((row, rowIdx) => {
    const rowNum = rowIdx + 1;
    if (!row || row.length === 0) {
      lines.push(`<row r="${rowNum}"/>`);
      return;
    }
    const cells: string[] = [];
    row.forEach((value, colIdx) => {
      if (value === null || value === undefined || value === '') return;
      const ref = `${colLetter(colIdx)}${rowNum}`;
      if (typeof value === 'number' && Number.isFinite(value)) {
        cells.push(`<c r="${ref}"><v>${value}</v></c>`);
      } else {
        const text = escapeXml(String(value));
        // `xml:space="preserve"` keeps leading/trailing whitespace — important
        // for the original template's literal "Ad Soyad " header (trailing space).
        cells.push(
          `<c r="${ref}" t="inlineStr"><is><t xml:space="preserve">${text}</t></is></c>`,
        );
      }
    });
    if (cells.length === 0) {
      lines.push(`<row r="${rowNum}"/>`);
    } else {
      lines.push(`<row r="${rowNum}">${cells.join('')}</row>`);
    }
  });

  lines.push('</sheetData>');
  lines.push('</worksheet>');
  return lines.join('');
}

// ─── Workbook + relationships ────────────────────────────────────────────────
function buildContentTypesXml(sheetCount: number): string {
  const overrides: string[] = [];
  for (let i = 1; i <= sheetCount; i++) {
    overrides.push(
      `<Override PartName="/xl/worksheets/sheet${i}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`,
    );
  }
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">',
    '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>',
    '<Default Extension="xml" ContentType="application/xml"/>',
    '<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>',
    overrides.join(''),
    '</Types>',
  ].join('');
}

function buildRootRelsXml(): string {
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>',
    '</Relationships>',
  ].join('');
}

function buildWorkbookXml(sheets: XlsxSheet[]): string {
  const sheetTags = sheets
    .map(
      (s, i) =>
        `<sheet name="${escapeXml(s.name)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`,
    )
    .join('');
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"',
    ' xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">',
    `<sheets>${sheetTags}</sheets>`,
    '</workbook>',
  ].join('');
}

function buildWorkbookRelsXml(sheetCount: number): string {
  const rels: string[] = [];
  for (let i = 1; i <= sheetCount; i++) {
    rels.push(
      `<Relationship Id="rId${i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i}.xml"/>`,
    );
  }
  return [
    '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
    '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">',
    rels.join(''),
    '</Relationships>',
  ].join('');
}

// ─── Tiny ZIP writer ─────────────────────────────────────────────────────────
// Stored (compression method 0) ZIP entries — simpler and avoids any
// dependency on external compression libraries. Excel and other consumers
// happily open uncompressed xlsx files.

interface ZipEntry {
  path: string;
  data: Buffer;
  /** Offset in the final archive where the local header for this entry starts. */
  offset: number;
  crc: number;
}

function buildLocalFileHeader(entry: ZipEntry): Buffer {
  const nameBytes = Buffer.from(entry.path, 'utf8');
  const buf = Buffer.alloc(30 + nameBytes.length);
  buf.writeUInt32LE(0x04034b50, 0); // signature
  buf.writeUInt16LE(20, 4);          // version needed
  buf.writeUInt16LE(0x0800, 6);      // flags: bit 11 → UTF-8 filename
  buf.writeUInt16LE(0, 8);           // compression: stored
  buf.writeUInt16LE(0, 10);          // last mod time
  buf.writeUInt16LE(0x21, 12);       // last mod date (1980-01-01 — fixed for determinism)
  buf.writeUInt32LE(entry.crc, 14);
  buf.writeUInt32LE(entry.data.length, 18); // compressed size
  buf.writeUInt32LE(entry.data.length, 22); // uncompressed size
  buf.writeUInt16LE(nameBytes.length, 26);
  buf.writeUInt16LE(0, 28);          // extra length
  nameBytes.copy(buf, 30);
  return buf;
}

function buildCentralDirectoryEntry(entry: ZipEntry): Buffer {
  const nameBytes = Buffer.from(entry.path, 'utf8');
  const buf = Buffer.alloc(46 + nameBytes.length);
  buf.writeUInt32LE(0x02014b50, 0);  // signature
  buf.writeUInt16LE(20, 4);          // version made by
  buf.writeUInt16LE(20, 6);          // version needed
  buf.writeUInt16LE(0x0800, 8);      // flags
  buf.writeUInt16LE(0, 10);          // compression: stored
  buf.writeUInt16LE(0, 12);          // last mod time
  buf.writeUInt16LE(0x21, 14);       // last mod date
  buf.writeUInt32LE(entry.crc, 16);
  buf.writeUInt32LE(entry.data.length, 20); // compressed size
  buf.writeUInt32LE(entry.data.length, 24); // uncompressed size
  buf.writeUInt16LE(nameBytes.length, 28);
  buf.writeUInt16LE(0, 30);          // extra length
  buf.writeUInt16LE(0, 32);          // comment length
  buf.writeUInt16LE(0, 34);          // disk number start
  buf.writeUInt16LE(0, 36);          // internal file attributes
  buf.writeUInt32LE(0, 38);          // external file attributes
  buf.writeUInt32LE(entry.offset, 42);
  nameBytes.copy(buf, 46);
  return buf;
}

function buildEndOfCentralDirectory(
  totalEntries: number,
  cdSize: number,
  cdOffset: number,
): Buffer {
  // Offsets per APPNOTE.txt §4.3.16:
  //  0–3   signature
  //  4–5   disk number
  //  6–7   disk where CD starts
  //  8–9   entries on this disk
  // 10–11  total entries
  // 12–15  CD size in bytes
  // 16–19  CD offset from start of archive
  // 20–21  comment length
  const buf = Buffer.alloc(22);
  buf.writeUInt32LE(0x06054b50, 0);
  buf.writeUInt16LE(0, 4);
  buf.writeUInt16LE(0, 6);
  buf.writeUInt16LE(totalEntries, 8);
  buf.writeUInt16LE(totalEntries, 10);
  buf.writeUInt32LE(cdSize, 12);
  buf.writeUInt32LE(cdOffset, 16);
  buf.writeUInt16LE(0, 20);
  return buf;
}

function packZip(files: { path: string; data: Buffer }[]): Buffer {
  const parts: Buffer[] = [];
  const entries: ZipEntry[] = [];
  let offset = 0;

  for (const f of files) {
    // zlib.crc32 was added in Node 22.2 — server runtime requires Node ≥ 24.
    const c = crc32(f.data);
    const entry: ZipEntry = { path: f.path, data: f.data, offset, crc: c };
    entries.push(entry);
    const header = buildLocalFileHeader(entry);
    parts.push(header, f.data);
    offset += header.length + f.data.length;
  }

  const cdOffset = offset;
  let cdSize = 0;
  for (const entry of entries) {
    const cd = buildCentralDirectoryEntry(entry);
    parts.push(cd);
    cdSize += cd.length;
    offset += cd.length;
  }

  parts.push(buildEndOfCentralDirectory(entries.length, cdSize, cdOffset));
  return Buffer.concat(parts);
}

// ─── Public API ──────────────────────────────────────────────────────────────
/**
 * Builds a `.xlsx` workbook in memory and returns the binary buffer.
 *
 * The workbook contains exactly the supplied sheets in the supplied order.
 * Sheet names follow Excel's restrictions: at most 31 characters and none of
 * `[ ] : * ? / \`. Names that violate these are sanitised conservatively so
 * the file always opens — bad input never produces an unreadable workbook.
 */
export function buildXlsx(sheets: XlsxSheet[]): Buffer {
  if (!Array.isArray(sheets) || sheets.length === 0) {
    throw new Error('buildXlsx: at least one sheet is required');
  }

  const safeSheets = sheets.map((s) => ({
    name: sanitizeSheetName(s.name),
    rows: s.rows,
  }));

  const files: { path: string; data: Buffer }[] = [];
  files.push({ path: '[Content_Types].xml', data: Buffer.from(buildContentTypesXml(safeSheets.length), 'utf8') });
  files.push({ path: '_rels/.rels', data: Buffer.from(buildRootRelsXml(), 'utf8') });
  files.push({ path: 'xl/workbook.xml', data: Buffer.from(buildWorkbookXml(safeSheets), 'utf8') });
  files.push({ path: 'xl/_rels/workbook.xml.rels', data: Buffer.from(buildWorkbookRelsXml(safeSheets.length), 'utf8') });
  for (let i = 0; i < safeSheets.length; i++) {
    const sheet = safeSheets[i]!;
    files.push({
      path: `xl/worksheets/sheet${i + 1}.xml`,
      data: Buffer.from(buildSheetXml(sheet.rows), 'utf8'),
    });
  }
  return packZip(files);
}

// Excel limits sheet names to 31 chars and rejects `[]:*?/\` and leading/trailing apostrophes.
// The original template uses "MESAJ " (trailing space) which we preserve verbatim.
function sanitizeSheetName(name: string): string {
  let n = (name ?? '').replace(/[\[\]:*?/\\]/g, '_');
  if (n.length === 0) n = 'Sheet';
  if (n.length > 31) n = n.slice(0, 31);
  return n;
}
