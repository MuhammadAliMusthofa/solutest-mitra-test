'use client';

import type { LoginBody } from 'src/models/auth';

import { z } from 'zod';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Button } from 'src/components/ui/button';

import { Iconify } from 'src/components/iconify/iconify';

const schema = z.object({
  email: z.string().trim().min(1, 'Email wajib diisi').email('Format email tidak valid'),
  password: z.string().min(1, 'Password wajib diisi'),
});

interface Props {
  onSubmit: (body: LoginBody) => void;
  loading?: boolean;
  error?: string | null;
  /** isi otomatis dari kartu akun demo */
  preset?: LoginBody | null;
}

export function LoginForm({ onSubmit, loading, error, preset }: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginBody>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
    values: preset ?? undefined,
  });
  const { errors } = form.formState;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5" noValidate>
      {error && (
        <div
          role="alert"
          className="flex items-start gap-2 rounded-lg bg-destructive/8 px-3 py-2.5 text-sm text-destructive"
        >
          <Iconify icon="solar:danger-circle-linear" size={18} className="mt-0.5" />
          {error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="nama@lembaga.sch.id"
          aria-invalid={Boolean(errors.email)}
          className="h-12"
          {...form.register('email')}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Masukkan password"
            aria-invalid={Boolean(errors.password)}
            className="h-12 pr-12"
            {...form.register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
            className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:text-foreground"
          >
            <Iconify
              icon={showPassword ? 'solar:eye-closed-linear' : 'solar:eye-linear'}
              size={20}
            />
          </button>
        </div>
        {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
      </div>

      <Button type="submit" size="lg" className="h-12 w-full" disabled={loading}>
        {loading ? <Iconify icon="svg-spinners:180-ring" size={18} /> : null}
        Masuk
      </Button>
      <p className="text-center text-xs text-muted-foreground">
        Lupa password? Hubungi admin lembaga Anda.
      </p>
    </form>
  );
}
