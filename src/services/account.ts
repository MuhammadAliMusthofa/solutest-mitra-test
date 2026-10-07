// Auth, branding mitra, profil, dan upload — endpoint di docs/api-contract.md §2–3.

import type { LoginBody, AuthTokens } from 'src/models/auth';
import type { TenantBranding, UpdateTenantBody } from 'src/models/tenant';
import type { UserProfile, UpdateProfileBody, ChangePasswordBody } from 'src/models/user';

import { api } from 'src/core/http';

export const authService = {
  login: (body: LoginBody) => api.post<AuthTokens>('/auth/login', body),
  logout: () => api.post<unknown>('/auth/logout'),
};

export const tenantService = {
  /** Publik: dipakai juga di halaman login sebelum user masuk. */
  branding: () => api.get<TenantBranding>('/tenant/branding'),
  update: (body: UpdateTenantBody) => api.put<TenantBranding>('/tenant/branding', body),
};

export const profileService = {
  me: () => api.get<UserProfile>('/me'),
  update: (body: UpdateProfileBody) => api.put<UserProfile>('/me', body),
  changePassword: (body: ChangePasswordBody) => api.post<unknown>('/me/password', body),
};

export const uploadService = {
  /** Upload gambar (logo/foto profil/lampiran soal), maks 2 MB → URL publik. */
  image: (file: File) => api.upload<{ url: string }>('/uploads', file),
};

export const devService = {
  /** Mode mock: kembalikan data simulasi ke kondisi awal. */
  resetMock: () => api.post<unknown>('/mock/reset'),
};
