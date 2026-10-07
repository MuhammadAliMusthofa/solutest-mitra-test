'use client';

import { useState } from 'react';

import { Button } from 'src/components/ui/button';

import { formatClock } from 'src/utils/format';

import { useExamAnswerStore, useExamSessionStore } from 'src/state/exam-store';

import { Iconify } from 'src/components/iconify/iconify';
import { ConfirmDialog } from 'src/components/feedback/confirm-dialog';

import { NumberGrid } from '../components/number-grid';
import { useCountdown } from '../hooks/use-exam-timers';
import { useSubmitExam } from '../hooks/use-exam-actions';
import { answerStats, flattenQuestions } from '../helpers/exam';
import { useExamNavigation } from '../hooks/use-exam-navigation';

/** Konfirmasi sebelum mengumpulkan: ringkasan dijawab / ragu-ragu / kosong. */
export function ExamConfirmView() {
  const session = useExamSessionStore((s) => s.session);
  const answers = useExamAnswerStore((s) => s.answers);
  const { goTo } = useExamNavigation();
  const submit = useSubmitExam();
  const { seconds } = useCountdown(session?.deadline);
  const [confirm, setConfirm] = useState(false);
  if (!session) return null;
  const stats = answerStats(flattenQuestions(session), answers);

  const tiles = [
    {
      label: 'Sudah dijawab',
      value: stats.answered,
      icon: 'solar:check-circle-linear',
      className: 'bg-primary/8 text-primary',
    },
    {
      label: 'Ragu-ragu',
      value: stats.doubt,
      icon: 'solar:flag-linear',
      className: 'bg-warning/10 text-warning',
    },
    {
      label: 'Belum dijawab',
      value: stats.unanswered,
      icon: 'solar:minus-circle-linear',
      className: 'bg-muted text-muted-foreground',
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="text-center">
        <span className="mx-auto mb-3 grid size-16 place-items-center rounded-full bg-primary/10 text-primary">
          <Iconify icon="solar:clipboard-check-linear" size={34} />
        </span>
        <h1 className="text-2xl font-semibold">Kumpulkan sekarang?</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Sisa waktu <span className="font-semibold tabular-nums">{formatClock(seconds)}</span>.
          Periksa kembali soal yang belum dijawab atau ditandai ragu-ragu.
        </p>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="flex items-center gap-3 rounded-card bg-card p-5 shadow-card"
          >
            <span className={`grid size-12 place-items-center rounded-xl ${t.className}`}>
              <Iconify icon={t.icon} size={24} />
            </span>
            <div>
              <p className="text-sm text-muted-foreground">{t.label}</p>
              <p className="text-2xl font-semibold tabular-nums">{t.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-card bg-card p-5 shadow-card md:p-6">
        <NumberGrid session={session} onPick={goTo} />
      </div>

      <div className="mt-6 flex flex-col-reverse justify-between gap-3 sm:flex-row">
        <Button variant="outline" size="lg" onClick={() => goTo(1)}>
          <Iconify icon="solar:arrow-left-linear" size={18} />
          Kembali mengerjakan
        </Button>
        <Button size="lg" onClick={() => setConfirm(true)}>
          <Iconify icon="solar:upload-square-linear" size={18} />
          Kumpulkan jawaban
        </Button>
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
