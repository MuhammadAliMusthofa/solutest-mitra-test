'use client';

import { useState } from 'react';

import { Button } from 'src/components/ui/button';

import { useCurrentUser } from 'src/hooks/use-session';

import { cn } from 'src/lib/utils';
import { formatClock, formatDateTime } from 'src/utils/format';

import { useExamAnswerStore, useExamSessionStore } from 'src/state/exam-store';

import { Iconify } from 'src/components/iconify/iconify';
import { ConfirmDialog } from 'src/components/feedback/confirm-dialog';

import { NumberGrid } from '../components/number-grid';
import { useCountdown } from '../hooks/use-exam-timers';
import { useSubmitExam } from '../hooks/use-exam-actions';
import { answerStats, flattenQuestions } from '../helpers/exam';
import { useExamNavigation } from '../hooks/use-exam-navigation';

/**
 * Konfirmasi sebelum mengumpulkan (gaya Solutest): identitas, ringkasan dijawab / dilewati,
 * sisa waktu, dan grid nomor untuk memeriksa ulang. Bar aksi menempel di bawah.
 */
export function ExamConfirmView() {
  const session = useExamSessionStore((s) => s.session);
  const answers = useExamAnswerStore((s) => s.answers);
  const { user } = useCurrentUser();
  const { goTo } = useExamNavigation();
  const submit = useSubmitExam();
  const { seconds } = useCountdown(session?.deadline);
  const [confirm, setConfirm] = useState(false);
  if (!session) return null;
  const stats = answerStats(flattenQuestions(session), answers);
  const percent = stats.total ? Math.round((stats.answered / stats.total) * 100) : 0;
  const low = seconds > 0 && seconds <= 600;

  return (
    <div className="min-h-dvh bg-[linear-gradient(180deg,var(--primary)_0%,color-mix(in_srgb,var(--primary)_55%,white)_45%,color-mix(in_srgb,var(--primary)_14%,white)_100%)] pb-32">
      <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6 md:pt-14">
        <h1 className="text-center text-3xl font-extrabold text-primary-foreground md:text-[2.5rem]">
          Kumpulkan sekarang?
        </h1>

        <div className="mt-8 grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
          <div className="space-y-5">
            <section className="rounded-2xl bg-card p-6 shadow-card md:px-8">
              <dl className="grid grid-cols-[auto_auto_1fr] gap-x-3 gap-y-3 text-[0.95rem] md:text-base">
                {[
                  ['Nama', user?.full_name ?? '-'],
                  ['Email', user?.email || '-'],
                  ['Mata Pelajaran', session.subjects.map((s) => s.name).join(', ') || '-'],
                ].map(([k, v]) => (
                  <div key={k} className="contents">
                    <dt className="font-semibold">{k}</dt>
                    <span aria-hidden>:</span>
                    <dd className="min-w-0 truncate font-bold">{v}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className="rounded-2xl bg-card p-6 shadow-card">
              <div className="flex items-start gap-4">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary/20 text-primary">
                  <Iconify icon="solar:notebook-bold" size={26} />
                </span>
                <div className="min-w-0">
                  <p className="font-bold">Tryout</p>
                  <p className="text-sm font-semibold text-muted-foreground">{session.title}</p>
                </div>
              </div>

              <div className="mt-5 rounded-xl bg-muted/70 px-5 pt-5 pb-4">
                <div
                  className="h-2.5 overflow-hidden rounded-full bg-success/25"
                  role="progressbar"
                  aria-valuenow={percent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Soal dijawab"
                >
                  <div
                    className="h-full rounded-full bg-success"
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <dl className="mt-5 grid grid-cols-3 text-center">
                  <div>
                    <dt className="text-sm font-semibold">Dijawab</dt>
                    <dd className="text-3xl font-extrabold text-success tabular-nums">
                      {stats.answered}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold">Dilewati</dt>
                    <dd className="text-3xl font-extrabold text-warning tabular-nums">
                      {stats.unanswered}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-semibold">Total Soal</dt>
                    <dd className="text-3xl font-extrabold tabular-nums">{stats.total}</dd>
                  </div>
                </dl>
              </div>

              <div
                className={cn(
                  'mt-4 rounded-xl px-5 py-3.5 shadow-[0_6px_16px_-10px_var(--warning)]',
                  low
                    ? 'bg-destructive text-white'
                    : 'bg-[color-mix(in_srgb,var(--warning)_28%,white)]'
                )}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-bold">
                    <Iconify icon="solar:clock-circle-linear" size={20} />
                    Sisa waktu
                  </span>
                  <span className="text-xl font-extrabold tabular-nums">
                    {formatClock(seconds)}
                  </span>
                </div>
                <p className="mt-2 border-t border-current/15 pt-2 text-center text-xs opacity-80">
                  Mulai mengerjakan: {formatDateTime(session.start_time)}
                </p>
              </div>
            </section>
          </div>

          <section className="rounded-2xl bg-card p-6 shadow-card">
            {(stats.unanswered > 0 || stats.doubt > 0) && (
              <p className="mb-5 flex items-start gap-2.5 rounded-xl bg-warning/8 px-4 py-3 text-sm font-semibold text-warning">
                <Iconify icon="solar:danger-triangle-linear" size={20} className="shrink-0" />
                Sebelum mengumpulkan, coba cek lagi soal-soal berikut, yuk!
              </p>
            )}
            <h2 className="text-lg font-bold">Periksa jawaban anda</h2>
            <p className="mb-5 text-sm font-medium text-foreground/75">
              Lengkapi jawaban kamu untuk dapatkan nilai maksimal, ya!
            </p>
            <NumberGrid session={session} onPick={goTo} />
          </section>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-center gap-3 px-4 py-3.5">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 rounded-lg border-foreground/30 hover:border-foreground hover:bg-muted hover:text-foreground"
            onClick={() => goTo(1)}
          >
            Kembali ke soal
          </Button>
          <Button
            variant="dark"
            size="lg"
            className="flex-1 rounded-lg"
            onClick={() => setConfirm(true)}
          >
            Kumpulkan
          </Button>
        </div>
      </div>

      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title="Kumpulkan jawaban?"
        description={
          stats.unanswered
            ? `Masih ada ${stats.unanswered} soal belum dijawab. Setelah dikumpulkan, jawaban tidak bisa diubah.`
            : 'Setelah dikumpulkan, jawaban tidak bisa diubah.'
        }
        confirmLabel="Ya, kumpulkan"
        loading={submit.isPending}
        onConfirm={() => submit.mutate()}
      />
    </div>
  );
}
