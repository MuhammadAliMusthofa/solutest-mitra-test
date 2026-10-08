'use client';

/* eslint-disable @next/next/no-img-element -- lampiran soal dari storage eksternal / data URL */

import { useParams } from 'next/navigation';
import { useState, useEffect, useEffectEvent } from 'react';

import { Button } from 'src/components/ui/button';
import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetContent,
  SheetDescription,
} from 'src/components/ui/sheet';

import { cn } from 'src/lib/utils';

import { FONT_SCALES, useExamUiStore } from 'src/state/exam-ui-store';
import { useExamAnswerStore, useExamSessionStore } from 'src/state/exam-store';

import { Iconify } from 'src/components/iconify/iconify';
import { ConfirmDialog } from 'src/components/feedback/confirm-dialog';
import { HtmlContent } from 'src/components/data-display/html-content';

import { useSubmitExam } from '../hooks/use-exam-actions';
import { useQuestionTimer } from '../hooks/use-exam-timers';
import { useExamNavigation } from '../hooks/use-exam-navigation';
import { decodeNumber, flattenQuestions } from '../helpers/exam';
import { QuestionAnswerArea } from '../components/question-types';
import { NumberGrid, useNumberState, numberTileClass } from '../components/number-grid';

const PAGE_SIZE = 10;

/** Baris atas: "Soal: n / total", nomor berhalaman (10 per halaman), ukuran huruf. */
function QuestionBar({
  nomor,
  total,
  ids,
  onPick,
  onOpenList,
}: {
  nomor: number;
  total: number;
  ids: number[];
  onPick: (n: number) => void;
  onOpenList: () => void;
}) {
  const stateOf = useNumberState();
  const fontScale = useExamUiStore((s) => s.fontScale);
  const setFontScale = useExamUiStore((s) => s.setFontScale);
  const scaleIndex = FONT_SCALES.indexOf(fontScale as (typeof FONT_SCALES)[number]);
  const block = Math.floor((nomor - 1) / PAGE_SIZE);
  const start = block * PAGE_SIZE + 1;
  const end = Math.min(total, start + PAGE_SIZE - 1);
  const arrow =
    'grid size-10 shrink-0 place-items-center rounded-lg border-[1.5px] border-primary text-primary transition-colors hover:bg-primary/15';

  return (
    <div className="flex flex-col gap-3 lg:flex-row">
      <div className="flex min-w-0 flex-1 items-center gap-4 rounded-2xl bg-card px-5 py-3.5 ring-1 ring-border md:px-7">
        <p className="shrink-0 text-lg font-bold tabular-nums md:text-xl">
          Soal: {nomor} / {total}
        </p>
        <div
          className="ml-auto hidden items-center gap-0.5 rounded-lg bg-muted p-0.5 md:flex"
          role="group"
          aria-label="Ukuran huruf soal"
        >
          <button
            type="button"
            aria-label="Perkecil huruf"
            disabled={scaleIndex <= 0}
            onClick={() => setFontScale(FONT_SCALES[Math.max(0, scaleIndex - 1)])}
            className="grid size-8 place-items-center rounded-md text-xs font-bold text-foreground/70 hover:bg-card disabled:opacity-35"
          >
            A
          </button>
          <button
            type="button"
            aria-label="Perbesar huruf"
            disabled={scaleIndex >= FONT_SCALES.length - 1}
            onClick={() =>
              setFontScale(FONT_SCALES[Math.min(FONT_SCALES.length - 1, scaleIndex + 1)])
            }
            className="grid size-8 place-items-center rounded-md text-base font-bold text-foreground/70 hover:bg-card disabled:opacity-35"
          >
            A
          </button>
        </div>
        <nav
          aria-label="Nomor soal"
          className="ml-auto no-scrollbar flex items-center gap-2 overflow-x-auto p-1 md:ml-0"
        >
          {start > 1 && (
            <button
              type="button"
              aria-label="Nomor sebelumnya"
              onClick={() => onPick(start - 1)}
              className={arrow}
            >
              <Iconify icon="solar:alt-arrow-left-linear" size={18} />
            </button>
          )}
          {Array.from({ length: end - start + 1 }, (_, i) => start + i).map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => onPick(n)}
              aria-current={n === nomor ? 'step' : undefined}
              aria-label={`Soal ${n}`}
              className={numberTileClass(stateOf(ids[n - 1]), n === nomor)}
            >
              {n}
            </button>
          ))}
          {end < total && (
            <button
              type="button"
              aria-label="Nomor berikutnya"
              onClick={() => onPick(end + 1)}
              className={arrow}
            >
              <Iconify icon="solar:alt-arrow-right-linear" size={18} />
            </button>
          )}
        </nav>
      </div>
      <button
        type="button"
        onClick={onOpenList}
        className="flex items-center justify-center gap-3 rounded-2xl bg-card px-8 py-3.5 text-base font-bold ring-1 ring-border transition-colors hover:bg-primary/10 hover:ring-primary lg:w-72"
      >
        <Iconify icon="solar:widget-4-linear" size={22} />
        Daftar Soal
      </button>
    </div>
  );
}

