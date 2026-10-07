'use client';

import type { AnswerValue, ExamQuestion } from 'src/models/exam';

import { useMemo, useCallback } from 'react';

import { Input } from 'src/components/ui/input';
import { Textarea } from 'src/components/ui/textarea';

import { cn } from 'src/lib/utils';

import { useExamAnswerStore } from 'src/state/exam-store';

import { Iconify } from 'src/components/iconify/iconify';
import { SelectField } from 'src/components/form/select-field';
import { HtmlContent } from 'src/components/data-display/html-content';

import { isFilled } from '../helpers/exam';

const LETTERS = 'ABCDEFGHIJ';

/** Baca & tulis jawaban satu soal di store (upsert, pertahankan ragu-ragu & durasi). */
function useAnswer(q: ExamQuestion, index: number) {
  const entry = useExamAnswerStore((s) => s.answers.find((a) => a.id === q.id));
  const setAnswer = useExamAnswerStore((s) => s.setAnswer);
  const set = useCallback(
    (answer: AnswerValue, isCompleted = isFilled(answer)) =>
      setAnswer({
        id: q.id,
        type: q.type_question_id,
        answer,
        isCompleted,
        isDoubt: entry?.isDoubt ?? false,
        duration_seconds: entry?.duration_seconds ?? 0,
        index,
      }),
    [entry?.duration_seconds, entry?.isDoubt, index, q.id, q.type_question_id, setAnswer]
  );
  return { answer: (entry?.answer ?? []) as AnswerValue, set };
}

function ChoiceCard({
  selected,
  label,
  html,
  onSelect,
  multi,
}: {
  selected: boolean;
  label: string;
  html: string;
  onSelect: () => void;
  multi?: boolean;
}) {
  return (
    <button
      type="button"
      role={multi ? 'checkbox' : 'radio'}
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        'flex w-full items-start gap-3 rounded-xl px-4 py-3 text-left ring-1 ring-border transition-colors hover:bg-primary/4 hover:ring-primary/40 focus-visible:ring-3 focus-visible:ring-primary/30 focus-visible:outline-none',
        selected && 'bg-primary/8 ring-2 ring-primary hover:bg-primary/8'
      )}
    >
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center text-sm font-semibold ring-1 ring-border',
          multi ? 'rounded-md' : 'rounded-full',
          selected && 'bg-primary text-primary-foreground ring-primary'
        )}
      >
        {multi && selected ? <Iconify icon="solar:check-read-linear" size={16} /> : label}
      </span>
      <HtmlContent html={html} className="flex-1 pt-1" />
    </button>
  );
}

/** 1 · Pilihan ganda — ["<optionId>"] */
export function MultipleChoice({ q, index }: { q: ExamQuestion; index: number }) {
  const { answer, set } = useAnswer(q, index);
  const chosen = String((answer as string[])[0] ?? '');
  return (
    <div role="radiogroup" aria-label="Pilihan jawaban" className="space-y-2.5">
      {q.options.map((o, i) => (
        <ChoiceCard
          key={o.id}
          label={LETTERS[i]}
          html={o.option_text}
          selected={chosen === String(o.id)}
          onSelect={() => set([String(o.id)])}
        />
      ))}
    </div>
  );
}

/** 2 · Pilihan ganda kompleks — ["<optionId>", ...] */
export function MultipleChoiceComplex({ q, index }: { q: ExamQuestion; index: number }) {
  const { answer, set } = useAnswer(q, index);
  const chosen = new Set((answer as string[]).map(String));
  return (
    <div className="space-y-2.5">
      <p className="text-sm text-muted-foreground">Pilih semua jawaban yang benar.</p>
      {q.options.map((o, i) => (
        <ChoiceCard
          key={o.id}
          multi
          label={LETTERS[i]}
          html={o.option_text}
          selected={chosen.has(String(o.id))}
          onSelect={() => {
            const next = new Set(chosen);
            if (next.has(String(o.id))) next.delete(String(o.id));
            else next.add(String(o.id));
            set(q.options.map((x) => String(x.id)).filter((id) => next.has(id)));
          }}
        />
      ))}
    </div>
  );
}

/** 3 · Benar/Salah — ["<optionId>"] */
export function TrueFalse({ q, index }: { q: ExamQuestion; index: number }) {
  const { answer, set } = useAnswer(q, index);
  const chosen = String((answer as string[])[0] ?? '');
  return (
    <div role="radiogroup" aria-label="Benar atau salah" className="grid gap-3 sm:grid-cols-2">
      {q.options.map((o) => {
        const selected = chosen === String(o.id);
        const isTrue = o.option_text.toLowerCase().includes('benar');
        return (
          <button
            key={o.id}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => set([String(o.id)])}
            className={cn(
              'flex items-center justify-center gap-2 rounded-xl px-4 py-4 font-semibold ring-1 ring-border transition-colors hover:ring-primary/40',
              selected && 'bg-primary/8 text-primary ring-2 ring-primary'
            )}
          >
            <Iconify
              icon={isTrue ? 'solar:check-circle-linear' : 'solar:close-circle-linear'}
              size={22}
            />
            <HtmlContent html={o.option_text} as="span" />
          </button>
        );
      })}
    </div>
  );
}

