import type { ReactNode } from 'react';

import Link from 'next/link';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

export interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  title: string;
  description?: ReactNode;
  crumbs?: Crumb[];
  actions?: ReactNode;
  /** tombol kembali di kiri judul */
  backHref?: string;
  className?: string;
}

/** Judul halaman + breadcrumb + aksi (gaya kartu Spike). */
export function PageHeader({ title, description, crumbs, actions, backHref, className }: Props) {
  return (
    <div
      className={cn(
        'mb-6 flex flex-col gap-4 rounded-card bg-card px-5 py-5 shadow-card sm:flex-row sm:items-center sm:justify-between md:px-6',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Kembali"
            className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground transition-colors hover:bg-primary/10 hover:text-primary"
          >
            <Iconify icon="solar:arrow-left-linear" size={18} />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-semibold md:text-[1.4rem]">{title}</h1>
          {crumbs && crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mt-1">
              <ol className="flex flex-wrap items-center gap-1.5 text-sm text-muted-foreground">
                {crumbs.map((c, i) => (
                  <li key={`${c.label}-${i}`} className="flex items-center gap-1.5">
                    {i > 0 && <span aria-hidden>•</span>}
                    {c.href ? (
                      <Link href={c.href} className="hover:text-primary">
                        {c.label}
                      </Link>
                    ) : (
                      <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>
                        {c.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
