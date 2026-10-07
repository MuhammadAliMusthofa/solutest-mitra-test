// Parse & validasi file import siswa (port dari prototipe mitra).

import type { ImportStudentRow } from 'src/models/member';

export const MAX_IMPORT_ROWS = 1000;
export const JENJANG_OPTIONS = ['SD', 'SMP', 'SMA', 'SMK'];

/** Kolom template: [key, judul kolom, wajib?, contoh]. */
export const IMPORT_COLUMNS: {
  key: keyof ImportStudentRow;
  header: string;
  required: boolean;
  example: string;
}[] = [
  { key: 'name', header: 'nama', required: true, example: 'Adit Pratama' },
  { key: 'email', header: 'email', required: true, example: 'adit.pratama@contoh.id' },
  { key: 'password', header: 'password', required: true, example: 'rahasia123' },
  { key: 'nisn', header: 'nisn', required: false, example: '0051234567' },
  { key: 'school', header: 'sekolah', required: true, example: 'SMA Negeri 1 Bandung' },
  { key: 'class', header: 'kelas', required: false, example: 'XII IPA 1' },
  { key: 'jenjang', header: 'jenjang', required: false, example: 'SMA' },
];

/** Alias judul kolom yang diterima (huruf kecil, tanpa spasi/tanda baca). */
const HEADER_ALIASES: Record<string, keyof ImportStudentRow> = {
  nama: 'name',
  namalengkap: 'name',
  name: 'name',
  email: 'email',
  surel: 'email',
  password: 'password',
  katasandi: 'password',
  nisn: 'nisn',
  sekolah: 'school',
  asalsekolah: 'school',
  school: 'school',
  kelas: 'class',
  class: 'class',
  jenjang: 'jenjang',
};

const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z]/g, '');

export interface ParsedRow {
  /** nomor baris di file (header = baris 1) */
  line: number;
  data: ImportStudentRow;
  errors: string[];
}

export interface ParseResult {
  rows: ParsedRow[];
  missingColumns: string[];
  truncated: boolean;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validasi satu baris; `seenEmails` dipakai untuk mendeteksi email duplikat di file. */
export const validateRow = (row: ImportStudentRow, seenEmails: Set<string>): string[] => {
  const errors: string[] = [];
  if (!row.name) errors.push('Nama wajib diisi');
  if (!row.email) errors.push('Email wajib diisi');
  else if (!EMAIL_RE.test(row.email)) errors.push('Format email tidak valid');
  else if (seenEmails.has(row.email)) errors.push('Email duplikat di file');
  if (!row.password) errors.push('Password wajib diisi');
  else if (row.password.length < 6) errors.push('Password minimal 6 karakter');
  if (!row.school) errors.push('Sekolah wajib diisi');
  if (row.nisn && !/^\d{10}$/.test(row.nisn)) errors.push('NISN harus 10 digit angka');
  if (row.jenjang && !JENJANG_OPTIONS.includes(row.jenjang))
    errors.push(`Jenjang harus salah satu: ${JENJANG_OPTIONS.join(', ')}`);
  return errors;
};

/** Ubah tabel mentah (baris pertama = header) menjadi baris tervalidasi. */
export const parseTable = (table: unknown[][]): ParseResult => {
  const [headerRow = [], ...body] = table;
  const columnIndex = new Map<keyof ImportStudentRow, number>();
  headerRow.forEach((h, i) => {
    const key = HEADER_ALIASES[normalizeHeader(String(h ?? ''))];
    if (key && !columnIndex.has(key)) columnIndex.set(key, i);
  });

  const missingColumns = IMPORT_COLUMNS.filter((c) => c.required && !columnIndex.has(c.key)).map(
    (c) => c.header
  );

  const cell = (r: unknown[], key: keyof ImportStudentRow) => {
    const i = columnIndex.get(key);
    return i === undefined ? '' : String(r[i] ?? '').trim();
  };

  const nonEmpty = body
    .map((r, i) => ({ r, line: i + 2 }))
    .filter(({ r }) => r.some((v) => String(v ?? '').trim() !== ''));

  const seenEmails = new Set<string>();
  const rows = nonEmpty.slice(0, MAX_IMPORT_ROWS).map(({ r, line }) => {
    const data: ImportStudentRow = {
      name: cell(r, 'name'),
      email: cell(r, 'email').toLowerCase(),
      password: cell(r, 'password'),
      nisn: cell(r, 'nisn'),
      school: cell(r, 'school'),
      class: cell(r, 'class'),
      jenjang: cell(r, 'jenjang').toUpperCase(),
    };
    const errors = validateRow(data, seenEmails);
    if (data.email) seenEmails.add(data.email);
    return { line, data, errors };
  });

  return { rows, missingColumns, truncated: nonEmpty.length > MAX_IMPORT_ROWS };
};

/** Baca file CSV/XLSX → tabel mentah. SheetJS dimuat dinamis agar tidak masuk bundle utama. */
export const readSpreadsheet = async (file: File): Promise<unknown[][]> => {
  const XLSX = await import('xlsx');
  const buffer = await file.arrayBuffer();
  // `raw: true` agar NISN berawalan 0 tidak berubah menjadi angka.
  const workbook = XLSX.read(buffer, { type: 'array', raw: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: false, defval: '' });
};

export const downloadTemplate = async (format: 'xlsx' | 'csv') => {
  const XLSX = await import('xlsx');
  const sheet = XLSX.utils.aoa_to_sheet([
    IMPORT_COLUMNS.map((c) => c.header),
    IMPORT_COLUMNS.map((c) => c.example),
  ]);
  // NISN sebagai teks agar nol di depan tidak hilang saat dibuka di Excel.
  sheet.D2 = { t: 's', v: IMPORT_COLUMNS[3].example };
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, sheet, 'Siswa');
  XLSX.writeFile(book, `template-import-siswa.${format}`, { bookType: format });
};

export const IMPORT_ACCEPT = '.xlsx,.xls,.csv';
export const MAX_IMPORT_FILE_MB = 5;

/** Pesan error bila file tidak bisa diimpor (format/ukuran); null bila boleh dibaca. */
export const validateImportFile = (file: File): string | null => {
  if (!/\.(xlsx|xls|csv)$/i.test(file.name)) return 'Format file harus .xlsx, .xls, atau .csv';
  if (file.size > MAX_IMPORT_FILE_MB * 1024 * 1024)
    return `Ukuran file maksimal ${MAX_IMPORT_FILE_MB} MB`;
  return null;
};

export type ImportRowFilter = 'all' | 'valid' | 'invalid';

/** Pisahkan baris valid & bermasalah, plus baris yang tampil untuk filter aktif. */
export const splitParsedRows = (parsed: ParseResult | null, filter: ImportRowFilter) => {
  const all = parsed?.rows ?? [];
  const valid = all.filter((r) => !r.errors.length);
  const invalid = all.filter((r) => r.errors.length);
  const visible = { all, valid, invalid }[filter];
  return { all, valid, invalid, visible };
};
