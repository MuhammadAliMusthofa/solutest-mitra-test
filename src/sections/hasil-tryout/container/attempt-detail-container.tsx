'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { Skeleton } from 'src/components/ui/skeleton';

import { usePanel } from 'src/hooks/use-panel';

import { formatScore, formatDateTime } from 'src/utils/format';

import { questionTypeName } from 'src/models/question';
import { monitoringService } from 'src/services/monitoring';

import { Iconify } from 'src/components/iconify/iconify';
import { KpiCard } from 'src/components/data-display/kpi-card';
import { ErrorState } from 'src/components/feedback/error-state';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import { HtmlContent } from 'src/components/data-display/html-content';
import { SectionCard } from 'src/components/data-display/section-card';

import { ReviewAnswer } from 'src/sections/_global/components/review-answer';
import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

const VIOLATION_LABEL: Record<string, string> = {
  TAB_SWITCH: 'Pindah tab / aplikasi',
  EXIT_FULLSCREEN: 'Keluar layar penuh',
  COPY_PASTE: 'Salin-tempel',
};

/** Detail satu pengerjaan siswa: nilai, pelanggaran, jawaban per soal. */
export function AttemptDetailContainer() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { panel, paths } = usePanel();
  const query = useQuery({
    queryKey: ['monitoring', panel, 'attempt', attemptId],
    queryFn: () => monitoringService.attempt(panel, attemptId),
    refetchInterval: (q) =>
      q.state.data && q.state.data.submitted_at && !q.state.data.is_processed ? 3000 : false,
  });
  const a = query.data;
  const minutes =
    a?.submitted_at && Math.round((Date.parse(a.submitted_at) - Date.parse(a.started_at)) / 60_000);

  return (
    <>
      <PageHeader
        title={a ? a.student.full_name : 'Detail pengerjaan'}
        description={a ? `${a.schedule.title} · ${a.package.title}` : undefined}
        backHref={a ? paths.hasilTryoutDetail(a.schedule.id) : paths.hasilTryout}
        crumbs={[
          { label: 'Hasil Tryout', href: paths.hasilTryout },
          ...(a ? [{ label: a.schedule.title, href: paths.hasilTryoutDetail(a.schedule.id) }] : []),
          { label: 'Pengerjaan' },
        ]}
      />
      {query.isPending && <Skeleton className="h-96 w-full rounded-card" />}
      {query.isError && (
        <SectionCard>
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </SectionCard>
      )}
      {a && (
        <div className="space-y-6">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard
              label="Skor"
              value={formatScore(a.score)}
              icon="solar:medal-ribbon-star-linear"
            />
            <KpiCard
              label="Benar"
              value={a.total_correct === null ? '-' : `${a.total_correct}/${a.questions.length}`}
              icon="solar:check-circle-linear"
              tone="success"
            />
            <KpiCard
              label="Lama mengerjakan"
              value={minutes || minutes === 0 ? `${minutes} menit` : '-'}
              icon="solar:clock-circle-linear"
              tone="info"
            />
            <KpiCard
              label="Pelanggaran"
              value={String(a.violations.length)}
              icon="solar:shield-warning-linear"
              tone="warning"
            />
          </div>
          <SectionCard title="Info">
            <dl className="grid gap-3 text-sm sm:grid-cols-2">
              {[
                ['Siswa', `${a.student.full_name} · ${a.student.email}`],
                [
                  'NISN / kelas',
                  [a.student.nisn, a.student.class_name].filter(Boolean).join(' · ') || '-',
                ],
                ['Sekolah', a.school?.name ?? '-'],
                ['Mulai', formatDateTime(a.started_at)],
                [
                  'Dikumpulkan',
                  a.submitted_at ? formatDateTime(a.submitted_at) : 'Masih mengerjakan',
                ],
                ['Tenggat', formatDateTime(a.deadline_at)],
              ].map(([k, v]) => (
                <div
                  key={k}
                  className="flex justify-between gap-4 rounded-lg bg-muted/50 px-3 py-2"
                >
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <PredicateBadge predicate={a.predicate} />
              {a.is_auto_ended && <StatusPill tone="warning">Dikumpulkan otomatis</StatusPill>}
              {a.submitted_at && !a.is_processed && (
                <StatusPill tone="info" icon="svg-spinners:180-ring">
                  Nilai sedang dihitung
                </StatusPill>
              )}
            </div>
            {a.violations.length > 0 && (
              <ul className="mt-4 space-y-1 text-sm">
                {a.violations.map((v) => (
                  <li key={v.id} className="flex items-center gap-2 text-warning">
                    <Iconify icon="solar:shield-warning-linear" size={16} />
                    {VIOLATION_LABEL[v.violation_type] ?? v.violation_type} ·{' '}
                    {formatDateTime(v.createdAt)}
                  </li>
                ))}
              </ul>
            )}
          </SectionCard>
          {a.questions.map((q, i) => (
            <SectionCard key={q.id}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <StatusPill tone="secondary">{questionTypeName(q.type_question_id)}</StatusPill>
                <StatusPill tone={q.score >= 100 ? 'success' : q.score > 0 ? 'warning' : 'danger'}>
                  Skor {formatScore(q.score, 0)}
                </StatusPill>
                {q.competency_name && (
                  <span className="text-xs text-muted-foreground">{q.competency_name}</span>
                )}
              </div>
              {q.text && (
                <div className="mb-3 rounded-xl bg-secondary/8 p-3.5 text-sm">
                  <HtmlContent html={q.text} />
                </div>
              )}
              <HtmlContent html={q.question_text} className="mb-3" />
              <ReviewAnswer q={q} mine="Jawaban siswa" />
            </SectionCard>
          ))}
        </div>
      )}
    </>
  );
}
