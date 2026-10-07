'use client';

import type { ReactNode } from 'react';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useRef, useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';

import { Button } from 'src/components/ui/button';

import { SISWA_PATHS } from 'src/config/paths';

import { useExamHydration, useExamAnswerStore, useExamSessionStore } from 'src/state/exam-store';

import { practiceService } from 'src/services/student';

import { ErrorState } from 'src/components/feedback/error-state';
import { PageLoader } from 'src/components/feedback/page-loader';
import { ConfirmDialog } from 'src/components/feedback/confirm-dialog';

import { ExamHeader } from '../components/exam-header';
import { useCountdown } from '../hooks/use-exam-timers';
import { enterFullscreen } from '../hooks/use-exam-flow';
import { useCheatDetection } from '../hooks/use-cheat-detection';
import { useExamNavigation } from '../hooks/use-exam-navigation';
import { useAutoSave, useSubmitExam, reportViolation } from '../hooks/use-exam-actions';
import {
  decodeNumber,
  computeDeadline,
  flattenQuestions,
  normalizeSavedAnswers,
} from '../helpers/exam';

const PERIODIC_SAVE_MS = 60_000;

/**
 * Memastikan store berisi sesi practice di URL. Bila store kosong / milik tryout lain (refresh
 * setelah storage dibersihkan, buka dari perangkat lain, deep link) → muat ulang dari server.
 */
function useEnsureSession(practiceId: number, hydrated: boolean) {
  const session = useExamSessionStore((s) => s.session);
  const setSession = useExamSessionStore((s) => s.setSession);
  const answersOwner = useExamAnswerStore((s) => s.practiceId);
  const setAnswers = useExamAnswerStore((s) => s.setAnswers);
  const needsSession = hydrated && session?.practice_id !== practiceId;

  const resume = useQuery({
    queryKey: ['exam', 'resume', practiceId],
    queryFn: async () => {
      const data = await practiceService.resume(practiceId);
      return { ...data, deadline: computeDeadline(data.start_time, data.duration, data.end_time) };
    },
    enabled: needsSession,
    retry: 1,
    gcTime: 0,
  });

  useEffect(() => {
    if (needsSession && resume.data) setSession(resume.data);
  }, [needsSession, resume.data, setSession]);

  // Jawaban milik practice lain → ambil jawaban tersimpan server untuk practice ini.
  useEffect(() => {
    if (!hydrated || !session || session.practice_id !== practiceId || answersOwner === practiceId)
      return;
    practiceService
      .savedAnswers(practiceId)
      .then((saved) =>
        setAnswers(practiceId, normalizeSavedAnswers(saved, flattenQuestions(session)))
      )
      .catch(() => setAnswers(practiceId, []));
  }, [hydrated, session, practiceId, answersOwner, setAnswers]);

  return { session: session?.practice_id === practiceId ? session : null, resume };
}

/** Cegah salin/klik kanan selama ujian (padanan useBlockSelectText). */
function useBlockCopy() {
  useEffect(() => {
    const block = (e: Event) => e.preventDefault();
    document.addEventListener('copy', block);
    document.addEventListener('contextmenu', block);
    return () => {
      document.removeEventListener('copy', block);
      document.removeEventListener('contextmenu', block);
    };
  }, []);
}

