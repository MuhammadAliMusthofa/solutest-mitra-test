import type { ReactNode } from 'react';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

export type PillTone =
  'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';

const TONES: Record<PillTone, string> = {
  primary: 'bg-primary/8 text-primary ring-primary/20',
  secondary:
    'bg-secondary/10 text-[color-mix(in_oklab,var(--secondary)_80%,black)] ring-secondary/25',
  accent:
    'bg-brand-accent/18 text-[color-mix(in_oklab,var(--brand-accent)_40%,black)] ring-brand-accent/35',
  success: 'bg-success/10 text-success ring-success/25',
  warning: 'bg-warning/10 text-warning ring-warning/25',
  danger: 'bg-destructive/10 text-destructive ring-destructive/25',
  info: 'bg-info/10 text-info ring-info/25',
  neutral: 'bg-muted text-muted-foreground ring-border',
};

interface Props {
  tone?: PillTone;
  icon?: string;
  children: ReactNode;
  className?: string;
}

/** Pill status ber-outline lembut (gaya Spike). Selalu berisi teks — tidak mengandalkan warna. */
export function StatusPill({ tone = 'neutral', icon, children, className }: Props) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset',
        TONES[tone],
        className
      )}
    >
      {icon && <Iconify icon={icon} size={14} />}
      {children}
    </span>
  );
}
