'use client';

import { usePathname } from 'next/navigation';

import type { Panel } from 'src/config/roles';
import { panelPaths } from 'src/config/paths';

/** Panel aktif (admin/guru) dari URL — view bersama memakai ini untuk membangun tautan. */
export function usePanel() {
  const pathname = usePathname();
  const panel: Panel = pathname.startsWith('/guru') ? 'guru' : 'admin';
  return { panel, isAdmin: panel === 'admin', paths: panelPaths(panel) };
}
