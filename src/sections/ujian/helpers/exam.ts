// Helper murni pengerjaan tryout (format nomor URL, normalisasi jawaban, payload kirim).

import type {
  ExamAnswer,
  AnswerValue,
  ExamSession,
  SavedAnswer,
  ExamQuestion,
  AnswerPayloadItem,
} from 'src/models/exam';

import Hashids from 'hashids';

/** Nomor soal di URL di-encode hashids — sama persis dengan fe-solutest (alfabet & salt). */
export const hashids = new Hashids(
  '12345678901234567890',
  10,
  'ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'
);

/** nomor (1-based) → segmen URL */
export const encodeNumber = (nomor: number) => hashids.encode(nomor);

/** segmen URL → nomor (1-based); NaN bila tidak valid */
export const decodeNumber = (segment?: string) => {
  const [value] = segment ? hashids.decode(segment) : [];
  return value === undefined ? Number.NaN : Number(value);
};

/** Semua soal lintas section, urut nomor. */
export const flattenQuestions = (session: ExamSession | null): ExamQuestion[] =>
  session?.sections.flatMap((s) => s.questions) ?? [];

/** Section (mapel) tempat nomor tertentu berada, beserta rentang nomornya. */
export const sectionRanges = (session: ExamSession | null) => {
  let start = 1;
  return (session?.sections ?? []).map((s) => {
    const range = { ...s, startNumber: start, endNumber: start + s.questions.length - 1 };
    start += s.questions.length;
    return range;
  });
};

/** Tenggat pengerjaan = min(mulai + durasi, akhir jadwal). */
export const computeDeadline = (startTime: string, durationMinutes: number, endTime?: string) => {
  const byDuration = new Date(startTime).getTime() + durationMinutes * 60_000;
  const end = endTime ? new Date(endTime).getTime() : Number.POSITIVE_INFINITY;
  return new Date(Math.min(byDuration, end)).toISOString();
};

export const secondsLeft = (deadline?: string | null) =>
  deadline ? Math.max(0, Math.round((new Date(deadline).getTime() - Date.now()) / 1000)) : 0;

/** Jawaban dianggap terisi (sama dengan aturan penilaian backend). */
export const isFilled = (answer: AnswerValue | null | undefined) =>
  Array.isArray(answer) &&
  answer.length > 0 &&
  answer.some((a) =>
    Array.isArray(a) ? a[1] !== null && a[1] !== undefined : String(a ?? '').trim() !== ''
  );

/**
 * Normalisasi jawaban tersimpan dari server. Backend bisa mengirim `answer` sebagai string JSON
 * (bahkan berlapis) — di-parse sampai menjadi array (port dari CardUnfinishedExamContainer).
 */
export const normalizeSavedAnswers = (
  saved: SavedAnswer[],
  questions: ExamQuestion[]
): ExamAnswer[] =>
  saved.map((item) => {
    let value: unknown = item.answer;
    while (typeof value === 'string') {
      try {
        value = JSON.parse(value);
        if (Array.isArray(value)) break;
      } catch {
        value = value ? [value] : [];
        break;
      }
    }
    if (!Array.isArray(value)) value = value ? [value] : [];
    const answer = value as AnswerValue;
    const index = questions.findIndex((q) => q.id === item.id);
    return {
      id: item.id,
      type: item.type,
      index: index >= 0 ? index : undefined,
      isDoubt: Boolean(item.is_doubt),
      isCompleted: isFilled(answer),
      answer,
      duration_seconds: item.duration_seconds ?? 0,
    };
  });

/** Payload simpan sementara / kumpulkan: satu entri per soal (soal kosong → null). */
export const buildPayload = (
  questions: ExamQuestion[],
  answers: ExamAnswer[]
): AnswerPayloadItem[] =>
  questions.map((q) => {
    const found = answers.find((a) => a.id === q.id);
    return {
      id: q.id,
      type: q.type_question_id,
      answer: found && isFilled(found.answer) ? found.answer : null,
      duration_seconds: found?.duration_seconds ?? 0,
      is_doubt: Boolean(found?.isDoubt),
    };
  });

/** Ringkasan status jawaban untuk dialog nomor & halaman konfirmasi. */
export const answerStats = (questions: ExamQuestion[], answers: ExamAnswer[]) => {
  const byId = new Map(answers.map((a) => [a.id, a]));
  let answered = 0;
  let doubt = 0;
  questions.forEach((q) => {
    const a = byId.get(q.id);
    if (a?.isDoubt) doubt += 1;
    if (a?.isCompleted) answered += 1;
  });
  return { total: questions.length, answered, doubt, unanswered: questions.length - answered };
};
