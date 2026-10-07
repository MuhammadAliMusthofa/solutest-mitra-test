'use client';

import Link from 'next/link';
import { useState } from 'react';
import { usePathname } from 'next/navigation';

import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/ui/collapsible';

import { resolveActivePath } from 'src/config/nav';
import type { NavItem, NavSection } from 'src/config/nav';

import { useLogout, useCurrentUser } from 'src/hooks/use-session';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';
import { UserAvatar } from 'src/components/data-display/user-avatar';

import { BrandMark } from './brand-mark';

/**
 * Aksen per menu (hover/aktif) ala Spike. Pada sidebar bergaya brand/dark semua aksen
 * diseragamkan lewat token --sidebar-accent (lihat globals.css).
 */
const ACCENTS = [
  'data-[active=true]:bg-primary/10 data-[active=true]:text-primary hover:bg-primary/10 hover:text-primary',
  'data-[active=true]:bg-brand-accent/22 data-[active=true]:text-[color-mix(in_oklab,var(--brand-accent)_45%,black)] hover:bg-brand-accent/22 hover:text-[color-mix(in_oklab,var(--brand-accent)_45%,black)]',
  'data-[active=true]:bg-secondary/14 data-[active=true]:text-[color-mix(in_oklab,var(--secondary)_80%,black)] hover:bg-secondary/14 hover:text-[color-mix(in_oklab,var(--secondary)_80%,black)]',
  'data-[active=true]:bg-info/12 data-[active=true]:text-info hover:bg-info/12 hover:text-info',
  'data-[active=true]:bg-primary/7 data-[active=true]:text-[color-mix(in_oklab,var(--primary)_75%,black)] hover:bg-primary/7 hover:text-[color-mix(in_oklab,var(--primary)_75%,black)]',
];

const UNIFORM =
  'in-data-[sidebar-style=brand]:data-[active=true]:bg-sidebar-accent in-data-[sidebar-style=brand]:data-[active=true]:text-sidebar-accent-foreground in-data-[sidebar-style=brand]:hover:bg-sidebar-accent in-data-[sidebar-style=brand]:hover:text-sidebar-accent-foreground in-data-[sidebar-style=dark]:data-[active=true]:bg-sidebar-accent in-data-[sidebar-style=dark]:data-[active=true]:text-sidebar-accent-foreground in-data-[sidebar-style=dark]:hover:bg-sidebar-accent in-data-[sidebar-style=dark]:hover:text-sidebar-accent-foreground';

interface Props {
  sections: NavSection[];
  collapsed?: boolean;
  onNavigate?: () => void;
  className?: string;
}

export function Sidebar({ sections, collapsed = false, onNavigate, className }: Props) {
  const pathname = usePathname();
  const activePath = resolveActivePath(pathname, sections);

  return (
    <aside
      aria-label="Navigasi utama"
      className={cn(
        'flex h-full flex-col overflow-hidden rounded-card bg-sidebar text-sidebar-foreground shadow-card transition-[width] duration-200 ease-out',
        collapsed ? 'w-[88px]' : 'w-[270px]',
        className
      )}
    >
      <div className={cn('flex h-[78px] items-center px-5', collapsed && 'justify-center px-0')}>
        <BrandMark compact={collapsed} subtitle="Solutest Mitra" onSidebar />
      </div>

      <nav className="no-scrollbar flex-1 overflow-y-auto px-4 pb-4">
        {sections.map((section) => (
          <div key={section.title} className="mt-4 first:mt-1">
            {collapsed ? (
              <div className="mx-auto my-3 h-px w-6 bg-sidebar-border" />
            ) : (
              <p className="mb-2 px-3 text-[0.72rem] font-semibold tracking-[0.08em] text-sidebar-muted uppercase">
                {section.title}
              </p>
            )}
            <ul className="space-y-1">
              {section.items.map((item) => (
                <li key={item.path}>
                  <SidebarItem
                    item={item}
                    activePath={activePath}
                    collapsed={collapsed}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <SidebarUser collapsed={collapsed} />
    </aside>
  );
}

function SidebarItem({
  item,
  activePath,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  activePath: string;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const childActive = item.children?.some((c) => c.path === activePath) ?? false;
  const active = item.path === activePath || childActive;
  const [open, setOpen] = useState(childActive);
  const accent = cn(ACCENTS[item.accent % ACCENTS.length], UNIFORM);
  const base =
    'flex h-11 w-full items-center gap-3 rounded-full px-4 text-[0.92rem] font-medium text-sidebar-foreground transition-colors duration-150 outline-none focus-visible:ring-3 focus-visible:ring-sidebar-ring/40';

  const content = (
    <>
      <Iconify icon={item.icon} size={21} />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </>
  );

  if (collapsed || !item.children?.length) {
    const link = (
      <Link
        href={item.path}
        data-active={active}
        aria-current={item.path === activePath ? 'page' : undefined}
        onClick={onNavigate}
        className={cn(base, accent, collapsed && 'justify-center px-0')}
      >
        {content}
      </Link>
    );
    if (!collapsed) return link;
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right">{item.title}</TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Collapsible open={open || childActive} onOpenChange={setOpen}>
      <CollapsibleTrigger data-active={active} className={cn(base, accent)}>
        {content}
        <Iconify
          icon="solar:alt-arrow-right-linear"
          size={16}
          className={cn('ml-auto transition-transform', (open || childActive) && 'rotate-90')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-1 space-y-0.5 pl-6">
          {item.children.map((child) => {
            const isActive = child.path === activePath;
            return (
              <li key={child.path}>
                <Link
                  href={child.path}
                  onClick={onNavigate}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex h-9 items-center gap-3 rounded-full px-4 text-sm transition-colors outline-none hover:text-primary focus-visible:ring-3 focus-visible:ring-sidebar-ring/40 in-data-[sidebar-style=brand]:hover:text-sidebar-foreground in-data-[sidebar-style=dark]:hover:text-sidebar-foreground',
                    isActive
                      ? 'font-semibold text-primary in-data-[sidebar-style=brand]:text-sidebar-foreground in-data-[sidebar-style=dark]:text-sidebar-foreground'
                      : 'text-sidebar-muted'
                  )}
                >
                  <span
                    className={cn(
                      'size-1.5 rounded-full',
                      isActive ? 'bg-current' : 'bg-sidebar-muted/60'
                    )}
                  />
                  {child.title}
                </Link>
              </li>
            );
          })}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}

function SidebarUser({ collapsed }: { collapsed: boolean }) {
  const { user, roleLabel } = useCurrentUser();
  const logout = useLogout();

  return (
    <div className="p-4 pt-0">
      <div
        className={cn(
          'flex items-center gap-3 rounded-2xl bg-sidebar-accent/70 p-3',
          collapsed && 'flex-col p-2'
        )}
      >
        <UserAvatar name={user?.full_name} src={user?.image_profile} size={38} />
        {!collapsed && (
          <span className="min-w-0 flex-1 leading-tight">
            <span className="block truncate text-sm font-semibold">{user?.full_name}</span>
            <span className="block truncate text-xs text-sidebar-muted">{roleLabel}</span>
          </span>
        )}
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => logout()}
              aria-label="Keluar"
              className="grid size-9 place-items-center rounded-full text-sidebar-muted transition-colors hover:bg-destructive/10 hover:text-destructive"
            >
              <Iconify icon="solar:logout-2-linear" size={20} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="right">Keluar</TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}
