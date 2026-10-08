'use client';

import type { AnswerValue, ExamQuestion } from 'src/models/exam';

import { useMemo, useCallback } from 'react';

import { cn } from 'src/lib/utils';

import { useExamAnswerStore } from 'src/state/exam-store';

import { Iconify } from 'src/components/iconify/iconify';
import { HtmlContent } from 'src/components/data-display/html-content';

import { isFilled } from '../helpers/exam';

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

/** Penanda pilihan: lingkaran (pilihan tunggal) atau kotak centang (pilihan jamak). */
function Mark({ selected, multi }: { selected: boolean; multi?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-5 shrink-0 place-items-center border-[1.5px] transition-colors',
        multi ? 'rounded-[5px]' : 'rounded-full',
        selected
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-foreground/45 bg-card group-hover/choice:border-primary'
      )}
    >
      {selected &&
        (multi ? (
          <Iconify icon="solar:check-read-linear" size={14} />
        ) : (
          <span className="size-2 rounded-full bg-primary-foreground" />
        ))}
    </span>
  );
}

function ChoiceRow({
  selected,
  html,
  onSelect,
  multi,
}: {
  selected: boolean;
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
        'group/choice flex w-full items-center gap-4 rounded-lg border-[1.5px] border-border bg-card px-4 py-3.5 text-left transition-colors hover:border-primary hover:bg-primary/[0.06] focus-visible:ring-4 focus-visible:ring-primary/35 focus-visible:outline-none',
        selected && 'border-primary bg-primary/12 hover:bg-primary/12'
      )}
    >
      <Mark selected={selected} multi={multi} />
      <HtmlContent html={html} className="flex-1" />
    </button>
  );
}

/** Petunjuk cara menjawab di atas pilihan. */
function Hint({ children }: { children: string }) {
  return (
    <p className="mb-3 flex items-center gap-1.5 text-[0.85em] font-semibold text-muted-foreground">
      <Iconify icon="solar:info-circle-linear" size={16} />
      {children}
    </p>
  );
}

/** 1 · Pilihan ganda — ["<optionId>"] */
export function MultipleChoice({ q, index }: { q: ExamQuestion; index: number }) {
  const { answer, set } = useAnswer(q, index);
  const chosen = String((answer as string[])[0] ?? '');
  return (
    <div role="radiogroup" aria-label="Pilihan jawaban" className="space-y-3">
      {q.options.map((o) => (
        <ChoiceRow
          key={o.id}
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
    <div>
      <Hint>Pilih semua jawaban yang benar.</Hint>
      <div className="space-y-3">
        {q.options.map((o) => (
          <ChoiceRow
            key={o.id}
            multi
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
    </div>
  );
}

/** 3 · Benar/Salah — ["<optionId>"] */
export function TrueFalse({ q, index }: { q: ExamQuestion; index: number }) {
  const { answer, set } = useAnswer(q, index);
  const chosen = String((answer as string[])[0] ?? '');
  return (
    <div role="radiogroup" aria-label="Benar atau salah" className="space-y-3">
      {q.options.map((o) => (
        <ChoiceRow
          key={o.id}
          html={o.option_text}
          selected={chosen === String(o.id)}
          onSelect={() => set([String(o.id)])}
        />
      ))}
    </div>
  );
}

/** 9 · Benar/Salah Kompleks (tabel) — [[pernyataanId, 1 (Benar) | 0 (Salah) | null], ...] */
export function TrueFalseComplex({ q, index }: { q: ExamQuestion; index: number }) {
  const { answer, set } = useAnswer(q, index);
  const statements = useMemo(() => [...q.options].sort((a, b) => a.order - b.order), [q.options]);
  const rows = answer as [number, number | null][];
  const valueOf = (sid: number) => {
    const v = rows.find((r) => Number(r[0]) === sid)?.[1];
    return v === null || v === undefined ? null : Number(v);
  };

  const choose = (sid: number, value: 0 | 1) => {
    const next = statements.map(
      (s) => [s.id, s.id === sid ? value : valueOf(s.id)] as [number, number | null]
    );
    set(
      next,
      next.every(([, v]) => v !== null)
    );
  };

  return (
    <div>
      <Hint>Tentukan Benar atau Salah untuk setiap pernyataan.</Hint>
      <div className="overflow-x-auto rounded-lg border-[1.5px] border-border">
        <table className="w-full text-[0.95em]">
          <thead className="bg-primary/15 text-left font-bold">
            <tr>
              <th scope="col" className="w-12 px-3 py-3 text-center">
                No
              </th>
              <th scope="col" className="px-3 py-3">
                Pernyataan
              </th>
              <th scope="col" className="w-20 px-3 py-3 text-center">
                Benar
              </th>
              <th scope="col" className="w-20 px-3 py-3 text-center">
                Salah
              </th>
            </tr>
          </thead>
          <tbody>
            {statements.map((s, i) => {
              const value = valueOf(s.id);
              return (
                <tr
                  key={s.id}
                  className={cn('border-t border-border', value !== null && 'bg-primary/5')}
                >
                  <td className="px-3 py-3.5 text-center align-top font-semibold">{i + 1}</td>
                  <td className="px-3 py-3.5">
                    <HtmlContent html={s.option_text} />
                  </td>
                  {([1, 0] as const).map((v) => (
                    <td key={v} className="px-3 py-3.5 text-center">
                      <button
                        type="button"
                        role="radio"
                        aria-checked={value === v}
                        aria-label={`Pernyataan ${i + 1}: ${v === 1 ? 'Benar' : 'Salah'}`}
                        onClick={() => choose(s.id, v)}
                        className="group/choice inline-grid size-9 place-items-center rounded-full transition-colors hover:bg-primary/12 focus-visible:ring-4 focus-visible:ring-primary/35 focus-visible:outline-none"
                      >
                        <Mark selected={value === v} />
                      </button>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
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
    case 9:
      return <TrueFalseComplex q={q} index={index} />;
    default:
      return <p className="text-sm text-muted-foreground">Tipe soal belum didukung.</p>;
  }
}
