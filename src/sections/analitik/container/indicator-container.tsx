'use client';

import type { IndicatorNode } from 'src/models/analytics';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';
import { Skeleton } from 'src/components/ui/skeleton';
import {
  Accordion,
  AccordionItem,
  AccordionContent,
  AccordionTrigger,
} from 'src/components/ui/accordion';
import {
  Dialog,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from 'src/components/ui/dialog';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { cn } from 'src/lib/utils';
import { formatScore, formatNumber } from 'src/utils/format';

import { analyticsService } from 'src/services/analytics';

import { Iconify } from 'src/components/iconify/iconify';
import { SelectField } from 'src/components/form/select-field';
import { StatTile } from 'src/components/data-display/kpi-card';
import { ErrorState } from 'src/components/feedback/error-state';
import { EmptyState } from 'src/components/feedback/empty-state';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import { HtmlContent } from 'src/components/data-display/html-content';
import { SectionCard } from 'src/components/data-display/section-card';

import { TryoutFilter } from 'src/sections/_global/components/tryout-filter';

import { achievementLevel, ACHIEVEMENT_LEGEND } from '../helpers/analytics';

function Meter({ value, label }: { value: number; label: string }) {
  const lvl = achievementLevel(value);
  return (
    <div className="flex items-center gap-3">
      <div
        className="h-2.5 w-28 overflow-hidden rounded-full bg-muted sm:w-40"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-label={label}
      >
        <div
          className={cn('h-full rounded-full', lvl.bar)}
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="w-14 text-right text-sm font-semibold tabular-nums">
        {formatScore(value)}%
      </span>
      <StatusPill tone={lvl.tone} className="hidden md:inline-flex">
        {lvl.label}
      </StatusPill>
    </div>
  );
}

function SampleQuestionsDialog({
  indicator,
  onClose,
}: {
  indicator: IndicatorNode | null;
  onClose: () => void;
}) {
  const query = useQuery({
    queryKey: ['analytics', 'indicator-questions', indicator?.question_ids],
    queryFn: () => analyticsService.indicatorQuestions(indicator?.question_ids ?? []),
    enabled: Boolean(indicator?.question_ids.length),
  });
  return (
    <Dialog open={Boolean(indicator)} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Contoh soal</DialogTitle>
          <DialogDescription>{indicator?.name}</DialogDescription>
        </DialogHeader>
        {query.isPending && <Skeleton className="h-40 w-full rounded-xl" />}
        {query.data?.map((q) => (
          <article key={q.id} className="space-y-3 rounded-xl p-4 ring-1 ring-border">
            <p className="text-xs text-muted-foreground">
              {q.code} · {q.competency_name} › {q.sub_competency_name}
            </p>
            <HtmlContent html={q.question_text} />
            <ul className="space-y-1.5">
              {q.options.map((o) => (
                <li
                  key={o.id}
                  className={cn(
                    'flex items-center justify-between rounded-lg px-3 py-2 text-sm ring-1 ring-border',
                    o.is_true && 'bg-success/8 ring-success/30'
                  )}
                >
                  <HtmlContent html={o.option_text} as="span" />
                  {o.is_true && <span className="text-xs font-semibold text-success">Kunci</span>}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </DialogContent>
    </Dialog>
  );
}

export function IndicatorContainer() {
  const { paths } = usePanel();
  const [f, setF] = useUrlState({ code: '', subject: '', jenjang: '' });
  const [sample, setSample] = useState<IndicatorNode | null>(null);
  const p = { code: f.code, subject: f.subject, jenjang: f.jenjang };
  const filters = useQuery({
    queryKey: ['analytics', 'indicator-filters'],
    queryFn: analyticsService.indicatorFilters,
  });
  const summary = useQuery({
    queryKey: ['analytics', 'indicator-summary', p],
    queryFn: () => analyticsService.indicatorSummary(p),
  });
  const tree = useQuery({
    queryKey: ['analytics', 'indicator-tree', p],
    queryFn: () => analyticsService.indicatorHierarchy(p),
  });

  return (
    <>
      <PageHeader
        title="Analisis Indikator"
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Analisis' },
          { label: 'Indikator' },
        ]}
      />
      <SectionCard>
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <TryoutFilter value={f.code} onChange={(code) => setF({ code })} />
          <SelectField
            aria-label="Filter mapel"
            value={f.subject}
            onChange={(subject) => setF({ subject })}
            options={(filters.data?.subjects ?? []).map((s) => ({ value: s, label: s }))}
            allLabel="Semua mapel"
          />
          <SelectField
            aria-label="Filter jenjang"
            value={f.jenjang}
            onChange={(jenjang) => setF({ jenjang })}
            options={(filters.data?.jenjang ?? []).map((s) => ({ value: s, label: s }))}
            allLabel="Semua jenjang"
            className="sm:w-40"
          />
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatTile
            label="Sekolah"
            value={formatNumber(summary.data?.total_sekolah)}
            icon="solar:buildings-2-linear"
          />
          <StatTile
            label="Peserta"
            value={formatNumber(summary.data?.total_peserta)}
            icon="solar:users-group-rounded-linear"
            tone="secondary"
          />
          <div className="rounded-xl bg-muted/60 p-4 text-xs text-muted-foreground lg:col-span-2">
            <p className="mb-2 font-semibold text-foreground">Level capaian</p>
            <div className="flex flex-wrap gap-2">
              {ACHIEVEMENT_LEGEND.map((l) => (
                <StatusPill key={l.label} tone={l.tone}>
                  {l.label} {l.range}
                </StatusPill>
              ))}
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Kompetensi → sub-kompetensi → indikator" className="mt-6">
        {tree.isPending && <Skeleton className="h-64 w-full rounded-xl" />}
        {tree.isError && <ErrorState error={tree.error} onRetry={() => tree.refetch()} />}
        {tree.data?.length === 0 && <EmptyState title="Belum ada data kompetensi" />}
        {tree.data && tree.data.length > 0 && (
          <Accordion type="multiple" className="space-y-3">
            {tree.data.map((c) => (
              <AccordionItem key={c.id} value={String(c.id)} className="rounded-xl border px-4">
                <AccordionTrigger className="hover:no-underline">
                  <span className="flex flex-1 flex-wrap items-center justify-between gap-3 pr-2">
                    <span className="font-semibold">{c.name}</span>
                    <Meter value={c.percentage} label={`Capaian ${c.name}`} />
                  </span>
                </AccordionTrigger>
                <AccordionContent className="space-y-4 pb-4">
                  {c.sub_competencies.map((sc) => (
                    <div key={sc.id} className="rounded-lg bg-muted/40 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <p className="text-sm font-semibold">{sc.name}</p>
                        <Meter value={sc.percentage} label={`Capaian ${sc.name}`} />
                      </div>
                      <ul className="mt-3 space-y-2">
                        {sc.indicators.map((ind) => (
                          <li
                            key={ind.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card px-3 py-2"
                          >
                            <span className="min-w-0 flex-1 text-sm">{ind.name}</span>
                            <Meter value={ind.percentage} label={`Capaian ${ind.name}`} />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSample(ind)}
                              disabled={!ind.question_ids.length}
                            >
                              <Iconify icon="solar:eye-linear" size={16} />
                              Contoh soal
                            </Button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </SectionCard>
      <SampleQuestionsDialog indicator={sample} onClose={() => setSample(null)} />
    </>
  );
}
