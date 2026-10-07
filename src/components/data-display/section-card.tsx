import type { ReactNode } from 'react';

import { cn } from 'src/lib/utils';

interface Props {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** tanpa padding isi (mis. tabel full-bleed) */
  flush?: boolean;
}

/** Kartu konten Spike: putih, radius card, bayangan lembut, judul + aksi opsional. */
export function SectionCard({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
  flush,
}: Props) {
  return (
    <section className={cn('rounded-card bg-card shadow-card', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
          <div className="min-w-0">
            {title && <h2 className="text-[1.05rem] font-semibold">{title}</h2>}
            {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
          </div>
          {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
        </header>
      )}
      <div
        className={cn(!flush && 'p-5 md:p-6', flush && (title || action) && 'pt-4', bodyClassName)}
      >
        {children}
      </div>
    </section>
  );
}
