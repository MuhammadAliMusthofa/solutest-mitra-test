'use client';

import type { Package } from 'src/models/question';

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

import { Iconify } from 'src/components/iconify/iconify';
import { SelectField } from 'src/components/form/select-field';

import { useMasterData, usePaketMutations } from '../hooks/use-paket';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = buat paket baru */
  initial?: Package | null;
  onSaved?: (pkg: Package) => void;
}

/** Buat / ubah paket soal: judul, kelas, mapel, bab. */
export function PackageFormDialog({ open, onOpenChange, initial, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [chapterIds, setChapterIds] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const master = useMasterData({
    class_id: Number(classId) || undefined,
    subject_id: Number(subjectId) || undefined,
  });
  const { savePackage } = usePaketMutations();

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(initial?.title ?? '');
      setClassId(initial ? String(initial.class_id) : '');
      setSubjectId(initial ? String(initial.subject_id) : '');
      setChapterIds(initial?.chapter_ids ?? []);
      setSubmitted(false);
    }
  }

  const errors = {
    title: !title.trim() ? 'Judul paket wajib diisi' : '',
    class: !classId ? 'Pilih kelas' : '',
    subject: !subjectId ? 'Pilih mata pelajaran' : '',
  };
  const invalid = Object.values(errors).some(Boolean);

  const submit = () => {
    setSubmitted(true);
    if (invalid) return;
    savePackage.mutate(
      {
        id: initial?.id,
        body: {
          title,
          class_id: Number(classId),
          subject_id: Number(subjectId),
          chapter_ids: chapterIds,
        },
      },
      {
        onSuccess: (pkg) => {
          onOpenChange(false);
          onSaved?.(pkg);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? 'Ubah paket soal' : 'Buat paket soal'}</DialogTitle>
          <DialogDescription>Kode paket dibuat otomatis setelah paket disimpan.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="paket-title">Judul paket</Label>
            <Input
              id="paket-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="mis. Paket TKA Matematika A"
              aria-invalid={submitted && Boolean(errors.title)}
            />
            {submitted && errors.title && (
              <p className="text-xs text-destructive">{errors.title}</p>
            )}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="paket-class">Kelas</Label>
              <SelectField
                id="paket-class"
                value={classId}
                onChange={(v) => {
                  setClassId(v);
                  setChapterIds([]);
                }}
                options={(master.classes.data ?? []).map((c) => ({
                  value: String(c.id),
                  label: `Kelas ${c.name}`,
                }))}
                placeholder="Pilih kelas"
                className="sm:w-full"
                invalid={submitted && Boolean(errors.class)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paket-subject">Mata pelajaran</Label>
              <SelectField
                id="paket-subject"
                value={subjectId}
                onChange={(v) => {
                  setSubjectId(v);
                  setChapterIds([]);
                }}
                options={(master.subjects.data ?? []).map((s) => ({
                  value: String(s.id),
                  label: s.name,
                }))}
                placeholder="Pilih mapel"
                className="sm:w-full"
                invalid={submitted && Boolean(errors.subject)}
              />
            </div>
          </div>
          {submitted && (errors.class || errors.subject) && (
            <p className="text-xs text-destructive">{errors.class || errors.subject}</p>
          )}
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Bab (opsional)</legend>
            {!classId || !subjectId ? (
              <p className="text-xs text-muted-foreground">
                Pilih kelas & mapel untuk menampilkan bab.
              </p>
            ) : (
              <div className="grid gap-2 sm:grid-cols-2">
                {(master.chapters.data ?? []).map((c) => (
                  <label
                    key={c.id}
                    className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-border has-[:checked]:bg-primary/6 has-[:checked]:ring-primary/40"
                  >
                    <Checkbox
                      checked={chapterIds.includes(c.id)}
                      onCheckedChange={(v) =>
                        setChapterIds((prev) =>
                          v ? [...prev, c.id] : prev.filter((x) => x !== c.id)
                        )
                      }
                    />
                    {c.order}. {c.name}
                  </label>
                ))}
              </div>
            )}
          </fieldset>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button onClick={submit} disabled={savePackage.isPending}>
            {savePackage.isPending && <Iconify icon="svg-spinners:180-ring" size={16} />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
