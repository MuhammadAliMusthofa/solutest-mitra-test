'use client';

/* eslint-disable @next/next/no-img-element -- lampiran soal dari storage eksternal / data URL */

import type { Question } from 'src/models/question';

import Link from 'next/link';

import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { Tooltip, TooltipContent, TooltipTrigger } from 'src/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from 'src/components/ui/collapsible';

import { cn } from 'src/lib/utils';

import { questionTypeName } from 'src/models/question';

import { Iconify } from 'src/components/iconify/iconify';
import { StatusPill } from 'src/components/data-display/status-pill';
import { HtmlContent } from 'src/components/data-display/html-content';

const LETTERS = 'ABCDEFGHIJ';

/** Kunci jawaban ringkas per tipe soal. */
function AnswerKey({ q }: { q: Question }) {
  if (q.type_question_id === 9) {
    return (
      <div className="overflow-x-auto rounded-xl ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-primary/[0.035] text-left text-xs font-semibold text-foreground">
            <tr>
              <th scope="col" className="w-10 px-3 py-2">
                No
              </th>
              <th scope="col" className="px-3 py-2">
                Pernyataan
              </th>
              <th scope="col" className="w-24 px-3 py-2 text-center">
                Kunci
              </th>
            </tr>
          </thead>
          <tbody>
            {[...q.options]
              .sort((a, b) => a.order - b.order)
              .map((o, i) => (
                <tr key={o.id} className="border-t border-border">
                  <td className="px-3 py-2 font-semibold">{i + 1}</td>
                  <td className="px-3 py-2">
                    <HtmlContent html={o.option_text} />
                  </td>
                  <td className="px-3 py-2 text-center">
                    <StatusPill
                      tone={o.is_true ? 'success' : 'danger'}
                      icon={o.is_true ? 'solar:check-circle-linear' : 'solar:close-circle-linear'}
                    >
                      {o.is_true ? 'Benar' : 'Salah'}
                    </StatusPill>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    );
  }
  return (
    <ul className="grid gap-1.5 sm:grid-cols-2">
      {q.options.map((o, i) => (
        <li
          key={o.id}
          className={cn(
            'flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm ring-1 ring-border',
            o.is_true && 'bg-success/8 ring-success/35'
          )}
        >
          {q.type_question_id !== 3 && (
            <span
              className={cn(
                'grid size-7 shrink-0 place-items-center rounded-lg text-xs font-bold',
                o.is_true ? 'bg-success text-white' : 'bg-muted text-foreground/70'
              )}
            >
              {LETTERS[i]}
            </span>
          )}
          <HtmlContent html={o.option_text} as="span" className="flex-1" />
          {o.is_true && (
            <Iconify
              icon="solar:check-circle-bold"
              size={18}
              className="text-success"
              aria-label="Jawaban benar"
            />
          )}
        </li>
      ))}
    </ul>
  );
}

export function QuestionCard({
  q,
  no,
  editHref,
  onDelete,
  selected,
  onSelectedChange,
  locked = false,
}: {
  q: Question;
  no: number;
  editHref: string;
  onDelete: () => void;
  /** dipilih untuk hapus massal */
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
  /** paket sudah dikerjakan siswa → soal hanya bisa dilihat */
  locked?: boolean;
}) {
  return (
    <article
      className={cn(
        'overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-[box-shadow,background-color] duration-150 hover:shadow-card-hover',
        selected && 'bg-primary/[0.03] ring-2 ring-primary/60'
      )}
    >
      <header className="flex flex-wrap items-center gap-2.5 border-b border-border bg-muted/40 px-4 py-2.5 md:px-5">
        {!locked && (
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelectedChange(Boolean(v))}
            aria-label={`Pilih soal ${no}`}
            className="mr-1"
          />
        )}
        <span className="grid size-8 place-items-center rounded-xl bg-primary text-sm font-bold text-primary-foreground tabular-nums">
          {no}
        </span>
        <StatusPill tone="secondary">{questionTypeName(q.type_question_id)}</StatusPill>
        {q.source_question_id && (
          <StatusPill tone="neutral" icon="solar:import-linear">
            Solutest
          </StatusPill>
        )}
        <div className={cn('ml-auto flex gap-1', locked && 'hidden')}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon-sm" asChild>
                <Link href={editHref} aria-label={`Ubah soal ${no}`}>
                  <Iconify icon="solar:pen-linear" size={17} />
                </Link>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Ubah soal</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={onDelete}
                aria-label={`Hapus soal ${no}`}
                className="hover:bg-destructive/10 hover:text-destructive"
              >
                <Iconify icon="solar:trash-bin-trash-linear" size={17} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hapus dari paket</TooltipContent>
          </Tooltip>
        </div>
      </header>

      <div className="p-4 md:p-5">
        {q.competency_name && (
          <div className="mb-3 flex flex-wrap gap-1.5 text-xs">
            <span className="inline-flex items-center gap-1 rounded-full bg-info/10 px-2.5 py-1 font-semibold text-info">
              <Iconify icon="solar:target-linear" size={13} />
              {q.competency_name}
            </span>
            {q.sub_competency_name && (
              <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-1 font-medium text-foreground/75">
                {q.sub_competency_name}
              </span>
            )}
          </div>
        )}
        {q.text && (
          <div className="mb-3 rounded-xl bg-secondary/8 p-3.5 text-sm">
            <p className="mb-1.5 inline-flex items-center gap-1 text-xs font-bold text-secondary-ink">
              <Iconify icon="solar:book-2-linear" size={13} />
              Bacaan
            </p>
            <HtmlContent html={q.text} />
          </div>
        )}
        <HtmlContent html={q.question_text} className="text-[0.95rem]" />
        {q.attachments
          .filter((a) => a.type === 'image')
          .map((a) => (
            <img
              key={a.path}
              src={a.path}
              alt="Lampiran soal"
              className="mt-2 max-h-56 rounded-lg ring-1 ring-border"
            />
          ))}
        <div className="mt-4">
          <AnswerKey q={q} />
        </div>
        {q.description && (
          <Collapsible className="mt-4">
            <CollapsibleTrigger className="group inline-flex items-center gap-1.5 rounded-full bg-primary/8 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-primary/15">
              <Iconify icon="solar:lightbulb-minimalistic-linear" size={14} />
              Pembahasan
              <Iconify
                icon="solar:alt-arrow-down-linear"
                size={16}
                className="transition-transform group-data-[state=open]:rotate-180"
              />
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2 rounded-xl bg-primary/[0.04] p-3.5 text-sm">
              <HtmlContent html={q.description} />
            </CollapsibleContent>
          </Collapsible>
        )}
      </div>
    </article>
  );
}
