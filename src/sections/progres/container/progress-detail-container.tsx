'use client';

import type { ProgressPoint } from 'src/models/progress';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter, useParams } from 'next/navigation';

import { Skeleton } from 'src/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from 'src/components/ui/toggle-group';

import type { ProgressKind } from 'src/config/paths';

import { usePanel } from 'src/hooks/use-panel';

import { cn } from 'src/lib/utils';
import { getPredicate } from 'src/utils/predicate';
import { PREDICATE_LABEL } from 'src/utils/predicate';
import { formatScore, formatSigned, formatShortDate } from 'src/utils/format';
import { getDelta, studentCaption, summarizeProgress } from 'src/utils/progress';

import { progressService } from 'src/services/analytics';

import { Iconify } from 'src/components/iconify/iconify';
import { LineChart } from 'src/components/charts/line-chart';
import { StatTile } from 'src/components/data-display/kpi-card';
import { ErrorState } from 'src/components/feedback/error-state';
import { DataTable } from 'src/components/data-display/data-table';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { SectionCard } from 'src/components/data-display/section-card';

import { TrendBadge, PredicateBadge } from 'src/sections/_global/components/predicate-badge';

function Summary({ points }: { points: ProgressPoint[] }) {
  const s = summarizeProgress(points);
  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <StatTile
        label="Skor terakhir"
        value={formatScore(s.last)}
        icon="solar:medal-ribbon-star-linear"
      />
      <div className="flex items-center gap-3 rounded-xl bg-muted/60 p-4">
        <div>
          <p className="text-xs text-muted-foreground">Status tren</p>
          <div className="mt-1">
            <TrendBadge scores={points.map((p) => p.score)} />
          </div>
        </div>
      </div>
      <StatTile
        label="Sejak tryout pertama"
        value={s.sinceFirst === null ? '-' : formatSigned(s.sinceFirst)}
        icon="solar:graph-up-linear"
        tone="secondary"
      />
      <div className="rounded-xl bg-muted/60 p-4">
        <p className="text-xs text-muted-foreground">Perubahan predikat</p>
        {s.shift ? (
          <p className="mt-1 flex items-center gap-1.5 text-sm font-semibold">
            {PREDICATE_LABEL[s.shift.from]}
            <Iconify
              icon={
                s.shift.direction === 'up'
                  ? 'solar:arrow-right-up-linear'
                  : 'solar:arrow-right-down-linear'
              }
              size={16}
              className={s.shift.direction === 'up' ? 'text-success' : 'text-destructive'}
            />
            {PREDICATE_LABEL[s.shift.to]}
          </p>
        ) : (
          <p className="mt-1 text-sm font-semibold">Tetap</p>
        )}
      </div>
    </div>
  );
}

function TrendChart({
  points,
  compare,
}: {
  points: ProgressPoint[];
  compare?: { code: string; score: number }[];
}) {
  const subjects = points[0]?.subjects.map((s) => s.name) ?? [];
  const [view, setView] = useState('total');
  const data = points.map((p) => ({
    name: p.tryout_name.split('—')[0].trim(),
    total: p.score,
    pembanding: compare?.find((c) => c.code === p.code)?.score,
    ...Object.fromEntries(p.subjects.map((s) => [s.name, s.score])),
  }));
  const series =
    view === 'total'
      ? [
          { key: 'total', label: 'Skor total' },
          ...(compare
            ? [{ key: 'pembanding', label: 'Rata-rata sekolah', color: 'var(--chart-4)' }]
            : []),
        ]
      : subjects.map((name) => ({ key: name, label: name }));

  return (
    <SectionCard
      title="Tren skor per tryout"
      action={
        <ToggleGroup
          type="single"
          variant="outline"
          value={view}
          onValueChange={(v) => v && setView(v)}
        >
          <ToggleGroupItem value="total">Total</ToggleGroupItem>
          <ToggleGroupItem value="mapel">Per mapel</ToggleGroupItem>
        </ToggleGroup>
      }
    >
      <LineChart
        data={data}
        xKey="name"
        series={series}
        yDomain={[0, 100]}
        dashedKeys={['pembanding']}
        area={view === 'total'}
        valueFormatter={(v) => formatScore(v)}
      />
    </SectionCard>
  );
}

