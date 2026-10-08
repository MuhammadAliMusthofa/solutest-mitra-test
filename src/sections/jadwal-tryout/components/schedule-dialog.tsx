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
import { Checkbox } from 'src/components/ui/checkbox';
import { Textarea } from 'src/components/ui/textarea';
import {
  Dialog,
  DialogIcon,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from 'src/components/ui/dialog';

import { errorMessage } from 'src/core/http';

import { memberService } from 'src/services/member';
import { paketService, scheduleService } from 'src/services/paket';

import { Iconify } from 'src/components/iconify/iconify';
import { SelectField } from 'src/components/form/select-field';

import {
  hasErrors,
  scheduleToForm,
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

/** Jadwalkan tryout: paket, waktu, durasi, kesempatan, sekolah sasaran → kode tryout baru. */
export function ScheduleDialog({
  open,
  onOpenChange,
  onCreated,
  initial = null,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (schedule: TryoutSchedule) => void;
  /** isi = mode ubah jadwal */
  initial?: TryoutSchedule | null;
}) {
  const editing = Boolean(initial);
  // paket tidak bisa diganti setelah ada siswa mengerjakan (backend 409)
  const packageLocked = Boolean(initial && initial.participants > 0);
  const qc = useQueryClient();
  const [form, setForm] = useState<ScheduleForm>(createScheduleForm);
  const [submitted, setSubmitted] = useState(false);
  const packages = useQuery({
    queryKey: ['schedule', 'package-options'],
    queryFn: paketService.options,
    enabled: open,
  });
  const schools = useQuery({
    queryKey: ['member', 'schools', 'options'],
    queryFn: memberService.schools,
    enabled: open,
  });
  const selectedPackage = packages.data?.find((p) => String(p.id) === form.package_id);
  const create = useMutation({
    mutationFn: (body: ReturnType<typeof toSchedulePayload>) => {
      if (!initial) return scheduleService.create(body);
      const { package_id: packageId, ...rest } = body;
      return scheduleService.update(
        initial.id,
        packageLocked ? rest : { ...rest, package_id: packageId }
      );
    },
    onSuccess: (schedule) => {
      qc.invalidateQueries({ queryKey: ['schedule'] });
      qc.invalidateQueries({ queryKey: ['paket'] });
      qc.invalidateQueries({ queryKey: ['monitoring'] });
      onOpenChange(false);
      if (editing) toast.success('Jadwal diperbarui');
      else onCreated(schedule);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  // reset form setiap kali dialog dibuka (penyesuaian state saat render)
  const [prevOpen, setPrevOpen] = useState(open);
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setForm(initial ? scheduleToForm(initial) : createScheduleForm());
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
          <DialogIcon>
            <Iconify icon="solar:calendar-add-linear" size={24} />
          </DialogIcon>
          <DialogTitle>{editing ? `Ubah jadwal ${initial?.code}` : 'Jadwalkan tryout'}</DialogTitle>
          <DialogDescription>
            Tryout tampil di beranda siswa sekolah sasaran dan bisa dibuka dengan kode.
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
              onChange={(package_id) => {
                const pkg = packages.data?.find((p) => String(p.id) === package_id);
                // durasi mengikuti durasi bawaan paket (masih bisa diubah)
                set({ package_id, ...(pkg ? { duration: String(pkg.time) } : {}) });
              }}
              options={(packages.data ?? []).map((p) => ({
                value: String(p.id),
                label: `${p.title} · ${p.code} (${p.question_count} soal)`,
              }))}
              placeholder={packages.isPending ? 'Memuat paket…' : 'Pilih paket'}
              disabled={packageLocked}
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
          <div className="grid gap-4 sm:grid-cols-2">
            <Field id="s-duration" label="Durasi pengerjaan (menit)" error={show('duration')}>
              <Input
                id="s-duration"
                type="number"
                min={1}
                max={1440}
                value={form.duration}
                onChange={(e) => set({ duration: e.target.value })}
              />
            </Field>
            <Field id="s-attempts" label="Kesempatan mengerjakan" error={show('max_attempts')}>
              <Input
                id="s-attempts"
                type="number"
                min={1}
                max={100}
                value={form.max_attempts}
                onChange={(e) => set({ max_attempts: e.target.value })}
              />
            </Field>
          </div>
          <div className="space-y-2">
            <Label>Sekolah sasaran</Label>
            <p className="text-xs text-muted-foreground">
              Tidak memilih sekolah = semua sekolah mitra.
            </p>
            <div className="max-h-44 space-y-1 overflow-y-auto rounded-lg p-2 ring-1 ring-border">
              {schools.isPending && (
                <p className="px-2 py-1 text-sm text-muted-foreground">Memuat sekolah…</p>
              )}
              {schools.data?.length === 0 && (
                <p className="px-2 py-1 text-sm text-muted-foreground">
                  Belum ada sekolah. Tambahkan di menu Sekolah.
                </p>
              )}
              {schools.data?.map((s) => {
                const checked = form.school_ids.includes(s.id);
                return (
                  <label
                    key={s.id}
                    className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted/60"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) =>
                        set({
                          school_ids: v
                            ? [...form.school_ids, s.id]
                            : form.school_ids.filter((id) => id !== s.id),
                        })
                      }
                    />
                    <span className="flex-1">{s.name}</span>
                    {s.city && <span className="text-xs text-muted-foreground">{s.city}</span>}
                  </label>
                );
              })}
            </div>
          </div>
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
            htmlFor="s-publish"
            className="flex items-center justify-between gap-3 rounded-2xl bg-muted/60 px-4 py-3.5"
          >
            <span>
              <span className="block text-sm font-medium">Terbitkan sekarang</span>
              <span className="block text-xs text-muted-foreground">
                Matikan untuk menyimpan sebagai draf (belum tampil ke siswa).
              </span>
            </span>
            <Switch
              id="s-publish"
              checked={form.is_published}
              onCheckedChange={(v) => set({ is_published: v })}
            />
          </label>
          {selectedPackage && (
            <p className="flex items-start gap-2 rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <Iconify icon="solar:shield-check-linear" size={16} className="mt-px shrink-0" />
              Tampilan nilai & deteksi kecurangan mengikuti pengaturan paket {selectedPackage.code}.
            </p>
          )}
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
            {editing ? 'Simpan' : 'Jadwalkan'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
