'use client';

import type { Paginated } from 'src/models/api';
import type {
  ProgressRow,
  TrendStatus,
  SchoolProgressItem,
  ProgressListParams,
  StudentProgressItem,
} from 'src/models/progress';

import { useRouter } from 'next/navigation';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import type { ProgressKind } from 'src/config/paths';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { cn } from 'src/lib/utils';
import { formatScore, formatNumber } from 'src/utils/format';
import {
  TREND_LABEL,
  schoolToRow,
  countByTrend,
  studentToRow,
  TREND_STATUSES,
} from 'src/utils/progress';

import { progressService } from 'src/services/analytics';

import { Iconify } from 'src/components/iconify/iconify';
import { Sparkline } from 'src/components/charts/sparkline';
import { SearchInput } from 'src/components/form/search-input';
import { DataTable } from 'src/components/data-display/data-table';
import { FilterBar } from 'src/components/data-display/filter-bar';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { TrendBadge, PredicateBadge } from 'src/sections/_global/components/predicate-badge';

type Item = SchoolProgressItem | StudentProgressItem;

const fetchList = (kind: ProgressKind, p: ProgressListParams): Promise<Paginated<Item>> =>
  kind === 'sekolah' ? progressService.schools(p) : progressService.students(p);

const STATUS_ICON: Record<TrendStatus, string> = {
  naik: 'solar:graph-up-linear',
  stabil: 'solar:minus-circle-linear',
  turun: 'solar:graph-down-linear',
  'kurang-data': 'solar:info-circle-linear',
};

/** Progres antar tryout — daftar sekolah atau siswa dengan status tren. */
export function ProgressListContainer({ kind }: { kind: ProgressKind }) {
  const router = useRouter();
  const { paths, isAdmin } = usePanel();
  const [f, setF] = useUrlState({ status: '', search: '', page: '1' });
  const params = {
    status: f.status as TrendStatus | '',
    search: f.search,
    page: Number(f.page),
    per_page: 10,
  };
  const query = useQuery({
    queryKey: ['progress', kind, params],
    queryFn: () => fetchList(kind, params),
    placeholderData: keepPreviousData,
  });
  // ringkasan status dihitung dari seluruh data (tanpa filter status)
  const all = useQuery({
    queryKey: ['progress', kind, 'all', f.search],
    queryFn: () => fetchList(kind, { search: f.search, per_page: 1000 }),
  });
  const byTrend = countByTrend(all.data?.data ?? []);
  const counts = TREND_STATUSES.map((s) => ({ status: s, count: byTrend[s] ?? 0 }));

  const rows: ProgressRow[] = (query.data?.data ?? []).map((item) =>
    kind === 'sekolah'
      ? schoolToRow(item as SchoolProgressItem, paths.progressDetail('sekolah', item.id))
      : studentToRow(item as StudentProgressItem, paths.progressDetail('siswa', item.id))
  );

  const columns: Column<ProgressRow>[] = [
    {
      key: 'name',
      header: kind === 'sekolah' ? 'Sekolah' : 'Siswa',
      cell: (r) => (
        <div className="min-w-48">
          <p className="font-semibold">{r.name}</p>
          <p className="text-xs text-muted-foreground">{r.caption}</p>
        </div>
      ),
    },
    ...(kind === 'sekolah'
      ? [
          {
            key: 'participants',
            header: 'Siswa',
            align: 'right' as const,
            cell: (r: ProgressRow) => formatNumber(r.participants),
          },
        ]
      : []),
    { key: 'count', header: 'Tryout', align: 'right', cell: (r) => r.tryout_count },
    {
      key: 'spark',
      header: 'Tren skor',
      hideOnMobile: true,
      cell: (r) =>
        r.scores.length > 1 ? <Sparkline values={r.scores} width={110} height={32} /> : '-',
    },
    {
      key: 'last',
      header: 'Skor terakhir',
      align: 'right',
      cell: (r) => <span className="font-semibold tabular-nums">{formatScore(r.last_score)}</span>,
    },
    {
      key: 'predicate',
      header: 'Predikat',
      hideOnMobile: true,
      cell: (r) => <PredicateBadge predicate={r.last_predicate} />,
    },
    { key: 'trend', header: 'Status', cell: (r) => <TrendBadge scores={r.scores} /> },
  ];

  const title = kind === 'sekolah' ? 'Progres Sekolah' : 'Progres Siswa';

  return (
    <>
      <PageHeader
        title={title}
        description="Perkembangan skor dari tryout ke tryout: naik (> +2), stabil (±2), atau turun (< −2) dibanding tryout sebelumnya."
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Progres Tryout' },
          { label: title },
        ]}
        actions={
          isAdmin ? (
            <div className="flex rounded-lg bg-muted p-1">
              {(['sekolah', 'siswa'] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => router.push(paths.progressList(k))}
                  className={cn(
                    'rounded-md px-4 py-1.5 text-sm font-medium transition-colors',
                    k === kind
                      ? 'bg-card text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {k === 'sekolah' ? 'Sekolah' : 'Siswa'}
                </button>
              ))}
            </div>
          ) : null
        }
      />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {counts.map((c) => {
          const active = f.status === c.status;
          return (
            <button
              key={c.status}
              type="button"
              aria-pressed={active}
              onClick={() => setF({ status: active ? '' : c.status })}
              className={cn(
                'flex items-center gap-3 rounded-card bg-card p-4 text-left shadow-card ring-2 ring-transparent transition-colors hover:ring-primary/30',
                active && 'ring-primary'
              )}
            >
              <span
                className={cn(
                  'grid size-11 place-items-center rounded-xl',
                  c.status === 'naik' && 'bg-success/10 text-success',
                  c.status === 'stabil' && 'bg-primary/10 text-primary',
                  c.status === 'turun' && 'bg-destructive/10 text-destructive',
                  c.status === 'kurang-data' && 'bg-muted text-muted-foreground'
                )}
              >
                <Iconify icon={STATUS_ICON[c.status]} size={22} />
              </span>
              <span>
                <span className="block text-xs text-muted-foreground">{TREND_LABEL[c.status]}</span>
                <span className="block text-xl font-bold tabular-nums">
                  {all.isPending ? '…' : c.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      <SectionCard flush>
        <FilterBar>
          <SearchInput
            value={f.search}
            onChange={(search) => setF({ search })}
            placeholder={kind === 'sekolah' ? 'Cari sekolah…' : 'Cari siswa…'}
          />
          {f.status && (
            <button
              type="button"
              onClick={() => setF({ status: '' })}
              className="text-sm text-primary hover:underline"
            >
              Hapus filter “{TREND_LABEL[f.status as TrendStatus]}”
            </button>
          )}
        </FilterBar>
        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={rows}
            rowKey={(r) => r.id}
            loading={query.isPending}
            error={query.error}
            onRetry={() => query.refetch()}
            onRowClick={(r) => router.push(r.href)}
            empty={{
              title: 'Tidak ada data progres',
              description: 'Coba ubah filter atau kata kunci.',
            }}
          />
          <TablePagination meta={query.data?.pagination} onPageChange={(page) => setF({ page })} />
        </div>
      </SectionCard>
    </>
  );
}
