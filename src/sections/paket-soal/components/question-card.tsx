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
  if (q.type_question_id === 4) {
    return (
      <div className="overflow-x-auto rounded-lg ring-1 ring-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left text-xs font-semibold text-muted-foreground uppercase">
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
            'flex items-start gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-border',
            o.is_true && 'bg-success/8 ring-success/30'
          )}
        >
          <span className="font-semibold">{q.type_question_id === 3 ? '' : `${LETTERS[i]}.`}</span>
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
}: {
  q: Question;
  no: number;
  editHref: string;
  onDelete: () => void;
  /** dipilih untuk hapus massal */
  selected: boolean;
  onSelectedChange: (selected: boolean) => void;
}) {
  return (
    <article
      className={cn(
        'rounded-xl p-4 ring-1 ring-border transition-colors md:p-5',
        selected && 'bg-primary/4 ring-2 ring-primary/50'
      )}
    >
      <header className="flex flex-wrap items-center gap-2">
        <Checkbox
          checked={selected}
          onCheckedChange={(v) => onSelectedChange(Boolean(v))}
          aria-label={`Pilih soal ${no}`}
          className="mr-1"
        />
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
          {no}
        </span>
        <StatusPill tone="secondary">{questionTypeName(q.type_question_id)}</StatusPill>
        <span className="text-xs text-muted-foreground">
          {q.code} · {q.category_name}
        </span>
        <div className="ml-auto flex gap-1">
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
                className="hover:text-destructive"
              >
                <Iconify icon="solar:trash-bin-trash-linear" size={17} />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Hapus dari paket</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {q.competency_name && (
        <dl className="mt-3 grid gap-1 rounded-lg bg-muted/50 px-3 py-2 text-xs sm:grid-cols-[auto_1fr] sm:gap-x-3">
          <dt className="font-semibold text-muted-foreground">Kompetensi</dt>
          <dd>{q.competency_name}</dd>
          {q.sub_competency_name && (
            <>
              <dt className="font-semibold text-muted-foreground">Sub kompetensi</dt>
              <dd>{q.sub_competency_name}</dd>
            </>
          )}
          {q.indicator_name && (
            <>
              <dt className="font-semibold text-muted-foreground">Indikator</dt>
              <dd>{q.indicator_name}</dd>
            </>
          )}
        </dl>
      )}
      {q.text && (
        <div className="mt-3 rounded-lg border-l-4 border-secondary/40 bg-muted/50 p-3 text-sm">
          <HtmlContent html={q.text} />
        </div>
      )}
      <HtmlContent html={q.question_text} className="mt-3" />
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
      <div className="mt-3">
        <AnswerKey q={q} />
      </div>
      {q.description && (
        <Collapsible className="mt-3">
          <CollapsibleTrigger className="group flex items-center gap-1 text-sm font-medium text-primary">
            Pembahasan
            <Iconify
              icon="solar:alt-arrow-down-linear"
              size={16}
              className="transition-transform group-data-[state=open]:rotate-180"
            />
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2 rounded-lg bg-muted/60 p-3 text-sm">
            <HtmlContent html={q.description} />
          </CollapsibleContent>
        </Collapsible>
      )}
    </article>
  );
}
