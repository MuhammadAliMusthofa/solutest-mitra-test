'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { Skeleton } from 'src/components/ui/skeleton';

import { SISWA_PATHS } from 'src/config/paths';

import { formatScore, formatNumber, formatDuration, formatLongDate } from 'src/utils/format';

import { practiceService } from 'src/services/student';

import { Iconify } from 'src/components/iconify/iconify';
import { BarChart } from 'src/components/charts/bar-chart';
import { DonutChart } from 'src/components/charts/donut-chart';
import { KpiCard } from 'src/components/data-display/kpi-card';
import { ErrorState } from 'src/components/feedback/error-state';
import { STATUS_COLORS } from 'src/components/charts/chart-types';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import { SectionCard } from 'src/components/data-display/section-card';

import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

/** Personal Performance Report: ringkasan, akurasi, per area kompetensi, rekomendasi belajar. */
export function ReportContainer() {
  const { practiceId } = useParams<{ practiceId: string }>();
  const query = useQuery({
    queryKey: ['student', 'report', practiceId],
    queryFn: () => practiceService.report(practiceId),
  });
  const r = query.data;

  return (
    <>
      <PageHeader
        title="Laporan Performa"
        description={r ? `${r.title} · ${formatLongDate(r.test_date)}` : undefined}
        backHref={SISWA_PATHS.history}
        crumbs={[{ label: 'Riwayat', href: SISWA_PATHS.history }, { label: 'Laporan' }]}
      />
      {query.isPending && <Skeleton className="h-96 w-full rounded-card" />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {r && (
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Skor"
              value={formatScore(r.score)}
              icon="solar:medal-ribbon-star-linear"
              hint="Skala 0–100"
            />
            <KpiCard
              label="Peringkat"
              value={r.rank_position ? `#${r.rank_position}` : '-'}
              icon="solar:cup-star-linear"
              tone="accent"
              hint={`dari ${formatNumber(r.total_participants)} peserta`}
            />
            <KpiCard
              label="Akurasi"
              value={`${r.accuracy_percentage}%`}
              icon="solar:target-linear"
              tone="secondary"
              hint={`${r.correct} benar dari ${r.total_questions} soal`}
            />
            <KpiCard
              label="Waktu pengerjaan"
              value={`${r.total_time_spent_minutes} mnt`}
              icon="solar:stopwatch-linear"
              tone="info"
            />
          </div>

          <div className="grid gap-6 xl:grid-cols-[380px_1fr]">
            <SectionCard title="Komposisi jawaban">
              <DonutChart
                size={170}
                centerValue={`${r.accuracy_percentage}%`}
                centerLabel="akurasi"
                data={[
                  { key: 'correct', label: 'Benar', value: r.correct, color: STATUS_COLORS.good },
                  {
                    key: 'incorrect',
                    label: 'Salah',
                    value: r.incorrect,
                    color: STATUS_COLORS.critical,
                  },
                  {
                    key: 'empty',
                    label: 'Kosong',
                    value: r.unanswered,
                    color: STATUS_COLORS.neutral,
                  },
                ]}
              />
            </SectionCard>
            <SectionCard title="Skor per area kompetensi">
              <BarChart
                horizontal
                height={Math.max(180, r.competency_breakdown.length * 56)}
                data={r.competency_breakdown.map((c) => ({ area: c.area_name, skor: c.score }))}
                categoryKey="area"
                yDomain={[0, 100]}
                series={[{ key: 'skor', label: 'Skor' }]}
              />
            </SectionCard>
          </div>

          <SectionCard title="Ringkasan" description={r.user_name}>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-primary/5 p-4 text-sm md:col-span-2">
                <div className="mb-2 flex items-center gap-2">
                  <Iconify icon="solar:document-text-linear" size={18} className="text-primary" />
                  <span className="font-semibold">Ringkasan hasil</span>
                  <PredicateBadge score={r.score} />
                </div>
                {r.summary.executive_summary}
              </div>
              <div className="rounded-xl bg-success/6 p-4 text-sm">
                <p className="mb-1 font-semibold text-success">Kekuatan</p>
                {r.summary.strengths}
              </div>
              <div className="rounded-xl bg-warning/8 p-4 text-sm">
                <p className="mb-1 font-semibold text-warning">Perlu ditingkatkan</p>
                {r.summary.weaknesses}
              </div>
              <div className="rounded-xl bg-muted/60 p-4 text-sm md:col-span-2">
                <p className="mb-1 font-semibold">Manajemen waktu</p>
                {r.summary.time_management}
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Detail per area">
            <div className="grid gap-3 md:grid-cols-2">
              {r.competency_breakdown.map((c) => (
                <div key={c.area_name} className="rounded-xl p-4 ring-1 ring-border">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold">{c.area_name}</p>
                    <StatusPill tone={c.status === 'Kuat' ? 'success' : 'warning'}>
                      {c.status}
                    </StatusPill>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Skor <span className="font-semibold text-foreground">{c.score}</span> ·{' '}
                    {c.total_questions} soal · rata-rata{' '}
                    {formatDuration(c.avg_time_per_question_seconds)} per soal
                  </p>
                </div>
              ))}
            </div>
          </SectionCard>

          <SectionCard title="Rekomendasi belajar">
            <ol className="space-y-3">
              {r.recommendation.learning_priorities.map((p, i) => (
                <li key={p.title} className="flex gap-3">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary/25 text-sm font-semibold">
                    {i + 1}
                  </span>
                  <div>
                    <p className="font-semibold">{p.title}</p>
                    <p className="text-sm text-muted-foreground">{p.brief}</p>
                  </div>
                </li>
              ))}
            </ol>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusPill tone="primary" icon="solar:calendar-linear">
                {r.recommendation.plan.frequency}
              </StatusPill>
              <StatusPill tone="primary" icon="solar:clock-circle-linear">
                {r.recommendation.plan.duration} per sesi
              </StatusPill>
              <StatusPill tone="primary" icon="solar:document-text-linear">
                {r.recommendation.plan.question_count} per sesi
              </StatusPill>
            </div>
          </SectionCard>
        </div>
      )}
    </>
  );
}
