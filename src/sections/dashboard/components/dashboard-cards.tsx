'use client';

import type { ReactNode } from 'react';
import type { UseQueryResult } from '@tanstack/react-query';
import type {
  CategoryChart,
  DashboardCompletion,
  DashboardDistribusi,
  DashboardTopStudent,
  DashboardRataRataMapel,
} from 'src/models/analytics';

import Link from 'next/link';

import { Button } from 'src/components/ui/button';
import { Skeleton } from 'src/components/ui/skeleton';

import { getPredicate } from 'src/utils/predicate';
import { formatScore, formatDuration } from 'src/utils/format';

import { Iconify } from 'src/components/iconify/iconify';
import { BarChart } from 'src/components/charts/bar-chart';
import { LineChart } from 'src/components/charts/line-chart';
import { DonutChart } from 'src/components/charts/donut-chart';
import { ErrorState } from 'src/components/feedback/error-state';
import { EmptyState } from 'src/components/feedback/empty-state';
import { STATUS_COLORS } from 'src/components/charts/chart-types';
import { UserAvatar } from 'src/components/data-display/user-avatar';
import { SectionCard } from 'src/components/data-display/section-card';

import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

/** Bungkus kartu chart: loading skeleton / error + coba lagi / isi. */
function ChartCard<T>({
  title,
  description,
  query,
  height = 280,
  action,
  isEmpty,
  children,
}: {
  title: string;
  description?: string;
  query: UseQueryResult<T>;
  height?: number;
  action?: ReactNode;
  isEmpty?: (data: T) => boolean;
  children: (data: T) => ReactNode;
}) {
  let body: ReactNode;
  if (query.isPending) body = <Skeleton className="w-full rounded-xl" style={{ height }} />;
  else if (query.isError) body = <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  else if (isEmpty?.(query.data)) body = <EmptyState title="Belum ada data untuk filter ini" />;
  else body = children(query.data);
  return (
    <SectionCard title={title} description={description} action={action} className="h-full">
      {body}
    </SectionCard>
  );
}

export function ParticipantTrendCard({
  query,
  action,
}: {
  query: UseQueryResult<CategoryChart>;
  action?: ReactNode;
}) {
  return (
    <ChartCard
      title="Peserta & penyelesaian"
      description="Jumlah peserta dan yang menyelesaikan per tryout"
      query={query}
      action={action}
      isEmpty={(d) => !d.categories.length}
    >
      {(d) => (
        <BarChart
          data={d.categories.map((c, i) => ({
            name: c,
            peserta: d.series[0]?.data[i] ?? 0,
            selesai: d.series[1]?.data[i] ?? 0,
          }))}
          categoryKey="name"
          series={[
            { key: 'peserta', label: 'Peserta' },
            { key: 'selesai', label: 'Selesai', color: 'var(--chart-3)' },
          ]}
        />
      )}
    </ChartCard>
  );
}

/** Rentang sumbu Y dibulatkan ke kelipatan 5 (0–100) agar tick tidak desimal. */
const niceDomain = (values: number[]): [number, number] => {
  const min = Math.min(...values);
  const max = Math.max(...values);
  return [Math.max(0, Math.floor(min / 5) * 5 - 5), Math.min(100, Math.ceil(max / 5) * 5 + 5)];
};

export function ScoreTrendCard({ trend, loading }: { trend?: number[]; loading?: boolean }) {
  const data = (trend ?? []).map((v, i) => ({ name: `TO ${i + 1}`, skor: v }));
  return (
    <SectionCard
      title="Tren rata-rata skor"
      description="Rata-rata skor per tryout"
      className="h-full"
    >
      {loading ? (
        <Skeleton className="h-[280px] w-full rounded-xl" />
      ) : data.length < 2 ? (
        <EmptyState title="Butuh minimal 2 tryout" icon="solar:graph-up-linear" />
      ) : (
        <LineChart
          data={data}
          xKey="name"
          series={[{ key: 'skor', label: 'Rata-rata skor' }]}
          yDomain={niceDomain(trend ?? [])}
          valueFormatter={(v) => formatScore(v, 0)}
        />
      )}
    </SectionCard>
  );
}

