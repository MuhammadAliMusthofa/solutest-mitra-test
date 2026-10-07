import { cn } from 'src/lib/utils';
import { formatSigned } from 'src/utils/format';

import { Iconify } from 'src/components/iconify/iconify';
import { Sparkline } from 'src/components/charts/sparkline';

export type KpiTone = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning';

const ICON_TONE: Record<KpiTone, string> = {
  primary: 'bg-primary/10 text-primary',
  secondary: 'bg-secondary/12 text-[color-mix(in_oklab,var(--secondary)_80%,black)]',
  accent: 'bg-brand-accent/22 text-[color-mix(in_oklab,var(--brand-accent)_40%,black)]',
  info: 'bg-info/10 text-info',
  success: 'bg-success/10 text-success',
  warning: 'bg-warning/10 text-warning',
};

interface Props {
  label: string;
  value: string;
  icon: string;
  tone?: KpiTone;
  /** perubahan (%) dibanding periode/tryout sebelumnya */
  delta?: number | null;
  trend?: number[];
  hint?: string;
  className?: string;
}

/** Kartu KPI: angka utama, ikon bertone, delta naik/turun (ikon + teks), sparkline opsional. */
export function KpiCard({
  label,
  value,
  icon,
  tone = 'primary',
  delta,
  trend,
  hint,
  className,
}: Props) {
  const up = (delta ?? 0) >= 0;
  return (
    <div className={cn('flex flex-col gap-4 rounded-card bg-card p-5 shadow-card', className)}>
      <div className="flex items-start justify-between gap-3">
        <span className={cn('grid size-12 place-items-center rounded-xl', ICON_TONE[tone])}>
          <Iconify icon={icon} size={24} />
        </span>
        {trend && trend.length > 1 && <Sparkline values={trend} label={`Tren ${label}`} />}
      </div>
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-2xl font-semibold tabular-nums">{value}</span>
          {delta !== undefined && delta !== null && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-semibold',
                up ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
              )}
            >
              <Iconify
                icon={up ? 'solar:arrow-right-up-linear' : 'solar:arrow-right-down-linear'}
                size={14}
              />
              {formatSigned(delta)}%
            </span>
          )}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
      </div>
    </div>
  );
}

/** Tile statistik kecil (dalam kartu). */
export function StatTile({
  label,
  value,
  icon,
  tone = 'primary',
  className,
}: {
  label: string;
  value: string;
  icon?: string;
  tone?: KpiTone;
  className?: string;
}) {
  return (
    <div className={cn('flex items-center gap-3 rounded-xl bg-muted/60 p-4', className)}>
      {icon && (
        <span
          className={cn('grid size-10 shrink-0 place-items-center rounded-lg', ICON_TONE[tone])}
        >
          <Iconify icon={icon} size={20} />
        </span>
      )}
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-lg font-semibold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
