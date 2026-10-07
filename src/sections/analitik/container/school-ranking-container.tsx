'use client';

import type { SchoolRankingItem } from 'src/models/analytics';

import { toast } from 'sonner';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { exportSheet } from 'src/utils/export';
import { getPredicate } from 'src/utils/predicate';
import { formatScore, formatNumber } from 'src/utils/format';

import { analyticsService } from 'src/services/analytics';

import { SearchInput } from 'src/components/form/search-input';
import { SelectField } from 'src/components/form/select-field';
import { DataTable } from 'src/components/data-display/data-table';
import { FilterBar } from 'src/components/data-display/filter-bar';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { TryoutFilter } from 'src/sections/_global/components/tryout-filter';
import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

import { LEVEL_OPTIONS } from '../helpers/analytics';
import {
  RankBadge,
  PercentBar,
  ExportButton,
  SchoolSubjectsPanel,
} from '../components/analytics-parts';

export function SchoolRankingContainer() {
  const { paths } = usePanel();
  const [f, setF] = useUrlState({ code: '', jenjang: '', search: '', page: '1' });
  const params = {
    code: f.code,
    jenjang: f.jenjang,
    search: f.search,
    page: Number(f.page),
    per_page: 10,
  };
  const query = useQuery({
    queryKey: ['analytics', 'school-ranking', params],
    queryFn: () => analyticsService.schoolRanking(params),
    placeholderData: keepPreviousData,
  });

  const exportAll = async (format: 'xlsx' | 'csv') => {
    const all = await analyticsService.schoolRanking({ ...params, page: 1, per_page: 1000 });
    await exportSheet(
      'peringkat-sekolah',
      all.data.map((s) => ({
        Peringkat: s.rank,
        Sekolah: s.name,
        Kota: s.city,
        Jenjang: s.level,
        Tryout: s.tryout_name,
        Peserta: s.participants,
        'Rata-rata': s.average,
        Tertinggi: s.highest_score,
        Terendah: s.lowest_score,
        'Penyelesaian (%)': s.completion_rate,
      })),
      format
    );
    toast.success('File peringkat sekolah diunduh');
  };

  const columns: Column<SchoolRankingItem>[] = [
    { key: 'rank', header: '#', cell: (s) => <RankBadge rank={s.rank} />, className: 'w-14' },
    {
      key: 'name',
      header: 'Sekolah',
      cell: (s) => (
        <div className="min-w-48">
          <p className="font-semibold">{s.name}</p>
          <p className="text-xs text-muted-foreground">
            {s.city} · {s.level}
          </p>
        </div>
      ),
    },
    {
      key: 'participants',
      header: 'Peserta',
      align: 'right',
      cell: (s) => formatNumber(s.participants),
    },
    {
      key: 'average',
      header: 'Rata-rata',
      align: 'right',
      cell: (s) => <span className="font-semibold tabular-nums">{formatScore(s.average)}</span>,
    },
    {
      key: 'range',
      header: 'Tertinggi / Terendah',
      align: 'right',
      hideOnMobile: true,
      cell: (s) => (
        <span className="tabular-nums">
          {formatScore(s.highest_score)} / {formatScore(s.lowest_score)}
        </span>
      ),
    },
    {
      key: 'completion',
      header: 'Penyelesaian',
      hideOnMobile: true,
      cell: (s) => <PercentBar value={s.completion_rate} />,
    },
    {
      key: 'predicate',
      header: 'Predikat',
      cell: (s) => <PredicateBadge predicate={getPredicate(s.average)} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Peringkat Sekolah"
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Analisis' },
          { label: 'Peringkat Sekolah' },
        ]}
      />
      <SectionCard flush>
        <FilterBar
          actions={<ExportButton onExport={exportAll} disabled={!query.data?.data.length} />}
        >
          <TryoutFilter value={f.code} onChange={(code) => setF({ code })} />
          <SelectField
            aria-label="Filter jenjang"
            value={f.jenjang}
            onChange={(jenjang) => setF({ jenjang })}
            options={LEVEL_OPTIONS}
            allLabel="Semua jenjang"
            className="sm:w-40"
          />
          <SearchInput
            value={f.search}
            onChange={(search) => setF({ search })}
            placeholder="Cari sekolah…"
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
            empty={{ title: 'Tidak ada sekolah', description: 'Coba ubah filter atau kata kunci.' }}
            renderExpanded={(s) => <SchoolSubjectsPanel school={s} code={f.code} />}
          />
          <TablePagination meta={query.data?.pagination} onPageChange={(page) => setF({ page })} />
        </div>
      </SectionCard>
    </>
  );
}
