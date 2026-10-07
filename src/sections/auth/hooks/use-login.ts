'use client';

import type { LoginBody } from 'src/models/auth';

import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { homeOf, roleForPath } from 'src/config/roles';

import { setTokens } from 'src/core/token';
import { scheduleAutoRefresh } from 'src/core/http';

import { useSessionStore } from 'src/state/session-store';

import { authService } from 'src/services/account';

/** Login → simpan token → jadwalkan auto-refresh → ke halaman tujuan / beranda role. */
export function useLogin(next?: string | null) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const sync = useSessionStore((s) => s.sync);

  return useMutation({
    mutationFn: (body: LoginBody) => authService.login(body),
    onSuccess: (tokens) => {
      const claims = setTokens(tokens);
      sync();
      scheduleAutoRefresh();
      queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== 'tenant' });
      // `next` hanya dipakai bila milik role yang sama (hindari redirect ke area role lain).
      const target = next && roleForPath(next) === claims?.role ? next : homeOf(claims?.role);
      router.replace(target);
    },
  });
}