/** 4 · Menjodohkan — [[pernyataanId, jawabanId | null], ...] */
export function Matching({ q, index }: { q: ExamQuestion; index: number }) {
  const { answer, set } = useAnswer(q, index);
  const statements = useMemo(
    () => q.options.filter((o) => o.type === 'pernyataan').sort((a, b) => a.order - b.order),
    [q.options]
  );
  // urutan jawaban diacak deterministik per soal agar pasangan tidak sejajar
  const answers = useMemo(
    () =>
      q.options
        .filter((o) => o.type === 'jawaban')
        .map((o) => ({ o, k: (o.id * 2654435761) % 1000 }))
        .sort((a, b) => a.k - b.k)
        .map(({ o }) => o),
    [q.options]
  );
  const pairs = answer as [number, number | null][];
  const pairOf = (sid: number) => pairs.find((p) => Number(p[0]) === sid)?.[1] ?? null;

  const choose = (sid: number, aid: number | null) => {
    const next = statements.map((s) => {
      if (s.id === sid) return [s.id, aid] as [number, number | null];
      const current = pairOf(s.id);
      // satu jawaban hanya boleh dipakai sekali
      return [s.id, current !== null && current === aid ? null : current] as [
        number,
        number | null,
      ];
    });
    set(
      next,
      next.every(([, a]) => a !== null)
    );
  };

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Pasangkan setiap pernyataan dengan jawaban yang tepat.
      </p>
      {statements.map((s, i) => (
        <div
          key={s.id}
          className="grid items-center gap-2 rounded-xl p-3 ring-1 ring-border md:grid-cols-[1fr_auto_minmax(200px,1fr)]"
        >
          <div className="flex items-start gap-2">
            <span className="grid size-7 shrink-0 place-items-center rounded-md bg-muted text-xs font-semibold">
              {i + 1}
            </span>
            <HtmlContent html={s.option_text} className="pt-0.5" />
          </div>
          <Iconify
            icon="solar:arrow-right-linear"
            size={18}
            className="hidden text-muted-foreground md:block"
          />
          <SelectField
            aria-label={`Jawaban untuk pernyataan ${i + 1}`}
            value={pairOf(s.id) === null ? '' : String(pairOf(s.id))}
            onChange={(v) => choose(s.id, v ? Number(v) : null)}
            allLabel="— Pilih jawaban —"
            options={answers.map((a) => ({
              value: String(a.id),
              label: a.option_text.replace(/<[^>]+>/g, '').trim(),
            }))}
            className="sm:w-full"
          />
        </div>
      ))}
    </div>
  );
}

/** 5 · Isian singkat — ["teks kolom 1", ...] */
export function ShortAnswer({ q, index }: { q: ExamQuestion; index: number }) {
  const { answer, set } = useAnswer(q, index);
  const values = answer as string[];
  const columns = Math.max(1, q.column_answer);
  return (
    <div className="space-y-3">
      {Array.from({ length: columns }, (_, i) => (
        <label key={i} className="block space-y-1.5">
          <span className="text-sm font-medium">
            {columns > 1 ? `Jawaban ${i + 1}` : 'Jawaban'}
          </span>
          <Input
            value={values[i] ?? ''}
            onChange={(e) => {
              const next = Array.from({ length: columns }, (__, k) =>
                k === i ? e.target.value : (values[k] ?? '')
              );
              set(
                next,
                next.every((v) => v.trim() !== '')
              );
            }}
            placeholder="Ketik jawaban singkat"
            autoComplete="off"
            className="h-12"
          />
        </label>
      ))}
    </div>
  );
}

/** 6 · Esai — ["teks"] */
export function Essay({ q, index }: { q: ExamQuestion; index: number }) {
  const { answer, set } = useAnswer(q, index);
  const value = String((answer as string[])[0] ?? '');
  return (
    <label className="block space-y-1.5">
      <span className="text-sm font-medium">Jawaban esai</span>
      <Textarea
        value={value}
        onChange={(e) => set([e.target.value])}
        rows={10}
        placeholder="Tulis jawabanmu di sini…"
        className="min-h-48"
      />
      <span className="block text-right text-xs text-muted-foreground">
        {value.trim() ? value.trim().split(/\s+/).length : 0} kata
      </span>
    </label>
  );
}

export function QuestionAnswerArea({ q, index }: { q: ExamQuestion; index: number }) {
  switch (q.type_question_id) {
    case 1:
      return <MultipleChoice q={q} index={index} />;
    case 2:
      return <MultipleChoiceComplex q={q} index={index} />;
    case 3:
      return <TrueFalse q={q} index={index} />;
    case 4:
      return <Matching q={q} index={index} />;
    case 5:
      return <ShortAnswer q={q} index={index} />;
    case 6:
      return <Essay q={q} index={index} />;
    default:
      return <p className="text-sm text-muted-foreground">Tipe soal belum didukung.</p>;
  }
}
