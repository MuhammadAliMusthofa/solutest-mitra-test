'use client';

import type { ScheduleResultRow } from 'src/models/monitoring';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { Skeleton } from 'src/components/ui/skeleton';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { formatScore, formatNumber, formatDateTime } from 'src/utils/format';

import { monitoringService } from 'src/services/monitoring';

import { Iconify } from 'src/components/iconify/iconify';
import { SearchInput } from 'src/components/form/search-input';
import { SelectField } from 'src/components/form/select-field';
import { ErrorState } from 'src/components/feedback/error-state';
import { DataTable } from 'src/components/data-display/data-table';
import { FilterBar } from 'src/components/data-display/filter-bar';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { SCHEDULE_STATUS } from 'src/sections/jadwal-tryout/helpers/schedule';
import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

const ATTEMPT_STATUS = {
  in_progress: { label: 'Mengerjakan', tone: 'warning' },
  scoring: { label: 'Dinilai…', tone: 'info' },
  scored: { label: 'Selesai', tone: 'success' },
} as const;

/** Rekap satu tryout: per sekolah + daftar hasil siswa. */
export function HasilDetailContainer() {
  const { id } = useParams<{ id: string }>();
  const { panel, isAdmin, paths } = usePanel();
  const [f, setF] = useUrlState({ school_id: '', search: '', class_name: '', page: '1' });
  const summary = useQuery({
    queryKey: ['monitoring', panel, 'summary', id],
    queryFn: () => monitoringService.summary(panel, id),
  });
  const params = {
    school_id: isAdmin ? f.school_id : undefined,
    search: f.search,
    class_name: f.class_name,
    page: Number(f.page),
    per_page: 15,
  };
  const results = useQuery({
    queryKey: ['monitoring', panel, 'results', id, params],
    queryFn: () => monitoringService.results(panel, id, params),
    placeholderData: keepPreviousData,
  });
  const s = summary.data?.schedule;

  const columns: Column<ScheduleResultRow>[] = [
    {
      key: 'student',
      header: 'Siswa',
      cell: (r) => (
        <Link href={paths.attemptDetail(r.attempt_id)} className="block min-w-48">
          <p className="font-semibold hover:text-primary">{r.student.full_name}</p>
          <p className="text-xs text-muted-foreground">
            {[r.student.class_name, isAdmin && r.school?.name].filter(Boolean).join(' · ') ||
              r.student.email}
          </p>
        </Link>
      ),
    },
    {
      key: 'time',
      header: 'Dikumpulkan',
      hideOnMobile: true,
      cell: (r) => (
        <span className="text-xs">{r.submitted_at ? formatDateTime(r.submitted_at) : '-'}</span>
      ),
    },
    {
      key: 'violation',
      header: 'Pelanggaran',
      align: 'right',
      hideOnMobile: true,
      cell: (r) =>
        r.total_violation ? (
          <span className="inline-flex items-center gap-1 text-warning">
            <Iconify icon="solar:shield-warning-linear" size={14} />
            {r.total_violation}
          </span>
        ) : (
          '-'
        ),
    },
    {
      key: 'score',
      header: 'Skor',
      align: 'right',
      cell: (r) => <span className="font-semibold tabular-nums">{formatScore(r.score)}</span>,
    },
    {
      key: 'predicate',
      header: 'Predikat',
      cell: (r) => <PredicateBadge predicate={r.predicate} />,
    },
    {
      key: 'status',
      header: 'Status',
      hideOnMobile: true,
      cell: (r) => (
        <div className="flex flex-col items-start gap-0.5">
          <StatusPill tone={ATTEMPT_STATUS[r.status].tone}>
            {ATTEMPT_STATUS[r.status].label}
          </StatusPill>
          {r.is_auto_ended && (
            <span className="text-[11px] text-muted-foreground">dikumpulkan otomatis</span>
          )}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={s?.title ?? 'Hasil tryout'}
        description={s ? `${s.code} · ${s.package_title}` : undefined}
        backHref={paths.hasilTryout}
        crumbs={[
          { label: 'Hasil Tryout', href: paths.hasilTryout },
          { label: s?.code ?? 'Detail' },
        ]}
        actions={
          s && (
            <StatusPill tone={SCHEDULE_STATUS[s.status].tone} icon={SCHEDULE_STATUS[s.status].icon}>
              {SCHEDULE_STATUS[s.status].label}
            </StatusPill>
          )
        }
      />
      {summary.isPending && <Skeleton className="mb-6 h-40 w-full rounded-card" />}
      {summary.isError && (
        <SectionCard className="mb-6">
          <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
        </SectionCard>
      )}
      {summary.data && (
        <SectionCard title="Rekap per sekolah" flush className="mb-6">
          <div className="mt-4">
            <DataTable
              columns={[
                {
                  key: 'school',
                  header: 'Sekolah',
                  cell: (r) => <span className="font-medium">{r.school_name ?? '-'}</span>,
                },
                {
                  key: 'participant',
                  header: 'Peserta',
                  align: 'right',
                  cell: (r) => formatNumber(r.total_participant),
                },
                {
                  key: 'submitted',
                  header: 'Selesai',
                  align: 'right',
                  cell: (r) => formatNumber(r.total_submitted),
                },
                {
                  key: 'avg',
                  header: 'Rata-rata',
                  align: 'right',
                  cell: (r) => (
                    <div className="flex items-center justify-end gap-2">
                      <span className="font-semibold tabular-nums">
                        {formatScore(r.average_score)}
                      </span>
                      <PredicateBadge predicate={r.average_predicate} />
                    </div>
                  ),
                },
                {
                  key: 'range',
                  header: 'Tertinggi / terendah',
                  align: 'right',
                  hideOnMobile: true,
                  cell: (r) => `${formatScore(r.highest_score)} / ${formatScore(r.lowest_score)}`,
                },
              ]}
              rows={summary.data.schools}
              rowKey={(r) => r.school_id ?? 0}
              empty={{
                title: 'Belum ada siswa yang mengumpulkan',
                icon: 'solar:users-group-rounded-linear',
              }}
            />
          </div>
        </SectionCard>
      )}
      <SectionCard title="Hasil siswa" flush>
        <FilterBar>
          <SearchInput
            value={f.search}
            onChange={(search) => setF({ search })}
            placeholder="Cari nama, email, NISN…"
          />
          {isAdmin && summary.data && (
            <SelectField
              aria-label="Filter sekolah"
              value={f.school_id}
              onChange={(school_id) => setF({ school_id })}
              options={summary.data.schools
                .filter((r) => r.school_id)
                .map((r) => ({ value: String(r.school_id), label: r.school_name ?? '-' }))}
              allLabel="Semua sekolah"
              className="sm:w-56"
            />
          )}
          <SearchInput
            value={f.class_name}
            onChange={(class_name) => setF({ class_name })}
            placeholder="Kelas (persis)…"
            className="sm:w-40"
          />
        </FilterBar>
        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={results.data?.data}
            rowKey={(r) => r.attempt_id}
            loading={results.isPending}
            error={results.error}
            onRetry={() => results.refetch()}
            empty={{ title: 'Belum ada pengerjaan', icon: 'solar:document-text-linear' }}
          />
          <TablePagination
            meta={results.data?.pagination}
            onPageChange={(page) => setF({ page })}
          />
        </div>
      </SectionCard>
    </>
  );
}
