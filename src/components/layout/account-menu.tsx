'use client';

import Link from 'next/link';

import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from 'src/components/ui/dropdown-menu';

import { useLogout, useCurrentUser } from 'src/hooks/use-session';

import { Iconify } from 'src/components/iconify/iconify';
import { UserAvatar } from 'src/components/data-display/user-avatar';

interface Props {
  profilePath: string;
  extraLinks?: { title: string; path: string; icon: string }[];
}

/** Avatar + nama di topbar/navbar; menu profil & keluar. */
export function AccountMenu({ profilePath, extraLinks = [] }: Props) {
  const { user, roleLabel } = useCurrentUser();
  const logout = useLogout();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-3 rounded-full py-1 pr-2 pl-1 text-left outline-none hover:bg-primary/6 focus-visible:ring-3 focus-visible:ring-ring/40"
        aria-label="Menu akun"
      >
        <UserAvatar name={user?.full_name} src={user?.image_profile} size={42} online />
        <span className="hidden max-w-40 sm:block">
          <span className="block truncate text-sm font-semibold">{user?.full_name ?? '…'}</span>
          <span className="block truncate text-xs text-muted-foreground">{roleLabel}</span>
        </span>
        <Iconify
          icon="solar:alt-arrow-down-linear"
          size={16}
          className="hidden text-muted-foreground sm:block"
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <span className="block truncate text-sm font-semibold">{user?.full_name}</span>
          <span className="block truncate text-xs text-muted-foreground">{user?.email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={profilePath}>
            <Iconify icon="solar:user-circle-linear" size={18} />
            Profil Saya
          </Link>
        </DropdownMenuItem>
        {extraLinks.map((l) => (
          <DropdownMenuItem key={l.path} asChild>
            <Link href={l.path}>
              <Iconify icon={l.icon} size={18} />
              {l.title}
            </Link>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onSelect={() => logout()}>
          <Iconify icon="solar:logout-2-linear" size={18} />
          Keluar
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
