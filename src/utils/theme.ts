// Tema mitra → variabel CSS. Warna teks di atas warna tema dihitung otomatis (kontras WCAG)
// sehingga admin bebas memilih warna tanpa merusak keterbacaan.

import type { ThemeConfig } from 'src/models/tenant';

import { DEFAULT_THEME } from 'src/config/theme';

const HEX_RE = /^#([0-9a-f]{6})$/i;

export const isHexColor = (value: string) => HEX_RE.test(value);

const channel = (v: number) => {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
};

export const luminance = (hex: string) => {
  const n = parseInt(hex.slice(1), 16);
  return (
    0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255)
  );
};

export const contrastRatio = (a: string, b: string) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const DARK_TEXT = '#111c2d';
const LIGHT_TEXT = '#ffffff';

/** Teks putih atau gelap — mana yang kontrasnya lebih tinggi di atas `hex`. */
export const readableOn = (hex: string) =>
  contrastRatio(hex, LIGHT_TEXT) >= contrastRatio(hex, DARK_TEXT) ? LIGHT_TEXT : DARK_TEXT;

/** Normalisasi config dari backend (nilai hilang/invalid → bawaan). */
export const resolveTheme = (theme?: Partial<ThemeConfig> | null): ThemeConfig => {
  const merged = { ...DEFAULT_THEME, ...(theme ?? {}) };
  const colorKeys = [
    'primary',
    'secondary',
    'accent',
    'background',
    'success',
    'warning',
    'danger',
  ] as const;
  colorKeys.forEach((key) => {
    if (!isHexColor(merged[key])) merged[key] = DEFAULT_THEME[key];
  });
  merged.radius = Math.min(24, Math.max(0, Number(merged.radius) || DEFAULT_THEME.radius));
  if (!['light', 'brand', 'dark'].includes(merged.sidebar)) merged.sidebar = DEFAULT_THEME.sidebar;
  return merged;
};

export const themeToCssVars = (input?: Partial<ThemeConfig> | null): Record<string, string> => {
  const t = resolveTheme(input);
  return {
    '--primary': t.primary,
    '--primary-foreground': readableOn(t.primary),
    '--secondary': t.secondary,
    '--secondary-foreground': readableOn(t.secondary),
    '--brand-accent': t.accent,
    '--brand-accent-foreground': readableOn(t.accent),
    '--page': t.background,
    '--success': t.success,
    '--warning': t.warning,
    '--destructive': t.danger,
    '--radius': `${t.radius}px`,
  };
};

/** Peringatan kontras untuk editor tema (warna yang dipakai sebagai teks di atas putih). */
export const contrastWarnings = (theme: ThemeConfig) => {
  const warnings: string[] = [];
  const check = (label: string, hex: string) => {
    if (isHexColor(hex) && contrastRatio(hex, '#ffffff') < 3)
      warnings.push(`${label} terlalu terang untuk teks/ikon di atas latar putih (kontras < 3:1).`);
  };
  check('Warna utama', theme.primary);
  check('Warna sukses', theme.success);
  check('Warna peringatan', theme.warning);
  check('Warna bahaya', theme.danger);
  if (isHexColor(theme.background) && luminance(theme.background) < 0.75)
    warnings.push('Latar halaman terlalu gelap; teks bawaan berwarna gelap.');
  return warnings;
};
