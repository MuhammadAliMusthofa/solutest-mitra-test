'use client';

/* eslint-disable @next/next/no-img-element -- lampiran soal dari storage eksternal / data URL */

import { useParams } from 'next/navigation';
import { useState, useEffect, useEffectEvent } from 'react';

import { Button } from 'src/components/ui/button';

import { cn } from 'src/lib/utils';

import { useExamUiStore } from 'src/state/exam-ui-store';
import { useExamAnswerStore, useExamSessionStore } from 'src/state/exam-store';

import { Iconify } from 'src/components/iconify/iconify';
import { ConfirmDialog } from 'src/components/feedback/confirm-dialog';
import { HtmlContent } from 'src/components/data-display/html-content';

import { useSubmitExam } from '../hooks/use-exam-actions';
import { useQuestionTimer } from '../hooks/use-exam-timers';
import { useExamNavigation } from '../hooks/use-exam-navigation';
import { QuestionAnswerArea } from '../components/question-types';
import { decodeNumber, sectionRanges, flattenQuestions } from '../helpers/exam';

/** Halaman satu soal: stimulus/soal di kiri, area jawaban di kanan, footer navigasi. */
export function ExamQuestionView() {
  const { nomor: segment } = useParams<{ nomor: string }>();
  const nomor = decodeNumber(segment);
  const session = useExamSessionStore((s) => s.session);
  const questions = flattenQuestions(session);
  const q = questions[nomor - 1];
  const fontScale = useExamUiStore((s) => s.fontScale);
  const entry = useExamAnswerStore((s) => s.answers.find((a) => a.id === q?.id));
  const setAnswer = useExamAnswerStore((s) => s.setAnswer);
  const { goTo, total } = useExamNavigation();
  const submit = useSubmitExam();
  const [exitOpen, setExitOpen] = useState(false);
  const section = sectionRanges(session).find(
    (s) => nomor >= s.startNumber && nomor <= s.endNumber
  );
  useQuestionTimer(q?.id);

  // Navigasi keyboard ← / → (diabaikan saat mengetik di input/textarea).
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    const target = e.target as HTMLElement | null;
    if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA' || target?.isContentEditable)
      return;
    if (e.key === 'ArrowLeft' && nomor > 1) goTo(nomor - 1);
    if (e.key === 'ArrowRight') goTo(nomor + 1);
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // Tombol "kembali" browser di soal pertama → dialog keluar (kumpulkan & keluar), bukan keluar diam-diam.
  useEffect(() => {
    if (nomor !== 1) return undefined;
    const trap = () => window.history.pushState({ examTrap: true }, '', window.location.href);
    trap();
    const onPop = () => {
      setExitOpen(true);
      trap();
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [nomor]);

  if (!session || !q) {
    return (
      <div className="grid place-items-center py-24 text-center">
        <p className="text-muted-foreground">Nomor soal tidak ditemukan.</p>
        <Button className="mt-4" onClick={() => goTo(1)}>
          Ke soal nomor 1
        </Button>
      </div>
    );
  }

  const hasStimulus = Boolean(q.text || q.text_image);
  const images = q.attachments.filter((a) => a.type === 'image');
  const audio = q.attachments.find((a) => a.type === 'audio');
  const toggleDoubt = () =>
    setAnswer({
      id: q.id,
      type: q.type_question_id,
      answer: entry?.answer ?? [],
      isCompleted: entry?.isCompleted ?? false,
      isDoubt: !entry?.isDoubt,
      duration_seconds: entry?.duration_seconds ?? 0,
      index: nomor - 1,
    });

  const questionBlock = (
    <>
      <HtmlContent html={q.question_text} />
      {images.map((a) => (
        <img
          key={a.path}
          src={a.path}
          alt={`Gambar soal nomor ${nomor}`}
          className="mt-3 max-h-80 rounded-lg ring-1 ring-border"
        />
      ))}
      {audio && <audio controls src={audio.path} className="mt-3 w-full" />}
    </>
  );

  return (
    <>
      <div
        className="mx-auto max-w-[1600px] px-4 pt-4 pb-32 sm:px-6"
        style={{ fontSize: `${fontScale}rem` }}
      >
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-primary px-3 py-1 text-sm font-semibold text-primary-foreground">
            Soal {nomor} dari {total}
          </span>
          {section && session.sections.length > 1 && (
            <span className="rounded-full bg-card px-3 py-1 text-sm ring-1 ring-border">
              {section.subject_name}
            </span>
          )}
          {entry?.isDoubt && (
            <span className="inline-flex items-center gap-1 rounded-full bg-warning/12 px-3 py-1 text-sm font-medium text-warning">
              <Iconify icon="solar:flag-linear" size={16} />
              Ragu-ragu
            </span>
          )}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <section
            aria-label={hasStimulus ? 'Stimulus' : 'Soal'}
            className="min-w-0 rounded-card bg-card p-5 shadow-card md:p-6 lg:max-h-[calc(100dvh-14rem)] lg:overflow-y-auto"
          >
            {hasStimulus ? (
              <>
                <p className="mb-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Bacaan
                </p>
                <HtmlContent html={q.text} />
                {q.text_image && (
                  <img
                    src={q.text_image}
                    alt="Gambar stimulus"
                    className="mt-3 max-h-96 rounded-lg"
                  />
                )}
              </>
            ) : (
              questionBlock
            )}
          </section>
          <section
            aria-label="Jawaban"
            className="min-w-0 rounded-card bg-card p-5 shadow-card md:p-6"
          >
            {hasStimulus && <div className="mb-5">{questionBlock}</div>}
            <QuestionAnswerArea key={q.id} q={q} index={nomor - 1} />
          </section>
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto grid max-w-[1600px] grid-cols-3 items-center gap-2 px-4 py-3 sm:px-6">
          <div>
            {nomor > 1 && (
              <Button variant="outline" onClick={() => goTo(nomor - 1)}>
                <Iconify icon="solar:arrow-left-linear" size={18} />
                <span className="hidden sm:inline">Soal sebelumnya</span>
              </Button>
            )}
          </div>
          <div className="flex justify-center">
            <Button
              variant="outline"
              onClick={toggleDoubt}
              aria-pressed={Boolean(entry?.isDoubt)}
              className={cn(
                'border-warning/50 text-warning hover:bg-warning/10 hover:text-warning',
                entry?.isDoubt && 'bg-warning text-white hover:bg-warning/90 hover:text-white'
              )}
            >
              <Iconify icon="solar:flag-linear" size={18} />
              Ragu-ragu
            </Button>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => goTo(nomor + 1)}>
              <span className="hidden sm:inline">
                {nomor >= total ? 'Selesaikan tryout' : 'Soal berikutnya'}
              </span>
              <Iconify
                icon={nomor >= total ? 'solar:flag-2-linear' : 'solar:arrow-right-linear'}
                size={18}
              />
            </Button>
          </div>
        </div>
      </footer>

      <ConfirmDialog
        open={exitOpen}
        onOpenChange={setExitOpen}
        tone="danger"
        icon="solar:logout-2-linear"
        title="Keluar dari tryout?"
        description="Jika keluar sekarang, sistem akan mengirim jawaban Anda dan sesi tryout tidak dapat diulang."
        cancelLabel="Kembali mengerjakan"
        confirmLabel="Kumpulkan & keluar"
        loading={submit.isPending}
        onConfirm={() => submit.mutate()}
      />
    </>
  );
}
