// Siswa: tryout, pengerjaan (mulai/simpan/lanjutkan/kumpulkan), hasil, riwayat, leaderboard.
// Bentuk be-solutest-mitra (/student/*) dipetakan ke model FE engine ujian di sini.

import type { Paginated } from 'src/models/api';
import type { BeScheduleStatus } from './paket';
import type { QuestionType } from 'src/models/question';
import type { StudentTryout } from 'src/models/schedule';
import type {
  AnswerValue,
  Leaderboard,
  ExamSession,
  Explanation,
  HistoryList,
  SavedAnswer,
  ExamQuestion,
  SubmitResult,
  TryoutDetail,
  ViolationBody,
  ReviewQuestion,
  LeaderboardRow,
  ViolationResult,
  AnswerPayloadItem,
  PerformanceReport,
  UnfinishedPractice,
  LeaderboardTryoutOption,
} from 'src/models/exam';

import { api } from 'src/core/http';

import { normalizePredicate } from 'src/utils/predicate';

import { scheduleStatusFromBe } from './paket';

// ------------------------------------------------------------------ bentuk backend
interface BeOption {
  id: number;
  option_text: string;
  order: number | null;
  file: string | null;
}

interface BeStatement<O extends BeOption = BeOption> {
  order: number;
  statement: O;
  answers: O[];
}

interface BeExamQuestion {
  id: number;
  question_text: string;
  type_question_id: QuestionType;
  text_content: string | null;
  text_image: string | null;
  attachments: string[];
  options: BeOption[];
  statements: BeStatement[] | null;
}

interface BeAnswer {
  question_id: number;
  answer: number[] | null;
  duration_seconds?: number;
}

interface BeSession {
  attempt_id: number;
  schedule_id: number;
  schedule: { id: number; code: string; title: string; end_at: string };
  package: { id: number; title: string; subject_name: string | null; class_name: string | null };
  started_at: string;
  deadline_at: string;
  server_time: string;
  is_cheat_detection: boolean;
  max_violations: number;
  current_violations: number;
  total_question: number;
  questions: BeExamQuestion[];
  draft: BeAnswer[];
}

interface BeStudentSchedule {
  id: number;
  code: string;
  title: string;
  description: string | null;
  package: {
    id: number;
    title: string;
    subject_name: string | null;
    class_name: string | null;
    show_score: boolean;
    is_cheat_detection: boolean;
    max_violations: number;
  };
  start_at: string;
  end_at: string;
  duration: number;
  total_question: number;
  status: BeScheduleStatus;
  max_attempts: number;
  attempts_used: number;
  running_attempt_id: number | null;
  can_start: boolean;
}

interface BeReviewOption extends BeOption {
  is_true: boolean;
  reason: string | null;
  selected: boolean;
}

export interface BeReviewQuestion {
  id: number;
  question_text: string;
  description: string | null;
  type_question_id: QuestionType;
  text_content: string | null;
  text_image: string | null;
  competency_name: string | null;
  sub_competency_name: string | null;
  attachments: string[];
  options: BeReviewOption[];
  statements: BeStatement<BeReviewOption>[] | null;
  score: number;
  duration_seconds: number;
}

interface BeResult {
  attempt_id: number;
  schedule: { id: number; title: string; end_at: string };
  package: { id: number; title: string };
  started_at: string;
  submitted_at: string;
  is_auto_ended: boolean;
  is_processed: boolean;
  score: number | null;
  predicate: string | null;
  total_correct: number | null;
  review_available: boolean;
  questions: BeReviewQuestion[];
}

interface BeHistoryRow {
  attempt_id: number;
  schedule: { id: number; title: string };
  package: { id: number; title: string; subject_name: string | null };
  started_at: string;
  submitted_at: string;
  is_auto_ended: boolean;
  is_processed: boolean;
  score: number | null;
  predicate: string | null;
}

