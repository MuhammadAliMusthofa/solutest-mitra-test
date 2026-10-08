'use client';

import type { ExplanationQuestion } from 'src/models/exam';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';
import { HtmlContent } from 'src/components/data-display/html-content';

const optionClass = (o: { is_true: boolean; selected: boolean }) =>
  cn(
    'flex items-start justify-between gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-border',
    o.is_true && 'bg-success/8 ring-success/40',
    o.selected && !o.is_true && 'bg-destructive/8 ring-destructive/40'
  );

const tfLabel = (v: number | null | undefined) =>
  v === null || v === undefined ? '—' : Number(v) === 1 ? 'Benar' : 'Salah';

/** Jawaban siswa vs kunci per tipe soal (pembahasan siswa & detail pengerjaan admin/guru). */
export function ReviewAnswer({ q, mine = 'Jawabanmu' }: { q: ExplanationQuestion; mine?: string }) {
  if (q.type_question_id === 9) {
    const rows = q.answer as [number, number | null][];
    return (
      <div className="overflow-x-auto rounded-lg ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-primary/[0.035] text-left text-xs font-semibold text-foreground">
            <tr>
              <th scope="col" className="px-3 py-2">
                Pernyataan
              </th>
              <th scope="col" className="w-28 px-3 py-2 text-center">
                {mine}
              </th>
              <th scope="col" className="w-24 px-3 py-2 text-center">
                Kunci
              </th>
            </tr>
          </thead>
          <tbody>
            {[...q.options]
              .sort((a, b) => a.order - b.order)
              .map((o) => {
                const chosen = rows.find((r) => Number(r[0]) === o.id)?.[1];
                const answered = chosen !== null && chosen !== undefined;
                const ok = answered && Number(chosen) === (o.is_true ? 1 : 0);
                return (
                  <tr key={o.id} className="border-t border-border">
                    <td className="px-3 py-2">
                      <HtmlContent html={o.option_text} />
                    </td>
                    <td
                      className={cn(
                        'px-3 py-2 text-center font-semibold',
                        answered && (ok ? 'text-success' : 'text-destructive'),
                        !answered && 'text-muted-foreground'
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {answered && (
                          <Iconify
                            icon={ok ? 'solar:check-circle-linear' : 'solar:close-circle-linear'}
                            size={16}
                          />
                        )}
                        {tfLabel(chosen)}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center font-semibold text-success">
                      {o.is_true ? 'Benar' : 'Salah'}
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <ul className="space-y-1.5">
      {q.options.map((o, i) => (
        <li key={o.id} className={optionClass(o)}>
          <span className="flex gap-2">
            <span className="font-semibold">
              {q.type_question_id === 3 ? '' : `${'ABCDEFGHIJ'[i]}.`}
            </span>
            <HtmlContent html={o.option_text} as="span" />
          </span>
          <span className="shrink-0 text-xs font-semibold">
            {o.is_true && <span className="text-success">Kunci</span>}
            {o.selected && (
              <span className={o.is_true ? 'text-success' : 'text-destructive'}>
                {o.is_true ? ' · ' : ''}
                {mine}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}
