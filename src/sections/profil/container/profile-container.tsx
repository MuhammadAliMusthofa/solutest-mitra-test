'use client';

import { useQuery } from '@tanstack/react-query';

import { Skeleton } from 'src/components/ui/skeleton';

import type { Role } from 'src/config/roles';
import { ROLES, ROLE_LABEL } from 'src/config/roles';

import { useTenant } from 'src/hooks/use-tenant';
import { useCurrentUser } from 'src/hooks/use-session';

import { formatLongDate } from 'src/utils/format';

import { profileService } from 'src/services/account';

import { Iconify } from 'src/components/iconify/iconify';
import { ErrorState } from 'src/components/feedback/error-state';
import { UserAvatar } from 'src/components/data-display/user-avatar';
import { PageHeader } from 'src/components/data-display/page-header';
import { SectionCard } from 'src/components/data-display/section-card';

function InfoRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-1">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-medium">{value || '—'}</dd>
    </div>
  );
}

/** Profil Saya — dipakai admin, guru, dan siswa. Data akun dikelola di Solutest pusat. */
export function ProfileContainer({ homeHref }: { homeHref: string }) {
  const { branding } = useTenant();
  const role = useCurrentUser().user?.role as Role | undefined;
  const query = useQuery({ queryKey: ['profile', 'me'], queryFn: profileService.me });
  const p = query.data;
  const isStudent = role === ROLES.siswa;

  return (
    <>
      <PageHeader
        title="Profil Saya"
        crumbs={[{ label: 'Beranda', href: homeHref }, { label: 'Profil' }]}
      />
      {query.isPending && <Skeleton className="h-96 w-full rounded-card" />}
      {query.isError && (
        <SectionCard>
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </SectionCard>
      )}
      {p && (
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <section className="h-fit overflow-hidden rounded-card bg-card shadow-card">
            <div className="h-24 bg-gradient-to-r from-primary to-secondary" />
            <div className="-mt-12 flex flex-col items-center px-6 pb-6 text-center">
              <span className="rounded-full ring-4 ring-card">
                <UserAvatar name={p.full_name} src={p.image_profile} size={96} />
              </span>
              <h2 className="mt-3 text-lg font-bold">{p.full_name}</h2>
              <p className="text-sm text-muted-foreground">
                {role ? ROLE_LABEL[role] : ''} · {branding.short_name || branding.name}
              </p>
              <dl className="mt-5 w-full space-y-2 text-left text-sm">
                {[
                  ['solar:letter-linear', p.email],
                  ['solar:phone-linear', p.phone || 'Belum diisi'],
                  ...(isStudent
                    ? [
                        [
                          'solar:square-academic-cap-linear',
                          [p.school_name, p.class_name].filter(Boolean).join(' · ') ||
                            'Belum diisi',
                        ],
                      ]
                    : []),
                  ['solar:calendar-linear', `Bergabung ${formatLongDate(p.created_at)}`],
                ].map(([icon, text]) => (
                  <div
                    key={icon}
                    className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2"
                  >
                    <Iconify icon={icon} size={18} className="text-muted-foreground" />
                    <span className="truncate">{text}</span>
                  </div>
                ))}
              </dl>
            </div>
          </section>

          <SectionCard title="Data akun">
            <dl className="grid gap-5 sm:grid-cols-2">
              <InfoRow label="Nama lengkap" value={p.full_name} />
              <InfoRow label="Email" value={p.email} />
              <InfoRow label="No. HP" value={p.phone} />
              <InfoRow label="Peran" value={role ? ROLE_LABEL[role] : ''} />
              {role !== ROLES.admin && <InfoRow label="Sekolah" value={p.school_name} />}
              {isStudent && (
                <>
                  <InfoRow label="NISN" value={p.nisn} />
                  <InfoRow label="Kelas" value={p.class_name} />
                </>
              )}
            </dl>
            <p className="mt-6 flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2.5 text-sm text-muted-foreground">
              <Iconify icon="solar:info-circle-linear" size={18} className="mt-0.5 shrink-0" />
              Nama, email, dan password memakai akun Solutest. Ubah lewat solutest.id; sekolah,
              NISN, dan kelas diatur oleh admin mitra.
            </p>
          </SectionCard>
        </div>
      )}
    </>
  );
}
