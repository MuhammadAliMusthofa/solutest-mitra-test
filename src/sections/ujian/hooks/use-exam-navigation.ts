'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';

import { SISWA_PATHS } from 'src/config/paths';

import { useExamSessionStore } from 'src/state/exam-store';

import { useAutoSave } from './use-exam-actions';
import { encodeNumber, flattenQuestions } from '../helpers/exam';

/** Pindah nomor / ke konfirmasi — selalu didahului simpan sementara (mekanisme fe-solutest). */
export function useExamNavigation() {
  const router = useRouter();
  const session = useExamSessionStore((s) => s.session);
  const { save } = useAutoSave();
  const total = flattenQuestions(session).length;

  const goTo = useCallback(
    (nomor: number) => {
      if (!session) return;
      save();
      if (nomor > total) router.push(SISWA_PATHS.examConfirm(session.practice_id));
      else router.push(SISWA_PATHS.exam(session.practice_id, encodeNumber(Math.max(1, nomor))));
    },
    [router, save, session, total]
  );

  return { goTo, total, save };
}
