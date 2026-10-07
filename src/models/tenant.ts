// Branding & tema per mitra (tenant). Diatur admin mitra di menu Pengaturan Mitra.

export type SidebarStyle = 'light' | 'brand' | 'dark';

export interface ThemeConfig {
  /** warna utama: tombol, link aktif, fokus, chart utama (hex #RRGGBB) */
  primary: string;
  /** warna sekunder: tombol sekunder, aksen kedua chart */
  secondary: string;
  /** warna aksen/sorotan: badge, highlight, aksen ketiga chart */
  accent: string;
  /** latar halaman */
  background: string;
  success: string;
  warning: string;
  danger: string;
  /** radius sudut dasar dalam px (card memakai kelipatannya) */
  radius: number;
  sidebar: SidebarStyle;
}

export interface TenantBranding {
  id: string;
  name: string;
  /** nama singkat untuk ruang sempit (sidebar ciut, navbar mobile) */
  short_name: string;
  tagline: string;
  /** URL logo (persegi/ikon) — tampil di sidebar guru & admin serta navbar siswa */
  logo_url: string | null;
  theme: ThemeConfig;
  updated_at?: string;
}

export type UpdateTenantBody = Partial<Omit<TenantBranding, 'id' | 'updated_at' | 'theme'>> & {
  theme?: Partial<ThemeConfig>;
};
