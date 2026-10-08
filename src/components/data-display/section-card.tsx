import type { ReactNode } from 'react';
import type { KpiTone } from './kpi-card';

import { cn } from 'src/lib/utils';

import { ToneIcon } from './kpi-card';

interface Props {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  /** ikon bertint di kiri judul */
  icon?: string;
  tone?: KpiTone;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
  /** tanpa padding isi (mis. tabel full-bleed) */
  flush?: boolean;
}

/** Kartu konten Spike: putih, radius card, bayangan lembut, judul (+ ikon) + aksi opsional. */
export function SectionCard({
  title,
  description,
  action,
  icon,
  tone = 'primary',
  children,
  className,
  bodyClassName,
  flush,
}: Props) {
  return (
    <section className={cn('rounded-card bg-card shadow-card', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 md:px-6 md:pt-6">
          <div className="flex min-w-0 items-center gap-3">
            {icon && <ToneIcon icon={icon} tone={tone} size="sm" />}
            <div className="min-w-0">
              {title && <h2 className="text-lg leading-snug font-bold">{title}</h2>}
              {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
            </div>
          </div>
          {action && <div className="flex shrink-0 flex-wrap items-center gap-2">{action}</div>}
        </header>
      )}
      <div
        className={cn(!flush && 'p-5 md:p-6', flush && (title || action) && 'pt-5', bodyClassName)}
      >
        {children}
      </div>
    </section>
  );
}
