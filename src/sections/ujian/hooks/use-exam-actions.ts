'use client';

import { toast } from 'sonner';
import { useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { SISWA_PATHS } from 'src/config/paths';

import { toApiError, errorMessage } from 'src/core/http';

import { resetExamStores, useExamAnswerStore, useExamSessionStore } from 'src/state/exam-store';

import { practiceService } from 'src/services/student';

import { buildPayload, flattenQuestions } from '../helpers/exam';

/** Payload dari isi store saat ini (dibaca langsung dari store agar selalu terbaru). */
const currentPayload = () => {
  const { session } = useExamSessionStore.getState();
  const { answers } = useExamAnswerStore.getState();
  const questions = flattenQuestions(session);
  return { session, questions, payload: buildPayload(questions, answers) };
};

export const finishedPath = (practiceId: number | string) =>
  `${SISWA_PATHS.tryout}/selesai/${practiceId}`;

/**
 * Backend sudah mengumpulkan pengerjaan (dikumpulkan sebelumnya, batas pelanggaran, atau waktu
 * habis + toleransi) → anggap selesai dan buka halaman hasil.
 */
export const isAlreadyFinished = (err: unknown) => {
  const { status, message } = toApiError(err);
  return status === 400 && /sudah selesai|dikumpulkan/i.test(message);
};

/**
 * Simpan sementara ke server (sinkronisasi jawaban). Dipanggil saat pindah soal — sama dengan
 * handleAutoSave fe-solutest — plus berkala & saat tab disembunyikan sebagai pengaman tambahan.
 * Gagal simpan tidak memblokir siswa (jawaban tetap aman di store lokal).
 */
export function useAutoSave() {
  const lastSent = useRef('');
  const mutation = useMutation({
    mutationKey: ['exam', 'save'],
    mutationFn: ({
      practiceId,
      body,
      questions,
    }: {
      practiceId: number;
      body: ReturnType<typeof buildPayload>;
      questions: ReturnType<typeof flattenQuestions>;
    }) => practiceService.saveAnswers(practiceId, body, questions),
    onError: (err) => console.warn('Gagal sinkronisasi jawaban:', err),
  });
  const { mutate } = mutation;

  const save = useCallback(
    (force = false) => {
      const { session, questions, payload } = currentPayload();
      if (!session) return;
      // durasi berubah tiap detik — bandingkan tanpa durasi agar tidak mengirim ulang tanpa perubahan jawaban
      const signature = JSON.stringify(payload.map(({ duration_seconds: _d, ...rest }) => rest));
      if (!force && signature === lastSent.current) return;
      lastSent.current = signature;
      mutate({ practiceId: session.practice_id, body: payload, questions });
    },
    [mutate]
  );

  return { save, saving: mutation.isPending };
}

/** Kumpulkan jawaban → bersihkan store → halaman selesai. */
export function useSubmitExam() {
  const router = useRouter();
  const qc = useQueryClient();
  return useMutation({
    mutationKey: ['exam', 'submit'],
    mutationFn: async () => {
      const { session, questions, payload } = currentPayload();
      if (!session) throw new Error('Sesi tryout tidak ditemukan');
      try {
        return await practiceService.submit(session.practice_id, payload, questions);
      } catch (err) {
        if (isAlreadyFinished(err)) return { practice_id: session.practice_id, is_late: false };
        throw err;
      }
    },
    onSuccess: (res) => {
      resetExamStores();
      qc.invalidateQueries({ queryKey: ['student'] });
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      router.replace(finishedPath(res.practice_id));
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

/**
 * Lapor pelanggaran ke server. Bila backend sudah mengumpulkan otomatis (batas pelanggaran),
 * hentikan ujian dan buka halaman hasil.
 */
export const reportViolation = (reason: string, count: number) => {
  const { session } = useExamSessionStore.getState();
  if (!session) return;
  const { practice_id: practiceId } = session;
  practiceService
    .violation(practiceId, { reason, count, occurred_at: new Date().toISOString() })
    .then((res) => {
      if (!res.auto_ended) return;
      resetExamStores();
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      window.location.replace(finishedPath(practiceId));
    })
    .catch(() => {});
};
