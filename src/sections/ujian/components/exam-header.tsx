'use client';

/* eslint-disable @next/next/no-img-element -- logo mitra (data URL / storage eksternal) */

import type { ExamSession } from 'src/models/exam';

import { useState } from 'react';

import { Button } from 'src/components/ui/button';
import {
  Sheet,
  SheetTitle,
  SheetHeader,
  SheetContent,
  SheetDescription,
} from 'src/components/ui/sheet';

import { SOLUTEST_LOGO } from 'src/config/theme';

import { useTenant } from 'src/hooks/use-tenant';

import { cn } from 'src/lib/utils';
import { formatClock } from 'src/utils/format';

import { FONT_SCALES, useExamUiStore } from 'src/state/exam-ui-store';

import { Iconify } from 'src/components/iconify/iconify';

import { NumberGrid } from './number-grid';
import { useCountdown } from '../hooks/use-exam-timers';

interface Props {
  session: ExamSession;
  current?: number;
  onPick: (nomor: number) => void;
}

/** Header ujian: logo mitra, judul, sisa waktu, ukuran huruf, daftar nomor. */
export function ExamHeader({ session, current, onPick }: Props) {
  const { branding } = useTenant();
  const [open, setOpen] = useState(false);
  const { seconds } = useCountdown(session.deadline);
  const fontScale = useExamUiStore((s) => s.fontScale);
  const setFontScale = useExamUiStore((s) => s.setFontScale);
  const scaleIndex = FONT_SCALES.indexOf(fontScale as (typeof FONT_SCALES)[number]);
  const low = seconds > 0 && seconds <= 600;

  return (
    <header className="sticky top-0 z-30 bg-primary text-primary-foreground shadow-md">
      <div className="mx-auto flex h-16 max-w-[1600px] items-center gap-3 px-4 sm:px-6">
        <span className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-xl bg-white p-1">
          <img
            src={branding.logo_url || SOLUTEST_LOGO.icon}
            alt={`Logo ${branding.name}`}
            className="size-full object-contain"
          />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold sm:text-base">{session.title}</p>
          <p className="truncate text-xs opacity-80">
            {session.subjects.map((s) => s.name).join(' · ')} · {session.total} soal
          </p>
        </div>

        <div
          className="hidden items-center gap-1 rounded-lg bg-white/10 p-1 md:flex"
          role="group"
          aria-label="Ukuran huruf soal"
        >
          <button
            type="button"
            aria-label="Perkecil huruf"
            disabled={scaleIndex <= 0}
            onClick={() => setFontScale(FONT_SCALES[Math.max(0, scaleIndex - 1)])}
            className="grid size-8 place-items-center rounded-md text-sm font-semibold hover:bg-white/15 disabled:opacity-40"
          >
            A−
          </button>
          <button
            type="button"
            aria-label="Perbesar huruf"
            disabled={scaleIndex >= FONT_SCALES.length - 1}
            onClick={() =>
              setFontScale(FONT_SCALES[Math.min(FONT_SCALES.length - 1, scaleIndex + 1)])
            }
            className="grid size-8 place-items-center rounded-md text-base font-semibold hover:bg-white/15 disabled:opacity-40"
          >
            A+
          </button>
        </div>

        <div
          className={cn(
            'flex items-center gap-2 rounded-xl px-3 py-1.5',
            low
              ? 'animate-pulse bg-destructive text-white motion-reduce:animate-none'
              : 'bg-white/12'
          )}
          role="timer"
          aria-live={low ? 'polite' : 'off'}
          aria-label={`Sisa waktu ${formatClock(seconds)}`}
        >
          <Iconify icon="solar:stopwatch-linear" size={20} />
          <span className="font-mono text-lg font-semibold tabular-nums">
            {formatClock(seconds)}
          </span>
        </div>

        <Button
          variant="secondary"
          size="sm"
          onClick={() => setOpen(true)}
          className="bg-white text-primary hover:bg-white/90"
        >
          <Iconify icon="solar:widget-2-linear" size={18} />
          <span className="hidden sm:inline">Daftar soal</span>
        </Button>
      </div>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Daftar soal</SheetTitle>
            <SheetDescription>
              Pilih nomor untuk berpindah soal. Jawaban tersimpan otomatis.
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <NumberGrid
              session={session}
              current={current}
              onPick={(n) => {
                setOpen(false);
                onPick(n);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </header>
  );
}
