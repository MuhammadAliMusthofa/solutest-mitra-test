'use client';

import type { TenantBranding } from 'src/models/tenant';

import { useQuery } from '@tanstack/react-query';

import { DEFAULT_BRANDING } from 'src/config/theme';

import { resolveTheme } from 'src/utils/theme';

import { tenantService } from 'src/services/account';

import { useHydrated } from './use-hydrated';

export const TENANT_QUERY_KEY = ['tenant', 'branding'] as const;

/** Branding & tema mitra aktif (publik, di-cache 5 menit). Fallback: branding Solutest. */
export function useTenant() {
  const query = useQuery({
    queryKey: TENANT_QUERY_KEY,
    queryFn: tenantService.branding,
    staleTime: 5 * 60_000,
  });
  const hydrated = useHydrated();
  const branding: TenantBranding =
    hydrated && query.data
      ? { ...query.data, theme: resolveTheme(query.data.theme) }
      : DEFAULT_BRANDING;
  return { ...query, isPending: !hydrated || query.isPending, branding };
}
