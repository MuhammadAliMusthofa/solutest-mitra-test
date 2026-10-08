'use client';

import type { HistoryItem } from 'src/models/exam';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';
import { Skeleton } from 'src/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/ui/collapsible';

import { withQuery, SISWA_PATHS } from 'src/config/paths';

import { useHydrated } from 'src/hooks/use-hydrated';
import { useUrlState } from 'src/hooks/use-url-state';

import { formatScore, formatDateTime } from 'src/utils/format';

import { practiceService } from 'src/services/student';

import { Iconify } from 'src/components/iconify/iconify';
import { ErrorState } from 'src/components/feedback/error-state';
import { EmptyState } from 'src/components/feedback/empty-state';
import { StatusPill } from 'src/components/data-display/status-pill';
import { HeroBanner } from 'src/components/data-display/hero-banner';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { KICKED_OUT_KEY } from 'src/sections/ujian/hooks/use-cheat-detection';
import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

const leaderboardHref = (scheduleId: number) =>
  withQuery(SISWA_PATHS.leaderboard, { paket: scheduleId });

/** Ajakan membuka laporan performa pribadi (kekuatan & materi yang perlu ditingkatkan). */
function ReportBanner({ practiceId }: { practiceId: number }) {
  return (
    <Link
      href={SISWA_PATHS.report(practiceId)}
      className="group/report mt-5 flex items-stretch overflow-hidden rounded-2xl bg-primary/25 transition-colors hover:bg-primary/35 focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none"
    >
      <span className="grid w-24 shrink-0 grid-cols-2 grid-rows-2 sm:w-40" aria-hidden>
        <span className="grid place-items-center bg-primary text-primary-foreground">
          <Iconify icon="solar:star-shine-bold" size={22} />
        </span>
        <span className="grid place-items-center bg-secondary text-secondary-foreground">
          <Iconify icon="solar:chart-2-bold" size={22} />
        </span>
        <span className="grid place-items-center bg-brand-accent text-brand-accent-foreground">
          <Iconify icon="solar:target-bold" size={22} />
        </span>
        <span className="grid place-items-center bg-info text-white">
          <Iconify icon="solar:graph-up-bold" size={22} />
        </span>
      </span>
      <span className="flex min-w-0 flex-1 items-center gap-4 px-5 py-4">
        <span className="min-w-0 flex-1">
          <span className="block text-base font-extrabold md:text-lg">
            Laporan Performa Pribadi
          </span>
          <span className="mt-1 block text-sm leading-relaxed text-foreground/75">
            Ketahui kekuatanmu, materi yang perlu ditingkatkan, dan strategi belajar berdasarkan
            hasil tryout ini.
          </span>
        </span>
        <Iconify
          icon="solar:arrow-right-up-linear"
          size={22}
          className="hidden shrink-0 transition-transform group-hover/report:translate-x-0.5 group-hover/report:-translate-y-0.5 sm:block"
        />
      </span>
    </Link>
  );
}

function HistoryCard({ h }: { h: HistoryItem }) {
  const scored = h.is_processed && h.score !== null;
  return (
    <article className="rounded-card bg-card p-6 shadow-card md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-xs font-semibold text-muted-foreground">
            Dikerjakan pada {formatDateTime(h.submitted_at)}
          </p>
          <h2 className="mt-1.5 text-lg font-extrabold md:text-xl">{h.title}</h2>
          <ul className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold text-foreground/75">
            <li className="flex items-center gap-1.5">
              <Iconify icon="solar:clock-circle-linear" size={18} />
              {h.time} Menit
            </li>
            <li className="flex items-center gap-1.5">
              <Iconify icon="solar:book-2-linear" size={18} />
              {h.subject_name || h.package_title}
            </li>
            {h.is_auto_ended && (
              <li>
                <StatusPill tone="warning" icon="solar:danger-circle-linear">
                  Dikumpulkan otomatis
                </StatusPill>
              </li>
            )}
          </ul>
        </div>
        {h.is_processed ? (
          scored && (
            <div className="flex items-center gap-3 rounded-2xl bg-muted/70 px-4 py-2.5">
              <div className="text-right">
                <p className="text-xs font-semibold text-muted-foreground">Skor</p>
                <p className="text-2xl leading-tight font-extrabold tabular-nums">
                  {formatScore(h.score ?? undefined)}
                </p>
              </div>
              {h.predicate && <PredicateBadge predicate={h.predicate} />}
            </div>
          )
        ) : (
          <StatusPill tone="info" icon="svg-spinners:180-ring">
            Nilai sedang dihitung
          </StatusPill>
        )}
      </div>

      <ReportBanner practiceId={h.practice_id} />

      <Collapsible>
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
          <CollapsibleTrigger className="group/detail flex items-center gap-1.5 text-sm font-bold hover:text-primary">
            Lihat detail paket soal
            <Iconify
              icon="solar:alt-arrow-down-linear"
              size={16}
              className="transition-transform group-data-[state=open]/detail:rotate-180"
            />
          </CollapsibleTrigger>
          <Link
            href={leaderboardHref(h.schedule_id)}
            className="flex items-center gap-1.5 text-sm font-bold hover:text-primary"
          >
            Lihat Peringkat Leaderboard
            <Iconify icon="solar:arrow-right-up-linear" size={16} />
          </Link>
        </div>
        <CollapsibleContent>
          <dl className="mt-4 grid gap-3 rounded-2xl bg-muted/60 p-4 text-sm sm:grid-cols-3">
            {[
              ['Paket soal', h.package_title || '-'],
              ['Mulai mengerjakan', formatDateTime(h.started_at)],
              ['Dikumpulkan', formatDateTime(h.submitted_at)],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-xs font-semibold text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 font-bold">{v}</dd>
              </div>
            ))}
          </dl>
        </CollapsibleContent>
      </Collapsible>
    </article>
  );
}

