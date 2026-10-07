'use client';

/* eslint-disable @next/next/no-img-element -- logo mitra (data URL / storage eksternal) */

import type { CSSProperties } from 'react';
import type { ThemeConfig } from 'src/models/tenant';

import { SOLUTEST_LOGO } from 'src/config/theme';

import { cn } from 'src/lib/utils';
import { themeToCssVars } from 'src/utils/theme';

import { Iconify } from 'src/components/iconify/iconify';
import { StatusPill } from 'src/components/data-display/status-pill';

interface Props {
  theme: ThemeConfig;
  name: string;
  shortName: string;
  logo: string | null;
}

/**
 * Pratinjau mini (sidebar admin/guru + navbar siswa + komponen) dengan variabel CSS tema yang
 * sedang diedit — diterapkan lokal pada elemen ini, tidak memengaruhi aplikasi sebelum disimpan.
 */
export function ThemePreview({ theme, name, shortName, logo }: Props) {
  const style = themeToCssVars(theme) as CSSProperties;
  const logoSrc = logo || SOLUTEST_LOGO.icon;
  const brand = (
    <span className="flex min-w-0 items-center gap-2">
      <span className="grid size-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white p-0.5 ring-1 ring-border">
        <img src={logoSrc} alt="" className="size-full object-contain" />
      </span>
      <span className="truncate text-xs font-semibold">{shortName || name}</span>
    </span>
  );

  return (
    <div
      data-sidebar-style={theme.sidebar}
      style={style}
      className="space-y-4 rounded-card bg-page p-4 ring-1 ring-border"
    >
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Panel admin & guru
      </p>
      <div className="flex gap-3">
        <div className="w-40 shrink-0 space-y-1 rounded-2xl bg-sidebar p-3 text-sidebar-foreground shadow-card">
          <div className="mb-3">{brand}</div>
          {['Ringkasan', 'Analisis', 'Paket Soal'].map((m, i) => (
            <div
              key={m}
              className={cn(
                'flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium',
                i === 0 &&
                  'bg-primary/10 text-primary in-data-[sidebar-style=brand]:bg-sidebar-accent in-data-[sidebar-style=brand]:text-sidebar-accent-foreground in-data-[sidebar-style=dark]:bg-sidebar-accent in-data-[sidebar-style=dark]:text-sidebar-accent-foreground'
              )}
            >
              <Iconify
                icon={['solar:widget-5-linear', 'solar:chart-square-linear', 'solar:box-linear'][i]}
                size={14}
              />
              {m}
            </div>
          ))}
        </div>
        <div className="min-w-0 flex-1 space-y-3 rounded-2xl bg-card p-4 shadow-card">
          <p className="text-sm font-semibold">Rata-rata per mapel</p>
          <div className="flex h-20 items-end gap-2" aria-hidden>
            {[62, 48, 75, 55, 68].map((h, i) => (
              <div
                key={i}
                className="w-5 rounded-t"
                style={{ height: `${h}%`, background: `var(--chart-${(i % 5) + 1})` }}
              />
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="h-8 rounded-lg bg-primary px-3 text-xs font-medium text-primary-foreground"
            >
              Tombol utama
            </button>
            <button
              type="button"
              className="h-8 rounded-lg bg-secondary px-3 text-xs font-medium text-secondary-foreground"
            >
              Sekunder
            </button>
            <button
              type="button"
              className="h-8 rounded-lg bg-brand-accent px-3 text-xs font-medium text-brand-accent-foreground"
            >
              Aksen
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            <StatusPill tone="success">Istimewa</StatusPill>
            <StatusPill tone="warning">Memadai</StatusPill>
            <StatusPill tone="danger">Kurang</StatusPill>
          </div>
        </div>
      </div>

      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Navbar siswa
      </p>
      <div className="flex items-center gap-3 rounded-2xl bg-card px-3 py-2 shadow-card">
        {brand}
        <div className="ml-auto flex gap-1">
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
            Beranda
          </span>
          <span className="rounded-full px-3 py-1 text-xs text-muted-foreground">Tryout</span>
          <span className="rounded-full px-3 py-1 text-xs text-muted-foreground">Riwayat</span>
        </div>
      </div>
    </div>
  );
}
