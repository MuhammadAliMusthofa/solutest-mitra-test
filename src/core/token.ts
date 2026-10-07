// Penyimpanan token. Access token disimpan di cookie (bukan localStorage) agar `proxy.ts`
// bisa melakukan redirect berbasis role sebelum halaman dirender.

import type { TokenClaims } from 'src/models/auth';

import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

import { TOKEN_COOKIE, REFRESH_STORAGE_KEY } from 'src/config/auth';

export { TOKEN_COOKIE };

const isBrowser = () => typeof window !== 'undefined';

export const decodeToken = (token?: string | null): TokenClaims | null => {
  if (!token) return null;
  try {
    return jwtDecode<TokenClaims>(token);
  } catch {
    return null;
  }
};

/** Sisa umur token (ms); negatif bila sudah kedaluwarsa. */
export const tokenTtl = (claims: Pick<TokenClaims, 'exp'> | null) =>
  claims?.exp ? claims.exp * 1000 - Date.now() : -1;

export const getToken = () => (isBrowser() ? (Cookies.get(TOKEN_COOKIE) ?? null) : null);

export const getRefreshToken = () => {
  if (!isBrowser()) return null;
  try {
    return localStorage.getItem(REFRESH_STORAGE_KEY);
  } catch {
    return null;
  }
};

export const setTokens = ({ token, refresh_token }: { token: string; refresh_token?: string }) => {
  const claims = decodeToken(token);
  Cookies.set(TOKEN_COOKIE, token, {
    path: '/',
    sameSite: 'lax',
    secure: window.location.protocol === 'https:',
    expires: claims?.exp ? new Date(claims.exp * 1000) : undefined,
  });
  try {
    if (refresh_token) localStorage.setItem(REFRESH_STORAGE_KEY, refresh_token);
  } catch {
    // storage tidak tersedia (mode privat): refresh reaktif tetap memakai access token
  }
  return claims;
};

export const clearTokens = () => {
  if (!isBrowser()) return;
  Cookies.remove(TOKEN_COOKIE, { path: '/' });
  try {
    localStorage.removeItem(REFRESH_STORAGE_KEY);
  } catch {
    // abaikan
  }
};