export function CompletionCard({ query }: { query: UseQueryResult<DashboardCompletion> }) {
  return (
    <ChartCard title="Tingkat penyelesaian" query={query} height={200}>
      {(d) => (
        <DonutChart
          size={180}
          centerValue={`${formatScore(d.completion_rate, 0)}%`}
          centerLabel="selesai"
          data={[
            { key: 'done', label: 'Selesai', value: d.total_completed, color: 'var(--chart-1)' },
            {
              key: 'pending',
              label: 'Belum selesai',
              value: d.total_incomplete,
              color: STATUS_COLORS.neutral,
            },
          ]}
        />
      )}
    </ChartCard>
  );
}

export function ScoreDistributionCard({ query }: { query: UseQueryResult<DashboardDistribusi> }) {
  return (
    <ChartCard
      title="Distribusi nilai"
      description="Jumlah peserta per rentang skor"
      query={query}
      height={240}
      isEmpty={(d) => d.data.every((v) => !v)}
    >
      {(d) => (
        <BarChart
          height={240}
          data={d.labels.map((label, i) => ({ rentang: label, peserta: d.data[i] }))}
          categoryKey="rentang"
          series={[{ key: 'peserta', label: 'Peserta' }]}
        />
      )}
    </ChartCard>
  );
}

export function SubjectPerformanceCard({
  query,
}: {
  query: UseQueryResult<DashboardRataRataMapel>;
}) {
  return (
    <ChartCard
      title="Rata-rata per mapel"
      query={query}
      height={240}
      isEmpty={(d) => !d.subjects.length}
    >
      {(d) => (
        <ul className="space-y-5">
          {d.subjects.map((s) => (
            <li key={s.name}>
              <div className="mb-2 flex items-center justify-between gap-2 text-sm">
                <span className="font-medium">{s.name}</span>
                <span className="flex items-center gap-2">
                  <span className="font-semibold tabular-nums">{formatScore(s.average)}</span>
                  <PredicateBadge predicate={getPredicate(s.average)} />
                </span>
              </div>
              <div
                className="h-2.5 overflow-hidden rounded-full bg-muted"
                role="meter"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={s.average}
                aria-label={`Rata-rata ${s.name}`}
              >
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${Math.min(100, s.average)}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </ChartCard>
  );
}

export function AnswerSummaryCard({ query }: { query: UseQueryResult<CategoryChart> }) {
  return (
    <ChartCard
      title="Ringkasan jawaban"
      description="Rata-rata persentase benar, salah, dan kosong per mapel"
      query={query}
      isEmpty={(d) => !d.categories.length}
    >
      {(d) => (
        <BarChart
          horizontal
          stacked
          data={d.categories.map((c, i) => ({
            mapel: c,
            benar: d.series[0]?.data[i] ?? 0,
            salah: d.series[1]?.data[i] ?? 0,
            kosong: d.series[2]?.data[i] ?? 0,
          }))}
          categoryKey="mapel"
          yDomain={[0, 100]}
          valueFormatter={(v) => `${formatScore(v, 0)}%`}
          series={[
            { key: 'benar', label: 'Benar', color: STATUS_COLORS.good },
            { key: 'salah', label: 'Salah', color: STATUS_COLORS.critical },
            { key: 'kosong', label: 'Kosong', color: STATUS_COLORS.neutral },
          ]}
        />
      )}
    </ChartCard>
  );
}

export function TopStudentsCard({
  query,
  allHref,
}: {
  query: UseQueryResult<DashboardTopStudent[]>;
  allHref: string;
}) {
  return (
    <ChartCard
      title="5 siswa teratas"
      query={query}
      height={300}
      isEmpty={(d) => !d.length}
      action={
        <Button variant="outline" size="sm" asChild>
          <Link href={allHref}>
            Lihat semua
            <Iconify icon="solar:arrow-right-linear" size={16} />
          </Link>
        </Button>
      }
    >
      {(rows) => (
        <ol className="divide-y divide-border">
          {rows.map((s, i) => (
            <li key={s.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary/8 text-xs font-semibold text-primary">
                {i + 1}
              </span>
              <UserAvatar name={s.name} size={38} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {s.school} · {s.class}
                </p>
              </div>
              <span className="hidden text-xs text-muted-foreground sm:block">
                {formatDuration(s.duration)}
              </span>
              <span className="w-12 text-right font-semibold tabular-nums">
                {formatScore(s.total_score)}
              </span>
            </li>
          ))}
        </ol>
      )}
    </ChartCard>
  );
}
