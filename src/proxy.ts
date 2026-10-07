// Pemeriksaan optimistik sebelum halaman dirender: belum login → /login, salah role → beranda
// role-nya. Ini hanya routing UX; otorisasi sebenarnya tetap di backend (token diverifikasi di sana).

import type { NextRequest } from 'next/server';

import { NextResponse } from 'next/server';

import { TOKEN_COOKIE } from 'src/config/auth';
import { homeOf, isRole, LOGIN_PATH, roleForPath } from 'src/config/roles';

const readClaims = (token?: string): { role?: string; exp?: number } | null => {
  if (!token) return null;
  try {
    const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(payload.padEnd(Math.ceil(payload.length / 4) * 4, '=')));
  } catch {
    return null;
  }
};

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const claims = readClaims(request.cookies.get(TOKEN_COOKIE)?.value);
  const valid = Boolean(claims && isRole(claims.role) && (claims.exp ?? 0) * 1000 > Date.now());

  if (pathname === '/' || pathname === LOGIN_PATH) {
    if (valid) return NextResponse.redirect(new URL(homeOf(claims?.role), request.url));
    if (pathname === '/') return NextResponse.redirect(new URL(LOGIN_PATH, request.url));
    return NextResponse.next();
  }

  const required = roleForPath(pathname);
  if (!required) return NextResponse.next();

  if (!valid) {
    const url = new URL(LOGIN_PATH, request.url);
    url.searchParams.set('next', `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  if (claims?.role !== required) {
    return NextResponse.redirect(new URL(homeOf(claims?.role), request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/login', '/admin/:path*', '/guru/:path*', '/siswa/:path*'],
};
