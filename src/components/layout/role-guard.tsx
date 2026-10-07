'use client';

import type { ReactNode } from 'react';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import type { Role } from 'src/config/roles';
import { homeOf, LOGIN_PATH } from 'src/config/roles';

import { tokenTtl } from 'src/core/token';

import { useCurrentUser } from 'src/hooks/use-session';

import { PageLoader } from 'src/components/feedback/page-loader';

/**
 * Guard klien (lapis kedua setelah proxy.ts): menangani token kedaluwarsa di tab yang lama
 * terbuka dan navigasi klien yang tidak melewati proxy.
 */
export function RoleGuard({ role, children }: { role: Role; children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { ready, user } = useCurrentUser();
  const valid = Boolean(user && tokenTtl(user) > 0);
  const allowed = valid && user?.role === role;

  useEffect(() => {
    if (!ready || allowed) return;
    if (!valid) router.replace(`${LOGIN_PATH}?next=${encodeURIComponent(pathname)}`);
    else router.replace(homeOf(user?.role));
  }, [ready, allowed, valid, user?.role, router, pathname]);

  // Halaman tetap dirender (proxy.ts sudah memblokir akses tanpa token di server, dan Next
  // memvalidasi instant navigation dari segmen yang dirender); overlay menutupinya sampai sesi valid.
  return (
    <>
      {children}
      {(!ready || !allowed) && (
        <div className="fixed inset-0 z-[100] bg-page">
          <PageLoader fullscreen label="Memeriksa sesi…" />
        </div>
      )}
    </>
  );
}
