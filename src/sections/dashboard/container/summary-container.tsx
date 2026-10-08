'use client';

import type { MonitoringSchedule } from 'src/models/monitoring';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';

import { usePanel } from 'src/hooks/use-panel';
import { useTenant } from 'src/hooks/use-tenant';
import { useCurrentUser } from 'src/hooks/use-session';

import { greeting, formatScore, formatNumber, formatDateTime } from 'src/utils/format';

import { summaryService, monitoringService } from 'src/services/monitoring';

import { Iconify } from 'src/components/iconify/iconify';
import { KpiCard } from 'src/components/data-display/kpi-card';
import { DataTable } from 'src/components/data-display/data-table';
import { StatusPill } from 'src/components/data-display/status-pill';
import type { Column } from 'src/components/data-display/data-table';
import { WelcomeCard } from 'src/components/data-display/welcome-card';
import { SectionCard } from 'src/components/data-display/section-card';

import { SCHEDULE_STATUS } from 'src/sections/jadwal-tryout/helpers/schedule';
import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

function QuotaBar({ label, used, limit }: { label: string; used: number; limit: number }) {
  const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-semibold tabular-nums">
          {formatNumber(used)}/{formatNumber(limit)}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={pct >= 90 ? 'h-full bg-warning' : 'h-full bg-primary'}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Ringkasan beranda admin / guru dari `GET /admin|teacher/summary` + tryout terbaru.
 * Guru otomatis dibatasi backend ke sekolahnya.
 */
export function SummaryContainer() {
  const { panel, isAdmin, paths } = usePanel();
  const { user } = useCurrentUser();
  const { branding } = useTenant();
  const admin = useQuery({
    queryKey: ['summary', 'admin'],
    queryFn: summaryService.admin,
    enabled: isAdmin,
  });
  const teacher = useQuery({
    queryKey: ['summary', 'teacher'],
    queryFn: summaryService.teacher,
    enabled: !isAdmin,
  });
  const recent = useQuery({
    queryKey: ['monitoring', panel, 'recent'],
    queryFn: () => monitoringService.schedules(panel, { page: 1, per_page: 5 }),
  });
  const schedules = isAdmin ? admin.data?.schedules : teacher.data?.schedules;
  const firstName = user?.full_name.split(' ').slice(0, 2).join(' ') ?? '';
  const noSchool = !isAdmin && teacher.data && !teacher.data.school;

  const columns: Column<MonitoringSchedule>[] = [
    {
      key: 'title',
      header: 'Tryout',
      cell: (s) => (
        <Link href={paths.hasilTryoutDetail(s.id)} className="block min-w-48">
          <p className="font-semibold hover:text-primary">{s.title}</p>
          <p className="font-mono text-xs text-muted-foreground">{s.code}</p>
        </Link>
      ),
    },
    {
      key: 'time',
      header: 'Waktu',
      hideOnMobile: true,
      cell: (s) => <span className="text-xs">{formatDateTime(s.start_date)}</span>,
    },
    {
      key: 'submitted',
      header: 'Selesai',
      align: 'right',
      cell: (s) => formatNumber(s.submitted_count),
    },
    {
      key: 'avg',
      header: 'Rata-rata',
      align: 'right',
      cell: (s) => (
        <div className="flex items-center justify-end gap-2">
          <span className="font-semibold tabular-nums">
            {formatScore(s.average_score ?? undefined)}
          </span>
          {s.average_score !== null && <PredicateBadge score={s.average_score} />}
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => (
        <StatusPill tone={SCHEDULE_STATUS[s.status].tone} icon={SCHEDULE_STATUS[s.status].icon}>
          {SCHEDULE_STATUS[s.status].label}
        </StatusPill>
      ),
    },
  ];

  return (
    <div className="grid grid-cols-12 gap-5 md:gap-6">
      <div className="col-span-12 xl:col-span-6">
        <WelcomeCard
          className="h-full"
          title={`${greeting()}, ${firstName}`}
          subtitle={
            isAdmin
              ? `Kelola sekolah, guru, siswa, dan tryout ${branding.name}.`
              : `Siswa & hasil tryout ${teacher.data?.school?.name ?? 'sekolah Anda'}.`
          }
        >
          {noSchool ? (
            <p
              role="alert"
              className="mt-5 flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2 text-sm text-warning"
            >
              <Iconify icon="solar:danger-triangle-linear" size={18} className="mt-0.5" />
              Akun Anda belum terhubung ke sekolah. Hubungi admin mitra.
            </p>
          ) : (
            <div className="mt-5 flex flex-wrap gap-2">
              <Button asChild>
                <Link href={isAdmin ? paths.jadwalTryout : paths.siswa}>
                  <Iconify
                    icon={isAdmin ? 'solar:calendar-add-linear' : 'solar:user-plus-linear'}
                    size={18}
                  />
                  {isAdmin ? 'Jadwalkan tryout' : 'Kelola siswa'}
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href={paths.hasilTryout}>Hasil tryout</Link>
              </Button>
            </div>
          )}
        </WelcomeCard>
      </div>

      <div className="col-span-12 grid grid-cols-2 gap-5 sm:grid-cols-4 md:gap-6 xl:col-span-6 xl:grid-cols-2">
        {isAdmin ? (
          <>
            <KpiCard
              label="Sekolah"
              value={formatNumber(admin.data?.total_school)}
              icon="solar:buildings-2-linear"
            />
            <KpiCard
              label="Guru aktif"
              value={formatNumber(admin.data?.total_teacher)}
              icon="solar:square-academic-cap-linear"
              tone="secondary"
            />
            <KpiCard
              label="Siswa aktif"
              value={formatNumber(admin.data?.total_student)}
              icon="solar:user-id-linear"
              tone="accent"
            />
            <KpiCard
              label="Paket soal"
              value={formatNumber(admin.data?.total_package)}
              icon="solar:box-linear"
              tone="info"
            />
          </>
        ) : (
          <>
            <KpiCard
              label="Siswa aktif"
              value={formatNumber(teacher.data?.total_student)}
              icon="solar:user-id-linear"
              tone="accent"
            />
            <KpiCard
              label="Tryout berlangsung"
              value={formatNumber(schedules?.active)}
              icon="solar:play-circle-linear"
              tone="success"
            />
          </>
        )}
      </div>

      <SectionCard title="Jadwal tryout" className="col-span-12 lg:col-span-4">
        <ul className="space-y-3">
          {(
            [
              ['Berlangsung', schedules?.active, 'success', 'solar:play-circle-linear'],
              ['Terjadwal', schedules?.upcoming, 'primary', 'solar:calendar-linear'],
              ['Selesai', schedules?.ended, 'neutral', 'solar:check-circle-linear'],
            ] as const
          ).map(([label, n, tone, icon]) => (
            <li key={label} className="flex items-center justify-between">
              <StatusPill tone={tone} icon={icon}>
                {label}
              </StatusPill>
              <span className="text-lg font-semibold tabular-nums">{formatNumber(n)}</span>
            </li>
          ))}
        </ul>
        {isAdmin && admin.data?.quota && (
          <div className="mt-6 space-y-4 border-t border-border pt-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Kuota akun</p>
            <QuotaBar label="Guru" {...admin.data.quota.guru} />
            <QuotaBar label="Siswa" {...admin.data.quota.siswa} />
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Tryout terbaru"
        className="col-span-12 lg:col-span-8"
        flush
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href={paths.hasilTryout}>
              Semua hasil
              <Iconify icon="solar:arrow-right-linear" size={16} />
            </Link>
          </Button>
        }
      >
        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={recent.data?.data}
            rowKey={(s) => s.id}
            loading={recent.isPending}
            error={recent.error}
            onRetry={() => recent.refetch()}
            empty={{ title: 'Belum ada tryout', icon: 'solar:calendar-linear' }}
          />
        </div>
      </SectionCard>
    </div>
  );
}
