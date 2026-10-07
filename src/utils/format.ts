// Formatter tampilan umum (angka, skor, durasi, tanggal) — fungsi murni, locale id-ID.

/** Angka bulat format Indonesia (1.234); '-' bila belum ada data. */
export const formatNumber = (value?: number | null) =>
  value === undefined || value === null ? '-' : value.toLocaleString('id-ID');

export const formatScore = (value?: number | null, digits = 1) =>
  value === null || value === undefined || Number.isNaN(value) ? '-' : value.toFixed(digits);

/** Selisih bertanda: +1.3 / -0.5. */
export const formatSigned = (value: number, digits = 1) =>
  `${value >= 0 ? '+' : ''}${value.toFixed(digits)}`;

export const formatPercent = (value?: number | null, digits = 0) =>
  value === null || value === undefined ? '-' : `${value.toFixed(digits)}%`;

/** 125 detik → "2m 05s" */
export const formatDuration = (seconds: number) => {
  const m = Math.floor(seconds / 60);
  const s = Math.round(seconds % 60);
  return `${m}m ${String(s).padStart(2, '0')}s`;
};

/** 3725 detik → "01:02:05" */
export const formatClock = (seconds: number) => {
  const safe = Math.max(0, Math.floor(seconds));
  const h = Math.floor(safe / 3600);
  const m = Math.floor((safe % 3600) / 60);
  const s = safe % 60;
  return [h, m, s].map((n) => String(n).padStart(2, '0')).join(':');
};

const toDate = (value: string) => new Date(value.includes('T') ? value : value.replace(' ', 'T'));

/** "6 Okt 2026" */
export const formatShortDate = (value?: string | null) =>
  value
    ? toDate(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
    : '-';

/** "6 Oktober 2026" */
export const formatLongDate = (value?: string | null) =>
  value
    ? toDate(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
    : '-';

/** "6 Okt 2026, 08.00" */
export const formatDateTime = (value?: string | null) =>
  value
    ? toDate(value).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

/** "6 Okt, 08.00" (tanpa tahun) */
export const formatDayTime = (value?: string | null) =>
  value
    ? toDate(value).toLocaleString('id-ID', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '-';

/** Inisial nama untuk avatar: "Adit Pratama" → "AP" */
export const initials = (name?: string | null) =>
  (name ?? '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');

/** Sapaan berdasarkan jam lokal. */
export const greeting = (date = new Date()) => {
  const h = date.getHours();
  if (h < 11) return 'Selamat pagi';
  if (h < 15) return 'Selamat siang';
  if (h < 18) return 'Selamat sore';
  return 'Selamat malam';
};
