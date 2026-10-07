// Store pengerjaan tryout (padanan `to-qn-store` + `latihan-soal-jawaban-siswa-store` di fe-solutest).
// Keduanya di-persist ke localStorage sehingga refresh/tutup tab tidak menghilangkan jawaban;
// server tetap menjadi sumber kebenaran lewat simpan sementara & tombol "Lanjutkan".
// `skipHydration` + rehydrate manual (useExamHydration) agar tidak terjadi hydration mismatch.

import type { ExamAnswer, ExamSession } from 'src/models/exam';

import { create } from 'zustand';
import { useState, useEffect } from 'react';
import { persist } from 'zustand/middleware';

interface ExamSessionState {
  session: ExamSession | null;
  setSession: (session: ExamSession) => void;
  reset: () => void;
}

export const useExamSessionStore = create<ExamSessionState>()(
  persist(
    (set) => ({
      session: null,
      setSession: (session) => set({ session }),
      reset: () => set({ session: null }),
    }),
    { name: 'st-exam-session', skipHydration: true }
  )
);

interface ExamAnswerState {
  /** practice_id pemilik jawaban — mencegah jawaban tryout lain ikut terkirim */
  practiceId: number | null;
  answers: ExamAnswer[];
  /** upsert jawaban berdasarkan id soal (sama dengan setStoreAnswer lama) */
  setAnswer: (answer: ExamAnswer) => void;
  /** ganti seluruh jawaban (dipakai saat lanjutkan / muat jawaban tersimpan) */
  setAnswers: (practiceId: number, answers: ExamAnswer[]) => void;
  /** tambah 1 detik durasi pengerjaan soal yang sedang dibuka */
  tick: (questionId: number) => void;
  /** kosongkan jawaban (pelanggaran ke-2) tanpa melepas practiceId */
  clearAnswers: () => void;
  reset: () => void;
}

export const useExamAnswerStore = create<ExamAnswerState>()(
  persist(
    (set) => ({
      practiceId: null,
      answers: [],
      setAnswer: (answer) =>
        set((prev) => {
          const exists = prev.answers.some((a) => a.id === answer.id);
          return {
            answers: exists
              ? prev.answers.map((a) => (a.id === answer.id ? { ...a, ...answer } : a))
              : [...prev.answers, answer],
          };
        }),
      setAnswers: (practiceId, answers) => set({ practiceId, answers }),
      tick: (questionId) =>
        set((prev) => {
          const current = prev.answers.find((a) => a.id === questionId);
          if (!current) return prev;
          return {
            answers: prev.answers.map((a) =>
              a.id === questionId ? { ...a, duration_seconds: (a.duration_seconds ?? 0) + 1 } : a
            ),
          };
        }),
      clearAnswers: () => set({ answers: [] }),
      reset: () => set({ practiceId: null, answers: [] }),
    }),
    { name: 'st-exam-answers', skipHydration: true }
  )
);

export const resetExamStores = () => {
  useExamSessionStore.getState().reset();
  useExamAnswerStore.getState().reset();
};

/** Muat ulang kedua store dari localStorage sekali di klien; true bila sudah siap dipakai. */
export function useExamHydration() {
  const [hydrated, setHydrated] = useState(
    () =>
      typeof window !== 'undefined' &&
      useExamSessionStore.persist.hasHydrated() &&
      useExamAnswerStore.persist.hasHydrated()
  );
  useEffect(() => {
    if (hydrated) return;
    Promise.all([
      useExamSessionStore.persist.rehydrate(),
      useExamAnswerStore.persist.rehydrate(),
    ]).then(() => setHydrated(true));
  }, [hydrated]);
  return hydrated;
}
