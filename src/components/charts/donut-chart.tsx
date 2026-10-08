'use client';

import { Pie, Cell, PieChart } from 'recharts';

import { ChartTooltip, ChartContainer, ChartTooltipContent } from 'src/components/ui/chart';

import { cn } from 'src/lib/utils';

interface Slice {
  key: string;
  label: string;
  value: number;
  color: string;
}

interface Props {
  data: Slice[];
  centerValue?: string;
  centerLabel?: string;
  size?: number;
  className?: string;
  valueFormatter?: (value: number) => string;
}

/** Donut + legend berlabel nilai (identitas tidak bergantung warna saja). */
export function DonutChart({
  data,
  centerValue,
  centerLabel,
  size = 200,
  className,
  valueFormatter = (v) => v.toLocaleString('id-ID'),
}: Props) {
  const config = Object.fromEntries(data.map((d) => [d.key, { label: d.label, color: d.color }]));
  const total = data.reduce((a, d) => a + d.value, 0);

  return (
    <div
      className={cn('flex flex-col items-center gap-5 sm:flex-row sm:justify-center', className)}
    >
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <ChartContainer config={config} className="aspect-square size-full">
          <PieChart>
            <ChartTooltip
              content={
                <ChartTooltipContent
                  nameKey="key"
                  hideLabel
                  formatter={(v) => valueFormatter(Number(v))}
                />
              }
            />
            <Pie
              data={data}
              dataKey="value"
              nameKey="key"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={data.filter((d) => d.value > 0).length > 1 ? 2 : 0}
              cornerRadius={4}
              stroke="var(--card)"
              strokeWidth={2}
              isAnimationActive={false}
            >
              {data.map((d) => (
                <Cell key={d.key} fill={d.color} />
              ))}
            </Pie>
          </PieChart>
        </ChartContainer>
        {(centerValue || centerLabel) && (
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
            {centerValue && <span className="text-2xl font-bold">{centerValue}</span>}
            {centerLabel && <span className="text-xs text-muted-foreground">{centerLabel}</span>}
          </div>
        )}
      </div>
      <ul className="w-full max-w-[220px] space-y-2.5 text-sm">
        {data.map((d) => (
          <li key={d.key} className="flex items-center gap-2.5">
            <span className="size-2.5 shrink-0 rounded-sm" style={{ background: d.color }} />
            <span className="flex-1 text-muted-foreground">{d.label}</span>
            <span className="font-semibold tabular-nums">{valueFormatter(d.value)}</span>
            {total > 0 && (
              <span className="w-10 text-right text-xs text-muted-foreground tabular-nums">
                {Math.round((d.value / total) * 100)}%
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