/** Halaman setelah mengumpulkan tryout. Nilai dihitung consumer → polling sampai selesai. */
export function TryoutFinishedContainer() {
  const { practiceId } = useParams<{ practiceId: string }>();
  const query = useQuery({
    queryKey: ['student', 'result', practiceId],
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
        <div className="deco-rings bg-primary px-6 py-10 text-primary-foreground [--deco:var(--primary-foreground)]">
          <Iconify icon="solar:cup-star-bold-duotone" size={72} className="mx-auto" />
          <h1 className="mt-3 text-2xl font-extrabold">Tryout berhasil dikumpulkan</h1>
          <p className="mt-1 font-semibold opacity-80">{d?.title ?? '…'}</p>
        </div>
        <div className="p-6 md:p-8">
          {hydrated && kicked && (
            <p
              role="alert"
              className="mb-4 rounded-xl bg-destructive/8 px-4 py-3 text-left text-sm text-destructive"
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
              <p className="text-sm font-semibold text-muted-foreground">Skor kamu</p>
              <p className="text-6xl font-extrabold tabular-nums">{formatScore(d.score)}</p>
              <div className="mt-3 flex justify-center">
                <PredicateBadge predicate={d.predicate} />
              </div>
              {d.total_correct !== null && (
                <p className="mt-3 text-sm text-muted-foreground">{d.total_correct} soal benar</p>
              )}
            </>
          ) : (
            <ErrorState error={query.error} onRetry={() => query.refetch()} />
          )}
          <div className="mt-7 grid gap-2 sm:grid-cols-2">
            <Button variant="outline" size="lg" className="rounded-lg" asChild>
              <Link href={SISWA_PATHS.report(practiceId)}>
                <Iconify icon="solar:chart-square-linear" size={18} />
                Laporan performa
              </Link>
            </Button>
            <Button variant="dark" size="lg" className="rounded-lg" asChild>
              <Link href={SISWA_PATHS.leaderboard}>
                <Iconify icon="solar:cup-star-linear" size={18} />
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
      <HeroBanner
        title="Riwayat Tryout"
        description="Semua tryout yang sudah kamu kumpulkan, lengkap dengan laporan performa dan peringkat."
        crumbs={[{ label: 'Tryout', href: SISWA_PATHS.tryout }, { label: 'Riwayat' }]}
        icon="solar:history-bold-duotone"
      />
      {query.isPending && <Skeleton className="h-72 w-full rounded-card" />}
      {query.isError && (
        <div className="rounded-card bg-card shadow-card">
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </div>
      )}
      {query.data?.data.length === 0 && (
        <div className="rounded-card bg-card shadow-card">
          <EmptyState
            title="Belum ada riwayat"
            description="Tryout yang sudah dikumpulkan akan muncul di sini."
            icon="solar:history-linear"
          />
        </div>
      )}
      <div className="space-y-6">
        {query.data?.data.map((h) => (
          <HistoryCard key={h.practice_id} h={h} />
        ))}
      </div>
      {query.data && query.data.pagination.total_items > 0 && (
        <div className="mt-6 rounded-card bg-card shadow-card">
          <TablePagination meta={query.data.pagination} onPageChange={(p) => setF({ page: p })} />
        </div>
      )}
    </>
  );
}
