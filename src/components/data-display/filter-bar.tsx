import type { ReactNode } from 'react';

import { cn } from 'src/lib/utils';

/** Satu baris filter di atas konten yang difilter (rata kiri, aksi di kanan). */
export function FilterBar({
  children,
  actions,
  className,
}: {
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-3 px-5 pt-5 md:flex-row md:flex-wrap md:items-center md:px-6',
        className
      )}
    >
      <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        {children}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
