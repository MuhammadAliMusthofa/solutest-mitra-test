// Penilaian jawaban simulasi per tipe soal (format jawaban: lihat src/models/exam.ts).

import type { Question } from 'src/models/question';

export const plainText = (html?: string | null) =>
  (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

/** Kunci Benar/Salah Kompleks: [pernyataanId, 1 (Benar) | 0 (Salah)] per baris tabel. */
export const trueFalseKey = (q: Question) =>
  [...q.options]
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
    .map((o) => [o.id, o.is_true ? 1 : 0] as [number, number]);

export const isAnswered = (answer: unknown) => {
  if (!Array.isArray(answer) || !answer.length) return false;
  return answer.some((a) =>
    Array.isArray(a) ? a[1] !== null && a[1] !== undefined : String(a ?? '').trim() !== ''
  );
};

/** Skor satu soal 0–100. Benar/Salah Kompleks dinilai proporsional per pernyataan. */
export const scoreQuestion = (q: Question, answer: unknown): number => {
  if (!isAnswered(answer)) return 0;
  const list = answer as unknown[];
  const trueIds = q.options.filter((o) => o.is_true).map((o) => String(o.id));

  switch (q.type_question_id) {
    case 1:
    case 3:
      return trueIds.includes(String(list[0])) ? 100 : 0;
    case 2: {
      const chosen = new Set(list.map(String));
      return chosen.size === trueIds.length && trueIds.every((id) => chosen.has(id)) ? 100 : 0;
    }
    case 4: {
      const key = trueFalseKey(q);
      if (!key.length) return 0;
      const correct = key.filter(([s, v]) =>
        list.some(
          (row) =>
            Array.isArray(row) && Number(row[0]) === s && row[1] !== null && Number(row[1]) === v
        )
      ).length;
      return Math.round((correct / key.length) * 100);
    }
    default:
      return 0;
  }
};

/** Jawaban benar (untuk menyemai riwayat siswa simulasi). */
export const correctAnswer = (q: Question): unknown[] => {
  const trueOpts = q.options.filter((o) => o.is_true);
  switch (q.type_question_id) {
    case 1:
    case 3:
      return [String(trueOpts[0]?.id ?? q.options[0]?.id)];
    case 2:
      return trueOpts.map((o) => String(o.id));
    case 4:
      return trueFalseKey(q);
    default:
      return [];
  }
};

/** Jawaban salah yang masuk akal (untuk menyemai riwayat siswa simulasi). */
export const wrongAnswer = (q: Question): unknown[] => {
  const falseOpt = q.options.find((o) => !o.is_true);
  switch (q.type_question_id) {
    case 1:
    case 2:
    case 3:
      return falseOpt ? [String(falseOpt.id)] : [];
    case 4:
      // separuh pernyataan dibalik
      return trueFalseKey(q).map(([s, v], i) => [s, i % 2 === 0 ? 1 - v : v]);
    default:
      return [];
  }
};