function PointsTable({ points }: { points: ProgressPoint[] }) {
  const columns: Column<ProgressPoint & { delta: number | null }>[] = [
    {
      key: 'name',
      header: 'Tryout',
      cell: (p) => (
        <div>
          <p className="font-semibold">{p.tryout_name}</p>
          <p className="text-xs text-muted-foreground">
            {p.code} · {formatShortDate(p.date)}
          </p>
        </div>
      ),
    },
    ...(points[0]?.subjects ?? []).map((s) => ({
      key: s.name,
      header: s.name,
      align: 'right' as const,
      hideOnMobile: true,
      cell: (p: ProgressPoint) => formatScore(p.subjects.find((x) => x.name === s.name)?.score),
    })),
    {
      key: 'score',
      header: 'Skor',
      align: 'right',
      cell: (p) => <span className="font-semibold tabular-nums">{formatScore(p.score)}</span>,
    },
    {
      key: 'predicate',
      header: 'Predikat',
      cell: (p) => <PredicateBadge predicate={getPredicate(p.score)} />,
    },
    {
      key: 'delta',
      header: 'Δ',
      align: 'right',
      cell: (p) =>
        p.delta === null ? (
          '-'
        ) : (
          <span
            className={cn(
              'font-semibold tabular-nums',
              p.delta > 2 ? 'text-success' : p.delta < -2 ? 'text-destructive' : ''
            )}
          >
            {formatSigned(p.delta)}
          </span>
        ),
    },
  ];
  const rows = points.map((p, i) => ({
    ...p,
    delta: i ? getDelta(points.slice(0, i + 1).map((x) => x.score)) : null,
  }));
  return (
    <SectionCard title="Riwayat per tryout" flush className="mt-6">
      <DataTable columns={columns} rows={rows} rowKey={(p) => p.code} />
    </SectionCard>
  );
}

export function ProgressDetailContainer({ kind }: { kind: ProgressKind }) {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { paths } = usePanel();
  const school = useQuery({
    queryKey: ['progress', 'school', id],
    queryFn: () => progressService.school(id),
    enabled: kind === 'sekolah',
  });
  const student = useQuery({
    queryKey: ['progress', 'student', id],
    queryFn: () => progressService.student(id),
    enabled: kind === 'siswa',
  });
  const query = kind === 'sekolah' ? school : student;
  const listPath = paths.progressList(kind);

  const title =
    kind === 'sekolah'
      ? (school.data?.name ?? 'Progres sekolah')
      : (student.data?.name ?? 'Progres siswa');
  const caption =
    kind === 'sekolah'
      ? school.data &&
        `${school.data.city} · ${school.data.level} · ${school.data.participants} siswa`
      : student.data &&
        `${studentCaption(student.data)}${student.data.nisn ? ` · NISN ${student.data.nisn}` : ''}`;

  return (
    <>
      <PageHeader
        title={title}
        description={caption}
        backHref={listPath}
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: kind === 'sekolah' ? 'Progres Sekolah' : 'Progres Siswa', href: listPath },
          { label: 'Detail' },
        ]}
      />
      {query.isPending && <Skeleton className="h-96 w-full rounded-card" />}
      {query.isError && (
        <SectionCard>
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </SectionCard>
      )}
      {query.data && (
        <div className="space-y-6">
          <SectionCard>
            <Summary points={query.data.points} />
          </SectionCard>
          <TrendChart points={query.data.points} compare={student.data?.school_average} />
          <PointsTable points={query.data.points} />
          {school.data && (
            <SectionCard title="Siswa di sekolah ini" flush>
              <DataTable
                rows={school.data.students}
                rowKey={(s) => s.id}
                onRowClick={(s) => router.push(paths.progressDetail('siswa', s.id))}
                columns={[
                  {
                    key: 'name',
                    header: 'Siswa',
                    cell: (s) => (
                      <div>
                        <p className="font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.class}</p>
                      </div>
                    ),
                  },
                  { key: 'count', header: 'Tryout', align: 'right', cell: (s) => s.tryout_count },
                  {
                    key: 'last',
                    header: 'Skor terakhir',
                    align: 'right',
                    cell: (s) => (
                      <span className="font-semibold tabular-nums">
                        {formatScore(s.last_score)}
                      </span>
                    ),
                  },
                  { key: 'trend', header: 'Status', cell: (s) => <TrendBadge scores={s.scores} /> },
                ]}
              />
            </SectionCard>
          )}
        </div>
      )}
    </>
  );
}
