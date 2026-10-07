'use client';

import type { ExamSession } from 'src/models/exam';

import { cn } from 'src/lib/utils';

import { useExamAnswerStore } from 'src/state/exam-store';

import { sectionRanges } from '../helpers/exam';

interface Props {
  session: ExamSession;
  current?: number;
  onPick: (nomor: number) => void;
}

const LEGEND = [
  { label: 'Sudah dijawab', className: 'bg-primary text-primary-foreground' },
  { label: 'Ragu-ragu', className: 'bg-warning text-white' },
  { label: 'Belum dijawab', className: 'bg-card ring-1 ring-border' },
];

/** Grid nomor soal per mapel; status ditandai warna + legenda teks. */
export function NumberGrid({ session, current, onPick }: Props) {
  const answers = useExamAnswerStore((s) => s.answers);
  const byId = new Map(answers.map((a) => [a.id, a]));

  return (
    <div className="space-y-5">
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
        {LEGEND.map((l) => (
          <li key={l.label} className="flex items-center gap-1.5">
            <span className={cn('size-3.5 rounded', l.className)} />
            {l.label}
          </li>
        ))}
      </ul>
      {sectionRanges(session).map((s) => (
        <section key={s.subject_id}>
          {session.sections.length > 1 && (
            <h3 className="mb-2 text-sm font-semibold">{s.subject_name}</h3>
          )}
          <div className="grid grid-cols-[repeat(auto-fill,minmax(2.75rem,1fr))] gap-2">
            {s.questions.map((q, i) => {
              const nomor = s.startNumber + i;
              const a = byId.get(q.id);
              const state = a?.isDoubt ? 'doubt' : a?.isCompleted ? 'done' : 'empty';
              return (
                <button
                  key={q.id}
                  type="button"
                  onClick={() => onPick(nomor)}
                  aria-current={current === nomor ? 'step' : undefined}
                  aria-label={`Soal ${nomor}, ${state === 'done' ? 'sudah dijawab' : state === 'doubt' ? 'ragu-ragu' : 'belum dijawab'}`}
                  className={cn(
                    'grid h-11 place-items-center rounded-lg text-sm font-semibold tabular-nums transition-transform hover:scale-105 motion-reduce:hover:scale-100',
                    state === 'done' && 'bg-primary text-primary-foreground',
                    state === 'doubt' && 'bg-warning text-white',
                    state === 'empty' && 'bg-card ring-1 ring-border',
                    current === nomor && 'ring-3 ring-foreground/70 ring-offset-2'
                  )}
                >
                  {nomor}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
