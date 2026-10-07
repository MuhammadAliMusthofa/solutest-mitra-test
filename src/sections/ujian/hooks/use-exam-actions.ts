'use client';

import { toast } from 'sonner';
import { useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { SISWA_PATHS } from 'src/config/paths';

import { errorMessage } from 'src/core/http';

import { resetExamStores, useExamAnswerStore, useExamSessionStore } from 'src/state/exam-store';

import { practiceService } from 'src/services/student';

import { buildPayload, flattenQuestions } from '../helpers/exam';

/** Payload dari isi store saat ini (dibaca langsung dari store agar selalu terbaru). */
const currentPayload = () => {
  const { session } = useExamSessionStore.getState();
  const { answers } = useExamAnswerStore.getState();
  return { session, payload: buildPayload(flattenQuestions(session), answers) };
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
    }: {
      practiceId: number;
      body: ReturnType<typeof buildPayload>;
    }) => practiceService.saveAnswers(practiceId, body),
    onError: (err) => console.warn('Gagal sinkronisasi jawaban:', err),
  });
  const { mutate } = mutation;

  const save = useCallback(
    (force = false) => {
      const { session, payload } = currentPayload();
      if (!session) return;
      // durasi berubah tiap detik — bandingkan tanpa durasi agar tidak mengirim ulang tanpa perubahan jawaban
      const signature = JSON.stringify(payload.map(({ duration_seconds: _d, ...rest }) => rest));
      if (!force && signature === lastSent.current) return;
      lastSent.current = signature;
      mutate({ practiceId: session.practice_id, body: payload });
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
    mutationFn: () => {
      const { session, payload } = currentPayload();
      if (!session) throw new Error('Sesi tryout tidak ditemukan');
      return practiceService.submit(session.practice_id, payload);
    },
    onSuccess: (res) => {
      resetExamStores();
      qc.invalidateQueries({ queryKey: ['student'] });
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
      router.replace(`${SISWA_PATHS.tryout}/selesai/${res.practice_id}`);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
}

/** Lapor pelanggaran ke server (fire-and-forget). */
export const reportViolation = (reason: string, count: number) => {
  const { session } = useExamSessionStore.getState();
  if (!session) return;
  practiceService
    .violation(session.practice_id, { reason, count, occurred_at: new Date().toISOString() })
    .catch(() => {});
};
