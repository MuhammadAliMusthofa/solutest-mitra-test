'use client';

import type { ItemAnalysisQuestion } from 'src/models/analytics';

import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { Skeleton } from 'src/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/ui/collapsible';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { formatNumber } from 'src/utils/format';

import { analyticsService } from 'src/services/analytics';

import { Iconify } from 'src/components/iconify/iconify';
import { SelectField } from 'src/components/form/select-field';
import { KpiCard } from 'src/components/data-display/kpi-card';
import { ErrorState } from 'src/components/feedback/error-state';
import { EmptyState } from 'src/components/feedback/empty-state';
import { STATUS_COLORS } from 'src/components/charts/chart-types';
import { FilterBar } from 'src/components/data-display/filter-bar';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import { SectionCard } from 'src/components/data-display/section-card';
import { HtmlContent } from 'src/components/data-display/html-content';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { TryoutFilter } from 'src/sections/_global/components/tryout-filter';

import { DIFFICULTIES, DIFFICULTY_STYLE } from '../helpers/analytics';

/** Batang 100% benar/salah/kosong dengan celah 2px antar segmen + label teks. */
function AnswerBar({ q }: { q: ItemAnalysisQuestion }) {
  const parts = [
    { key: 'Benar', value: q.benar, color: STATUS_COLORS.good },
    { key: 'Salah', value: q.salah, color: STATUS_COLORS.critical },
    { key: 'Kosong', value: q.kosong, color: STATUS_COLORS.neutral },
  ];
  const total = parts.reduce((a, p) => a + p.value, 0) || 1;
  return (
    <div>
      <div
        className="flex h-3 gap-0.5 overflow-hidden rounded-full"
        role="img"
        aria-label={parts.map((p) => `${p.key} ${p.value}%`).join(', ')}
      >
        {parts.map((p) =>
          p.value > 0 ? (
            <div
              key={p.key}
              style={{ width: `${(p.value / total) * 100}%`, background: p.color }}
              title={`${p.key} ${p.value}%`}
            />
          ) : null
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {parts.map((p) => (
          <span key={p.key} className="flex items-center gap-1.5">
            <span className="size-2 rounded-sm" style={{ background: p.color }} />
            {p.key} <span className="font-semibold text-foreground tabular-nums">{p.value}%</span>
          </span>
        ))}
      </div>
    </div>
  );
}

export function ItemAnalysisContainer() {
  const { paths } = usePanel();
  const [f, setF] = useUrlState({ code: '', subject: '', difficulty: '', page: '1' });
  const params = {
    code: f.code,
    subject: f.subject,
    difficulty: f.difficulty,
    page: Number(f.page),
    per_page: 8,
  };
  const query = useQuery({
    queryKey: ['analytics', 'items', params],
    queryFn: () => analyticsService.items(params),
    placeholderData: keepPreviousData,
  });
  const sum = query.data?.summary;

  return (
    <>
      <PageHeader
        title="Analisis Butir Soal"
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Analisis' },
          { label: 'Butir Soal' },
        ]}
      />
      <div className="grid gap-5 sm:grid-cols-3">
        {DIFFICULTIES.map((d) => (
          <KpiCard
            key={d}
            label={`Soal ${DIFFICULTY_STYLE[d].label.toLowerCase()}`}
            value={formatNumber(sum?.[d.toLowerCase() as 'mudah'])}
            icon={DIFFICULTY_STYLE[d].icon}
            tone={d === 'MUDAH' ? 'success' : d === 'SEDANG' ? 'warning' : 'secondary'}
            hint={
              d === 'MUDAH'
                ? '> 65% peserta menjawab benar'
                : d === 'SEDANG'
                  ? '35–65% menjawab benar'
                  : '< 35% menjawab benar'
            }
          />
        ))}
      </div>

      <SectionCard flush className="mt-6">
        <FilterBar>
          <TryoutFilter value={f.code} onChange={(code) => setF({ code })} />
          <SelectField
            aria-label="Filter mapel"
            value={f.subject}
            onChange={(subject) => setF({ subject })}
            options={(query.data?.subjects ?? []).map((s) => ({ value: s, label: s }))}
            allLabel="Semua mapel"
          />
          <SelectField
            aria-label="Filter tingkat kesulitan"
            value={f.difficulty}
            onChange={(difficulty) => setF({ difficulty })}
            options={DIFFICULTIES.map((d) => ({ value: d, label: DIFFICULTY_STYLE[d].label }))}
            allLabel="Semua tingkat"
            className="sm:w-44"
          />
        </FilterBar>
        <div className="space-y-3 p-5 md:p-6">
          {query.isPending && <Skeleton className="h-64 w-full rounded-xl" />}
          {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
          {query.data?.data.length === 0 && <EmptyState title="Tidak ada soal untuk filter ini" />}
          {query.data?.data.map((q, i) => {
            const st = DIFFICULTY_STYLE[q.difficulty];
            const no =
              (query.data.pagination.current_page - 1) * query.data.pagination.per_page + i + 1;
            return (
              <Collapsible key={q.id} className="rounded-xl p-4 ring-1 ring-border">
                <div className="flex flex-wrap items-start gap-3">
                  <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary/8 text-sm font-semibold text-primary">
                    {no}
                  </span>
                  <div className="min-w-0 flex-1 space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={st.tone} icon={st.icon}>
                        {st.label}
                      </StatusPill>
                      <StatusPill>{q.subject_name}</StatusPill>
                      <span className="text-xs text-muted-foreground">
                        {formatNumber(q.total_participants)} peserta
                      </span>
                    </div>
                    <HtmlContent html={q.question_text} className="text-sm" />
                    <AnswerBar q={q} />
                  </div>
                </div>
                <CollapsibleTrigger className="group mt-3 ml-12 flex items-center gap-1 text-sm font-medium text-primary">
                  Pembahasan
                  <Iconify
                    icon="solar:alt-arrow-down-linear"
                    size={16}
                    className="transition-transform group-data-[state=open]:rotate-180"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2 ml-12 rounded-lg bg-muted/60 p-3 text-sm">
                  <HtmlContent html={q.pembahasan} />
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
        <TablePagination meta={query.data?.pagination} onPageChange={(page) => setF({ page })} />
      </SectionCard>
    </>
  );
}
