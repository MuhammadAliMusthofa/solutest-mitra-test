'use client';

import type { QuestionForm } from '../helpers/question-form';

import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from 'src/components/ui/radio-group';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

const LETTERS = 'ABCDEFGHIJ';
const MAX_CHOICES = 6;
const MAX_STATEMENTS = 10;

interface Props {
  form: QuestionForm;
  update: (patch: Partial<QuestionForm>) => void;
}

/** Bagian kunci jawaban editor soal; isi berbeda per tipe soal. */
export function AnswerEditor({ form, update }: Props) {
  const { type } = form;

  if (type === 1 || type === 2) {
    const setChoice = (i: number, patch: Partial<QuestionForm['choices'][number]>) =>
      update({ choices: form.choices.map((c, idx) => (idx === i ? { ...c, ...patch } : c)) });
    const markCorrect = (i: number, value: boolean) =>
      type === 1
        ? update({ choices: form.choices.map((c, idx) => ({ ...c, correct: idx === i })) })
        : setChoice(i, { correct: value });
    return (
      <div className="space-y-2.5">
        <p className="mb-1 inline-flex items-center gap-1.5 rounded-full bg-info/10 px-3 py-1.5 text-xs font-semibold text-info">
          <Iconify icon="solar:info-circle-linear" size={14} />
          {type === 1 ? 'Pilih satu jawaban benar.' : 'Centang semua jawaban benar.'}
        </p>
        {form.choices.map((c, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2.5 rounded-2xl p-2 pl-3 ring-1 ring-border transition-colors',
              c.correct && 'bg-success/[0.07] ring-success/45'
            )}
          >
            {type === 1 ? (
              <input
                type="radio"
                name="correct-choice"
                checked={c.correct}
                onChange={() => markCorrect(i, true)}
                aria-label={`Tandai ${LETTERS[i]} sebagai jawaban benar`}
                className="size-4 accent-[var(--success)]"
              />
            ) : (
              <Checkbox
                checked={c.correct}
                onCheckedChange={(v) => markCorrect(i, Boolean(v))}
                aria-label={`Tandai ${LETTERS[i]} benar`}
              />
            )}
            <span
              className={cn(
                'grid size-9 shrink-0 place-items-center rounded-xl text-sm font-bold transition-colors',
                c.correct ? 'bg-success text-white' : 'bg-muted text-foreground/70'
              )}
            >
              {LETTERS[i]}
            </span>
            <Input
              value={c.text}
              onChange={(e) => setChoice(i, { text: e.target.value })}
              placeholder={`Pilihan ${LETTERS[i]}`}
              className="flex-1 bg-card"
            />
            {c.correct && (
              <span className="hidden items-center gap-1 rounded-full bg-success px-2.5 py-1 text-[0.7rem] font-bold text-white sm:inline-flex">
                <Iconify icon="solar:check-circle-bold" size={13} />
                Kunci
              </span>
            )}
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Hapus pilihan ${LETTERS[i]}`}
              disabled={form.choices.length <= 2}
              onClick={() => {
                const next = form.choices.filter((_, idx) => idx !== i);
                if (type === 1 && !next.some((x) => x.correct))
                  next[0] = { ...next[0], correct: true };
                update({ choices: next });
              }}
            >
              <Iconify icon="solar:trash-bin-minimalistic-linear" size={18} />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="soft"
          size="sm"
          disabled={form.choices.length >= MAX_CHOICES}
          onClick={() => update({ choices: [...form.choices, { text: '', correct: false }] })}
        >
          <Iconify icon="solar:add-circle-linear" size={16} />
          Tambah pilihan
        </Button>
      </div>
    );
  }

  if (type === 3) {
    return (
      <RadioGroup
        value={form.trueFalse}
        onValueChange={(v) => update({ trueFalse: v as 'benar' | 'salah' })}
        className="flex gap-3"
      >
        {(['benar', 'salah'] as const).map((v) => (
          <label
            key={v}
            className="flex min-w-36 cursor-pointer items-center gap-2.5 rounded-2xl px-4 py-3.5 ring-1 ring-border transition-colors hover:ring-success/40 has-[[data-state=checked]]:bg-success/[0.07] has-[[data-state=checked]]:ring-2 has-[[data-state=checked]]:ring-success/60"
          >
            <RadioGroupItem value={v} />
            <span className="text-sm font-bold capitalize">{v}</span>
          </label>
        ))}
      </RadioGroup>
    );
  }

  // 4 · Benar/Salah Kompleks: tabel pernyataan, tiap baris diberi kunci Benar/Salah
  const setStatement = (i: number, patch: Partial<QuestionForm['statements'][number]>) =>
    update({
      statements: form.statements.map((s, idx) => (idx === i ? { ...s, ...patch } : s)),
    });
  return (
    <div className="space-y-2">
      <p className="mb-1 text-xs leading-relaxed text-muted-foreground">
        Tulis setiap pernyataan lalu tentukan kuncinya. Siswa memilih Benar/Salah per baris; nilai
        dihitung proporsional dari jumlah baris yang tepat.
      </p>
      {form.statements.map((s, i) => (
        <div
          key={i}
          className="grid items-center gap-2.5 rounded-2xl p-2 pl-3 ring-1 ring-border sm:grid-cols-[auto_1fr_auto_auto]"
        >
          <span className="grid size-9 place-items-center rounded-xl bg-muted text-sm font-bold">
            {i + 1}
          </span>
          <Input
            value={s.text}
            onChange={(e) => setStatement(i, { text: e.target.value })}
            placeholder={`Pernyataan ${i + 1}`}
            aria-label={`Pernyataan ${i + 1}`}
          />
          <RadioGroup
            value={s.value}
            onValueChange={(v) => setStatement(i, { value: v as 'benar' | 'salah' })}
            className="flex gap-2"
            aria-label={`Kunci pernyataan ${i + 1}`}
          >
            {(['benar', 'salah'] as const).map((v) => (
              <label
                key={v}
                className={cn(
                  'flex cursor-pointer items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-semibold ring-1 ring-border transition-colors',
                  v === 'benar'
                    ? 'has-[[data-state=checked]]:bg-success/8 has-[[data-state=checked]]:text-success has-[[data-state=checked]]:ring-success/40'
                    : 'has-[[data-state=checked]]:bg-destructive/8 has-[[data-state=checked]]:text-destructive has-[[data-state=checked]]:ring-destructive/40'
                )}
              >
                <RadioGroupItem value={v} />
                <span className="capitalize">{v}</span>
              </label>
            ))}
          </RadioGroup>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={`Hapus pernyataan ${i + 1}`}
            disabled={form.statements.length <= 2}
            onClick={() => update({ statements: form.statements.filter((_, idx) => idx !== i) })}
          >
            <Iconify icon="solar:trash-bin-minimalistic-linear" size={18} />
          </Button>
        </div>
      ))}
      <Button
        type="button"
        variant="soft"
        size="sm"
        disabled={form.statements.length >= MAX_STATEMENTS}
        onClick={() => update({ statements: [...form.statements, { text: '', value: 'benar' }] })}
      >
        <Iconify icon="solar:add-circle-linear" size={16} />
        Tambah pernyataan
      </Button>
    </div>
  );
}
