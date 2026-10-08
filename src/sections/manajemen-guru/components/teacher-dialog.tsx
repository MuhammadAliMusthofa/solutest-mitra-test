'use client';

import type { MitraTeacher } from 'src/models/member';

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
  DialogIcon,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from 'src/components/ui/dialog';

import { errorMessage } from 'src/core/http';

import { memberService } from 'src/services/member';

import { Iconify } from 'src/components/iconify/iconify';
import { SelectField } from 'src/components/form/select-field';

const schema = z.object({
  name: z.string().trim().min(1, 'Nama wajib diisi'),
  email: z.string().trim().email('Format email tidak valid'),
  phone: z.string().trim().optional(),
  password: z.string().refine((v) => !v || v.length >= 6, 'Password minimal 6 karakter'),
  school_id: z.string().min(1, 'Pilih sekolah'),
});

type FormValues = z.infer<typeof schema>;

/**
 * Tambah guru (akun Solutest; email yang sudah terdaftar dipakai apa adanya) atau pindah sekolah.
 * Guru hanya mengampu satu sekolah dan hanya melihat siswa sekolah itu.
 */
export function TeacherDialog({
  open,
  onOpenChange,
  initial,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initial: MitraTeacher | null;
}) {
  const qc = useQueryClient();
  const creating = !initial;
  const schools = useQuery({
    queryKey: ['member', 'schools', 'options'],
    queryFn: memberService.schools,
    enabled: open,
  });
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: initial?.name ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      password: '',
      school_id: initial?.school_id ? String(initial.school_id) : '',
    });
  }, [open, initial, form]);

  const save = useMutation({
    mutationFn: (v: FormValues) =>
      initial
        ? memberService.updateTeacher(initial.id, { school_id: Number(v.school_id) })
        : memberService.createTeacher({
            name: v.name,
            email: v.email,
            phone: v.phone,
            password: v.password,
            school_id: Number(v.school_id),
          }),
    onSuccess: (teacher) => {
      if (creating) {
        const isNew = 'is_new_account' in teacher && teacher.is_new_account;
        toast.success(
          isNew
            ? 'Akun guru dibuat. Guru login dengan email & password ini.'
            : 'Guru ditambahkan memakai akun Solutest yang sudah ada (password tidak berubah).'
        );
      } else toast.success('Sekolah guru diperbarui');
      qc.invalidateQueries({ queryKey: ['member'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogIcon>
            <Iconify icon="solar:square-academic-cap-linear" size={24} />
          </DialogIcon>
          <DialogTitle>{creating ? 'Tambah guru' : 'Ubah sekolah guru'}</DialogTitle>
          <DialogDescription>
            Guru mengelola dan memantau hasil tryout siswa di sekolahnya saja.
          </DialogDescription>
        </DialogHeader>
        <form
          id="teacher-form"
          onSubmit={form.handleSubmit((v) => save.mutate(v))}
          className="space-y-4"
          noValidate
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="t-name">Nama lengkap</Label>
              <Input
                id="t-name"
                disabled={!creating}
                {...form.register('name')}
                aria-invalid={Boolean(errors.name)}
              />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-email">Email</Label>
              <Input
                id="t-email"
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
                  <Label htmlFor="t-phone">No. HP (opsional)</Label>
                  <Input id="t-phone" inputMode="tel" {...form.register('phone')} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="t-password">Password</Label>
                  <Input
                    id="t-password"
                    type="password"
                    autoComplete="new-password"
                    {...form.register('password')}
                    aria-invalid={Boolean(errors.password)}
                  />
                  {errors.password && (
                    <p className="text-xs text-destructive">{errors.password.message}</p>
                  )}
                </div>
                <p className="text-xs text-muted-foreground sm:col-span-2">
                  Password wajib bila email belum punya akun Solutest. Bila sudah punya, kosongkan;
                  guru login dengan password akun Solutest-nya.
                </p>
              </>
            )}
            {!creating && (
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Nama & email mengikuti akun Solutest dan tidak bisa diubah di sini.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-school">Sekolah</Label>
            <Controller
              control={form.control}
              name="school_id"
              render={({ field }) => (
                <SelectField
                  id="t-school"
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
            {schools.data?.length === 0 && (
              <p className="text-xs text-warning">
                Belum ada sekolah mitra. Tambahkan dulu di menu Sekolah.
              </p>
            )}
          </div>
        </form>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button type="submit" form="teacher-form" disabled={save.isPending}>
            {save.isPending && <Iconify icon="svg-spinners:180-ring" size={16} />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
