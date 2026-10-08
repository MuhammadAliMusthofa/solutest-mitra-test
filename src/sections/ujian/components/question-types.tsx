'use client';

import type { AnswerValue, ExamQuestion } from 'src/models/exam';

import { useMemo, useCallback } from 'react';

import { cn } from 'src/lib/utils';

import { useExamAnswerStore } from 'src/state/exam-store';

import { Iconify } from 'src/components/iconify/iconify';
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
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Tentukan Benar atau Salah untuk setiap pernyataan.
      </p>
      <div className="overflow-x-auto rounded-xl ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs font-semibold text-muted-foreground uppercase">
            <tr>
              <th scope="col" className="w-10 px-3 py-2.5">
                No
              </th>
              <th scope="col" className="px-3 py-2.5">
                Pernyataan
              </th>
              <th scope="col" className="w-20 px-3 py-2.5 text-center">
                Benar
              </th>
              <th scope="col" className="w-20 px-3 py-2.5 text-center">
                Salah
              </th>
            </tr>
          </thead>
          <tbody>
            {statements.map((s, i) => {
              const value = valueOf(s.id);
              return (
                <tr key={s.id} className="border-t border-border">
                  <td className="px-3 py-3 align-top font-semibold">{i + 1}</td>
                  <td className="px-3 py-3">
                    <HtmlContent html={s.option_text} />
                  </td>
                  {([1, 0] as const).map((v) => {
                    const selected = value === v;
                    return (
                      <td key={v} className="px-3 py-3 text-center">
                        <button
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          aria-label={`Pernyataan ${i + 1}: ${v === 1 ? 'Benar' : 'Salah'}`}
                          onClick={() => choose(s.id, v)}
                          className={cn(
                            'inline-grid size-9 place-items-center rounded-full ring-1 ring-border transition-colors hover:bg-primary/4 hover:ring-primary/40 focus-visible:ring-3 focus-visible:ring-primary/30 focus-visible:outline-none',
                            selected &&
                              'bg-primary text-primary-foreground ring-primary hover:bg-primary'
                          )}
                        >
                          {selected && (
                            <Iconify
                              icon={
                                v === 1 ? 'solar:check-read-linear' : 'solar:close-circle-linear'
                              }
                              size={18}
                            />
                          )}
                        </button>
                      </td>
                    );
                  })}
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
