'use client';

import type { ThemeConfig } from 'src/models/tenant';

import { useEffect } from 'react';

import { THEME_CACHE_KEY } from 'src/config/theme';

import { useTenant } from 'src/hooks/use-tenant';

import { themeToCssVars } from 'src/utils/theme';

/** Terapkan variabel CSS tema ke <html> (dipakai juga oleh pratinjau Pengaturan Mitra). */
export const applyTheme = (theme: Partial<ThemeConfig>, persist = true) => {
  const root = document.documentElement;
  const vars = themeToCssVars(theme);
  Object.entries(vars).forEach(([key, value]) => root.style.setProperty(key, value));
  const sidebar = theme.sidebar ?? 'light';
  root.setAttribute('data-sidebar-style', sidebar);
  if (!persist) return;
  try {
    localStorage.setItem(THEME_CACHE_KEY, JSON.stringify({ vars, sidebar }));
  } catch {
    // abaikan
  }
};

/**
 * Sinkronkan tema mitra dari backend ke variabel CSS. Nilai terakhir di-cache di localStorage dan
 * dipasang skrip di <head> sebelum render pertama, sehingga tidak ada kedip warna bawaan.
 */
export function ThemeSync() {
  const { data, branding } = useTenant();

  useEffect(() => {
    if (data) applyTheme(branding.theme);
  }, [data, branding.theme]);

  return null;
}

/** Skrip anti-kedip: dijalankan sebelum hydration, membaca cache tema terakhir. */
export const THEME_BOOT_SCRIPT = `(function(){try{var c=JSON.parse(localStorage.getItem('${THEME_CACHE_KEY}')||'null');if(!c)return;var r=document.documentElement;for(var k in c.vars){r.style.setProperty(k,c.vars[k])}r.setAttribute('data-sidebar-style',c.sidebar||'light')}catch(e){}})();`;
