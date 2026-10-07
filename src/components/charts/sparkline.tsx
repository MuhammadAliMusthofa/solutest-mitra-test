'use client';

import { cn } from 'src/lib/utils';

interface Props {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
  label?: string;
}

/** Sparkline SVG ringan untuk KPI (tanpa sumbu; nilai lengkap ada di tooltip/tabel halaman). */
export function Sparkline({
  values,
  width = 96,
  height = 36,
  color = 'var(--primary)',
  className,
  label,
}: Props) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pad = 4;
  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * (width - pad * 2);
    const y = pad + (1 - (v - min) / range) * (height - pad * 2);
    return [x, y] as const;
  });
  const d = points.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const [lx, ly] = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('overflow-visible', className)}
      role="img"
      aria-label={label ?? `Tren: ${values.map((v) => v.toLocaleString('id-ID')).join(', ')}`}
    >
      <path d={`${d} L${lx},${height} L${points[0][0]},${height} Z`} fill={color} opacity={0.08} />
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lx} cy={ly} r={4} fill={color} stroke="var(--card)" strokeWidth={2} />
    </svg>
  );
}