export function ExamShell({ children }: { children: ReactNode }) {
  const params = useParams<{ practiceId: string; nomor?: string }>();
  const pathname = usePathname();
  const practiceId = Number(params.practiceId);
  const current = params.nomor ? decodeNumber(params.nomor) : undefined;
  const hydrated = useExamHydration();
  const { session, resume } = useEnsureSession(practiceId, hydrated);
  const clearAnswers = useExamAnswerStore((s) => s.clearAnswers);
  const { goTo } = useExamNavigation();
  const { save } = useAutoSave();
  const submit = useSubmitExam();
  const { expired } = useCountdown(session?.deadline);
  const [kickedOut, setKickedOut] = useState(false);
  useBlockCopy();

  // Simpan berkala & saat tab disembunyikan (pengaman tambahan selain simpan saat pindah soal).
  useEffect(() => {
    if (!session) return undefined;
    const id = setInterval(() => save(), PERIODIC_SAVE_MS);
    const onHide = () => document.visibilityState === 'hidden' && save();
    document.addEventListener('visibilitychange', onHide);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', onHide);
    };
  }, [session, save]);

  // Waktu habis saat sedang mengerjakan → kumpulkan otomatis sekali (CountDown fe-solutest).
  // Bila halaman dibuka setelah tenggat lewat, siswa menekan "Kumpulkan" di dialog wajib (TimeOver).
  const wasRunning = useRef(false);
  useEffect(() => {
    if (session && !expired) wasRunning.current = true;
    if (
      expired &&
      wasRunning.current &&
      !submit.isPending &&
      !submit.isSuccess &&
      !submit.isError
    ) {
      wasRunning.current = false;
      submit.mutate();
    }
  }, [expired, session, submit]);

  const cheat = useCheatDetection({
    enabled: Boolean(session) && !expired && !submit.isPending && !kickedOut,
    isCheatDetectionActive: session?.is_cheat_detection ?? false,
    maxViolations: session?.max_violations ?? 3,
    onViolation: reportViolation,
    onResetAnswers: clearAnswers,
    onSubmitAnswers: () => {
      setKickedOut(true);
      submit.mutate();
    },
  });

  if (!hydrated || (!session && resume.isFetching))
    return <PageLoader fullscreen label="Menyiapkan soal…" />;

  if (!session) {
    return (
      <div className="grid min-h-dvh place-items-center bg-page p-6">
        <div className="w-full max-w-md rounded-card bg-card p-6 shadow-card">
          <ErrorState
            title="Gagal memuat data ujian"
            error={resume.error ?? new Error('Sesi tryout tidak ditemukan atau sudah dikumpulkan.')}
            onRetry={() => resume.refetch()}
          />
          <Button variant="outline" className="w-full" asChild>
            <Link href={SISWA_PATHS.root}>Kembali ke beranda</Link>
          </Button>
        </div>
      </div>
    );
  }

  const onConfirmPage = pathname.endsWith('/konfirmasi');

  return (
    <div className="no-select min-h-dvh bg-page">
      <ExamHeader session={session} current={onConfirmPage ? undefined : current} onPick={goTo} />
      {children}

      {/* Pelanggaran deteksi kecurangan */}
      <ConfirmDialog
        open={cheat.open && !expired}
        onOpenChange={() => {}}
        tone="warning"
        icon="solar:shield-warning-linear"
        title={
          session.is_cheat_detection ? 'Aktivitas di luar ujian terdeteksi' : 'Peringatan sistem'
        }
        description={
          <>
            {cheat.reason}
            {session.is_cheat_detection && !kickedOut && (
              <span className="mt-2 block font-semibold text-foreground">
                Peringatan ke-{cheat.violationCount} dari {cheat.maxViolations}. Mohon tetap di
                halaman ujian.
              </span>
            )}
          </>
        }
        cancelLabel={null}
        confirmLabel={kickedOut ? 'Mengumpulkan…' : 'Lanjutkan mengerjakan'}
        loading={kickedOut && submit.isPending}
        onConfirm={() => {
          if (kickedOut) return;
          enterFullscreen();
          cheat.setOpen(false);
        }}
      />

      {/* Waktu habis: dialog wajib kumpul (tidak bisa ditutup), juga saat mendarat setelah tenggat lewat */}
      <ConfirmDialog
        open={expired && !kickedOut}
        onOpenChange={() => {}}
        tone="danger"
        icon="solar:stopwatch-linear"
        title="Waktu habis"
        description="Waktu pengerjaan sudah habis. Jawaban yang tersimpan akan dikirim sebagai jawaban akhir."
        cancelLabel={null}
        confirmLabel={submit.isError ? 'Coba kirim lagi' : 'Kumpulkan'}
        loading={submit.isPending}
        onConfirm={() => submit.mutate()}
      />
    </div>
  );
}
