'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';
import { useState, useSyncExternalStore } from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { Button } from 'src/components/ui/button';
import { Sheet, SheetTitle, SheetContent } from 'src/components/ui/sheet';

import type { Role } from 'src/config/roles';
import { panelPaths } from 'src/config/paths';
import { NAV, QUICK_LINKS } from 'src/config/nav';
import { ROLES, ROLE_PREFIX } from 'src/config/roles';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

import { Sidebar } from './sidebar';
import { MockBadge } from './mock-badge';
import { BrandMark } from './brand-mark';
import { AccountMenu } from './account-menu';

const COLLAPSE_KEY = 'st_sidebar_collapsed';

// Preferensi ciut sidebar per perangkat (localStorage) sebagai external store kecil.
const collapseListeners = new Set<() => void>();
const readCollapsed = () => {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === '1';
  } catch {
    return false;
  }
};
const subscribeCollapsed = (listener: () => void) => {
  collapseListeners.add(listener);
  window.addEventListener('storage', listener);
  return () => {
    collapseListeners.delete(listener);
    window.removeEventListener('storage', listener);
  };
};
const writeCollapsed = (value: boolean) => {
  try {
    localStorage.setItem(COLLAPSE_KEY, value ? '1' : '0');
  } catch {
    // abaikan
  }
  collapseListeners.forEach((l) => l());
};

/**
 * Shell admin & guru: sidebar + topbar melayang (gaya Spike Admin), konten maks 1440px.
 * Status ciut sidebar disimpan per perangkat (localStorage).
 */
export function PanelShell({ role, children }: { role: Role; children: ReactNode }) {
  const collapsed = useSyncExternalStore(subscribeCollapsed, readCollapsed, () => false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const sections = NAV[role];
  const toggleCollapsed = () => writeCollapsed(!collapsed);

  return (
    <div className="min-h-dvh">
      <div className="fixed inset-y-5 left-5 z-40 hidden xl:block">
        <Sidebar sections={sections} collapsed={collapsed} />
      </div>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent
          side="left"
          className="w-auto border-none bg-transparent p-3 shadow-none sm:max-w-none"
        >
          <SheetTitle className="sr-only">Menu navigasi</SheetTitle>
          <Sidebar sections={sections} onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>

      <div
        className={cn(
          'transition-[padding] duration-200 ease-out xl:pr-5',
          collapsed ? 'xl:pl-[128px]' : 'xl:pl-[310px]'
        )}
      >
        <div className="mx-auto max-w-[1440px] px-4 pt-4 xl:px-0 xl:pt-5">
          <Topbar
            role={role}
            onToggle={() => {
              if (window.matchMedia('(min-width: 1280px)').matches) toggleCollapsed();
              else setMobileOpen(true);
            }}
          />
          <main id="konten" className="py-6">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

function Topbar({ role, onToggle }: { role: Role; onToggle: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const [query, setQuery] = useState('');
  const panel = role === ROLES.admin ? 'admin' : 'guru';
  const paths = panelPaths(panel);
  const links = QUICK_LINKS[role] ?? [];

  const submitSearch = (event: React.FormEvent) => {
    event.preventDefault();
    const q = query.trim();
    router.push(`${paths.studentScores}${q ? `?search=${encodeURIComponent(q)}` : ''}`);
  };

  return (
    <header className="sticky top-2 z-30 flex h-[70px] items-center gap-2 rounded-card bg-card px-3 shadow-card md:gap-4 md:px-5 xl:top-5">
      <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Buka / ciutkan menu">
        <Iconify icon="solar:hamburger-menu-linear" size={24} />
      </Button>

      <Link href={ROLE_PREFIX[role]} className="xl:hidden" aria-label="Beranda">
        <BrandMark compact />
      </Link>

      <nav aria-label="Pintasan" className="hidden items-center gap-1 lg:flex">
        {links.map((l) => (
          <Link
            key={l.path}
            href={l.path}
            className={cn(
              'rounded-full px-3.5 py-2 text-[0.92rem] font-medium whitespace-nowrap transition-colors hover:bg-primary/8 hover:text-primary',
              pathname.startsWith(l.path) && 'text-primary'
            )}
          >
            {l.title}
          </Link>
        ))}
      </nav>

      <div className="flex-1" />

      <MockBadge />

      <form
        role="search"
        onSubmit={submitSearch}
        className="hidden h-11 w-64 items-center gap-2 rounded-full border border-input px-4 transition-shadow focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15 md:flex"
      >
        <Iconify icon="solar:magnifer-linear" size={18} className="text-muted-foreground" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari siswa…"
          aria-label="Cari siswa"
          className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </form>

      <AccountMenu
        profilePath={paths.profile}
        extraLinks={
          role === ROLES.admin
            ? [
                {
                  title: 'Pengaturan Mitra',
                  path: paths.pengaturan,
                  icon: 'solar:pallete-2-linear',
                },
              ]
            : []
        }
      />
    </header>
  );
}
