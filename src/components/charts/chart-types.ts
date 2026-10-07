// Tipe & palet bersama komponen chart global.
// Palet kategorikal = token --chart-1..5 (tervalidasi; urutan tetap, tidak pernah diputar ulang).

export interface ChartSeries {
  /** key field di data */
  key: string;
  label: string;
  /** warna CSS; default mengikuti urutan palet kategorikal */
  color?: string;
}

export const CATEGORICAL = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
];

/** Warna status (benar/salah/kosong, naik/turun) — selalu disertai label/legend. */
export const STATUS_COLORS = {
  good: 'var(--success)',
  critical: 'var(--destructive)',
  neutral: '#c6ccd6',
  warning: 'var(--warning)',
};

export const seriesColor = (s: ChartSeries, index: number) =>
  s.color ?? CATEGORICAL[index % CATEGORICAL.length];

export const toChartConfig = (series: ChartSeries[]) =>
  Object.fromEntries(series.map((s, i) => [s.key, { label: s.label, color: seriesColor(s, i) }]));

/** Gaya sumbu & grid: hairline solid, resesif. */
export const AXIS_PROPS = {
  tickLine: false,
  axisLine: false,
  tickMargin: 8,
  fontSize: 12,
} as const;
