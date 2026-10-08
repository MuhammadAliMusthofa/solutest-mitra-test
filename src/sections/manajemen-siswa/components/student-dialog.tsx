'use client';

import type { MitraStudent } from 'src/models/member';

import { z } from 'zod';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Button } from 'src/components/ui/button';
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from 'src/components/ui/dialog';

import { errorMessage } from 'src/core/http';

import { usePanel } from 'src/hooks/use-panel';

import { memberService } from 'src/services/member';

import { Iconify } from 'src/components/iconify/iconify';
import { SelectField } from 'src/components/form/select-field';

const schema = (needSchool: boolean) =>
  z.object({
    name: z.string().trim().min(1, 'Nama wajib diisi'),
    email: z.string().trim().email('Format email tidak valid'),
    phone: z.string().trim().optional(),
    password: z.string().refine((v) => !v || v.length >= 6, 'Password minimal 6 karakter'),
    nisn: z
      .string()
      .trim()
      .regex(/^(\d{10})?$/, 'NISN harus 10 digit'),
    class: z.string().trim().max(100).optional(),
    school_id: needSchool ? z.string().min(1, 'Pilih sekolah') : z.string().optional(),
  });

type FormValues = z.infer<ReturnType<typeof schema>>;

/**
 * Tambah siswa satu per satu atau ubah NISN/kelas (+ sekolah untuk admin).
 * Guru: sekolah siswa otomatis sekolah guru.
 */
export function StudentDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: MitraStudent | null;
}) {
  const qc = useQueryClient();
  const { panel, isAdmin } = usePanel();
  const creating = !initial;
  const schools = useQuery({
    queryKey: ['member', 'schools', 'options'],
    queryFn: memberService.schools,
    enabled: open && isAdmin,
  });
  const form = useForm<FormValues>({ resolver: zodResolver(schema(isAdmin)) });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: initial?.name ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      password: '',
      nisn: initial?.nisn ?? '',
      class: initial?.class ?? '',
      school_id: initial?.school_id ? String(initial.school_id) : '',
    });
  }, [open, initial, form]);

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const schoolId = isAdmin && v.school_id ? Number(v.school_id) : undefined;
      return initial
        ? memberService.updateStudent(panel, initial.id, {
            nisn: v.nisn,
            class: v.class,
            school_id: schoolId,
          })
        : memberService.createStudent(panel, {
            name: v.name,
            email: v.email,
            phone: v.phone,
            password: v.password,
            nisn: v.nisn,
            class: v.class,
            school_id: schoolId,
          });
    },
    onSuccess: (student) => {
      if (creating) {
        const isNew = 'is_new_account' in student && student.is_new_account;
        toast.success(
          isNew
            ? 'Akun siswa dibuat. Siswa login dengan email & password ini.'
            : 'Siswa ditambahkan memakai akun Solutest yang sudah ada (password tidak berubah).'
        );
      } else toast.success('Data siswa diperbarui');
      qc.invalidateQueries({ queryKey: ['member'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{creating ? 'Tambah siswa' : 'Ubah data siswa'}</DialogTitle>
          <DialogDescription>
            Siswa login memakai akun Solutest. Email yang sudah terdaftar memakai akun lamanya.
          </DialogDescription>
        </DialogHeader>
        <form
          id="student-form"
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="st-name">Nama lengkap</Label>
              <Input
                id="st-name"
                disabled={!creating}
                {...form.register('name')}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-email">Email</Label>
              <Input
                id="st-email"
                type="email"
                disabled={!creating}
                {...form.register('email')}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            {creating && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="st-phone">No. HP (opsional)</Label>
                  <Input id="st-phone" inputMode="tel" {...form.register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="st-password">Password</Label>
                  <Input
                    id="st-password"
                    type="password"
                    autoComplete="new-password"
                    {...form.register('password')}
                    aria-invalid={Boolean(errors.password)}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
              </>
            )}
            <div className="space-y-2">
              <Label htmlFor="st-nisn">NISN (opsional)</Label>
              <Input
                id="st-nisn"
                inputMode="numeric"
                {...form.register('nisn')}
                aria-invalid={Boolean(errors.nisn)}
              />
              {errors.nisn && <p className="text-xs text-destructive">{errors.nisn.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="st-class">Kelas (opsional)</Label>
              <Input id="st-class" placeholder="mis. XII IPA 1" {...form.register('class')} />
            </div>
          </div>
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="st-school">Sekolah</Label>
              <Controller
                control={form.control}
                name="school_id"
                render={({ field }) => (
                  <SelectField
                    id="st-school"
                    value={field.value ?? ''}
                    onChange={field.onChange}
                    options={(schools.data ?? []).map((s) => ({
                      value: String(s.id),
                      label: [s.name, s.city].filter(Boolean).join(' · '),
                    }))}
                    placeholder={schools.isPending ? 'Memuat sekolah…' : 'Pilih sekolah'}
                    className="sm:w-full"
                    invalid={Boolean(errors.school_id)}
                  />
                )}
              />
              {errors.school_id && (
                <p className="text-xs text-destructive">{errors.school_id.message}</p>
              )}
            </div>
          )}
          {creating && (
            <p className="text-xs text-muted-foreground">
              Password wajib bila email belum punya akun Solutest.
            </p>
          )}
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" form="student-form" disabled={save.isPending}>
            {save.isPending && <Iconify icon="svg-spinners:180-ring" size={16} />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
