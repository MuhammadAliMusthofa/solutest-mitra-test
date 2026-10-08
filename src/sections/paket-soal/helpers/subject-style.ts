// Warna & ikon kartu per mapel (paket soal). Tone diambil bergiliran dari id mapel agar konsisten
// antar halaman; ikon dipilih dari kata kunci nama mapel.

import type { KpiTone } from 'src/components/data-display/kpi-card';

const TONES: KpiTone[] = ['primary', 'secondary', 'info', 'success', 'warning', 'accent'];

export const subjectTone = (id: number): KpiTone => TONES[Math.abs(id) % TONES.length];

const ICONS: [RegExp, string][] = [
  [/matematika|numerasi/i, 'solar:calculator-minimalistic-bold'],
  [/fisika/i, 'solar:atom-bold'],
  [/kimia/i, 'solar:test-tube-bold'],
  [/biologi|ipa/i, 'solar:leaf-bold'],
  [/inggris|english/i, 'solar:global-bold'],
  [/indonesia|bahasa|literasi/i, 'solar:book-2-bold'],
  [/sejarah|ips|geografi|ekonomi|sosiologi/i, 'solar:map-bold'],
];

export const subjectIcon = (name?: string | null) =>
  ICONS.find(([re]) => name && re.test(name))?.[1] ?? 'solar:box-bold';
