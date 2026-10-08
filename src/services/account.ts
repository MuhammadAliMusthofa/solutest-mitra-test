// Auth, branding mitra, profil, dan upload — be-solutest-mitra (docs/be-api.md).

import type { UserProfile } from 'src/models/user';
import type { LoginBody, MitraUser, AuthTokens } from 'src/models/auth';
import type { ThemeConfig, TenantBranding, UpdateTenantBody } from 'src/models/tenant';

import { DEFAULT_BRANDING } from 'src/config/theme';

import { api } from 'src/core/http';

type ExtraTheme = Partial<
  Pick<ThemeConfig, 'background' | 'success' | 'warning' | 'danger' | 'radius' | 'sidebar'>
>;

/** Profil mitra di backend (`GET /public/profile`, `GET/PUT /admin/profile`). */
interface MitraProfile {
  name: string;
  short_name: string | null;
  tagline: string | null;
  logo: string | null;
  primary_color: string | null;
  secondary_color: string | null;
  accent_color: string | null;
  theme: ExtraTheme | null;
  updatedAt?: string;
}

const toBranding = (p: MitraProfile): TenantBranding => ({
  id: 'mitra',
  name: p.name || DEFAULT_BRANDING.name,
  short_name: p.short_name || p.name || DEFAULT_BRANDING.short_name,
  tagline: p.tagline ?? '',
  logo_url: p.logo,
  theme: {
    ...DEFAULT_BRANDING.theme,
    ...(p.theme ?? {}),
    ...(p.primary_color ? { primary: p.primary_color } : {}),
    ...(p.secondary_color ? { secondary: p.secondary_color } : {}),
    ...(p.accent_color ? { accent: p.accent_color } : {}),
  },
  updated_at: p.updatedAt,
});

const toProfileBody = (body: UpdateTenantBody) => {
  const { theme, logo_url, ...rest } = body;
  const { primary, secondary, accent, ...extra } = theme ?? {};
  return {
    ...rest,
    ...(logo_url !== undefined ? { logo: logo_url } : {}),
    ...(primary !== undefined ? { primary_color: primary } : {}),
    ...(secondary !== undefined ? { secondary_color: secondary } : {}),
    ...(accent !== undefined ? { accent_color: accent } : {}),
    ...(Object.keys(extra).length ? { theme: extra } : {}),
  };
};

const toUserProfile = (u: MitraUser): UserProfile => ({
  id: u.id,
  email: u.email,
  full_name: u.full_name,
  phone: u.phone,
  address: null,
  image_profile: null,
  role: u.role,
  nisn: u.nisn,
  school_name: u.school_name,
  class_name: u.class_name,
  created_at: u.createdAt,
});

export const authService = {
  login: (body: LoginBody) => api.post<AuthTokens>('/auth/login', body),
  /** Backend tidak menyimpan sesi; logout cukup menghapus token di klien. */
  logout: async () => null,
};

export const tenantService = {
  /** Publik: dipakai juga di halaman login sebelum user masuk. */
  branding: () => api.get<MitraProfile>('/public/profile').then(toBranding),
  update: (body: UpdateTenantBody) =>
    api.put<MitraProfile>('/admin/profile', toProfileBody(body)).then(toBranding),
};

export const profileService = {
  /** Nama, email & password dikelola di akun Solutest; app mitra hanya menampilkan. */
  me: () => api.get<MitraUser>('/auth/me').then(toUserProfile),
};

export const uploadService = {
  /** Upload gambar (logo/lampiran soal), maks 10 MB → URL proxy storage (bisa dipakai di <img>). */
  image: (file: File) => api.upload<{ url: string; path: string }>('/admin/uploads', file),
};
