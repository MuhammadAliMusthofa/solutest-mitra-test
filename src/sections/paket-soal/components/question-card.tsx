'use client';

/* eslint-disable @next/next/no-img-element -- lampiran soal dari storage eksternal / data URL */

import type { Question } from 'src/models/question';

import Link from 'next/link';

import { Button } from 'src/components/ui/button';
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
    const statements = q.options.filter((o) => o.type === 'pernyataan');
    const answers = q.options.filter((o) => o.type === 'jawaban');
    return (
      <ul className="space-y-1.5">
        {statements.map((s, i) => (
          <li key={s.id} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-sm">
            <span className="rounded-lg bg-muted px-3 py-1.5">
              <HtmlContent html={s.option_text} as="span" />
            </span>
            <Iconify icon="solar:arrow-right-linear" size={16} className="text-muted-foreground" />
            <span className="rounded-lg bg-success/8 px-3 py-1.5 ring-1 ring-success/30">
              <HtmlContent html={answers[i]?.option_text} as="span" />
            </span>
          </li>
        ))}
      </ul>
    );
  }
  if (q.type_question_id === 5 || q.type_question_id === 6) {
    return (
      <div className="rounded-lg bg-success/8 px-3 py-2 text-sm ring-1 ring-success/30">
        <span className="mr-1 font-semibold">
          {q.type_question_id === 5 ? 'Kunci:' : 'Rubrik:'}
        </span>
        {q.options.map((o) => (
          <HtmlContent key={o.id} html={o.option_text} as="span" />
        ))}
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
}: {
  q: Question;
  no: number;
  editHref: string;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-xl p-4 ring-1 ring-border md:p-5">
      <header className="flex flex-wrap items-center gap-2">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-sm font-semibold text-primary">
          {no}
        </span>
        <StatusPill tone="secondary">{questionTypeName(q.type_question_id)}</StatusPill>
        <StatusPill
          tone={q.source === 'manual' ? 'accent' : 'neutral'}
          icon={q.source === 'manual' ? 'solar:pen-new-round-linear' : 'solar:database-linear'}
        >
          {q.source === 'manual' ? 'Buatan mitra' : 'Bank soal'}
        </StatusPill>
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
