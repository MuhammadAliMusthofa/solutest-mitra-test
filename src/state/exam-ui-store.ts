// Preferensi tampilan halaman ujian (per perangkat): skala huruf soal.

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const FONT_SCALES = [0.9, 1, 1.15, 1.3] as const;

interface ExamUiState {
  fontScale: number;
  setFontScale: (scale: number) => void;
}

export const useExamUiStore = create<ExamUiState>()(
  persist(
    (set) => ({
      fontScale: 1,
      setFontScale: (fontScale) => set({ fontScale }),
    }),
    { name: 'st-exam-ui' }
  )
);
