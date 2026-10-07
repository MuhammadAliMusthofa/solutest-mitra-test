'use client';

import { useState, useEffect, useEffectEvent } from 'react';

import { useExamAnswerStore } from 'src/state/exam-store';

import { secondsLeft } from '../helpers/exam';

/**
 * Sisa waktu (detik) menuju tenggat. Dihitung ulang dari jam sistem setiap detik, sehingga tetap
 * akurat setelah tab tidur / refresh (berbeda dengan pengurangan counter murni).
 */
export function useCountdown(deadline?: string | null) {
  const [seconds, setSeconds] = useState(() => secondsLeft(deadline));
  const [prevDeadline, setPrevDeadline] = useState(deadline);
  // tenggat berganti (mis. sesi dimuat ulang) → hitung ulang saat render, bukan di effect
  if (deadline !== prevDeadline) {
    setPrevDeadline(deadline);
    setSeconds(secondsLeft(deadline));
  }

  useEffect(() => {
    if (!deadline) return undefined;
    const id = setInterval(() => setSeconds(secondsLeft(deadline)), 1000);
    return () => clearInterval(id);
  }, [deadline]);

  return { seconds, expired: Boolean(deadline) && seconds <= 0 };
}

/**
 * Tambah durasi pengerjaan soal yang sedang dibuka tiap detik (duration_seconds) — sama dengan
 * useQuestionTimer fe-solutest: hanya berjalan bila soal sudah punya entri jawaban.
 */
export function useQuestionTimer(questionId?: number, active = true) {
  const tick = useExamAnswerStore((s) => s.tick);
  const hasEntry = useExamAnswerStore((s) => s.answers.some((a) => a.id === questionId));
  const onTick = useEffectEvent(() => {
    if (hasEntry && questionId) tick(questionId);
  });

  useEffect(() => {
    if (!active || !questionId) return undefined;
    const id = setInterval(() => onTick(), 1000);
    return () => clearInterval(id);
  }, [active, questionId]);
}
