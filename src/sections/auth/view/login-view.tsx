'use client';

/* eslint-disable @next/next/no-img-element -- logo mitra bisa berupa data URL / domain apa saja */

import { useSearchParams } from 'next/navigation';

import { SOLUTEST_LOGO } from 'src/config/theme';

import { errorMessage } from 'src/core/http';

import { useTenant } from 'src/hooks/use-tenant';

import { Iconify } from 'src/components/iconify/iconify';

import { useLogin } from '../hooks/use-login';
import { LoginForm } from '../components/login-form';

const HIGHLIGHTS = [
  { icon: 'solar:pen-new-square-linear', text: 'Tryout terjadwal dengan deteksi kecurangan' },
  { icon: 'solar:users-group-rounded-linear', text: 'Siswa & guru per sekolah dalam satu lembaga' },
  { icon: 'solar:chart-square-linear', text: 'Hasil & predikat siswa langsung setelah tryout' },
];

export function LoginView() {
  const params = useSearchParams();
  const { branding } = useTenant();
  const login = useLogin(params.get('next'));
  const expired = params.get('expired') === '1';
  const disabled = params.get('disabled') === '1';

  return (
    <div className="grid min-h-dvh lg:grid-cols-[1.05fr_1fr]">
      {/* Panel brand */}
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col">
        <div className="absolute -top-24 -right-24 size-96 rounded-full bg-white/8" />
        <div className="absolute -bottom-32 -left-20 size-[28rem] rounded-full bg-secondary/40 blur-3xl" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-14 place-items-center overflow-hidden rounded-2xl bg-white p-1.5">
            <img
              src={branding.logo_url || SOLUTEST_LOGO.icon}
              alt={`Logo ${branding.name}`}
              className="size-full object-contain"
            />
          </span>
          <div>
            <p className="text-lg font-semibold">{branding.name}</p>
            <p className="text-sm opacity-80">bersama Solutest</p>
          </div>
        </div>

        <div className="relative mt-auto max-w-lg">
          <h1 className="text-4xl leading-tight font-semibold">
            {branding.tagline || 'Platform tryout & analitik untuk lembaga mitra'}
          </h1>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map((h) => (
              <li key={h.text} className="flex items-center gap-3 text-[0.95rem] opacity-90">
                <span className="grid size-10 place-items-center rounded-xl bg-white/12">
                  <Iconify icon={h.icon} size={22} />
                </span>
                {h.text}
              </li>
            ))}
          </ul>
        </div>
        <img
          src={SOLUTEST_LOGO.inlineWhite}
          alt="Solutest"
          className="relative mt-12 h-7 w-auto self-start opacity-80"
        />
      </section>

      {/* Form */}
      <section className="flex items-center justify-center px-5 py-10">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center gap-3 lg:hidden">
            <span className="grid size-12 place-items-center overflow-hidden rounded-xl bg-white p-1 ring-1 ring-border">
              <img
                src={branding.logo_url || SOLUTEST_LOGO.icon}
                alt={`Logo ${branding.name}`}
                className="size-full object-contain"
              />
            </span>
            <p className="font-semibold">{branding.name}</p>
          </div>

          <div>
            <h2 className="text-2xl font-semibold">Masuk ke akun Anda</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Untuk admin mitra, guru, dan siswa {branding.short_name || branding.name}.
            </p>
          </div>

          {disabled && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/8 px-3 py-2.5 text-sm text-destructive">
              <Iconify icon="solar:user-block-linear" size={18} className="mt-0.5" />
              Akun Anda dinonaktifkan oleh admin. Hubungi admin lembaga Anda.
            </div>
          )}
          {expired && (
            <div className="flex items-start gap-2 rounded-lg bg-warning/10 px-3 py-2.5 text-sm text-warning">
              <Iconify icon="solar:clock-circle-linear" size={18} className="mt-0.5" />
              Sesi Anda telah berakhir. Silakan masuk kembali.
            </div>
          )}

          <LoginForm
            loading={login.isPending}
            error={login.isError ? errorMessage(login.error) : null}
            onSubmit={(body) => login.mutate(body)}
          />

          <p className="text-center text-xs text-muted-foreground">
            Masuk dengan akun Solutest yang didaftarkan oleh {branding.short_name || branding.name}.
          </p>
        </div>
      </section>
    </div>
  );
}
