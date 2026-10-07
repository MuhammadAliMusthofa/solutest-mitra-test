'use client';

import type { QuestionForm } from '../helpers/question-form';

import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import { Textarea } from 'src/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from 'src/components/ui/radio-group';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

const LETTERS = 'ABCDEFGHIJ';
const MAX_CHOICES = 6;

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
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          {type === 1 ? 'Pilih satu jawaban benar.' : 'Centang semua jawaban benar.'}
        </p>
        {form.choices.map((c, i) => (
          <div
            key={i}
            className={cn(
              'flex items-center gap-2 rounded-lg p-2 ring-1 ring-border',
              c.correct && 'bg-success/6 ring-success/40'
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
            <span className="w-5 text-sm font-semibold">{LETTERS[i]}</span>
            <Input
              value={c.text}
              onChange={(e) => setChoice(i, { text: e.target.value })}
              placeholder={`Pilihan ${LETTERS[i]}`}
              className="flex-1"
            />
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
              <Iconify icon="solar:close-circle-linear" size={18} />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
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
            className="flex cursor-pointer items-center gap-2 rounded-lg px-4 py-2.5 ring-1 ring-border has-[[data-state=checked]]:bg-success/6 has-[[data-state=checked]]:ring-success/40"
          >
            <RadioGroupItem value={v} />
            <span className="text-sm font-medium capitalize">{v}</span>
          </label>
        ))}
      </RadioGroup>
    );
  }

  if (type === 4) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Setiap baris adalah pasangan benar. Siswa akan melihat jawaban dalam urutan acak.
        </p>
        {form.pairs.map((p, i) => (
          <div key={i} className="grid items-center gap-2 sm:grid-cols-[1fr_auto_1fr_auto]">
            <Input
              value={p.statement}
              onChange={(e) =>
                update({
                  pairs: form.pairs.map((x, idx) =>
                    idx === i ? { ...x, statement: e.target.value } : x
                  ),
                })
              }
              placeholder={`Pernyataan ${i + 1}`}
            />
            <Iconify
              icon="solar:arrow-right-linear"
              size={18}
              className="hidden text-muted-foreground sm:block"
            />
            <Input
              value={p.answer}
              onChange={(e) =>
                update({
                  pairs: form.pairs.map((x, idx) =>
                    idx === i ? { ...x, answer: e.target.value } : x
                  ),
                })
              }
              placeholder={`Jawaban ${i + 1}`}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Hapus pasangan ${i + 1}`}
              disabled={form.pairs.length <= 2}
              onClick={() => update({ pairs: form.pairs.filter((_, idx) => idx !== i) })}
            >
              <Iconify icon="solar:close-circle-linear" size={18} />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={form.pairs.length >= 8}
          onClick={() => update({ pairs: [...form.pairs, { statement: '', answer: '' }] })}
        >
          <Iconify icon="solar:add-circle-linear" size={16} />
          Tambah pasangan
        </Button>
      </div>
    );
  }

  if (type === 5) {
    return (
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          Satu kolom isian per kunci. Penilaian tidak membedakan huruf besar/kecil.
        </p>
        {form.keys.map((k, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="w-16 text-sm text-muted-foreground">Kolom {i + 1}</span>
            <Input
              value={k}
              onChange={(e) =>
                update({ keys: form.keys.map((x, idx) => (idx === i ? e.target.value : x)) })
              }
              placeholder="Kunci jawaban"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label={`Hapus kolom ${i + 1}`}
              disabled={form.keys.length <= 1}
              onClick={() => update({ keys: form.keys.filter((_, idx) => idx !== i) })}
            >
              <Iconify icon="solar:close-circle-linear" size={18} />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={form.keys.length >= 5}
          onClick={() => update({ keys: [...form.keys, ''] })}
        >
          <Iconify icon="solar:add-circle-linear" size={16} />
          Tambah kolom
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">
        Rubrik/jawaban acuan untuk penilaian esai (opsional).
      </p>
      <Textarea
        value={form.rubric}
        onChange={(e) => update({ rubric: e.target.value })}
        rows={4}
        placeholder="mis. Jawaban memuat definisi, contoh, dan alasan."
      />
    </div>
  );
}