interface BeHistory extends Paginated<BeHistoryRow> {
  summary: {
    total_attempt: number;
    total_scored: number;
    average_score: number | null;
    average_predicate: string | null;
    highest_score: number | null;
  };
}

interface BeLeaderboardRow {
  rank: number;
  user_id: number;
  full_name: string;
  class_name: string | null;
  school: { id: number; name: string } | null;
  score: number | null;
  predicate: string | null;
  duration_seconds: number | null;
  is_me: boolean;
}

// ------------------------------------------------------------------ pemetaan soal & jawaban
const orderOf = (o: { order: number | null }, i: number) => o.order ?? i;

/** Soal ujian: B/S Kompleks = satu opsi per pernyataan + peta label Benar/Salah. */
const toExamQuestion = (q: BeExamQuestion): ExamQuestion => {
  const isComplexTf = q.type_question_id === 9 && q.statements;
  return {
    id: q.id,
    type_question_id: q.type_question_id,
    question_text: q.question_text,
    text: q.text_content ?? '',
    text_image: q.text_image ?? '',
    attachments: q.attachments.map((path) => ({ type: 'image', path })),
    options: isComplexTf
      ? q.statements!.map((g) => ({
          id: g.statement.id,
          option_text: g.statement.option_text,
          order: g.order,
        }))
      : q.options.map((o, i) => ({ id: o.id, option_text: o.option_text, order: orderOf(o, i) })),
    ...(isComplexTf
      ? {
          statement_labels: Object.fromEntries(
            q.statements!.map((g) => [g.statement.id, g.answers.map((a) => a.id)])
          ),
        }
      : {}),
  };
};

/** Jawaban backend (id opsi) → format FE. */
const fromBeAnswer = (q: ExamQuestion | undefined, ids: number[] | null): AnswerValue => {
  const list = (ids ?? []).map(Number);
  if (q?.type_question_id === 9 && q.statement_labels) {
    return Object.entries(q.statement_labels).map(([stmtId, labels]) => {
      const chosen = labels.findIndex((id) => list.includes(id));
      return [Number(stmtId), chosen === -1 ? null : chosen === 0 ? 1 : 0];
    }) as [number, number | null][];
  }
  return list.map(String);
};

/** Jawaban FE → id opsi backend. B/S Kompleks: 1 = label pertama (Benar), 0 = label kedua. */
const toBeAnswer = (q: ExamQuestion | undefined, answer: AnswerValue | null): number[] | null => {
  if (!answer || answer.length === 0) return null;
  if (q?.type_question_id === 9 && q.statement_labels) {
    const ids = (answer as [number, number | null][])
      .map(([stmtId, value]) => {
        if (value === null || value === undefined) return null;
        return q.statement_labels?.[Number(stmtId)]?.[Number(value) === 1 ? 0 : 1] ?? null;
      })
      .filter((id): id is number => id !== null);
    return ids.length ? ids : null;
  }
  const ids = (answer as string[]).map(Number).filter((n) => Number.isFinite(n));
  return ids.length ? ids : null;
};

const toBeAnswers = (payload: AnswerPayloadItem[], questions: ExamQuestion[]) => {
  const byId = new Map(questions.map((q) => [q.id, q]));
  return payload.map((p) => ({
    question_id: p.id,
    answer: toBeAnswer(byId.get(p.id), p.answer),
    duration_seconds: Math.max(0, Math.round(p.duration_seconds)),
  }));
};

