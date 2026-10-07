// Klien HTTP tunggal untuk backend be-solutest-mitra.
//
// Refresh token memakai dua jalur (pelajaran dari bug "Lanjutkan Ujian" di fe-solutest):
//  1. Proaktif: `scheduleAutoRefresh()` memasang satu timer ~60 detik sebelum `exp`, dipanggil
//     dari root (AppProviders) agar tetap aktif di semua route, termasuk halaman pengerjaan soal.
//  2. Reaktif: interceptor me-refresh saat token hampir habis / response 401, lalu mengulang request.
// Pada mode mock (NEXT_PUBLIC_MOCK=true) semua request dijawab mock adapter di browser.

import type { ApiError } from 'src/models/api';
import type { AuthTokens } from 'src/models/auth';
import type { AxiosError, AxiosAdapter, InternalAxiosRequestConfig } from 'axios';

import axios from 'axios';

import { ENV } from 'src/config/env';
import { LOGIN_PATH } from 'src/config/roles';

import { useSessionStore } from 'src/state/session-store';

import { getToken, tokenTtl, setTokens, decodeToken, getRefreshToken } from './token';

const REFRESH_MARGIN_MS = 60_000;
/** setTimeout overflow di atas 2^31-1 ms (~24,8 hari) */
const MAX_TIMEOUT_MS = 2_147_483_000;

/** Mock adapter dimuat dinamis agar dataset simulasi tidak masuk bundle saat mode API asli. */
const lazyMockAdapter: AxiosAdapter = async (config) => {
  const { mockAdapter } = await import('src/mocks/adapter');
  return mockAdapter(config);
};

export const http = axios.create({
  baseURL: ENV.apiUrl,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
  ...(ENV.mock ? { adapter: lazyMockAdapter } : {}),
});

// ------------------------------------------------------------------ refresh
let refreshing: Promise<string | null> | null = null;

const requestRefresh = async (): Promise<string | null> => {
  const current = getToken();
  if (!current) return null;
  const res = await axios.post<{ data: AuthTokens }>(
    `${ENV.apiUrl}/auth/refresh`,
    { refresh_token: getRefreshToken() },
    {
      headers: { Authorization: `Bearer ${current}` },
      ...(ENV.mock ? { adapter: lazyMockAdapter } : {}),
    }
  );
  const tokens = res.data.data;
  setTokens(tokens);
  useSessionStore.getState().sync();
  return tokens.token;
};

/** Satu refresh berjalan untuk semua request yang menunggu (hindari refresh ganda). */
export const refreshToken = () => {
  refreshing ??= requestRefresh()
    .catch(() => null)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
};

export const forceLogout = (reason: 'expired' | 'logout' = 'expired') => {
  clearScheduledRefresh();
  useSessionStore.getState().clear();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith(LOGIN_PATH)) {
    window.location.replace(`${LOGIN_PATH}${reason === 'expired' ? '?expired=1' : ''}`);
  }
};

let refreshTimer: ReturnType<typeof setTimeout> | null = null;

export const clearScheduledRefresh = () => {
  if (refreshTimer) clearTimeout(refreshTimer);
  refreshTimer = null;
};

/** Jadwalkan refresh ~60 detik sebelum token kedaluwarsa; menjadwal ulang dari token baru. */
export const scheduleAutoRefresh = () => {
  clearScheduledRefresh();
  const claims = decodeToken(getToken());
  if (!claims) return;
  const delay = Math.min(Math.max(tokenTtl(claims) - REFRESH_MARGIN_MS, 0), MAX_TIMEOUT_MS);
  refreshTimer = setTimeout(async () => {
    const token = await refreshToken();
    if (token) scheduleAutoRefresh();
    else forceLogout();
  }, delay);
};

// ------------------------------------------------------------------ interceptors
http.interceptors.request.use(async (config) => {
  let token = getToken();
  const ttl = tokenTtl(decodeToken(token));
  if (token && ttl > 0 && ttl < REFRESH_MARGIN_MS) {
    token = (await refreshToken()) ?? token;
  }
  if (token) config.headers.set('Authorization', `Bearer ${token}`);
  return config;
});

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

http.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined;
    const status = error.response?.status;
    const isAuthCall = config?.url?.startsWith('/auth/');
    if (status === 401 && config && !config._retried && !isAuthCall && getToken()) {
      config._retried = true;
      const token = await refreshToken();
      if (token) {
        config.headers.set('Authorization', `Bearer ${token}`);
        return http(config);
      }
      forceLogout();
    }
    return Promise.reject(error);
  }
);

// ------------------------------------------------------------------ helpers
/** Ambil `data` dari envelope `{ success, data, message }`; response paginasi dibiarkan utuh. */
export const unwrap = <T>(body: unknown): T => {
  if (body && typeof body === 'object' && 'pagination' in body) return body as T;
  if (body && typeof body === 'object' && 'data' in body) return (body as { data: T }).data;
  return body as T;
};

/** Bersihkan param kosong agar `code=''` tidak terkirim (kosong = semua tryout). */
export const cleanParams = (params?: object) =>
  Object.fromEntries(
    Object.entries(params ?? {}).filter(([, v]) => v !== undefined && v !== null && v !== '')
  );

export const api = {
  get: <T>(url: string, params?: object) =>
    http.get(url, { params: cleanParams(params) }).then((r) => unwrap<T>(r.data)),
  post: <T>(url: string, body?: unknown) => http.post(url, body).then((r) => unwrap<T>(r.data)),
  put: <T>(url: string, body?: unknown) => http.put(url, body).then((r) => unwrap<T>(r.data)),
  delete: <T>(url: string) => http.delete(url).then((r) => unwrap<T>(r.data)),
  upload: <T>(url: string, file: File, field = 'file') => {
    const form = new FormData();
    form.append(field, file);
    return http.post(url, form).then((r) => unwrap<T>(r.data));
  },
};

/** Normalisasi error axios → pesan yang aman ditampilkan ke pengguna. */
export const toApiError = (error: unknown): ApiError => {
  const err = error as AxiosError<{ message?: string; errors?: ApiError['errors'] }>;
  const status = err?.response?.status ?? 0;
  const message =
    err?.response?.data?.message ||
    (status === 0 ? 'Tidak dapat terhubung ke server. Periksa koneksi internet.' : '') ||
    (error as Error)?.message ||
    'Terjadi kesalahan, silakan coba lagi.';
  return { status, message, errors: err?.response?.data?.errors ?? null };
};

export const errorMessage = (error: unknown) => toApiError(error).message;