/**
 * Halaman satu soal (gaya Solutest). Dengan stimulus: bacaan krem di kiri (scroll sendiri),
 * soal + pilihan di kanan. Tanpa stimulus: satu kartu soal. Footer tetap: sebelumnya / ragu / berikutnya.
 */
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
  const [listOpen, setListOpen] = useState(false);
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
      <div className="mx-auto mt-16 grid max-w-sm place-items-center rounded-2xl bg-card px-6 py-12 text-center ring-1 ring-border">
        <Iconify icon="solar:question-square-linear" size={40} className="text-primary" />
        <p className="mt-3 font-bold">Nomor soal tidak ditemukan</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Tautan soal ini tidak sesuai dengan sesi tryout Anda.
        </p>
        <Button variant="dark" className="mt-5 rounded-lg" onClick={() => goTo(1)}>
          Ke soal nomor 1
        </Button>
      </div>
    );
  }

  const hasStimulus = Boolean(q.text || q.text_image);
  const images = q.attachments.filter((a) => a.type === 'image');
  const audio = q.attachments.find((a) => a.type === 'audio');
  const isLast = nomor >= total;
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
  const pick = (n: number) => {
    setListOpen(false);
    goTo(n);
  };

  const questionCard = (
    <section
      aria-label="Soal dan jawaban"
      className="min-w-0 rounded-2xl bg-card p-5 ring-1 ring-border md:p-8"
    >
      <HtmlContent html={q.question_text} className="leading-relaxed" />
      {images.map((a) => (
        <img
          key={a.path}
          src={a.path}
          alt={`Gambar soal nomor ${nomor}`}
          className="mt-4 max-h-80 rounded-xl ring-1 ring-border"
        />
      ))}
      {audio && <audio controls src={audio.path} className="mt-4 w-full" />}
      <div className="mt-6">
        <QuestionAnswerArea key={q.id} q={q} index={nomor - 1} />
      </div>
    </section>
  );

  return (
    <>
      <div className="mx-auto max-w-[1440px] px-4 pt-5 pb-32 sm:px-8">
        <QuestionBar
          nomor={nomor}
          total={total}
          ids={questions.map((x) => x.id)}
          onPick={goTo}
          onOpenList={() => setListOpen(true)}
        />

        {entry?.isDoubt && (
          <p className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-warning/12 px-3 py-1.5 text-sm font-semibold text-warning">
            <Iconify icon="solar:flag-bold" size={16} />
            Soal ini ditandai ragu-ragu
          </p>
        )}

        <div className="mt-6" style={{ fontSize: `${fontScale}rem` }}>
          {hasStimulus ? (
            <div className="grid items-start gap-5 lg:grid-cols-2">
              <section aria-label="Stimulus" className="min-w-0">
                <p className="mb-2 text-[0.95em] font-bold">Stimulus :</p>
                <div className="rounded-xl bg-[color-mix(in_srgb,var(--primary)_7%,var(--card))] px-5 py-4 ring-1 ring-primary/15 md:px-8 md:py-6 lg:max-h-[calc(100dvh-19rem)] lg:overflow-y-auto">
                  <HtmlContent html={q.text} className="leading-[1.85] lg:text-justify" />
                  {q.text_image && (
                    <img
                      src={q.text_image}
                      alt="Gambar stimulus"
                      className="mx-auto mt-4 max-h-96 rounded-lg"
                    />
                  )}
                </div>
              </section>
              <div className="lg:pt-7">{questionCard}</div>
            </div>
          ) : (
            questionCard
          )}
        </div>
      </div>

      <footer className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-4 py-3.5 sm:px-8">
          <Button
            variant="outline"
            onClick={() => goTo(nomor - 1)}
            disabled={nomor <= 1}
            aria-label="Soal sebelumnya"
            className="rounded-lg border-foreground/30 hover:border-foreground hover:bg-muted hover:text-foreground"
          >
            <Iconify icon="solar:arrow-left-linear" size={18} />
            <span className="hidden sm:inline">Soal Sebelumnya</span>
          </Button>
          <Button
            variant="outline"
            onClick={toggleDoubt}
            aria-pressed={Boolean(entry?.isDoubt)}
            className={cn(
              'mx-auto rounded-lg border-warning/50 text-warning hover:border-warning hover:bg-warning/10 hover:text-warning',
              entry?.isDoubt &&
                'border-warning bg-warning text-white hover:bg-[color-mix(in_oklab,var(--warning),black_10%)] hover:text-white'
            )}
          >
            <Iconify icon={entry?.isDoubt ? 'solar:flag-bold' : 'solar:flag-linear'} size={18} />
            Ragu-ragu
          </Button>
          <Button
            variant="dark"
            onClick={() => goTo(nomor + 1)}
            className="rounded-lg"
            aria-label={isLast ? 'Selesai, periksa jawaban' : 'Soal berikutnya'}
          >
            <span className="hidden sm:inline">{isLast ? 'Selesai' : 'Soal Berikutnya'}</span>
            <Iconify icon={isLast ? 'solar:flag-2-linear' : 'solar:arrow-right-linear'} size={18} />
          </Button>
        </div>
      </footer>

      <Sheet open={listOpen} onOpenChange={setListOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Daftar Soal</SheetTitle>
            <SheetDescription>
              Pilih nomor untuk berpindah soal. Jawaban tersimpan otomatis.
            </SheetDescription>
          </SheetHeader>
          <div className="px-5 pb-6">
            <NumberGrid session={session} current={nomor} onPick={pick} />
            <Button
              variant="dark"
              className="mt-6 w-full rounded-lg"
              onClick={() => pick(total + 1)}
            >
              <Iconify icon="solar:clipboard-check-linear" size={18} />
              Selesai & periksa jawaban
            </Button>
          </div>
        </SheetContent>
      </Sheet>

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
