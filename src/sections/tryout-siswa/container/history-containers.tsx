'use client';

import type { HistoryItem } from 'src/models/exam';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';
import { Skeleton } from 'src/components/ui/skeleton';

import { SISWA_PATHS } from 'src/config/paths';

import { useHydrated } from 'src/hooks/use-hydrated';
import { useUrlState } from 'src/hooks/use-url-state';

import { formatScore, formatDateTime } from 'src/utils/format';

import { practiceService } from 'src/services/student';
import { questionTypeName } from 'src/models/question';

import { Iconify } from 'src/components/iconify/iconify';
import { ErrorState } from 'src/components/feedback/error-state';
import { EmptyState } from 'src/components/feedback/empty-state';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import { HtmlContent } from 'src/components/data-display/html-content';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { ReviewAnswer } from 'src/sections/_global/components/review-answer';
import { KICKED_OUT_KEY } from 'src/sections/ujian/hooks/use-cheat-detection';
import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

function HistoryActions({ item }: { item: Pick<HistoryItem, 'practice_id'> }) {
  return (
    <div className="flex flex-wrap gap-2">
      <Button variant="outline" size="sm" asChild>
        <Link href={SISWA_PATHS.explanation(item.practice_id)}>
          <Iconify icon="solar:book-bookmark-linear" size={16} />
          Pembahasan
        </Link>
      </Button>
      <Button variant="outline" size="sm" asChild>
        <Link href={SISWA_PATHS.report(item.practice_id)}>
          <Iconify icon="solar:chart-square-linear" size={16} />
          Laporan performa
        </Link>
      </Button>
    </div>
  );
}

