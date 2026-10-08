'use client';

import type { StudentHistoryRow } from 'src/models/monitoring';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { formatScore, formatDateTime } from 'src/utils/format';

import { monitoringService } from 'src/services/monitoring';

import { KpiCard } from 'src/components/data-display/kpi-card';
import { DataTable } from 'src/components/data-display/data-table';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

/** Riwayat tryout seorang siswa (lintas jadwal). */
export function StudentHistoryContainer() {
  const { studentId } = useParams<{ studentId: string }>();
  const { panel, paths } = usePanel();
  const [{ page }, setF] = useUrlState({ page: '1' });
  const query = useQuery({
    queryKey: ['monitoring', panel, 'student', studentId, page],
    queryFn: () =>
      monitoringService.studentHistory(panel, studentId, { page: Number(page), per_page: 10 }),
    placeholderData: keepPreviousData,
  });
  const d = query.data;

  const columns: Column<StudentHistoryRow>[] = [
    {
      key: 'title',
      header: 'Tryout',
      cell: (r) => (
        <Link href={paths.attemptDetail(r.attempt_id)} className="block min-w-48">
          <p className="font-semibold hover:text-primary">{r.schedule.title}</p>
          <p className="text-xs text-muted-foreground">
            {[r.package.title, r.package.subject_name].filter(Boolean).join(' · ')}
          </p>
        </Link>
      ),
    },
    {
      key: 'time',
      header: 'Dikumpulkan',
      hideOnMobile: true,
      cell: (r) => <span className="text-xs">{formatDateTime(r.submitted_at)}</span>,
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
      cell: (r) => (
        <div className="flex flex-wrap items-center gap-1">
          <PredicateBadge predicate={r.predicate} />
          {r.is_auto_ended && <StatusPill tone="warning">Otomatis</StatusPill>}
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={d?.student.full_name ?? 'Riwayat siswa'}
        description={
          d
            ? [d.student.email, d.student.nisn && `NISN ${d.student.nisn}`, d.student.class_name]
                .filter(Boolean)
                .join(' · ')
            : undefined
        }
        backHref={paths.siswa}
        crumbs={[{ label: 'Siswa', href: paths.siswa }, { label: 'Riwayat' }]}
      />
      <div className="mb-6 grid gap-5 sm:grid-cols-3">
        <KpiCard
          label="Tryout dikerjakan"
          value={String(d?.summary.total_attempt ?? '-')}
          icon="solar:checklist-minimalistic-linear"
        />
        <KpiCard
          label="Rata-rata"
          value={formatScore(d?.summary.average_score)}
          icon="solar:medal-ribbon-star-linear"
          tone="accent"
        />
        <KpiCard
          label="Tertinggi"
          value={formatScore(d?.summary.highest_score)}
          icon="solar:cup-star-linear"
          tone="secondary"
        />
      </div>
      <SectionCard flush>
        <div className="mt-2">
          <DataTable
            columns={columns}
            rows={d?.data}
            rowKey={(r) => r.attempt_id}
            loading={query.isPending}
            error={query.error}
            onRetry={() => query.refetch()}
            empty={{ title: 'Belum ada tryout yang dikumpulkan', icon: 'solar:history-linear' }}
          />
          <TablePagination meta={d?.pagination} onPageChange={(p) => setF({ page: p })} />
        </div>
      </SectionCard>
    </>
  );
}
