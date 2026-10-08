'use client';

import type { Package, PackageBody } from 'src/models/question';

import { useState } from 'react';

import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Button } from 'src/components/ui/button';
import { Switch } from 'src/components/ui/switch';
import {
  Dialog,
  DialogIcon,
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

/**
 * Buat / ubah paket soal: judul, kelas, mapel, durasi, dan aturan pengerjaan.
 * Kompetensi diisi per soal; kelas & mapel terkunci setelah paket berisi soal.
 */
export function PackageFormDialog({ open, onOpenChange, initial, onSaved }: Props) {
  const [title, setTitle] = useState('');
  const [classId, setClassId] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [time, setTime] = useState('60');
  const [showScore, setShowScore] = useState(true);
  const [cheat, setCheat] = useState(false);
  const [maxViolations, setMaxViolations] = useState('3');
  const [submitted, setSubmitted] = useState(false);
  const lockedMaster = Boolean(initial && initial.question_count > 0);
  const master = useMasterData();
  const { savePackage } = usePaketMutations();

  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setTitle(initial?.title ?? '');
      setClassId(initial?.class_id ? String(initial.class_id) : '');
      setSubjectId(initial?.subject_id ? String(initial.subject_id) : '');
      setTime(String(initial?.time ?? 60));
      setShowScore(initial?.show_score ?? true);
      setCheat(initial?.is_cheat_detection ?? false);
      setMaxViolations(String(initial?.max_violations ?? 3));
      setSubmitted(false);
    }
  }

  const errors = {
    title: !title.trim() ? 'Judul paket wajib diisi' : '',
    class: !classId ? 'Pilih kelas' : '',
    subject: !subjectId ? 'Pilih mata pelajaran' : '',
    time: !(Number(time) >= 1 && Number(time) <= 1440) ? 'Durasi 1–1440 menit' : '',
    violations:
      cheat && !(Number(maxViolations) >= 1 && Number(maxViolations) <= 100)
        ? 'Batas pelanggaran 1–100'
        : '',
  };
  const invalid = Object.values(errors).some(Boolean);

  const submit = () => {
    setSubmitted(true);
    if (invalid) return;
    savePackage.mutate(
      {
        id: initial?.id,
        body: {
          title: title.trim(),
          // kelas & mapel tidak dikirim bila terkunci (backend menolak perubahan → 409)
          ...(lockedMaster ? {} : { class_id: Number(classId), subject_id: Number(subjectId) }),
          time: Number(time),
          show_score: showScore,
          is_cheat_detection: cheat,
          max_violations: Number(maxViolations),
        } as PackageBody,
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
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogIcon>
            <Iconify icon="solar:box-linear" size={24} />
          </DialogIcon>
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
                onChange={setClassId}
                options={(master.classes.data ?? []).map((c) => ({
                  value: String(c.id),
                  label: `Kelas ${c.name}`,
                }))}
                placeholder="Pilih kelas"
                className="sm:w-full"
                disabled={lockedMaster}
                invalid={submitted && Boolean(errors.class)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paket-subject">Mata pelajaran</Label>
              <SelectField
                id="paket-subject"
                value={subjectId}
                onChange={setSubjectId}
                options={(master.subjects.data ?? []).map((s) => ({
                  value: String(s.id),
                  label: s.name,
                }))}
                placeholder="Pilih mapel"
                className="sm:w-full"
                disabled={lockedMaster}
                invalid={submitted && Boolean(errors.subject)}
              />
            </div>
          </div>
          {submitted && (errors.class || errors.subject) && (
            <p className="text-xs text-destructive">{errors.class || errors.subject}</p>
          )}
          <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
            {lockedMaster
              ? `Kelas & mapel terkunci karena paket sudah berisi ${initial?.question_count} soal.`
              : 'Kompetensi TKA dipilih per soal, sesuai kelas & mapel paket.'}
          </p>
          <div className="space-y-2">
            <Label htmlFor="paket-time">Durasi bawaan (menit)</Label>
            <Input
              id="paket-time"
              type="number"
              min={1}
              max={1440}
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-40"
              aria-invalid={submitted && Boolean(errors.time)}
            />
            {submitted && errors.time && <p className="text-xs text-destructive">{errors.time}</p>}
          </div>
          <label
            htmlFor="paket-score"
            className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3.5"
          >
            <span>
              <span className="block text-sm font-medium">Tampilkan nilai ke siswa</span>
              <span className="block text-xs text-muted-foreground">
                Bila dimatikan, siswa tidak melihat skor & leaderboard.
              </span>
            </span>
            <Switch id="paket-score" checked={showScore} onCheckedChange={setShowScore} />
          </label>
          <label
            htmlFor="paket-cheat"
            className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3.5"
          >
            <span>
              <span className="block text-sm font-medium">Deteksi kecurangan</span>
              <span className="block text-xs text-muted-foreground">
                Pindah tab / keluar layar penuh dihitung pelanggaran; melewati batas = dikumpulkan
                otomatis.
              </span>
            </span>
            <Switch id="paket-cheat" checked={cheat} onCheckedChange={setCheat} />
          </label>
          {cheat && (
            <div className="space-y-2">
              <Label htmlFor="paket-violations">Batas pelanggaran</Label>
              <Input
                id="paket-violations"
                type="number"
                min={1}
                max={100}
                value={maxViolations}
                onChange={(e) => setMaxViolations(e.target.value)}
                className="w-40"
                aria-invalid={submitted && Boolean(errors.violations)}
              />
              {submitted && errors.violations && (
                <p className="text-xs text-destructive">{errors.violations}</p>
              )}
            </div>
          )}
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
