import type { ReactNode } from 'react';
import type { Crumb } from './page-header';

import Link from 'next/link';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

interface Props {
  title: string;
  description?: ReactNode;
  crumbs?: Crumb[];
  /** ikon dekoratif besar di kanan (mis. piala) */
  icon?: string;
  children?: ReactNode;
  className?: string;
}

/** Banner halaman siswa (gaya Solutest): latar warna aksen, breadcrumb, judul, ikon besar. */
export function HeroBanner({ title, description, crumbs, icon, children, className }: Props) {
  return (
    <section
      className={cn(
        'deco-rings relative mb-8 rounded-card bg-primary px-6 py-9 text-primary-foreground [--deco:var(--primary-foreground)] md:px-10 md:py-12',
        className
      )}
    >
      <div className="relative z-10 max-w-2xl">
        {crumbs && crumbs.length > 0 && (
          <nav aria-label="Breadcrumb" className="mb-3">
            <ol className="flex flex-wrap items-center gap-2 text-sm font-bold">
              {crumbs.map((c, i) => (
                <li key={`${c.label}-${i}`} className="flex items-center gap-2">
                  {i > 0 && <Iconify icon="solar:alt-arrow-right-linear" size={14} />}
                  {c.href ? (
                    <Link href={c.href} className="opacity-75 transition-opacity hover:opacity-100">
                      {c.label}
                    </Link>
                  ) : (
                    <span aria-current="page">{c.label}</span>
                  )}
                </li>
              ))}
            </ol>
          </nav>
        )}
        <h1 className="text-2xl font-extrabold md:text-[2rem]">{title}</h1>
        {description && (
          <p className="mt-2 text-sm leading-relaxed opacity-80 md:text-base">{description}</p>
        )}
        {children}
      </div>
      {icon && (
        <Iconify
          icon={icon}
          size={168}
          className="pointer-events-none absolute right-6 bottom-0 hidden -rotate-6 opacity-90 drop-shadow-[0_18px_24px_rgb(0_0_0/0.18)] md:block lg:right-14"
        />
      )}
    </section>
  );
}
