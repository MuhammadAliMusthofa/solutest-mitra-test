'use client';

import type { PracticeQuestion } from 'src/models/analytics';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';

import { Skeleton } from 'src/components/ui/skeleton';
import { ToggleGroup, ToggleGroupItem } from 'src/components/ui/toggle-group';
import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from 'src/components/ui/accordion';

import { usePanel } from 'src/hooks/use-panel';

import { cn } from 'src/lib/utils';
import { formatScore, formatDateTime } from 'src/utils/format';

import { analyticsService } from 'src/services/analytics';

import { StatTile } from 'src/components/data-display/kpi-card';
import { ErrorState } from 'src/components/feedback/error-state';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import { HtmlContent } from 'src/components/data-display/html-content';
import { SectionCard } from 'src/components/data-display/section-card';

import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

import { ANSWER_STATUS, PRACTICE_DIFFICULTY } from '../helpers/analytics';

type Filter = 'all' | PracticeQuestion['status'];

/** Hasil pengerjaan satu siswa: ringkasan + jawaban per soal (benar/salah/kosong). */
export function PracticeDetailContainer() {
  const { practiceId } = useParams<{ practiceId: string }>();
  const { paths } = usePanel();
  const [filter, setFilter] = useState<Filter>('all');
  const query = useQuery({
    queryKey: ['analytics', 'practice', practiceId],
    queryFn: () => analyticsService.practice(practiceId),
  });
  const d = query.data;
  const questions = (d?.questions ?? []).filter((q) => filter === 'all' || q.status === filter);

  return (
    <>
      <PageHeader
        title={d ? `Hasil ${d.student.name}` : 'Hasil pengerjaan'}
        backHref={paths.studentScores}
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Detail Siswa', href: paths.studentScores },
          { label: 'Hasil' },
        ]}
      />
      {query.isPending && <Skeleton className="h-72 w-full rounded-card" />}
      {query.isError && (
        <SectionCard>
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </SectionCard>
      )}
      {d && (
        <div className="grid gap-6 xl:grid-cols-[340px_1fr]">
          <SectionCard title="Ringkasan" className="h-fit">
            <dl className="space-y-2 text-sm">
              {[
                ['NISN', d.student.nisn],
                ['Sekolah', d.student.school],
                ['Kelas', d.student.class],
                ['Paket', `${d.package.title} (${d.package.code})`],
                ['Dikumpulkan', formatDateTime(d.summary.submitted_at)],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
            <div className="mt-5 flex items-center justify-between rounded-xl bg-primary/6 p-4">
              <div>
                <p className="text-xs text-muted-foreground">Skor akhir</p>
                <p className="text-3xl font-semibold tabular-nums">
                  {formatScore(d.summary.score)}
                </p>
              </div>
              <PredicateBadge score={d.summary.score} />
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <StatTile label="Benar" value={String(d.summary.total_correct)} tone="success" />
              <StatTile label="Salah" value={String(d.summary.total_incorrect)} tone="warning" />
              <StatTile label="Kosong" value={String(d.summary.total_unanswered)} />
            </div>
          </SectionCard>

          <SectionCard
            title="Jawaban per soal"
            action={
              <ToggleGroup
                type="single"
                variant="outline"
                value={filter}
                onValueChange={(v) => v && setFilter(v as Filter)}
                aria-label="Filter status jawaban"
              >
                <ToggleGroupItem value="all">Semua</ToggleGroupItem>
                <ToggleGroupItem value="correct">Benar</ToggleGroupItem>
                <ToggleGroupItem value="incorrect">Salah</ToggleGroupItem>
                <ToggleGroupItem value="unanswered">Kosong</ToggleGroupItem>
              </ToggleGroup>
            }
          >
            <Accordion type="multiple" className="space-y-2">
              {questions.map((q) => {
                const st = ANSWER_STATUS[q.status];
                return (
                  <AccordionItem key={q.no} value={String(q.no)} className="rounded-xl border px-4">
                    <AccordionTrigger className="gap-3 hover:no-underline">
                      <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-xs font-semibold">
                          {q.no}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-medium">
                            {q.question_code} · {q.subject}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            Tingkat {PRACTICE_DIFFICULTY[q.difficulty].toLowerCase()} · jawaban{' '}
                            {q.student_answer ?? '-'} · kunci {q.correct_answer ?? '-'}
                          </span>
                        </span>
                        <StatusPill tone={st.tone} icon={st.icon}>
                          {st.label}
                        </StatusPill>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pb-4">
                      <HtmlContent html={q.question_text} />
                      <ul className="space-y-1.5">
                        {q.options.map((o) => (
                          <li
                            key={o.id}
                            className={cn(
                              'flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-border',
                              o.is_correct && 'bg-success/8 ring-success/30',
                              o.is_student_answer &&
                                !o.is_correct &&
                                'bg-destructive/8 ring-destructive/30'
                            )}
                          >
                            <HtmlContent html={o.text} as="span" />
                            <span className="text-xs font-semibold">
                              {o.is_correct ? 'Kunci' : ''}
                              {o.is_student_answer
                                ? `${o.is_correct ? ' · ' : ''}Jawaban siswa`
                                : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                      <div className="rounded-lg bg-muted/60 p-3 text-sm">
                        <p className="mb-1 font-semibold">Pembahasan</p>
                        <HtmlContent html={q.explanation} />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </SectionCard>
        </div>
      )}
    </>
  );
}
