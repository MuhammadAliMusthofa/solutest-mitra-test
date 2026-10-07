'use client';

import { useMemo, useCallback } from 'react';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';

/**
 * State filter yang disimpan di query string (bisa dibagikan & bertahan saat refresh),
 * mis. `?code=SLT-...&search=adit&page=2`. Nilai sama dengan default dihapus dari URL.
 * Mengubah filter selain `page` otomatis mengembalikan ke halaman 1.
 */
export function useUrlState<K extends string>(defaults: Record<K, string>) {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const keys = Object.keys(defaults) as K[];
  const serialized = params.toString();

  const state = useMemo(
    () =>
      Object.fromEntries(keys.map((k) => [k, params.get(k) ?? defaults[k]])) as Record<K, string>,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serialized]
  );

  const setState = useCallback(
    (patch: Partial<Record<K, string | number>>) => {
      const next = new URLSearchParams(serialized);
      Object.entries(patch).forEach(([k, v]) => {
        const value = v === undefined || v === null ? '' : String(v);
        if (!value || value === defaults[k as K]) next.delete(k);
        else next.set(k, value);
      });
      if (!('page' in patch)) next.delete('page');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [serialized, pathname, router]
  );

  return [state, setState] as const;
}
