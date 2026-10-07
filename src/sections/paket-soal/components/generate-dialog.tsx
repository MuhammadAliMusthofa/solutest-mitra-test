'use client';

import type { QuestionType, PackageDetail } from 'src/models/question';

import { useState } from 'react';

import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Button } from 'src/components/ui/button';
import { Checkbox } from 'src/components/ui/checkbox';
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from 'src/components/ui/dialog';

import { QUESTION_TYPES } from 'src/models/question';

import { Iconify } from 'src/components/iconify/iconify';

import { useMasterData, usePaketMutations } from '../hooks/use-paket';

/** Ambil soal dari bank soal berdasarkan bab & tipe soal. */
export function GenerateDialog({
  open,
  onOpenChange,
  paket,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  paket: PackageDetail;
}) {
  const master = useMasterData({ class_id: paket.class_id, subject_id: paket.subject_id });
  const { generate } = usePaketMutations();
  const [chapters, setChapters] = useState<number[]>([]);
  const [types, setTypes] = useState<QuestionType[]>([1]);
  const [count, setCount] = useState('10');

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setChapters(paket.chapter_ids);
      setTypes([1]);
      setCount('10');
    }
  }

  const n = Number(count);
  const error = !chapters.length
    ? 'Pilih minimal satu bab'
    : !types.length
      ? 'Pilih minimal satu tipe soal'
      : !(n >= 1 && n <= 50)
        ? 'Jumlah soal 1–50'
        : '';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Generate soal dari bank soal</DialogTitle>
          <DialogDescription>
            Soal dipilih otomatis dari bank soal {paket.subject_name} kelas {paket.class_name}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Bab</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {(master.chapters.data ?? []).map((c) => (
                <label
                  key={c.id}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-border has-[:checked]:bg-primary/6 has-[:checked]:ring-primary/40"
                >
                  <Checkbox
                    checked={chapters.includes(c.id)}
                    onCheckedChange={(v) =>
                      setChapters((p) => (v ? [...p, c.id] : p.filter((x) => x !== c.id)))
                    }
                  />
                  {c.name}
                </label>
              ))}
            </div>
          </fieldset>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Tipe soal</legend>
            <div className="grid gap-2 sm:grid-cols-2">
              {QUESTION_TYPES.map((t) => (
                <label
                  key={t.id}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-border has-[:checked]:bg-primary/6 has-[:checked]:ring-primary/40"
                >
                  <Checkbox
                    checked={types.includes(t.id)}
                    onCheckedChange={(v) =>
                      setTypes((p) => (v ? [...p, t.id] : p.filter((x) => x !== t.id)))
                    }
                  />
                  {t.name}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="gen-count">Jumlah soal</Label>
            <Input
              id="gen-count"
              type="number"
              min={1}
              max={50}
              value={count}
              onChange={(e) => setCount(e.target.value)}
              className="w-32"
            />
          </div>
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            disabled={Boolean(error) || generate.isPending}
            onClick={() =>
              generate.mutate(
                {
                  paketId: String(paket.id),
                  body: { chapter_ids: chapters, type_ids: types, count: n },
                },
                { onSuccess: () => onOpenChange(false) }
              )
            }
          >
            {generate.isPending ? (
              <Iconify icon="svg-spinners:180-ring" size={16} />
            ) : (
              <Iconify icon="solar:magic-stick-3-linear" size={16} />
            )}
            Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