const toSession = (s: BeSession): ExamSession => {
  // Tenggat mengikuti jam server: koreksi selisih jam perangkat siswa
  const offset = Date.parse(s.server_time) - Date.now();
  const deadline = new Date(Date.parse(s.deadline_at) - offset).toISOString();
  const questions = s.questions.map(toExamQuestion);
  const byId = new Map(questions.map((q) => [q.id, q]));
  return {
    practice_id: s.attempt_id,
    schedule_id: s.schedule_id,
    package_id: s.package.id,
    code: s.schedule.code,
    title: s.schedule.title,
    subjects: s.package.subject_name ? [{ id: 0, name: s.package.subject_name }] : [],
    sections: [
      { subject_id: 0, subject_name: s.package.subject_name ?? s.package.title, questions },
    ],
    start_time: s.started_at,
    end_time: s.deadline_at,
    duration: Math.max(
      1,
      Math.round((Date.parse(s.deadline_at) - Date.parse(s.started_at)) / 60_000)
    ),
    deadline,
    total: s.total_question,
    is_cheat_detection: s.is_cheat_detection,
    max_violations: s.max_violations,
    current_violations: s.current_violations,
    saved_answers: s.draft.map((d): SavedAnswer => ({
      id: d.question_id,
      type: byId.get(d.question_id)?.type_question_id ?? 1,
      answer: fromBeAnswer(byId.get(d.question_id), d.answer),
      duration_seconds: d.duration_seconds ?? 0,
    })),
  };
};

/** Soal pembahasan: kunci & jawaban siswa dalam format FE. */
export const toReviewQuestion = (q: BeReviewQuestion): ReviewQuestion => {
  const isComplexTf = q.type_question_id === 9 && q.statements;
  const options = isComplexTf
    ? q.statements!.map((g) => ({
        id: g.statement.id,
        option_text: g.statement.option_text,
        order: g.order,
        is_true: g.answers.findIndex((a) => a.is_true) === 0,
        selected: g.answers.some((a) => a.selected),
      }))
    : q.options.map((o, i) => ({
        id: o.id,
        option_text: o.option_text,
        order: orderOf(o, i),
        is_true: o.is_true,
        selected: o.selected,
      }));
  const answer: AnswerValue = isComplexTf
    ? q.statements!.map((g) => {
        const chosen = g.answers.findIndex((a) => a.selected);
        return [g.statement.id, chosen === -1 ? null : chosen === 0 ? 1 : 0] as [
          number,
          number | null,
        ];
      })
    : q.options.filter((o) => o.selected).map((o) => String(o.id));
  return {
    id: q.id,
    type_question_id: q.type_question_id,
    question_text: q.question_text,
    description: q.description ?? '',
    text: q.text_content ?? '',
    text_image: q.text_image ?? '',
    attachments: q.attachments.map((path) => ({ type: 'image', path })),
    options,
    answer,
    score: q.score,
    competency_name: q.competency_name,
    sub_competency_name: q.sub_competency_name,
    duration_seconds: q.duration_seconds,
  };
};

const toResult = (r: BeResult): Explanation => ({
  practice_id: r.attempt_id,
  schedule_id: r.schedule.id,
  title: r.schedule.title,
  package_title: r.package.title,
  score: r.score,
  predicate: normalizePredicate(r.predicate),
  total_correct: r.total_correct,
  is_processed: r.is_processed,
  is_auto_ended: r.is_auto_ended,
  review_available: r.review_available,
  schedule_end_at: r.schedule.end_at,
  started_at: r.started_at,
  submitted_at: r.submitted_at,
  questions: r.questions.map(toReviewQuestion),
});

const toTryout = (s: BeStudentSchedule): StudentTryout => ({
  id: s.id,
  code: s.code,
  title: s.title,
  package_id: s.package.id,
  start_date: s.start_at,
  end_date: s.end_at,
  duration: s.duration,
  total_questions: s.total_question,
  subject_name: s.package.subject_name,
  status: scheduleStatusFromBe(s.status),
  max_attempts: s.max_attempts,
  attempts_used: s.attempts_used,
  can_start: s.can_start,
  is_done: s.attempts_used > 0,
  unfinished_practice_id: s.running_attempt_id,
  score: null,
});

