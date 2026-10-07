'use client';

/* eslint-disable @next/next/no-img-element -- logo mitra bisa berupa data URL / domain apa saja */

import { SOLUTEST_LOGO } from 'src/config/theme';

import { useTenant } from 'src/hooks/use-tenant';

import { cn } from 'src/lib/utils';

interface Props {
  /** hanya logo (sidebar ciut) */
  compact?: boolean;
  subtitle?: string | null;
  className?: string;
  /** warna teks mengikuti token sidebar (untuk gaya sidebar brand/dark) */
  onSidebar?: boolean;
}

/** Logo + nama mitra. Mitra tanpa logo memakai ikon Solutest. */
export function BrandMark({ compact, subtitle, className, onSidebar }: Props) {
  const { branding } = useTenant();
  const logo = branding.logo_url || SOLUTEST_LOGO.icon;

  return (
    <span className={cn('flex min-w-0 items-center gap-3', className)}>
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-border">
        <img src={logo} alt={`Logo ${branding.name}`} className="size-full object-contain" />
      </span>
      {!compact && (
        <span className="min-w-0 leading-tight">
          <span
            className={cn(
              'block truncate text-[0.95rem] font-semibold',
              onSidebar ? 'text-sidebar-foreground' : 'text-foreground'
            )}
            title={branding.name}
          >
            {branding.short_name || branding.name}
          </span>
          <span
            className={cn(
              'block truncate text-xs',
              onSidebar ? 'text-sidebar-muted' : 'text-muted-foreground'
            )}
          >
            {subtitle ?? 'Solutest Mitra'}
          </span>
        </span>
      )}
    </span>
  );
}
