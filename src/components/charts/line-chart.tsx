'use client';

import type { ChartSeries } from './chart-types';

import { Area, XAxis, YAxis, AreaChart, CartesianGrid } from 'recharts';

import {
  ChartLegend,
  ChartTooltip,
  ChartContainer,
  ChartLegendContent,
  ChartTooltipContent,
} from 'src/components/ui/chart';

import { cn } from 'src/lib/utils';

import { AXIS_PROPS, seriesColor, toChartConfig } from './chart-types';

interface Props {
  data: Record<string, unknown>[];
  xKey: string;
  series: ChartSeries[];
  height?: number;
  yDomain?: [number | 'auto', number | 'auto'];
  valueFormatter?: (value: number) => string;
  /** isi area tipis (~10%) di bawah garis */
  area?: boolean;
  /** garis putus-putus untuk seri pembanding (mis. rata-rata sekolah) */
  dashedKeys?: string[];
  className?: string;
}

/** Line chart: garis 2px, marker r4 dengan cincin 2px warna permukaan, crosshair tooltip. */
export function LineChart({
  data,
  xKey,
  series,
  height = 280,
  yDomain,
  valueFormatter = (v) => v.toLocaleString('id-ID'),
  area = true,
  dashedKeys = [],
  className,
}: Props) {
  const config = toChartConfig(series);
  return (
    <ChartContainer
      config={config}
      className={cn('aspect-auto w-full', className)}
      style={{ height }}
    >
      <AreaChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={seriesColor(s, i)} stopOpacity={0.14} />
              <stop offset="100%" stopColor={seriesColor(s, i)} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid vertical={false} stroke="var(--border)" />
        <XAxis dataKey={xKey} {...AXIS_PROPS} />
        <YAxis domain={yDomain} tickFormatter={valueFormatter} width={44} {...AXIS_PROPS} />
        <ChartTooltip
          cursor={{ stroke: 'var(--muted-foreground)', strokeWidth: 1 }}
          content={
            <ChartTooltipContent indicator="line" formatter={(v) => valueFormatter(Number(v))} />
          }
        />
        {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s, i) => {
          const color = seriesColor(s, i);
          const dashed = dashedKeys.includes(s.key);
          return (
            <Area
              key={s.key}
              type="monotone"
              dataKey={s.key}
              name={s.label}
              stroke={color}
              strokeWidth={2}
              strokeDasharray={dashed ? '5 4' : undefined}
              fill={area && !dashed ? `url(#fill-${s.key})` : 'transparent'}
              dot={{ r: 4, fill: color, stroke: 'var(--card)', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: color, stroke: 'var(--card)', strokeWidth: 2 }}
              connectNulls
              isAnimationActive={false}
            />
          );
        })}
      </AreaChart>
    </ChartContainer>
  );
}