const toDetail = (s: BeStudentSchedule): TryoutDetail => ({
  id: s.id,
  code: s.code,
  title: s.title,
  package_id: s.package.id,
  description: s.description ?? '',
  subject_name: s.package.subject_name,
  class_name: s.package.class_name,
  total_question: s.total_question,
  duration: s.duration,
  start_date: s.start_at,
  end_date: s.end_at,
  status: scheduleStatusFromBe(s.status),
  is_cheat_detection: s.package.is_cheat_detection,
  max_violations: s.package.max_violations,
  show_score: s.package.show_score,
  max_attempts: s.max_attempts,
  attempts_used: s.attempts_used,
  can_start: s.can_start,
  is_done: !s.running_attempt_id && s.attempts_used >= s.max_attempts,
  unfinished_practice_id: s.running_attempt_id,
});

const toHistory = (h: BeHistory): HistoryList => ({
  ...h,
  summary: { ...h.summary, average_predicate: normalizePredicate(h.summary.average_predicate) },
  data: h.data.map((row) => ({
    practice_id: row.attempt_id,
    schedule_id: row.schedule.id,
    package_id: row.package.id,
    title: row.schedule.title,
    package_title: row.package.title,
    subject_name: row.package.subject_name ?? '',
    score: row.score,
    predicate: normalizePredicate(row.predicate),
    is_processed: row.is_processed,
    is_auto_ended: row.is_auto_ended,
    time: Math.max(
      0,
      Math.round((Date.parse(row.submitted_at) - Date.parse(row.started_at)) / 60_000)
    ),
    started_at: row.started_at,
    submitted_at: row.submitted_at,
  })),
});

const toLeaderboardRow = (r: BeLeaderboardRow): LeaderboardRow => ({
  rank: r.rank,
  user_id: r.user_id,
  full_name: r.full_name,
  class_name: r.class_name,
  school: r.school?.name ?? '-',
  score: r.score ?? 0,
  predicate: normalizePredicate(r.predicate),
  duration_seconds: r.duration_seconds,
  is_me: r.is_me,
});

// ------------------------------------------------------------------ laporan performa
const isAnswered = (a: AnswerValue) =>
  a.some((v) => (Array.isArray(v) ? v[1] !== null && v[1] !== undefined : String(v) !== ''));

const buildReport = (r: Explanation): PerformanceReport => {
  const qs = r.questions;
  const correct = qs.filter((q) => q.score >= 100).length;
  const unanswered = qs.filter((q) => !isAnswered(q.answer)).length;
  const totalSeconds = qs.reduce((sum, q) => sum + q.duration_seconds, 0);
  const groups = new Map<string, ReviewQuestion[]>();
  qs.forEach((q) => {
    const key = q.competency_name ?? 'Tanpa kompetensi';
    groups.set(key, [...(groups.get(key) ?? []), q]);
  });
  const breakdown = [...groups.entries()].map(([area, list]) => {
    const time = list.reduce((sum, q) => sum + q.duration_seconds, 0);
    const score = Number((list.reduce((sum, q) => sum + q.score, 0) / list.length).toFixed(2));
    return {
      area_name: area,
      score,
      status: score >= 70 ? ('Kuat' as const) : ('Perlu Ditingkatkan' as const),
      total_questions: list.length,
      time_spent_seconds: time,
      avg_time_per_question_seconds: Math.round(time / list.length),
    };
  });
  const strong = breakdown.filter((b) => b.status === 'Kuat').map((b) => b.area_name);
  const weak = [...breakdown].filter((b) => b.status !== 'Kuat').sort((a, b) => a.score - b.score);
  const avgSeconds = qs.length ? Math.round(totalSeconds / qs.length) : 0;
  return {
    practice_id: r.practice_id,
    title: r.title,
    user_name: '',
    score: r.score ?? 0,
    rank_position: null,
    total_participants: 0,
    total_questions: qs.length,
    correct,
    incorrect: qs.length - correct - unanswered,
    unanswered,
    accuracy_percentage: qs.length ? Math.round((correct / qs.length) * 100) : 0,
    total_time_spent_minutes: Math.round(totalSeconds / 60),
    test_date: r.submitted_at,
    competency_breakdown: breakdown,
    summary: {
      executive_summary: `Kamu menjawab benar ${correct} dari ${qs.length} soal dengan skor ${r.score ?? '-'}.`,
      strengths: strong.length
        ? `Sudah kuat di: ${strong.join(', ')}.`
        : 'Belum ada kompetensi dengan skor ≥ 70.',
      weaknesses: weak.length
        ? `Perlu ditingkatkan: ${weak.map((w) => w.area_name).join(', ')}.`
        : 'Semua kompetensi sudah di atas 70. Pertahankan!',
      time_management: `Rata-rata ${avgSeconds} detik per soal${unanswered ? `, ${unanswered} soal tidak dijawab` : ''}.`,
    },
    recommendation: {
      learning_priorities: weak.slice(0, 3).map((w) => ({
        title: w.area_name,
        brief: `Skor ${w.score} dari ${w.total_questions} soal. Pelajari ulang pembahasan soal di kompetensi ini.`,
      })),
      plan: { frequency: '3× seminggu', duration: '45 menit', question_count: '10–15 soal' },
    },
  };
};

