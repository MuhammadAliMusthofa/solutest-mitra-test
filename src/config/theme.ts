// Tema bawaan (warna logo Solutest) dan preset yang bisa dipilih admin mitra.

import type { ThemeConfig, TenantBranding } from 'src/models/tenant';

export const DEFAULT_THEME: ThemeConfig = {
  primary: '#3F479E',
  secondary: '#8A68AC',
  accent: '#B3C966',
  background: '#F3F2FA',
  success: '#1A8A55',
  warning: '#B5650C',
  danger: '#C4472A',
  radius: 12,
  sidebar: 'light',
};

export const THEME_PRESETS: { id: string; name: string; theme: ThemeConfig }[] = [
  { id: 'solutest', name: 'Solutest', theme: DEFAULT_THEME },
  {
    id: 'samudra',
    name: 'Samudra',
    theme: {
      ...DEFAULT_THEME,
      primary: '#0B6E99',
      secondary: '#1F9AA8',
      accent: '#F2A541',
      background: '#EEF5F8',
    },
  },
  {
    id: 'hutan',
    name: 'Hutan',
    theme: {
      ...DEFAULT_THEME,
      primary: '#2E6B3F',
      secondary: '#6B8F3A',
      accent: '#E3B23C',
      background: '#F1F5EF',
    },
  },
  {
    id: 'senja',
    name: 'Senja',
    theme: {
      ...DEFAULT_THEME,
      primary: '#B4472C',
      secondary: '#7A4B94',
      accent: '#F0B429',
      background: '#FAF3EF',
    },
  },
  {
    id: 'merah-putih',
    name: 'Merah Putih',
    theme: {
      ...DEFAULT_THEME,
      primary: '#B3202A',
      secondary: '#3D4451',
      accent: '#E8A33D',
      background: '#F7F3F3',
      sidebar: 'brand',
    },
  },
  {
    id: 'malam',
    name: 'Malam',
    theme: {
      ...DEFAULT_THEME,
      primary: '#4B4FD8',
      secondary: '#2D3A55',
      accent: '#22B8A6',
      background: '#F1F2F7',
      sidebar: 'dark',
    },
  },
];

export const RADIUS_OPTIONS = [
  { value: 6, label: 'Tegas' },
  { value: 12, label: 'Standar' },
  { value: 18, label: 'Membulat' },
];

export const DEFAULT_BRANDING: TenantBranding = {
  id: 'default',
  name: 'Solutest Mitra',
  short_name: 'Solutest',
  tagline: 'Platform tryout & analitik untuk lembaga mitra',
  logo_url: null,
  theme: DEFAULT_THEME,
};

/** Logo Solutest dipakai bila mitra belum mengunggah logo sendiri. */
export const SOLUTEST_LOGO = {
  icon: '/assets/logo/solutest-logo-icon-normal.png',
  iconWhite: '/assets/logo/solutest-logo-icon-white.png',
  inline: '/assets/logo/solutest-logo-inline.png',
  inlineWhite: '/assets/logo/solutest-logo-inline-white.png',
};

/** Kunci localStorage variabel CSS tema terakhir (dipakai skrip anti-kedip di <head>). */
export const THEME_CACHE_KEY = 'st_theme_vars';
