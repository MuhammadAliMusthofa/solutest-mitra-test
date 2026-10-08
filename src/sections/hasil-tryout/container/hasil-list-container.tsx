'use client';

import type { MonitoringSchedule } from 'src/models/monitoring';
import type { TryoutScheduleStatus } from 'src/models/schedule';

import Link from 'next/link';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { formatScore, formatNumber, formatDateTime } from 'src/utils/format';

import { monitoringService } from 'src/services/monitoring';

import { SearchInput } from 'src/components/form/search-input';
import { SelectField } from 'src/components/form/select-field';
import { DataTable } from 'src/components/data-display/data-table';
import { FilterBar } from 'src/components/data-display/filter-bar';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';
import { SCHEDULE_STATUS, SCHEDULE_STATUSES } from 'src/sections/jadwal-tryout/helpers/schedule';

/** Daftar tryout + rekap nilai (admin: semua sekolah, guru: sekolahnya). */
export function HasilListContainer() {
  const { panel, isAdmin, paths } = usePanel();
  const [f, setF] = useUrlState({ status: '', search: '', page: '1' });
  const params = {
    status: f.status as TryoutScheduleStatus | '',
    search: f.search,
    page: Number(f.page),
    per_page: 10,
  };
  const query = useQuery({
    queryKey: ['monitoring', panel, 'schedules', params],
    queryFn: () => monitoringService.schedules(panel, params),
    placeholderData: keepPreviousData,
  });

  const columns: Column<MonitoringSchedule>[] = [
    {
      key: 'title',
      header: 'Tryout',
      cell: (s) => (
        <Link href={paths.hasilTryoutDetail(s.id)} className="block min-w-56">
          <p className="font-semibold hover:text-primary">{s.title}</p>
          <p className="text-xs text-muted-foreground">
            <span className="font-mono">{s.code}</span> · {s.package_title}
          </p>
        </Link>
      ),
    },
    {
      key: 'time',
      header: 'Waktu',
      hideOnMobile: true,
      cell: (s) => (
        <div className="text-xs">
          <p>{formatDateTime(s.start_date)}</p>
          <p className="text-muted-foreground">s.d. {formatDateTime(s.end_date)}</p>
        </div>
      ),
    },
    {
      key: 'submitted',
      header: 'Dikumpulkan',
      align: 'right',
      cell: (s) => formatNumber(s.submitted_count),
    },
    {
      key: 'avg',
      header: 'Rata-rata',
      align: 'right',
      cell: (s) => (
        <div className="flex items-center justify-end gap-2">
          <span className="font-semibold tabular-nums">{formatScore(s.average_score)}</span>
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
    <>
      <PageHeader
        title="Hasil Tryout"
        description={
          isAdmin
            ? 'Rekap nilai per tryout untuk semua sekolah mitra.'
            : 'Rekap nilai tryout siswa di sekolah Anda.'
        }
        crumbs={[{ label: 'Ringkasan', href: paths.root }, { label: 'Hasil Tryout' }]}
      />
      <SectionCard flush>
        <FilterBar>
          <SelectField
            aria-label="Filter status"
            value={f.status}
            onChange={(status) => setF({ status })}
            options={SCHEDULE_STATUSES.map((s) => ({ value: s, label: SCHEDULE_STATUS[s].label }))}
            allLabel="Semua status"
            className="sm:w-44"
          />
          <SearchInput
            value={f.search}
            onChange={(search) => setF({ search })}
            placeholder="Cari judul tryout…"
          />
        </FilterBar>
        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={query.data?.data}
            rowKey={(s) => s.id}
            loading={query.isPending}
            error={query.error}
            onRetry={() => query.refetch()}
            empty={{ title: 'Belum ada tryout', icon: 'solar:calendar-linear' }}
          />
          <TablePagination meta={query.data?.pagination} onPageChange={(page) => setF({ page })} />
        </div>
      </SectionCard>
    </>
  );
}
