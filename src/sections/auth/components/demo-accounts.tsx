'use client';

import type { LoginBody } from 'src/models/auth';

import { ENV } from 'src/config/env';

import { Iconify } from 'src/components/iconify/iconify';

/** Akun uji mode mock (password sama untuk semua, lihat src/mocks/db.ts). */
const DEMO = [
  { email: 'admin@mitra.test', role: 'Admin Mitra', icon: 'solar:shield-user-linear' },
  { email: 'guru@mitra.test', role: 'Guru', icon: 'solar:square-academic-cap-linear' },
  { email: 'siswa@mitra.test', role: 'Siswa', icon: 'solar:user-linear' },
];
const DEMO_PASSWORD = 'mitra123';

export function DemoAccounts({ onPick }: { onPick: (body: LoginBody) => void }) {
  if (!ENV.mock) return null;
  return (
    <div className="rounded-xl border border-dashed border-warning/40 bg-warning/6 p-4">
      <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-warning">
        <Iconify icon="solar:test-tube-linear" size={18} />
        Mode simulasi — pilih akun uji
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        {DEMO.map((d) => (
          <button
            key={d.email}
            type="button"
            onClick={() => onPick({ email: d.email, password: DEMO_PASSWORD })}
            className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-left text-sm ring-1 ring-border transition-colors hover:ring-primary"
          >
            <Iconify icon={d.icon} size={18} className="text-primary" />
            <span className="min-w-0">
              <span className="block font-medium">{d.role}</span>
              <span className="block truncate text-xs text-muted-foreground">{d.email}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        Password: <code className="font-mono">{DEMO_PASSWORD}</code>
      </p>
    </div>
  );
}