/** Halaman setelah mengumpulkan tryout. Nilai dihitung consumer → polling sampai selesai. */
export function TryoutFinishedContainer() {
  const { practiceId } = useParams<{ practiceId: string }>();
  const query = useQuery({
    queryKey: ['student', 'explanation', practiceId],
    queryFn: () => practiceService.result(practiceId),
    refetchInterval: (q) => (q.state.data && !q.state.data.is_processed ? 2500 : false),
  });
  // alasan auto-submit karena pelanggaran (ditulis deteksi kecurangan), dibaca sekali lalu dihapus
  const hydrated = useHydrated();
  const [kicked] = useState(() => {
    try {
      return typeof window === 'undefined' ? null : sessionStorage.getItem(KICKED_OUT_KEY);
    } catch {
      return null;
    }
  });
  useEffect(() => {
    try {
      sessionStorage.removeItem(KICKED_OUT_KEY);
    } catch {
      // abaikan
    }
  }, []);
  const d = query.data;

  return (
    <div className="mx-auto max-w-2xl">
      <section className="overflow-hidden rounded-card bg-card text-center shadow-card">
        <div className="bg-gradient-to-br from-primary to-secondary px-6 py-10 text-primary-foreground">
          <Iconify icon="solar:cup-star-bold-duotone" size={64} className="mx-auto" />
          <h1 className="mt-3 text-2xl font-semibold">Tryout berhasil dikumpulkan</h1>
          <p className="mt-1 opacity-90">{d?.title ?? '…'}</p>
        </div>
        <div className="p-6">
          {hydrated && kicked && (
            <p
              role="alert"
              className="mb-4 rounded-lg bg-destructive/8 px-4 py-3 text-left text-sm text-destructive"
            >
              {kicked}
            </p>
          )}
          {query.isPending ? (
            <Skeleton className="mx-auto h-24 w-48 rounded-xl" />
          ) : d && !d.is_processed ? (
            <p className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <Iconify icon="svg-spinners:180-ring" size={18} />
              Nilai sedang dihitung…
            </p>
          ) : d && d.score === null ? (
            <p className="text-sm text-muted-foreground">
              Nilai tryout ini tidak ditampilkan oleh penyelenggara.
            </p>
          ) : d ? (
            <>
              <p className="text-sm text-muted-foreground">Skor kamu</p>
              <p className="text-5xl font-semibold tabular-nums">{formatScore(d.score)}</p>
              <div className="mt-2 flex justify-center">
                <PredicateBadge predicate={d.predicate} />
              </div>
              {d.total_correct !== null && (
                <p className="mt-3 text-sm text-muted-foreground">{d.total_correct} soal benar</p>
              )}
            </>
          ) : (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          )}
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <HistoryActions item={{ practice_id: Number(practiceId) }} />
            <Button size="sm" asChild>
              <Link href={SISWA_PATHS.leaderboard}>
                <Iconify icon="solar:cup-star-linear" size={16} />
                Leaderboard
              </Link>
            </Button>
          </div>
          <Button variant="ghost" className="mt-4" asChild>
            <Link href={SISWA_PATHS.root}>Kembali ke beranda</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}

export function HistoryContainer() {
  const [{ page }, setF] = useUrlState({ page: '1' });
  const query = useQuery({
    queryKey: ['student', 'history', page],
    queryFn: () => practiceService.history({ page: Number(page), per_page: 8 }),
    placeholderData: keepPreviousData,
  });

  return (
    <>
      <PageHeader
        title="Riwayat Tryout"
        crumbs={[{ label: 'Beranda', href: SISWA_PATHS.root }, { label: 'Riwayat' }]}
      />
      {query.isPending && <Skeleton className="h-72 w-full rounded-card" />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.data?.data.length === 0 && (
        <EmptyState
          title="Belum ada riwayat"
          description="Tryout yang sudah dikumpulkan akan muncul di sini."
          icon="solar:history-linear"
        />
      )}
      <div className="space-y-4">
        {query.data?.data.map((h) => (
          <article
            key={h.practice_id}
            className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card md:flex-row md:items-center"
          >
            <div className="grid size-16 shrink-0 place-items-center rounded-2xl bg-primary/8">
              <span className="text-xl font-semibold text-primary tabular-nums">
                {h.is_processed ? formatScore(h.score ?? undefined, 0) : '…'}
              </span>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{h.title}</p>
                <PredicateBadge predicate={h.predicate} />
                {h.is_auto_ended && <StatusPill tone="warning">Dikumpulkan otomatis</StatusPill>}
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {[
                  h.subject_name || h.package_title,
                  `${h.time} menit`,
                  formatDateTime(h.submitted_at),
                ]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            </div>
            <HistoryActions item={h} />
          </article>
        ))}
      </div>
      <TablePagination
        meta={query.data?.pagination}
        onPageChange={(p) => setF({ page: p })}
        className="px-0"
      />
    </>
  );
}

export function ExplanationContainer() {
  const { practiceId } = useParams<{ practiceId: string }>();
  const query = useQuery({
    queryKey: ['student', 'explanation', practiceId],
    queryFn: () => practiceService.result(practiceId),
  });
  const d = query.data;

  return (
    <>
      {d && !d.review_available && (
        <SectionCard className="mb-6">
          <EmptyState
            title="Pembahasan belum dibuka"
            description={
              d.score === null && d.is_processed
                ? 'Penyelenggara tidak menampilkan nilai & pembahasan tryout ini.'
                : `Kunci & pembahasan tersedia setelah tryout ditutup (${formatDateTime(d.schedule_end_at)}).`
            }
            icon="solar:lock-keyhole-linear"
          />
        </SectionCard>
      )}
      <PageHeader
        title={d ? `Pembahasan — ${d.title}` : 'Pembahasan'}
        backHref={SISWA_PATHS.history}
        crumbs={[{ label: 'Riwayat', href: SISWA_PATHS.history }, { label: 'Pembahasan' }]}
        actions={
          d &&
          d.score !== null && <StatusPill tone="primary">Skor {formatScore(d.score)}</StatusPill>
        }
      />
      {query.isPending && <Skeleton className="h-96 w-full rounded-card" />}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      <div className="space-y-4">
        {d?.questions.map((q, i) => {
          const status =
            q.score >= 100
              ? 'benar'
              : q.score > 0
                ? 'sebagian'
                : (q.answer as unknown[]).length
                  ? 'salah'
                  : 'kosong';
          return (
            <SectionCard key={q.id}>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
                  {i + 1}
                </span>
                <StatusPill tone="secondary">{questionTypeName(q.type_question_id)}</StatusPill>
                <StatusPill
                  tone={
                    status === 'benar'
                      ? 'success'
                      : status === 'sebagian'
                        ? 'warning'
                        : status === 'salah'
                          ? 'danger'
                          : 'neutral'
                  }
                  icon={
                    status === 'benar'
                      ? 'solar:check-circle-linear'
                      : status === 'kosong'
                        ? 'solar:minus-circle-linear'
                        : 'solar:close-circle-linear'
                  }
                >
                  {status === 'benar'
                    ? 'Benar'
                    : status === 'sebagian'
                      ? `Sebagian (${q.score})`
                      : status === 'salah'
                        ? 'Salah'
                        : 'Tidak dijawab'}
                </StatusPill>
              </div>
              {q.text && (
                <div className="mb-3 rounded-lg border-l-4 border-secondary/40 bg-muted/50 p-3 text-sm">
                  <HtmlContent html={q.text} />
                </div>
              )}
              <HtmlContent html={q.question_text} className="mb-3" />
              <ReviewAnswer q={q} />
              {q.description && (
                <div className="mt-4 rounded-lg bg-primary/5 p-4 text-sm">
                  <p className="mb-1 flex items-center gap-1.5 font-semibold text-primary">
                    <Iconify icon="solar:lightbulb-bolt-linear" size={18} />
                    Pembahasan
                  </p>
                  <HtmlContent html={q.description} />
                </div>
              )}
            </SectionCard>
          );
        })}
      </div>
    </>
  );
}
