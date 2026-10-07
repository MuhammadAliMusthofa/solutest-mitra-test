'use client';

// Alur masuk ke halaman pengerjaan: mulai baru & lanjutkan (resume). Mekanisme sama dengan
// fe-solutest: soal → store soal, jawaban tersimpan server → store jawaban, lalu ke nomor 1.

import type { ExamSession } from 'src/models/exam';

import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';

import { SISWA_PATHS } from 'src/config/paths';

import { errorMessage } from 'src/core/http';

import { useExamAnswerStore, useExamSessionStore } from 'src/state/exam-store';

import { practiceService, studentTryoutService } from 'src/services/student';

import {
  encodeNumber,
  computeDeadline,
  flattenQuestions,
  normalizeSavedAnswers,
} from '../helpers/exam';

/** Masuk mode layar penuh (harus dipanggil dari gesture pengguna). */
export const enterFullscreen = () => {
  if (typeof document === 'undefined' || document.fullscreenElement) return;
  document.documentElement.requestFullscreen?.().catch(() => {});
};

export function useExamFlow() {
  const router = useRouter();
  const qc = useQueryClient();
  const setSession = useExamSessionStore((s) => s.setSession);
  const setAnswers = useExamAnswerStore((s) => s.setAnswers);
  const [loading, setLoading] = useState<string | number | null>(null);

  /** Isi store dari data sesi + jawaban tersimpan (opsional), lalu buka nomor 1. */
  const enter = useCallback(
    async (session: ExamSession) => {
      const prepared = {
        ...session,
        deadline: computeDeadline(session.start_time, session.duration, session.end_time),
      };
      setSession(prepared);
      // Jawaban tersimpan adalah data pendukung: bila gagal dimuat, siswa tetap boleh lanjut
      // (mulai tanpa jawaban tersimpan) — tidak diblokir (Issue #1 fe-solutest).
      try {
        const saved = await practiceService.savedAnswers(session.practice_id);
        setAnswers(session.practice_id, normalizeSavedAnswers(saved, flattenQuestions(prepared)));
      } catch {
        setAnswers(session.practice_id, []);
      }
      qc.invalidateQueries({ queryKey: ['student'] });
      router.push(SISWA_PATHS.exam(session.practice_id, encodeNumber(1)));
    },
    [qc, router, setAnswers, setSession]
  );

  /** Mulai tryout dengan kode (atau lanjutkan bila sudah pernah mulai). */
  const start = useCallback(
    async (code: string) => {
      setLoading(code);
      enterFullscreen();
      try {
        const session = await studentTryoutService.start(code);
        await enter(session);
      } catch (err) {
        toast.error(errorMessage(err));
      } finally {
        setLoading(null);
      }
    },
    [enter]
  );

  /**
   * Lanjutkan pengerjaan yang belum dikumpulkan. Data soal WAJIB berhasil dimuat sebelum navigasi
   * — bila gagal, berhenti dengan pesan error (perbaikan silent-fail Issue #1 fe-solutest).
   * Waktu yang sudah habis tidak diblokir di sini: halaman ujian menampilkan dialog wajib kumpul.
   */
  const resume = useCallback(
    async (practiceId: number) => {
      setLoading(practiceId);
      enterFullscreen();
      try {
        const session = await practiceService.resume(practiceId);
        if (!session?.sections?.length) {
          toast.error('Gagal memuat data ujian, silakan coba lagi');
          return;
        }
        await enter(session);
      } catch (err) {
        toast.error(errorMessage(err) || 'Gagal memuat data ujian, silakan coba lagi');
      } finally {
        setLoading(null);
      }
    },
    [enter]
  );

  return { start, resume, loading };
}
