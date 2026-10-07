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
import { SectionCard } from 'src/components/data-display/section-card';

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
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <WelcomeCard
          title={`${greeting()}, ${firstName}!`}
          subtitle={`Tryout dari ${branding.name}. Semangat mengerjakan!`}
        >
          <form onSubmit={join} className="mt-5 max-w-md" noValidate>
            <label htmlFor="join-code" className="mb-1.5 block text-sm font-medium">
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
                className="font-mono uppercase"
                aria-invalid={Boolean(codeError)}
                aria-describedby={codeError ? 'join-code-error' : undefined}
              />
              <Button type="submit">Gabung</Button>
            </div>
            {codeError && (
              <p id="join-code-error" className="mt-1 text-xs text-destructive">
                {codeError}
              </p>
            )}
          </form>
        </WelcomeCard>
        <div className="grid grid-cols-3 gap-4 xl:grid-cols-1 xl:gap-3">
          <KpiCard
            label="Tryout selesai"
            value={String(summary.completedCount)}
            icon="solar:checklist-minimalistic-linear"
            className="p-4"
          />
          <KpiCard
            label="Rata-rata skor"
            value={formatScore(summary.averageScore)}
            icon="solar:medal-ribbon-star-linear"
            tone="accent"
            className="p-4"
          />
          <KpiCard
            label="Skor terbaik"
            value={formatScore(summary.bestScore)}
            icon="solar:cup-star-linear"
            tone="secondary"
            className="p-4"
          />
        </div>
      </div>

      {unfinished.data && unfinished.data.length > 0 && (
        <section aria-labelledby="unfinished-title" className="space-y-3">
          <h2 id="unfinished-title" className="flex items-center gap-2 text-lg font-semibold">
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

      <SectionCard
        title="Tryout aktif & terjadwal"
        action={
          <Button variant="outline" size="sm" asChild>
            <Link href={SISWA_PATHS.tryout}>
              Semua tryout
              <Iconify icon="solar:arrow-right-linear" size={16} />
            </Link>
          </Button>
        }
      >
        {tryouts.isPending && (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-52 rounded-card" />
            ))}
          </div>
        )}
        {tryouts.isError && <ErrorState error={tryouts.error} onRetry={() => tryouts.refetch()} />}
        {tryouts.data && summary.active.length === 0 && (
          <EmptyState
            title="Belum ada tryout aktif"
            description="Tryout baru dari lembagamu akan muncul di sini."
            icon="solar:calendar-linear"
          />
        )}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {summary.active.map((t) => (
            <TryoutCard key={t.id} t={t} />
          ))}
        </div>
      </SectionCard>

      {summary.done.length > 0 && (
        <SectionCard
          title="Tryout yang sudah dikerjakan"
          action={
            <Button variant="outline" size="sm" asChild>
              <Link href={SISWA_PATHS.history}>Riwayat lengkap</Link>
            </Button>
          }
        >
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {summary.done.slice(0, 3).map((t) => (
              <TryoutCard key={t.id} t={t} />
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}