// ------------------------------------------------------------------ service
const S = '/student';
const ALL = { per_page: 100 };

const fetchSchedules = (status?: BeScheduleStatus) =>
  api.get<Paginated<BeStudentSchedule>>(`${S}/schedules`, { ...ALL, status }).then((r) => r.data);

const fetchHistory = (p: { page?: number; per_page?: number }) =>
  api.get<BeHistory>(`${S}/history`, p).then(toHistory);

export const studentTryoutService = {
  /** Semua tryout: aktif & akan datang + yang sudah berakhir, dengan nilai terakhir dari riwayat. */
  list: async () => {
    const [upcoming, ended, history] = await Promise.all([
      fetchSchedules(),
      fetchSchedules('ended'),
      fetchHistory(ALL).catch(() => null),
    ]);
    const lastScore = new Map<number, number | null>();
    history?.data.forEach((h) => {
      if (!lastScore.has(h.schedule_id)) lastScore.set(h.schedule_id, h.score);
    });
    return [...upcoming, ...ended].map((s) => ({
      ...toTryout(s),
      score: lastScore.get(s.id) ?? null,
    }));
  },
  detail: (code: string) =>
    api.get<BeStudentSchedule>(`${S}/schedules/code/${encodeURIComponent(code)}`).then(toDetail),
  /** Mulai (atau lanjutkan pengerjaan yang sedang berjalan) lewat kode tryout. */
  start: (code: string) =>
    api.post<BeSession>(`${S}/schedules/code/${encodeURIComponent(code)}/start`).then(toSession),
};

