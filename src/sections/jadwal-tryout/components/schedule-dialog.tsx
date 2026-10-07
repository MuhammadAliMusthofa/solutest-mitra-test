'use client';

import type { ScheduleForm } from '../helpers/schedule';
import type { TryoutSchedule } from 'src/models/schedule';

import { toast } from 'sonner';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Button } from 'src/components/ui/button';
import { Switch } from 'src/components/ui/switch';
import { Textarea } from 'src/components/ui/textarea';
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from 'src/components/ui/dialog';

import { errorMessage } from 'src/core/http';

import { paketService, scheduleService } from 'src/services/paket';

import { Iconify } from 'src/components/iconify/iconify';
import { SelectField } from 'src/components/form/select-field';

import {
  hasErrors,
  toSchedulePayload,
  createScheduleForm,
  validateScheduleForm,
} from '../helpers/schedule';

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

/** Jadwalkan tryout: paket, waktu, durasi, anti-cheat → kode tryout baru. */
export function ScheduleDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (schedule: TryoutSchedule) => void;
}) {
  const qc = useQueryClient();
  const [form, setForm] = useState<ScheduleForm>(createScheduleForm);
  const [submitted, setSubmitted] = useState(false);
  const packages = useQuery({
    queryKey: ['schedule', 'package-options'],
    queryFn: paketService.options,
    enabled: open,
  });
  const create = useMutation({
    mutationFn: scheduleService.create,
    onSuccess: (schedule) => {
      qc.invalidateQueries({ queryKey: ['schedule'] });
      qc.invalidateQueries({ queryKey: ['paket'] });
      onOpenChange(false);
      onCreated(schedule);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // reset form setiap kali dialog dibuka (penyesuaian state saat render)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(createScheduleForm());
      setSubmitted(false);
    }
  }

  const errors = validateScheduleForm(form);
  const set = (patch: Partial<ScheduleForm>) => setForm((f) => ({ ...f, ...patch }));
  const show = (key: keyof typeof errors) => (submitted ? errors[key] : '');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Jadwalkan tryout</DialogTitle>
          <DialogDescription>
            Tryout otomatis tampil untuk semua siswa mitra dan bisa diikuti dengan kode.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Field id="s-title" label="Judul tryout" error={show('title')}>
            <Input
              id="s-title"
              value={form.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="mis. Tryout TKA #7 — Desember"
              aria-invalid={Boolean(show('title'))}
            />
          </Field>
          <Field id="s-package" label="Paket soal" error={show('package_id')}>
            <SelectField
              id="s-package"
              value={form.package_id}
              onChange={(package_id) => set({ package_id })}
              options={(packages.data ?? []).map((p) => ({
                value: String(p.id),
                label: `${p.title} · ${p.code} (${p.question_count} soal)`,
              }))}
              placeholder={packages.isPending ? 'Memuat paket…' : 'Pilih paket'}
              className="sm:w-full"
              invalid={Boolean(show('package_id'))}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="s-start" label="Mulai">
              <Input
                id="s-start"
                type="datetime-local"
                value={form.start}
                onChange={(e) => set({ start: e.target.value })}
              />
            </Field>
            <Field id="s-end" label="Selesai" error={show('end')}>
              <Input
                id="s-end"
                type="datetime-local"
                value={form.end}
                onChange={(e) => set({ end: e.target.value })}
                aria-invalid={Boolean(show('end'))}
              />
            </Field>
          </div>
          <Field id="s-duration" label="Durasi pengerjaan (menit)" error={show('duration')}>
            <Input
              id="s-duration"
              type="number"
              min={1}
              value={form.duration}
              onChange={(e) => set({ duration: e.target.value })}
              className="w-40"
            />
          </Field>
          <Field id="s-desc" label="Deskripsi (opsional)">
            <Textarea
              id="s-desc"
              rows={3}
              value={form.description}
              onChange={(e) => set({ description: e.target.value })}
              placeholder="Petunjuk singkat untuk siswa"
            />
          </Field>
          <label
            htmlFor="s-cheat"
            className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-4 py-3"
          >
            <span>
              <span className="block text-sm font-medium">Deteksi kecurangan</span>
              <span className="block text-xs text-muted-foreground">
                Keluar layar penuh / pindah tab dihitung pelanggaran; ke-2 mengosongkan jawaban,
                ke-3 mengumpulkan otomatis.
              </span>
            </span>
            <Switch
              id="s-cheat"
              checked={form.is_cheat_detection}
              onCheckedChange={(v) => set({ is_cheat_detection: v })}
            />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            disabled={create.isPending}
            onClick={() => {
              setSubmitted(true);
              if (!hasErrors(errors)) create.mutate(toSchedulePayload(form));
            }}
          >
            {create.isPending && <Iconify icon="svg-spinners:180-ring" size={16} />}
            Jadwalkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
