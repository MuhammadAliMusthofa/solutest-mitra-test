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

/** Judul halaman + breadcrumb + aksi — kartu bertint primary ala breadcrumb card Spike. */
export function PageHeader({ title, description, crumbs, actions, backHref, className }: Props) {
  return (
    <div
      className={cn(
        'deco-rings mb-6 flex flex-col gap-4 rounded-card bg-[color-mix(in_srgb,var(--primary)_9%,var(--card))] px-5 py-6 sm:flex-row sm:items-center sm:justify-between md:px-7',
        className
      )}
    >
      <div className="flex min-w-0 items-start gap-3.5">
        {backHref && (
          <Link
            href={backHref}
            aria-label="Kembali"
            className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-full bg-card text-foreground shadow-card transition-[color,background-color,transform] duration-200 hover:-translate-x-0.5 hover:bg-primary hover:text-primary-foreground"
          >
            <Iconify icon="solar:arrow-left-linear" size={18} />
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-xl font-bold md:text-[1.5rem]">{title}</h1>
          {crumbs && crumbs.length > 0 && (
            <nav aria-label="Breadcrumb" className="mt-1.5">
              <ol className="flex flex-wrap items-center gap-1 text-sm text-foreground/60">
                {crumbs.map((c, i) => (
                  <li key={`${c.label}-${i}`} className="flex items-center gap-1">
                    {i > 0 && (
                      <Iconify
                        icon="solar:alt-arrow-right-linear"
                        size={14}
                        className="text-foreground/35"
                      />
                    )}
                    {i === 0 && (
                      <Iconify icon="solar:home-smile-angle-linear" size={16} className="mr-0.5" />
                    )}
                    {c.href ? (
                      <Link href={c.href} className="transition-colors hover:text-primary">
                        {c.label}
                      </Link>
                    ) : (
                      <span
                        aria-current={i === crumbs.length - 1 ? 'page' : undefined}
                        className={cn(i === crumbs.length - 1 && 'font-semibold text-primary')}
                      >
                        {c.label}
                      </span>
                    )}
                  </li>
                ))}
              </ol>
            </nav>
          )}
          {description && (
            <p className="mt-2 max-w-[68ch] text-sm leading-relaxed text-foreground/65">
              {description}
            </p>
          )}
        </div>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
