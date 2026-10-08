import type { CSSProperties } from 'react';

import { cn } from 'src/lib/utils';
import { formatSigned } from 'src/utils/format';

import { Iconify } from 'src/components/iconify/iconify';
import { Sparkline } from 'src/components/charts/sparkline';

export type KpiTone = 'primary' | 'secondary' | 'accent' | 'info' | 'success' | 'warning';

/** Variabel CSS warna per tone (dipakai untuk tint latar, ikon solid, dan lingkaran dekoratif). */
export const TONE_VAR: Record<KpiTone, string> = {
  primary: 'var(--primary)',
  secondary: 'var(--secondary)',
  accent: 'var(--brand-accent)',
  info: 'var(--info)',
  success: 'var(--success)',
  warning: 'var(--warning)',
};

/** Teks/ikon bertone yang tetap terbaca di atas latar tint (secondary & accent bisa terang). */
const TONE_INK: Record<KpiTone, string> = {
  primary: 'var(--primary)',
  secondary: 'var(--secondary-ink)',
  accent: 'var(--accent-ink)',
  info: 'var(--info)',
  success: 'var(--success)',
  warning: 'var(--warning)',
};

/** Style inline untuk elemen bertone: --tone (warna) & --tone-ink (teks di atas tint). */
export const toneStyle = (tone: KpiTone): CSSProperties =>
  ({
    '--tone': TONE_VAR[tone],
    '--tone-ink': TONE_INK[tone],
    '--deco': TONE_VAR[tone],
  }) as CSSProperties;

/** Ikon bertint ala Spike (bg-light* + ikon berwarna). */
export function ToneIcon({
  icon,
  tone = 'primary',
  size = 'md',
  solid,
  className,
}: {
  icon: string;
  tone?: KpiTone;
  size?: 'sm' | 'md' | 'lg';
  /** latar warna penuh + ikon putih */
  solid?: boolean;
  className?: string;
}) {
  const box = { sm: 'size-9 rounded-xl', md: 'size-11 rounded-2xl', lg: 'size-14 rounded-2xl' }[
    size
  ];
  const px = { sm: 18, md: 22, lg: 28 }[size];
  return (
    <span
      style={toneStyle(tone)}
      className={cn(
        'grid shrink-0 place-items-center',
        box,
        solid
          ? 'bg-(--tone) text-white shadow-[0_8px_18px_-8px_var(--tone)]'
          : 'bg-[color-mix(in_srgb,var(--tone)_12%,transparent)] text-(--tone-ink)',
        className
      )}
    >
      <Iconify icon={icon} size={px} />
    </span>
  );
}

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

/**
 * Kartu KPI ala Spike: latar tint warna tone, ikon solid, angka besar, delta naik/turun
 * (ikon + teks), sparkline opsional, lingkaran dekoratif di pojok.
 */
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
    <div
      style={toneStyle(tone)}
      className={cn(
        'deco-rings flex flex-col gap-5 rounded-card bg-[color-mix(in_srgb,var(--tone)_9%,var(--card))] p-5 md:p-6',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <ToneIcon icon={icon} tone={tone} solid />
        {trend && trend.length > 1 && (
          <Sparkline values={trend} label={`Tren ${label}`} color="var(--tone-ink)" />
        )}
      </div>
      <div>
        <p className="text-sm font-medium text-foreground/70">{label}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-2">
          <span className="text-[1.75rem] leading-tight font-bold tracking-[-0.02em] text-foreground tabular-nums">
            {value}
          </span>
          {delta !== undefined && delta !== null && (
            <span
              className={cn(
                'inline-flex items-center gap-0.5 rounded-full bg-card px-2 py-0.5 text-xs font-bold',
                up ? 'text-success' : 'text-destructive'
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
        {hint && <p className="mt-1 text-xs text-foreground/60">{hint}</p>}
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
    <div
      style={toneStyle(tone)}
      className={cn(
        'flex items-center gap-3 rounded-2xl bg-[color-mix(in_srgb,var(--tone)_7%,var(--card))] p-4',
        className
      )}
    >
      {icon && <ToneIcon icon={icon} tone={tone} size="sm" />}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium text-foreground/65">{label}</p>
        <p className="truncate text-lg font-bold tabular-nums">{value}</p>
      </div>
    </div>
  );
}
