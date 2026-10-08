'use client';

import type { ExamSession } from 'src/models/exam';

import { cn } from 'src/lib/utils';

import { useExamAnswerStore } from 'src/state/exam-store';

import { Iconify } from 'src/components/iconify/iconify';

import { sectionRanges } from '../helpers/exam';

export type NumberState = 'done' | 'doubt' | 'empty';

/** Kotak nomor soal: bergaris warna aksen; terisi bila dijawab, oranye bila ragu-ragu. */
export function numberTileClass(state: NumberState, current: boolean) {
  return cn(
    'relative grid h-10 min-w-10 place-items-center rounded-lg border-[1.5px] px-1 text-sm font-semibold tabular-nums transition-[background-color,box-shadow,transform] duration-150 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-primary/40 focus-visible:outline-none motion-reduce:hover:translate-y-0',
    state === 'done' && 'border-primary bg-primary text-primary-foreground',
    state === 'doubt' && 'border-warning bg-warning text-white',
    state === 'empty' && 'border-primary bg-card text-primary hover:bg-primary/12',
    current && 'ring-[2.5px] ring-foreground ring-offset-2 ring-offset-card'
  );
}

export const LEGEND = [
  { label: 'Dijawab', className: 'border-primary bg-primary' },
  { label: 'Ragu-ragu', className: 'border-warning bg-warning' },
  { label: 'Belum dijawab', className: 'border-primary bg-card' },
];

export function useNumberState() {
  const answers = useExamAnswerStore((s) => s.answers);
  const byId = new Map(answers.map((a) => [a.id, a]));
  return (id: number): NumberState => {
    const a = byId.get(id);
    return a?.isDoubt ? 'doubt' : a?.isCompleted ? 'done' : 'empty';
  };
}

const STATE_LABEL: Record<NumberState, string> = {
  done: 'sudah dijawab',
  doubt: 'ragu-ragu',
  empty: 'belum dijawab',
};

interface Props {
  session: ExamSession;
  current?: number;
  onPick: (nomor: number) => void;
  className?: string;
}

/** Grid nomor soal per mapel; status ditandai warna + ikon + legenda teks. */
export function NumberGrid({ session, current, onPick, className }: Props) {
  const stateOf = useNumberState();

  return (
    <div className={cn('space-y-5', className)}>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
        {LEGEND.map((l) => (
          <li key={l.label} className="flex items-center gap-1.5">
            <span className={cn('size-3.5 rounded border-[1.5px]', l.className)} />
            {l.label}
          </li>
        ))}
      </ul>
      {sectionRanges(session).map((s) => (
        <section key={s.subject_id}>
          {session.sections.length > 1 && (
            <h3 className="mb-2 text-sm font-bold">{s.subject_name}</h3>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2.5">
            {s.questions.map((q, i) => {
              const nomor = s.startNumber + i;
              const state = stateOf(q.id);
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onPick(nomor)}
                  aria-current={current === nomor ? 'step' : undefined}
                  aria-label={`Soal ${nomor}, ${STATE_LABEL[state]}`}
                  className={numberTileClass(state, current === nomor)}
                >
                  {nomor}
                  {state === 'doubt' && (
                    <Iconify
                      icon="solar:flag-bold"
                      size={10}
                      className="absolute top-0.5 right-0.5"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
