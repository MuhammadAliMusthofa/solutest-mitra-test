'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * false di server & selama hydration, true setelahnya. Dipakai untuk data yang hanya ada di klien
 * (cookie sesi, cache tenant) agar render hydration identik dengan HTML server.
 */
export function useHydrated() {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false
  );
}
