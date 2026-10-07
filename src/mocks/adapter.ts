// Axios adapter mode mock: request dijawab handler lokal (src/mocks/handlers) dengan bentuk
// response yang sama seperti kontrak backend (docs/api-contract.md).

import type { AxiosAdapter, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

import { AxiosError, AxiosHeaders } from 'axios';

import { ENV } from 'src/config/env';

import { decodeToken } from 'src/core/token';

import { resolveRoute } from './router';
import { MockHttpError } from './utils';

const DELAY_MS = 280;

const pathOf = (config: InternalAxiosRequestConfig) => {
  const url = config.url ?? '';
  const relative = url.startsWith(ENV.apiUrl) ? url.slice(ENV.apiUrl.length) : url;
  return relative.split('?')[0].replace(/\/$/, '') || '/';
};

const bodyOf = (config: InternalAxiosRequestConfig) => {
  const { data } = config;
  if (typeof data === 'string') {
    try {
      return JSON.parse(data);
    } catch {
      return data;
    }
  }
  return data ?? {};
};

const queryOf = (config: InternalAxiosRequestConfig) =>
  Object.fromEntries(
    Object.entries((config.params ?? {}) as Record<string, unknown>).map(([k, v]) => [k, String(v)])
  );

const respond = (
  config: InternalAxiosRequestConfig,
  status: number,
  data: unknown
): AxiosResponse => ({
  data,
  status,
  statusText: String(status),
  headers: new AxiosHeaders(),
  config,
});

export const mockAdapter: AxiosAdapter = async (config) => {
  await new Promise((resolve) => {
    setTimeout(resolve, DELAY_MS);
  });
  const method = (config.method ?? 'get').toUpperCase();
  const path = pathOf(config);
  const auth = String(config.headers?.Authorization ?? '').replace(/^Bearer\s+/i, '');

  try {
    const route = resolveRoute(method, path);
    if (!route) throw new MockHttpError(404, `Endpoint simulasi tidak tersedia: ${method} ${path}`);
    const result = await route.handle({
      method,
      path,
      query: queryOf(config),
      body: bodyOf(config),
      params: route.params,
      user: decodeToken(auth),
    });
    // structuredClone agar komponen tidak memodifikasi state simulasi secara langsung.
    const data = result === undefined ? null : structuredClone(result);
    const envelope =
      data && typeof data === 'object' && 'pagination' in data
        ? { success: true, ...(data as object) }
        : { success: true, data };
    return respond(config, 200, envelope);
  } catch (error) {
    const status = error instanceof MockHttpError ? error.status : 500;
    const message = (error as Error)?.message || 'Kesalahan simulasi';
    if (!(error instanceof MockHttpError)) console.error('[mock]', error);
    const response = respond(config, status, { success: false, message });
    throw new AxiosError(message, AxiosError.ERR_BAD_REQUEST, config, null, response);
  }
};