export const practiceService = {
  /** Pengerjaan yang sudah dimulai tapi belum dikumpulkan (dari daftar jadwal aktif). */
  unfinished: async (): Promise<UnfinishedPractice[]> => {
    const running = (await fetchSchedules()).filter((s) => s.running_attempt_id);
    const sessions = await Promise.all(
      running.map((s) =>
        api
          .get<BeSession>(`${S}/attempts/${s.running_attempt_id}/session`)
          .then(toSession)
          .catch(() => null)
      )
    );
    return sessions
      .filter((s): s is ExamSession => s !== null)
      .map((s) => ({
        practice_id: s.practice_id,
        code: s.code,
        title: s.title,
        subject_name: s.subjects[0]?.name ?? '',
        total_question: s.total,
        answered: s.saved_answers.filter((a) => Array.isArray(a.answer) && a.answer.length > 0)
          .length,
        started_at: s.start_time,
        deadline: s.deadline,
      }));
  },
  resume: (practiceId: number) =>
    api.get<BeSession>(`${S}/attempts/${practiceId}/session`).then(toSession),
  savedAnswers: (practiceId: number) =>
    practiceService.resume(practiceId).then((s) => s.saved_answers),
  /** Simpan sementara (server menggabungkan dengan draf sebelumnya). */
  saveAnswers: (practiceId: number, answers: AnswerPayloadItem[], questions: ExamQuestion[]) =>
    api.post<{ saved: boolean; total_answered: number }>(`${S}/attempts/${practiceId}/draft`, {
      answers: toBeAnswers(answers, questions),
    }),
  submit: (practiceId: number, answers: AnswerPayloadItem[], questions: ExamQuestion[]) =>
    api
      .post<{ attempt_id: number; submitted: boolean; is_late: boolean }>(
        `${S}/attempts/${practiceId}/submit`,
        { answers: toBeAnswers(answers, questions) }
      )
      .then((r): SubmitResult => ({ practice_id: r.attempt_id, is_late: r.is_late })),
  violation: (practiceId: number, body: ViolationBody) =>
    api.post<ViolationResult>(`${S}/attempts/${practiceId}/violation`, {
      violation_type: body.reason === 'visibility' ? 'TAB_SWITCH' : 'EXIT_FULLSCREEN',
      note: `Pelanggaran ke-${body.count} (${body.occurred_at})`,
    }),
  /** Hasil + pembahasan (kunci dibuka setelah jadwal berakhir). */
  result: (practiceId: number | string) =>
    api.get<BeResult>(`${S}/attempts/${practiceId}`).then(toResult),
  history: (p: { page?: number; per_page?: number }) => fetchHistory(p),
  /** Laporan performa dihitung di klien dari hasil + pembahasan (per kompetensi TKA). */
  report: async (practiceId: number | string) => {
    const result = await practiceService.result(practiceId);
    // peringkat dari leaderboard jadwal (tidak tersedia bila nilai disembunyikan)
    const board = await api
      .raw<{ me: BeLeaderboardRow | null; total_participant: number }>(
        `${S}/schedules/${result.schedule_id}/leaderboard`,
        { limit: 1 }
      )
      .catch(() => null);
    return {
      ...buildReport(result),
      rank_position: board?.me?.rank ?? null,
      total_participants: board?.total_participant ?? 0,
    };
  },
};

export const leaderboardService = {
  /** Tryout yang bisa dilihat peringkatnya: jadwal yang pernah dikerjakan siswa. */
  options: async (): Promise<LeaderboardTryoutOption[]> => {
    const [history, schedules] = await Promise.all([
      fetchHistory(ALL),
      Promise.all([fetchSchedules(), fetchSchedules('ended')]).then(([a, b]) => [...a, ...b]),
    ]);
    const codeOf = new Map(schedules.map((s) => [s.id, s.code]));
    const seen = new Set<number>();
    return history.data
      .filter((h) => !seen.has(h.schedule_id) && seen.add(h.schedule_id))
      .map((h) => ({
        schedule_id: h.schedule_id,
        code: codeOf.get(h.schedule_id) ?? '',
        title: h.title,
      }));
  },
  /** Backend mengirim maks. 100 peringkat teratas; cari & paginasi dilakukan di klien. */
  list: async (
    scheduleId: number,
    p: { search?: string; page?: number; scope?: 'all' | 'school' }
  ): Promise<Leaderboard> => {
    const res = await api.raw<{
      data: BeLeaderboardRow[];
      me: BeLeaderboardRow | null;
      total_participant: number;
    }>(`${S}/schedules/${scheduleId}/leaderboard`, { scope: p.scope ?? 'all', limit: 100 });
    const perPage = 10;
    const page = Math.max(1, p.page ?? 1);
    const rows = res.data
      .map(toLeaderboardRow)
      .filter((r) => !p.search || r.full_name.toLowerCase().includes(p.search.toLowerCase()));
    return {
      data: rows.slice((page - 1) * perPage, page * perPage),
      pagination: {
        current_page: page,
        per_page: perPage,
        total_items: rows.length,
        total_pages: Math.max(1, Math.ceil(rows.length / perPage)),
      },
      my_rank: res.me ? toLeaderboardRow(res.me) : null,
      total_participant: res.total_participant,
    };
  },
};
