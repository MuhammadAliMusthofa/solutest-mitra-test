'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Input } from 'src/components/ui/input';
import { Button } from 'src/components/ui/button';
import { Skeleton } from 'src/components/ui/skeleton';

import { SISWA_PATHS } from 'src/config/paths';

import { useTenant } from 'src/hooks/use-tenant';
import { useCurrentUser } from 'src/hooks/use-session';

import { greeting, formatScore } from 'src/utils/format';

import { Iconify } from 'src/components/iconify/iconify';
import { KpiCard } from 'src/components/data-display/kpi-card';
import { ErrorState } from 'src/components/feedback/error-state';
import { EmptyState } from 'src/components/feedback/empty-state';
import { WelcomeCard } from 'src/components/data-display/welcome-card';

import { useExamFlow } from 'src/sections/ujian/hooks/use-exam-flow';
import { summarizeStudentTryouts } from 'src/sections/jadwal-tryout/helpers/schedule';

import { TryoutCard, UnfinishedCard } from '../components/tryout-cards';
import { useUnfinished, useStudentTryouts } from '../hooks/use-student-data';

const CODE_RE = /^SLT-\d{6}-TKA$/i;

export function BerandaSiswaContainer() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { branding } = useTenant();
  const tryouts = useStudentTryouts();
  const unfinished = useUnfinished();
  const { resume, loading } = useExamFlow();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const summary = summarizeStudentTryouts(tryouts.data ?? []);
  const firstName = user?.full_name.split(' ')[0] ?? '';

  const join = (e: React.FormEvent) => {
    e.preventDefault();
    const value = code.trim().toUpperCase();
    if (!CODE_RE.test(value)) {
      setCodeError('Format kode: SLT-123456-TKA');
      return;
    }
    router.push(SISWA_PATHS.tryoutDetail(value));
  };

  return (
    <div className="space-y-8">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <WelcomeCard
          variant="brand"
          title={`${greeting()}, ${firstName}!`}
          subtitle={`Tryout dari ${branding.name}. Semangat mengerjakan!`}
        >
          <form onSubmit={join} className="mt-6 max-w-md" noValidate>
            <label
              htmlFor="join-code"
              className="mb-2 flex items-center gap-1.5 text-sm font-semibold"
            >
              <Iconify icon="solar:key-minimalistic-square-linear" size={18} />
              Punya kode tryout?
            </label>
            <div className="flex gap-2">
              <Input
                id="join-code"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setCodeError('');
                }}
                placeholder="SLT-123456-TKA"
                className="h-12 rounded-full border-transparent px-5 font-mono uppercase shadow-card focus-visible:border-transparent focus-visible:ring-primary-foreground/30"
                aria-invalid={Boolean(codeError)}
                aria-describedby={codeError ? 'join-code-error' : undefined}
              />
              <Button
                type="submit"
                size="lg"
                className="bg-brand-accent text-brand-accent-foreground hover:bg-[color-mix(in_oklab,var(--brand-accent),black_8%)] hover:shadow-[0_6px_16px_-6px_var(--brand-accent)]"
              >
                Gabung
                <Iconify icon="solar:arrow-right-linear" size={18} />
              </Button>
            </div>
            {codeError && (
              <p
                id="join-code-error"
                className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-card px-3 py-1 text-xs font-semibold text-destructive"
              >
                {codeError}
              </p>
            )}
          </form>
        </WelcomeCard>
        <div className="grid gap-4 sm:grid-cols-3 xl:grid-cols-1">
          <KpiCard
            label="Tryout selesai"
            value={String(summary.completedCount)}
            icon="solar:checklist-minimalistic-linear"
            className="flex-row items-center gap-4 p-4 md:p-5"
          />
          <KpiCard
            label="Rata-rata skor"
            value={formatScore(summary.averageScore)}
            icon="solar:medal-ribbon-star-linear"
            tone="accent"
            className="flex-row items-center gap-4 p-4 md:p-5"
          />
          <KpiCard
            label="Skor terbaik"
            value={formatScore(summary.bestScore)}
            icon="solar:cup-star-linear"
            tone="secondary"
            className="flex-row items-center gap-4 p-4 md:p-5"
          />
        </div>
      </div>

      {unfinished.data && unfinished.data.length > 0 && (
        <section aria-labelledby="unfinished-title" className="space-y-3">
          <h2 id="unfinished-title" className="flex items-center gap-2 text-lg font-bold">
            Tryout belum selesai
            <span className="grid size-6 place-items-center rounded-full bg-warning text-xs text-white">
              {unfinished.data.length}
            </span>
          </h2>
          {unfinished.data.map((item) => (
            <UnfinishedCard
              key={item.practice_id}
              item={item}
              loading={loading === item.practice_id}
              onContinue={() => resume(item.practice_id)}
            />
          ))}
        </section>
      )}

      <section aria-labelledby="active-title" className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 id="active-title" className="text-lg font-bold md:text-xl">
              Tryout aktif & terjadwal
            </h2>
            <p className="text-sm text-muted-foreground">Kerjakan sebelum jadwalnya berakhir.</p>
          </div>
          <Button variant="soft" size="sm" asChild>
            <Link href={SISWA_PATHS.tryout}>
              Semua tryout
              <Iconify icon="solar:arrow-right-linear" size={16} />
            </Link>
          </Button>
        </div>
        {tryouts.isPending && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-52 rounded-card" />
            ))}
          </div>
        )}
        {tryouts.isError && (
          <div className="rounded-card bg-card shadow-card">
            <ErrorState error={tryouts.error} onRetry={() => tryouts.refetch()} />
          </div>
        )}
        {tryouts.data && summary.active.length === 0 && (
          <div className="rounded-card bg-card shadow-card">
            <EmptyState
              title="Belum ada tryout aktif"
              description="Tryout baru dari lembagamu akan muncul di sini."
              icon="solar:calendar-linear"
            />
          </div>
        )}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {summary.active.map((t) => (
            <TryoutCard key={t.id} t={t} />
          ))}
        </div>
      </section>

      {summary.done.length > 0 && (
        <section aria-labelledby="done-title" className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="done-title" className="text-lg font-bold md:text-xl">
                Tryout yang sudah dikerjakan
              </h2>
              <p className="text-sm text-muted-foreground">Lihat skor dan laporan performanya.</p>
            </div>
            <Button variant="soft" size="sm" asChild>
              <Link href={SISWA_PATHS.history}>
                Riwayat lengkap
                <Iconify icon="solar:arrow-right-linear" size={16} />
              </Link>
            </Button>
          </div>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {summary.done.slice(0, 3).map((t) => (
              <TryoutCard key={t.id} t={t} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
