// Konstanta & helper tampilan analitik (port dari helpers/analytics.ts prototipe mitra).

import type {
  Difficulty,
  RegionalHeatmap,
  PracticeQuestion,
  StudentDetailItem,
} from 'src/models/analytics';

import type { PillTone } from 'src/components/data-display/status-pill';

export const LEVEL_OPTIONS = ['SMA', 'SMK', 'SMP'].map((j) => ({ value: j, label: j }));

export const STUDENT_STATUS: Record<StudentDetailItem['status'], { tone: PillTone; icon: string }> =
  {
    Selesai: { tone: 'success', icon: 'solar:check-circle-linear' },
    'Sedang Mengerjakan': { tone: 'info', icon: 'solar:clock-circle-linear' },
    'Belum Selesai': { tone: 'neutral', icon: 'solar:minus-circle-linear' },
  };

export const ANSWER_STATUS: Record<
  PracticeQuestion['status'],
  { label: string; icon: string; tone: PillTone }
> = {
  correct: { label: 'Benar', icon: 'solar:check-circle-linear', tone: 'success' },
  incorrect: { label: 'Salah', icon: 'solar:close-circle-linear', tone: 'danger' },
  unanswered: { label: 'Tidak dijawab', icon: 'solar:minus-circle-linear', tone: 'neutral' },
};

export const PRACTICE_DIFFICULTY: Record<PracticeQuestion['difficulty'], string> = {
  EASY: 'Mudah',
  MEDIUM: 'Sedang',
  HARD: 'Sulit',
};

export const DIFFICULTIES: Difficulty[] = ['MUDAH', 'SEDANG', 'SULIT'];

export const DIFFICULTY_STYLE: Record<Difficulty, { label: string; tone: PillTone; icon: string }> =
  {
    MUDAH: { label: 'Mudah', tone: 'success', icon: 'solar:smile-circle-linear' },
    SEDANG: { label: 'Sedang', tone: 'warning', icon: 'solar:expressionless-circle-linear' },
    SULIT: { label: 'Sulit', tone: 'danger', icon: 'solar:sad-circle-linear' },
  };

/** Level capaian indikator: ≥ 70 baik, 50–70 cukup, < 50 perlu perhatian (selalu berlabel). */
export const achievementLevel = (
  percentage: number
): { label: string; tone: PillTone; bar: string } => {
  if (percentage >= 70) return { label: 'Baik', tone: 'success', bar: 'bg-success' };
  if (percentage >= 50) return { label: 'Cukup', tone: 'warning', bar: 'bg-warning' };
  return { label: 'Perlu perhatian', tone: 'danger', bar: 'bg-destructive' };
};

export const ACHIEVEMENT_LEGEND = [
  { ...achievementLevel(80), range: '≥ 70%' },
  { ...achievementLevel(60), range: '50–70%' },
  { ...achievementLevel(40), range: '< 50%' },
];

export interface HeatmapRow {
  label: string;
  value: number;
  aboveAverage: boolean;
  /** lebar bar relatif terhadap nilai tertinggi (0–100) */
  widthPct: number;
}

/** Baris heatmap urut nilai tertinggi + posisi garis rata-rata (persen lebar). */
export const buildHeatmap = (heatmap?: RegionalHeatmap) => {
  const average = heatmap?.national_average ?? 0;
  const max = Math.max(1, ...(heatmap?.data.map((d) => d.value) ?? [1]));
  const rows: HeatmapRow[] = (heatmap?.data ?? [])
    .slice()
    .sort((a, b) => b.value - a.value)
    .map((d) => ({
      label: d.label,
      value: d.value,
      aboveAverage: d.value >= average,
      widthPct: (d.value / max) * 100,
    }));
  return { rows, average, averagePct: (average / max) * 100 };
};

/** Medali untuk 3 besar peringkat. */
export const RANK_STYLE = [
  'bg-[#F6E7B8] text-[#7A5A00]',
  'bg-[#E4E8ED] text-[#3F4A55]',
  'bg-[#F1DCCB] text-[#7A4220]',
];
