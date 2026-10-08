'use client';

import type { ExamSession } from 'src/models/exam';

import { cn } from 'src/lib/utils';
import { formatClock } from 'src/utils/format';

import { Iconify } from 'src/components/iconify/iconify';

import { useCountdown } from '../hooks/use-exam-timers';

/**
 * Header ujian (gaya Solutest): band warna aksen berisi nama latihan & mapel di kiri,
 * waktu tersisa besar di kanan. Sisa ≤ 10 menit → timer berubah merah.
 */
export function ExamHeader({ session }: { session: ExamSession }) {
  const { seconds } = useCountdown(session.deadline);
  const low = seconds > 0 && seconds <= 600;
  const subjects = session.subjects.map((s) => s.name).join(', ') || '-';

  return (
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-[0_6px_20px_-12px_var(--primary)]">
      <div className="mx-auto flex max-w-[1440px] items-center gap-4 px-4 py-4 sm:px-8 md:py-5">
        <dl className="grid min-w-0 flex-1 grid-cols-[auto_auto_1fr] gap-x-2 gap-y-1 text-sm font-bold md:text-base">
          <dt className="hidden sm:block">Nama Latihan Soal</dt>
          <span aria-hidden className="hidden sm:block">
            :
          </span>
          <dd className="col-span-3 truncate sm:col-span-1">{session.title}</dd>
          <dt className="hidden sm:block">Mata Pelajaran</dt>
          <span aria-hidden className="hidden sm:block">
            :
          </span>
          <dd className="col-span-3 truncate text-xs font-semibold opacity-80 sm:col-span-1 sm:text-base sm:font-bold sm:opacity-100">
            {subjects}
          </dd>
        </dl>

        <div
          role="timer"
          aria-live={low ? 'polite' : 'off'}
          aria-label={`Sisa waktu ${formatClock(seconds)}`}
          className={cn(
            'shrink-0 text-right',
            low && 'rounded-xl bg-destructive px-3 py-1.5 text-white'
          )}
        >
          <p className="flex items-center justify-end gap-1 text-xs font-bold md:text-sm">
            {low && (
              <Iconify
                icon="solar:alarm-bold"
                size={14}
                className="animate-pulse motion-reduce:animate-none"
              />
            )}
            Waktu Tersisa :
          </p>
          <p className="text-2xl leading-tight font-extrabold tracking-[0.01em] tabular-nums md:text-[2.4rem]">
            {formatClock(seconds)}
          </p>
        </div>
      </div>
    </header>
  );
}
