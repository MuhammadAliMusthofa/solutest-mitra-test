'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { LOGIN_PATH, ROLE_LABEL } from 'src/config/roles';

import { forceLogout } from 'src/core/http';

import { resetExamStores } from 'src/state/exam-store';
import { useSessionStore } from 'src/state/session-store';

import { authService } from 'src/services/account';

import { useHydrated } from './use-hydrated';

/** Klaim user yang sedang login (null sebelum cookie dibaca / bila belum login). */
export function useCurrentUser() {
  const hydrated = useHydrated();
  const storeClaims = useSessionStore((s) => s.claims);
  const storeReady = useSessionStore((s) => s.ready);
  const claims = hydrated ? storeClaims : null;
  return {
    ready: hydrated && storeReady,
    user: claims,
    roleLabel: claims ? ROLE_LABEL[claims.role] : '',
  };
}

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();
  return useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      // logout tetap dilanjutkan walau request gagal
    }
    forceLogout('logout');
    resetExamStores();
    queryClient.clear();
    router.replace(LOGIN_PATH);
  }, [queryClient, router]);
}
