// Penilaian jawaban simulasi per tipe soal (format jawaban: lihat src/models/exam.ts).

import type { Question, QuestionOption } from 'src/models/question';

export const plainText = (html?: string | null) =>
  (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

const byOrder = (a: QuestionOption, b: QuestionOption) => (a.order ?? 0) - (b.order ?? 0);

/** Pasangan benar menjodohkan: pernyataan ke-i ↔ jawaban ke-i (urut `order`). */
export const matchingKey = (q: Question) => {
  const statements = q.options.filter((o) => o.type === 'pernyataan').sort(byOrder);
  const answers = q.options.filter((o) => o.type === 'jawaban').sort(byOrder);
  return statements.map((s, i) => [s.id, answers[i]?.id ?? null] as [number, number | null]);
};

export const isAnswered = (answer: unknown) => {
  if (!Array.isArray(answer) || !answer.length) return false;
  return answer.some((a) =>
    Array.isArray(a) ? a[1] !== null && a[1] !== undefined : String(a ?? '').trim() !== ''
  );
};

/** Skor satu soal 0–100. Esai dinilai "AI" simulasi: 70 bila diisi cukup panjang. */
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
      const key = matchingKey(q);
      if (!key.length) return 0;
      const correct = key.filter(([s, a]) =>
        list.some((pair) => Array.isArray(pair) && Number(pair[0]) === s && Number(pair[1]) === a)
      ).length;
      return Math.round((correct / key.length) * 100);
    }
    case 5: {
      const keys = q.options.filter((o) => o.is_true).map((o) => plainText(o.option_text));
      if (!keys.length) return 0;
      const correct = keys.filter(
        (k, i) =>
          plainText(String(list[i] ?? '')) === k || list.some((v) => plainText(String(v)) === k)
      ).length;
      return Math.round((correct / keys.length) * 100);
    }
    case 6:
      return plainText(String(list[0] ?? '')).length >= 15 ? 70 : 40;
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
      return matchingKey(q);
    case 5:
      return trueOpts.map((o) => plainText(o.option_text));
    case 6:
      return ['Jawaban esai siswa yang menjelaskan konsep beserta contohnya.'];
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
      return matchingKey(q).map(([s], i, all) => [s, all[(i + 1) % all.length][1]]);
    case 5:
      return ['tidak tahu'];
    default:
      return [];
  }
};
