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
import { Switch } from 'src/components/ui/switch';
import { Checkbox } from 'src/components/ui/checkbox';
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from 'src/components/ui/dialog';

import { errorMessage } from 'src/core/http';

import { memberService } from 'src/services/member';

import { Iconify } from 'src/components/iconify/iconify';

const schema = (creating: boolean) =>
  z.object({
    name: z.string().trim().min(1, 'Nama wajib diisi'),
    email: z.string().trim().email('Format email tidak valid'),
    phone: z.string().trim().optional(),
    subject: z.string().trim().optional(),
    password: creating
      ? z.string().min(8, 'Password minimal 8 karakter')
      : z.string().refine((v) => !v || v.length >= 8, 'Password minimal 8 karakter'),
    school_ids: z.array(z.number()).min(1, 'Pilih minimal satu sekolah'),
    active: z.boolean(),
  });

type FormValues = z.infer<ReturnType<typeof schema>>;

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
    queryKey: ['members', 'schools'],
    queryFn: memberService.schools,
    enabled: open,
  });
  const form = useForm<FormValues>({ resolver: zodResolver(schema(creating)) });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      name: initial?.name ?? '',
      email: initial?.email ?? '',
      phone: initial?.phone ?? '',
      subject: initial?.subject ?? '',
      password: '',
      school_ids: initial?.schools.map((s) => s.id) ?? [],
      active: (initial?.status ?? 'active') === 'active',
    });
  }, [open, initial, form]);

  const save = useMutation({
    mutationFn: (v: FormValues) => {
      const body = {
        name: v.name,
        email: v.email,
        phone: v.phone,
        subject: v.subject,
        school_ids: v.school_ids,
        status: v.active ? ('active' as const) : ('inactive' as const),
        ...(v.password ? { password: v.password } : {}),
      };
      return initial
        ? memberService.updateTeacher(initial.id, body)
        : memberService.createTeacher(body);
    },
    onSuccess: () => {
      toast.success(creating ? 'Akun guru dibuat' : 'Data guru diperbarui');
      qc.invalidateQueries({ queryKey: ['members', 'teachers'] });
      onOpenChange(false);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{creating ? 'Tambah guru' : 'Ubah data guru'}</DialogTitle>
          <DialogDescription>
            Guru hanya melihat analitik siswa dari sekolah yang dipilih.
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
              <Input id="t-name" {...form.register('name')} aria-invalid={Boolean(errors.name)} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-email">Email</Label>
              <Input
                id="t-email"
                type="email"
                {...form.register('email')}
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-phone">No. HP (opsional)</Label>
              <Input id="t-phone" {...form.register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="t-subject">Mapel diampu (opsional)</Label>
              <Input id="t-subject" {...form.register('subject')} placeholder="mis. Matematika" />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="t-password">
                {creating ? 'Password' : 'Password baru (kosongkan bila tidak diubah)'}
              </Label>
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
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Sekolah yang diampu</legend>
            <Controller
              control={form.control}
              name="school_ids"
              render={({ field }) => (
                <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
                  {(schools.data ?? []).map((s) => (
                    <label
                      key={s.id}
                      className="flex items-start gap-2 rounded-lg px-3 py-2 text-sm ring-1 ring-border has-[:checked]:bg-primary/6 has-[:checked]:ring-primary/40"
                    >
                      <Checkbox
                        className="mt-0.5"
                        checked={field.value?.includes(s.id)}
                        onCheckedChange={(v) =>
                          field.onChange(
                            v
                              ? [...(field.value ?? []), s.id]
                              : (field.value ?? []).filter((x) => x !== s.id)
                          )
                        }
                      />
                      <span>
                        <span className="block font-medium">{s.name}</span>
                        <span className="block text-xs text-muted-foreground">
                          {s.city} · {s.level}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.school_ids && (
              <p className="text-xs text-destructive">{errors.school_ids.message}</p>
            )}
          </fieldset>
          <Controller
            control={form.control}
            name="active"
            render={({ field }) => (
              <label
                htmlFor="t-active"
                className="flex items-center justify-between rounded-lg bg-muted/50 px-4 py-3"
              >
                <span>
                  <span className="block text-sm font-medium">Akun aktif</span>
                  <span className="block text-xs text-muted-foreground">
                    Akun nonaktif tidak bisa login.
                  </span>
                </span>
                <Switch id="t-active" checked={field.value} onCheckedChange={field.onChange} />
              </label>
            )}
          />
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
