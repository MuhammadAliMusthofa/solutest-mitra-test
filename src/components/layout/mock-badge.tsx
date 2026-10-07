'use client';

import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip';

import { ENV } from 'src/config/env';

import { Iconify } from 'src/components/iconify/iconify';

/** Penanda mode simulasi (NEXT_PUBLIC_MOCK=true). */
export function MockBadge() {
  if (!ENV.mock) return null;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="hidden items-center gap-1.5 rounded-full bg-warning/12 px-2.5 py-1 text-xs font-medium text-warning sm:inline-flex">
          <Iconify icon="solar:test-tube-linear" size={14} />
          Simulasi
        </span>
      </TooltipTrigger>
      <TooltipContent>Data & aksi memakai simulasi di browser ini (tanpa backend)</TooltipContent>
    </Tooltip>
  );
}
