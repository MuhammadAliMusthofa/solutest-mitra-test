// Klien HTTP tunggal untuk backend be-solutest-mitra.
//
// Refresh token memakai dua jalur (pelajaran dari bug "Lanjutkan Ujian" di fe-solutest):
//  1. Proaktif: `scheduleAutoRefresh()` memasang satu timer ~60 detik sebelum `exp`, dipanggil
//     dari root (AppProviders) agar tetap aktif di semua route, termasuk halaman pengerjaan soal.
//  2. Reaktif: interceptor me-refresh saat token hampir habis / response 401, lalu mengulang request.
// Backend tidak punya refresh token terpisah: `/auth/refresh` menukar token yang masih berlaku
// dengan token baru. Token yang sudah kedaluwarsa → 401 → login ulang.
// Mode mock (NEXT_PUBLIC_MOCK=true) hanya menjawab endpoint analitik & progres (belum ada di backend).

import type { ApiError } from 'src/models/api';
import type { AuthTokens } from 'src/models/auth';
import type { AxiosError, AxiosAdapter, InternalAxiosRequestConfig } from 'axios';

import axios, { getAdapter } from 'axios';

import { ENV } from 'src/config/env';
import { LOGIN_PATH } from 'src/config/roles';

import { useSessionStore } from 'src/state/session-store';

import { getToken, tokenTtl, setTokens, decodeToken } from './token';

const REFRESH_MARGIN_MS = 60_000;
/** setTimeout overflow di atas 2^31-1 ms (~24,8 hari) */
const MAX_TIMEOUT_MS = 2_147_483_000;

const MOCK_PREFIXES = ['/analytics', '/progress'];
const defaultAdapter = getAdapter(axios.defaults.adapter);

/**
 * Mock adapter dimuat dinamis (dataset simulasi tidak masuk bundle saat mode API asli) dan hanya
 * untuk endpoint yang belum ada di backend.
 */
const hybridAdapter: AxiosAdapter = async (config) => {
  if (MOCK_PREFIXES.some((prefix) => config.url?.startsWith(prefix))) {
    const { mockAdapter } = await import('src/mocks/adapter');
    return mockAdapter(config);
  }
  return defaultAdapter(config);
};

export const http = axios.create({
  baseURL: ENV.apiUrl,
  timeout: 30_000,
  headers: { Accept: 'application/json' },
  ...(ENV.mock ? { adapter: hybridAdapter } : {}),
});

// ------------------------------------------------------------------ refresh
let refreshing: Promise<string | null> | null = null;

const requestRefresh = async (): Promise<string | null> => {
  const current = getToken();
  if (!current) return null;
  // Token sudah kedaluwarsa tidak bisa ditukar → langsung login ulang
  if (tokenTtl(decodeToken(current)) <= 0) return null;
  const res = await axios.post<{ data: AuthTokens }>(`${ENV.apiUrl}/auth/refresh`, null, {
    headers: { Authorization: `Bearer ${current}` },
  });
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

export const forceLogout = (reason: 'expired' | 'logout' | 'disabled' = 'expired') => {
  clearScheduledRefresh();
  useSessionStore.getState().clear();
  if (typeof window !== 'undefined' && !window.location.pathname.startsWith(LOGIN_PATH)) {
    const query = { expired: '?expired=1', disabled: '?disabled=1', logout: '' }[reason];
    window.location.replace(`${LOGIN_PATH}${query}`);
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
    // backend: member nonaktif → 403 "Akun Anda dinonaktifkan" di semua endpoint
    const message = (error.response?.data as { errors?: unknown } | undefined)?.errors;
    if (status === 403 && typeof message === 'string' && /dinonaktifkan/i.test(message)) {
      forceLogout('disabled');
    }
    return Promise.reject(error);
  }
);

// ------------------------------------------------------------------ helpers
const DEFAULT_PAGE_SIZE = 10;

interface BackendPaging {
  page: number;
  total_item: number;
  total_page: number;
}

/**
 * Ambil `data` dari envelope `{ success, code, message, data }`. Response daftar backend
 * (`paging`) diubah ke bentuk `Paginated` FE: `{ data, pagination, ...kunci lain (mis. summary) }`.
 */
export const unwrap = <T>(body: unknown, pageSize = DEFAULT_PAGE_SIZE): T => {
  if (!body || typeof body !== 'object') return body as T;
  if ('pagination' in body) return body as T;
  if ('paging' in body) {
    const {
      success: _s,
      code: _c,
      message: _m,
      paging,
      ...rest
    } = body as Record<string, unknown> & {
      paging: BackendPaging;
    };
    return {
      ...rest,
      pagination: {
        current_page: paging.page,
        per_page: pageSize,
        total_items: paging.total_item,
        total_pages: paging.total_page,
      },
    } as T;
  }
  if ('data' in body) return (body as { data: T }).data;
  return body as T;
};

/**
 * Bersihkan param kosong agar `code=''` tidak terkirim (kosong = semua tryout).
 * `per_page` (istilah FE) dikirim sebagai `size` (istilah backend).
 */
export const cleanParams = (params?: object) =>
  Object.fromEntries(
    Object.entries(params ?? {})
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => (k === 'per_page' ? ['size', v] : [k, v]))
  );

export const api = {
  get: <T>(url: string, params?: object) => {
    const query = cleanParams(params);
    return http
      .get(url, { params: query })
      .then((r) => unwrap<T>(r.data, Number(query.size) || DEFAULT_PAGE_SIZE));
  },
  // body kosong tetap dikirim `{}`: backend (Fastify) menolak POST JSON tanpa body
  post: <T>(url: string, body?: unknown) =>
    http.post(url, body ?? {}).then((r) => unwrap<T>(r.data)),
  /** Envelope utuh (untuk respons yang punya kunci tambahan di samping `data` tanpa paging). */
  raw: <T>(url: string, params?: object) =>
    http.get(url, { params: cleanParams(params) }).then((r) => r.data as T),
  put: <T>(url: string, body?: unknown) => http.put(url, body).then((r) => unwrap<T>(r.data)),
  patch: <T>(url: string, body?: unknown) => http.patch(url, body).then((r) => unwrap<T>(r.data)),
  delete: <T>(url: string) => http.delete(url).then((r) => unwrap<T>(r.data)),
  upload: <T>(url: string, file: File, field = 'file') => {
    const form = new FormData();
    form.append(field, file);
    return http.post(url, form).then((r) => unwrap<T>(r.data));
  },
};

/** Normalisasi error axios → pesan yang aman ditampilkan ke pengguna. */
export const toApiError = (error: unknown): ApiError => {
  const err = error as AxiosError<{ message?: string; errors?: string | ApiError['errors'] }>;
  const status = err?.response?.status ?? 0;
  const body = err?.response?.data;
  // Backend mitra: `{ success: false, code, errors: "pesan" }`
  const backendMessage = typeof body?.errors === 'string' ? body.errors : '';
  const message =
    backendMessage ||
    body?.message ||
    (status === 0 ? 'Tidak dapat terhubung ke server. Periksa koneksi internet.' : '') ||
    (error as Error)?.message ||
    'Terjadi kesalahan, silakan coba lagi.';
  return {
    status,
    message,
    errors: body?.errors && typeof body.errors === 'object' ? body.errors : null,
  };
};

export const errorMessage = (error: unknown) => toApiError(error).message;
