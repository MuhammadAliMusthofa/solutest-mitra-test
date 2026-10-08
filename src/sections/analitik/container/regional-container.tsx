'use client';

import type { RegionData } from 'src/models/analytics';

import dynamic from 'next/dynamic';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { Skeleton } from 'src/components/ui/skeleton';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { cn } from 'src/lib/utils';
import { getPredicate } from 'src/utils/predicate';
import { formatScore, formatNumber } from 'src/utils/format';

import { analyticsService } from 'src/services/analytics';

import { SelectField } from 'src/components/form/select-field';
import { KpiCard } from 'src/components/data-display/kpi-card';
import { ErrorState } from 'src/components/feedback/error-state';
import { EmptyState } from 'src/components/feedback/empty-state';
import { DataTable } from 'src/components/data-display/data-table';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { TryoutFilter } from 'src/sections/_global/components/tryout-filter';
import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

import { buildHeatmap } from '../helpers/analytics';
import { PercentBar } from '../components/analytics-parts';

const RegionalMap = dynamic(() => import('../components/regional-map'), {
  ssr: false,
  loading: () => <Skeleton className="h-[360px] w-full rounded-xl" />,
});

export function RegionalContainer() {
  const { paths } = usePanel();
  const [f, setF] = useUrlState({ code: '', wilayah: '', page: '1' });
  const p = { code: f.code };
  const summary = useQuery({
    queryKey: ['analytics', 'regional', 'summary', p],
    queryFn: () => analyticsService.regionalSummary(p),
  });
  const map = useQuery({
    queryKey: ['analytics', 'regional', 'map', p],
    queryFn: () => analyticsService.regionalMap(p),
  });
  const regions = useQuery({
    queryKey: ['analytics', 'regional', 'regions', p],
    queryFn: () => analyticsService.regionalRegions(p),
  });
  const heatmap = useQuery({
    queryKey: ['analytics', 'regional', 'heatmap', p],
    queryFn: () => analyticsService.regionalHeatmap(p),
  });
  const schoolParams = { code: f.code, wilayah: f.wilayah, page: Number(f.page), per_page: 9 };
  const schools = useQuery({
    queryKey: ['analytics', 'regional', 'schools', schoolParams],
    queryFn: () => analyticsService.regionalSchools(schoolParams),
    placeholderData: keepPreviousData,
  });
  const s = summary.data;
  const heat = buildHeatmap(heatmap.data);

  const regionColumns: Column<RegionData>[] = [
    {
      key: 'name',
      header: 'Wilayah',
      cell: (r) => <span className="font-semibold">{r.name}</span>,
    },
    {
      key: 'participants',
      header: 'Peserta',
      align: 'right',
      cell: (r) => formatNumber(r.participants),
    },
    { key: 'schools', header: 'Sekolah', align: 'right', cell: (r) => formatNumber(r.schools) },
    {
      key: 'average',
      header: 'Rata-rata',
      align: 'right',
      cell: (r) => <span className="font-semibold tabular-nums">{formatScore(r.average)}</span>,
    },
    {
      key: 'completion',
      header: 'Penyelesaian',
      hideOnMobile: true,
      cell: (r) => <PercentBar value={r.completion} />,
    },
    {
      key: 'predicate',
      header: 'Predikat',
      cell: (r) => <PredicateBadge predicate={getPredicate(r.average)} />,
    },
  ];

  return (
    <>
      <PageHeader
        title="Analisis Regional"
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Analisis' },
          { label: 'Regional' },
        ]}
        actions={<TryoutFilter value={f.code} onChange={(code) => setF({ code })} />}
      />

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Wilayah" value={formatNumber(s?.total_regions)} icon="solar:map-linear" />
        <KpiCard
          label="Peserta"
          value={formatNumber(s?.total_participants)}
          icon="solar:users-group-rounded-linear"
          tone="secondary"
        />
        <KpiCard
          label="Sekolah"
          value={formatNumber(s?.total_schools)}
          icon="solar:buildings-2-linear"
          tone="info"
        />
        <KpiCard
          label="Rata-rata keseluruhan"
          value={formatScore(s?.national_average)}
          icon="solar:medal-ribbon-star-linear"
          tone="accent"
        />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <SectionCard
          title="Peta sebaran"
          description="Ukuran lingkaran = jumlah peserta · hijau = di atas rata-rata, merah = di bawah rata-rata"
        >
          {map.isError ? (
            <ErrorState error={map.error} onRetry={() => map.refetch()} />
          ) : map.data && map.data.length === 0 ? (
            <EmptyState
              title="Lokasi sekolah belum tersedia"
              description="Peta tampil setelah koordinat sekolah terisi (dari data circl atau menu Sekolah)."
              icon="solar:map-point-linear"
            />
          ) : (
            <RegionalMap locations={map.data ?? []} average={s?.national_average ?? 0} />
          )}
        </SectionCard>

        <SectionCard
          title="Perbandingan wilayah"
          description="Rata-rata skor; garis = rata-rata keseluruhan"
        >
          {heatmap.isPending ? (
            <Skeleton className="h-64 w-full rounded-xl" />
          ) : (
            <ul className="space-y-4">
              {heat.rows.map((r) => (
                <li key={r.label}>
                  <div className="mb-1.5 flex items-center justify-between text-sm">
                    <span className="font-medium">{r.label}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-semibold tabular-nums">{formatScore(r.value)}</span>
                      <span
                        className={cn(
                          'text-xs',
                          r.aboveAverage ? 'text-success' : 'text-destructive'
                        )}
                      >
                        {r.aboveAverage ? '▲ di atas' : '▼ di bawah'}
                      </span>
                    </span>
                  </div>
                  <div className="relative h-3 rounded-full bg-muted">
                    <div
                      className={cn(
                        'h-full rounded-full',
                        r.aboveAverage ? 'bg-primary' : 'bg-chart-2'
                      )}
                      style={{ width: `${r.widthPct}%` }}
                    />
                    <div
                      className="absolute -top-1 h-5 w-0.5 rounded bg-foreground/60"
                      style={{ left: `${heat.averagePct}%` }}
                      aria-hidden
                    />
                  </div>
                </li>
              ))}
              <li className="pt-1 text-xs text-muted-foreground">
                Rata-rata keseluruhan:{' '}
                <span className="font-semibold">{formatScore(heat.average)}</span>
              </li>
            </ul>
          )}
        </SectionCard>
      </div>

      <SectionCard title="Kinerja per wilayah" className="mt-6" flush>
        <DataTable
          columns={regionColumns}
          rows={regions.data}
          rowKey={(r) => r.id}
          loading={regions.isPending}
          error={regions.error}
          onRetry={() => regions.refetch()}
          skeletonRows={5}
        />
      </SectionCard>

      <SectionCard
        title="Sekolah per wilayah"
        className="mt-6"
        action={
          <SelectField
            aria-label="Filter wilayah"
            value={f.wilayah}
            onChange={(wilayah) => setF({ wilayah })}
            options={(schools.data?.region_list ?? []).map((r) => ({ value: r, label: r }))}
            allLabel="Semua wilayah"
          />
        }
      >
        {schools.isPending ? (
          <Skeleton className="h-48 w-full rounded-xl" />
        ) : schools.isError ? (
          <ErrorState error={schools.error} onRetry={() => schools.refetch()} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {schools.data.data.map((sc) => (
              <article key={sc.id} className="rounded-xl p-4 ring-1 ring-border">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{sc.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {sc.city} · {sc.region} · {sc.level}
                    </p>
                  </div>
                  <span className="text-xl font-semibold tabular-nums">
                    {formatScore(sc.average)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sc.subjects.map((sub) => (
                    <span key={sub.code} className="rounded-md bg-muted px-2 py-1 text-xs">
                      {sub.short_name}{' '}
                      <span className="font-semibold tabular-nums">{formatScore(sub.score)}</span>
                    </span>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">
                  {formatNumber(sc.participants)} peserta · penyelesaian{' '}
                  {formatScore(sc.completion_rate, 0)}%
                </p>
              </article>
            ))}
          </div>
        )}
        <TablePagination
          meta={schools.data?.pagination}
          onPageChange={(page) => setF({ page })}
          className="px-0 pb-0"
        />
      </SectionCard>
    </>
  );
}
