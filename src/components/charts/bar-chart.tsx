'use client';

import type { ChartSeries } from './chart-types';

import { Bar, Cell, XAxis, YAxis, CartesianGrid, BarChart as RBarChart } from 'recharts';

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
  categoryKey: string;
  series: ChartSeries[];
  /** horizontal = batang mendatar (kategori di sumbu Y) */
  horizontal?: boolean;
  stacked?: boolean;
  height?: number;
  yDomain?: [number | 'auto', number | 'auto'];
  valueFormatter?: (value: number) => string;
  className?: string;
  /** warna per batang (single series), mis. distribusi berwarna status */
  barColors?: string[];
}

/**
 * Bar/column chart: tebal ≤ 24px, ujung data membulat 4px & datar di baseline,
 * celah 2px antar segmen stack, legend hanya bila ≥ 2 seri.
 */
export function BarChart({
  data,
  categoryKey,
  series,
  horizontal,
  stacked,
  height = 280,
  yDomain,
  valueFormatter = (v) => v.toLocaleString('id-ID'),
  className,
  barColors,
}: Props) {
  const config = toChartConfig(series);
  const radius = (last: boolean): [number, number, number, number] => {
    if (!last) return [0, 0, 0, 0];
    return horizontal ? [0, 4, 4, 0] : [4, 4, 0, 0];
  };

  return (
    <ChartContainer
      config={config}
      className={cn('aspect-auto w-full', className)}
      style={{ height }}
    >
      <RBarChart
        data={data}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 8, right: 12, left: horizontal ? 8 : -8, bottom: 0 }}
        barCategoryGap="28%"
      >
        <CartesianGrid
          vertical={Boolean(horizontal)}
          horizontal={!horizontal}
          stroke="var(--border)"
          strokeDasharray="0"
        />
        {horizontal ? (
          <>
            <XAxis type="number" domain={yDomain} tickFormatter={valueFormatter} {...AXIS_PROPS} />
            <YAxis type="category" dataKey={categoryKey} width={110} {...AXIS_PROPS} />
          </>
        ) : (
          <>
            <XAxis dataKey={categoryKey} interval={0} {...AXIS_PROPS} />
            <YAxis domain={yDomain} tickFormatter={valueFormatter} width={44} {...AXIS_PROPS} />
          </>
        )}
        <ChartTooltip
          cursor={{ fill: 'var(--muted)' }}
          content={<ChartTooltipContent formatter={(v) => valueFormatter(Number(v))} />}
        />
        {series.length > 1 && <ChartLegend content={<ChartLegendContent />} />}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={seriesColor(s, i)}
            stackId={stacked ? 'stack' : undefined}
            maxBarSize={24}
            radius={radius(!stacked || i === series.length - 1)}
            stroke={stacked ? 'var(--card)' : undefined}
            strokeWidth={stacked ? 2 : 0}
            isAnimationActive={false}
          >
            {barColors && series.length === 1
              ? data.map((_, idx) => <Cell key={idx} fill={barColors[idx % barColors.length]} />)
              : null}
          </Bar>
        ))}
      </RBarChart>
    </ChartContainer>
  );
}
