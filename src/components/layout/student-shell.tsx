'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ROLES } from 'src/config/roles';
import type { NavItem } from 'src/config/nav';
import { SISWA_PATHS } from 'src/config/paths';
import { NAV, resolveActivePath } from 'src/config/nav';

import { useTenant } from 'src/hooks/use-tenant';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

import { MockBadge } from './mock-badge';
import { BrandMark } from './brand-mark';
import { AccountMenu } from './account-menu';

const PILL_ACCENTS = [
  'data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-primary/10 hover:text-primary',
  'data-[active=true]:bg-brand-accent/22 data-[active=true]:text-[color-mix(in_oklab,var(--brand-accent)_45%,black)] hover:bg-brand-accent/22',
  'data-[active=true]:bg-secondary/14 data-[active=true]:text-[color-mix(in_oklab,var(--secondary)_80%,black)] hover:bg-secondary/14',
  'data-[active=true]:bg-info/12 data-[active=true]:text-info hover:bg-info/12',
];

/** Shell siswa: hanya navbar (tanpa sidebar) dengan logo & nama mitra. */
export function StudentShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const { branding } = useTenant();
  const sections = NAV[ROLES.siswa];
  const items = sections.flatMap((s) => s.items);
  const activePath = resolveActivePath(pathname, sections);

  return (
    <div className="mx-auto min-h-dvh max-w-[1280px] px-3 pt-3 md:px-6 md:pt-5">
      <header className="sticky top-2 z-30 rounded-card bg-card px-3 shadow-card md:top-4 md:px-5">
        <div className="flex h-[70px] items-center gap-3">
          <Link href={SISWA_PATHS.root} aria-label="Beranda" className="shrink-0">
            <BrandMark subtitle={branding.tagline ? 'Siswa' : null} />
          </Link>
          <nav
            aria-label="Navigasi siswa"
            className="hidden flex-1 items-center justify-center gap-1 md:flex"
          >
            {items.map((item) => (
              <NavPill key={item.path} item={item} active={item.path === activePath} />
            ))}
          </nav>
          <div className="flex-1 md:hidden" />
          <MockBadge />
          <AccountMenu profilePath={SISWA_PATHS.profile} />
        </div>
        <nav
          aria-label="Navigasi siswa"
          className="-mx-1 no-scrollbar flex gap-1 overflow-x-auto px-1 pb-3 md:hidden"
        >
          {items.map((item) => (
            <NavPill key={item.path} item={item} active={item.path === activePath} />
          ))}
        </nav>
      </header>
      <main id="konten" className="py-6">
        {children}
      </main>
    </div>
  );
}

function NavPill({ item, active }: { item: NavItem; active: boolean }) {
  return (
    <Link
      href={item.path}
      data-active={active}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex h-10 shrink-0 items-center gap-2 rounded-full px-4 text-[0.92rem] font-medium whitespace-nowrap transition-colors',
        PILL_ACCENTS[item.accent % PILL_ACCENTS.length]
      )}
    >
      <Iconify icon={item.icon} size={20} />
      {item.title}
    </Link>
  );
}
