// "Backend palsu" alur tryout siswa (port dari src/_mock/mitra/tryout/router.ts fe-solutest).
// Soal diambil dari paket simulasi, jadwal dari Jadwal Tryout panel, dan pengerjaan disimpan
// sebagai StoredAttempt di db simulasi.

import type { MockContext } from '../utils';
import type { TokenClaims } from 'src/models/auth';
import type { MockDb, StoredAttempt } from '../db';
import type { Question } from 'src/models/question';
import type { TryoutSchedule } from 'src/models/schedule';
import type {
  ExamSession,
  SavedAnswer,
  ExamQuestion,
  TryoutDetail,
  LeaderboardRow,
  AnswerPayloadItem,
  PerformanceReport,
  UnfinishedPractice,
  CompetencyBreakdown,
  ExplanationQuestion,
} from 'src/models/exam';

import { ROLES } from 'src/config/roles';

import { getPredicate } from 'src/utils/predicate';

import { withLiveStatus } from './packages';
import { loadDb, nextId, mutateDb } from '../db';
import { MOCK_CLASSES, MOCK_SUBJECTS } from '../seed';
import { SCHOOLS, TRYOUTS, helpers, STUDENTS, TENANT_NAME } from '../data';
import { fail, paginate, parseDate, requireUser, scheduleStatus } from '../utils';
import { isAnswered, wrongAnswer, scoreQuestion, correctAnswer } from '../scoring';

const MAX_VIOLATIONS = 3;

const student = (ctx: MockContext) => requireUser(ctx, [ROLES.siswa]);

// ------------------------------------------------------------------ helper data
const packageOf = (db: MockDb, packageId: number) => db.packages.find((p) => p.id === packageId);

const questionsOf = (db: MockDb, packageId: number): Question[] =>
  (packageOf(db, packageId)?.question_ids ?? []).map((id) => db.questions[id]).filter(Boolean);

const subjectOf = (db: MockDb, packageId: number) => {
  const id = packageOf(db, packageId)?.subject_id ?? MOCK_SUBJECTS[0].id;
  return { id, name: MOCK_SUBJECTS.find((s) => s.id === id)?.name ?? 'Mapel' };
};

const classNameOf = (db: MockDb, packageId: number) =>
  MOCK_CLASSES.find((c) => c.id === packageOf(db, packageId)?.class_id)?.name ?? '-';

const findSchedule = (db: MockDb, code: string) =>
  db.schedules.find((s) => s.code.toUpperCase() === code.toUpperCase());

const userAttempt = (db: MockDb, user: TokenClaims, code: string) =>
  db.attempts.find((a) => a.user_email === user.email && a.schedule_code === code);

const findOwnAttempt = (db: MockDb, user: TokenClaims, practiceId: number | string) =>
  db.attempts.find((a) => a.practice_id === Number(practiceId) && a.user_email === user.email) ??
  fail(404, 'Pengerjaan tidak ditemukan');

/** Soal versi ujian: tanpa kunci jawaban & pembahasan. */
const toExamQuestion = (q: Question): ExamQuestion => ({
  id: q.id,
  code: q.code,
  type_question_id: q.type_question_id,
  question_text: q.question_text,
  text: q.text,
  text_image: q.text_image,
  options: q.options.map(({ id, option_text, order }) => ({ id, option_text, order })),
  attachments: q.attachments,
});

const deadlineOf = (attempt: StoredAttempt, schedule: TryoutSchedule) => {
  const byDuration = new Date(attempt.started_at).getTime() + schedule.duration * 60_000;
  return new Date(Math.min(byDuration, parseDate(schedule.end_date).getTime())).toISOString();
};

const gradeAttempt = (db: MockDb, attempt: StoredAttempt) => {
  const questions = questionsOf(db, attempt.package_id);
  const scores: Record<number, number> = {};
  questions.forEach((q) => {
    scores[q.id] = scoreQuestion(q, attempt.answers.find((a) => Number(a.id) === q.id)?.answer);
  });
  attempt.question_scores = scores;
  attempt.score = questions.length
    ? Math.round((Object.values(scores).reduce((a, b) => a + b, 0) / questions.length) * 10) / 10
    : 0;
};

/**
 * Siswa simulasi punya riwayat untuk tryout dataset yang sudah selesai (selaras dengan
 * analitik). Jawaban disemai deterministik dari skor siswa demo pertama di dataset.
 */
const ensureSeedAttempts = (db: MockDb, user: TokenClaims) => {
  let changed = false;
  db.schedules.forEach((schedule) => {
    const t = TRYOUTS.findIndex((tr) => tr.code === schedule.code);
    if (t < 0 || userAttempt(db, user, schedule.code)) return;
    const target = STUDENTS[0].scores[t]?.total ?? 60;
    const questions = questionsOf(db, schedule.package_id);
    const startedAt = new Date(parseDate(schedule.start_date).getTime() + 30 * 60_000);
    const attempt: StoredAttempt = {
      practice_id: nextId(db),
      schedule_code: schedule.code,
      package_id: schedule.package_id,
      user_email: user.email,
      user_name: user.full_name,
      started_at: startedAt.toISOString(),
      submitted_at: new Date(startedAt.getTime() + (60 + t * 10) * 60_000).toISOString(),
      answers: questions.map((q, i) => ({
        id: q.id,
        type: q.type_question_id,
        answer: ((i * 37 + t * 11) % 100 < target
          ? correctAnswer(q)
          : wrongAnswer(q)) as AnswerPayloadItem['answer'],
        duration_seconds: 40 + ((i * 13) % 90),
      })),
      score: null,
      question_scores: {},
      violations: 0,
    };
    gradeAttempt(db, attempt);
    db.attempts.push(attempt);
    changed = true;
  });
  return changed;
};

const withSeed = (ctx: MockContext) => {
  const user = student(ctx);
  const db = loadDb();
  if (ensureSeedAttempts(db, user)) mutateDb(() => undefined);
  return { db, user };
};

// ------------------------------------------------------------------ beranda & detail
export const listTryouts = (ctx: MockContext) => {
  const { db, user } = withSeed(ctx);
  return db.schedules
    .map((s) => withLiveStatus(db, s))
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map((s) => {
      const attempt = userAttempt(db, user, s.code);
      return {
        id: s.id,
        code: s.code,
        title: s.title,
        package_id: s.package_id,
        start_date: s.start_date,
        end_date: s.end_date,
        duration: s.duration,
        total_questions: questionsOf(db, s.package_id).length,
        status: s.status,
        is_done: Boolean(attempt?.submitted_at),
        unfinished_practice_id: attempt && !attempt.submitted_at ? attempt.practice_id : null,
        score: attempt?.submitted_at ? attempt.score : null,
      };
    });
};

export const tryoutDetail = (ctx: MockContext): TryoutDetail => {
  const { db, user } = withSeed(ctx);
  const schedule = findSchedule(db, decodeURIComponent(ctx.params.code));
  if (!schedule) return fail(404, 'Kode tryout tidak valid atau sudah kedaluwarsa');
  const attempt = userAttempt(db, user, schedule.code);
  const questions = questionsOf(db, schedule.package_id);
  return {
    code: schedule.code,
    title: schedule.title,
    package_id: schedule.package_id,
    description:
      schedule.description ||
      `<p>Tryout dari <b>${TENANT_NAME}</b>. Kerjakan ${questions.length} soal dalam ${schedule.duration} menit.</p>`,
    subject_name: subjectOf(db, schedule.package_id).name,
    class_name: classNameOf(db, schedule.package_id),
    total_question: questions.length,
    duration: schedule.duration,
    start_date: schedule.start_date,
    end_date: schedule.end_date,
    status: scheduleStatus(schedule.start_date, schedule.end_date),
    is_cheat_detection: schedule.is_cheat_detection,
    max_violations: MAX_VIOLATIONS,
    is_done: Boolean(attempt?.submitted_at),
    unfinished_practice_id: attempt && !attempt.submitted_at ? attempt.practice_id : null,
    tenant_name: TENANT_NAME,
  };
};

// ------------------------------------------------------------------ mulai & lanjutkan
const sessionOf = (db: MockDb, attempt: StoredAttempt, schedule: TryoutSchedule): ExamSession => {
  const subject = subjectOf(db, schedule.package_id);
  const questions = questionsOf(db, schedule.package_id).map(toExamQuestion);
  return {
    practice_id: attempt.practice_id,
    package_id: schedule.package_id,
    code: schedule.code,
    title: schedule.title,
    subjects: [subject],
    sections: [{ subject_id: subject.id, subject_name: subject.name, questions }],
    start_time: attempt.started_at,
    end_time: parseDate(schedule.end_date).toISOString(),
    duration: schedule.duration,
    deadline: deadlineOf(attempt, schedule),
    total: questions.length,
    is_cheat_detection: schedule.is_cheat_detection,
    max_violations: MAX_VIOLATIONS,
  };
};

export const startTryout = (ctx: MockContext) => {
  const user = student(ctx);
  return mutateDb((db) => {
    const schedule = findSchedule(db, decodeURIComponent(ctx.params.code));
    if (!schedule) return fail(404, 'Kode tryout tidak ditemukan');
    const status = scheduleStatus(schedule.start_date, schedule.end_date);
    if (status === 'scheduled') fail(422, 'Tryout belum dimulai');
    if (status === 'finished') fail(422, 'Tryout sudah berakhir');
    let attempt = userAttempt(db, user, schedule.code);
    if (attempt?.submitted_at) fail(422, 'Kamu sudah pernah mengerjakan tryout ini.');
    if (!attempt) {
      attempt = {
        practice_id: nextId(db),
        schedule_code: schedule.code,
        package_id: schedule.package_id,
        user_email: user.email,
        user_name: user.full_name,
        started_at: new Date().toISOString(),
        submitted_at: null,
        answers: [],
        score: null,
        question_scores: {},
        violations: 0,
      };
      db.attempts.push(attempt);
    }
    return sessionOf(db, attempt, schedule);
  });
};

export const listUnfinished = (ctx: MockContext): UnfinishedPractice[] => {
  const user = student(ctx);
  const db = loadDb();
  return db.attempts
    .filter((a) => a.user_email === user.email && !a.submitted_at)
    .map((a) => {
      const schedule = findSchedule(db, a.schedule_code);
      if (!schedule) return null;
      return {
        practice_id: a.practice_id,
        code: a.schedule_code,
        title: schedule.title,
        subject_name: subjectOf(db, a.package_id).name,
        total_question: questionsOf(db, a.package_id).length,
        answered: a.answers.filter((ans) => isAnswered(ans.answer)).length,
        started_at: a.started_at,
        deadline: deadlineOf(a, schedule),
      };
    })
    .filter((x): x is UnfinishedPractice => Boolean(x));
};

export const resumePractice = (ctx: MockContext) => {
  const user = student(ctx);
  const db = loadDb();
  const attempt = findOwnAttempt(db, user, ctx.params.id);
  if (attempt.submitted_at) return fail(422, 'Tryout sudah dikumpulkan');
  const schedule = findSchedule(db, attempt.schedule_code) ?? fail(404, 'Jadwal tidak ditemukan');
  return sessionOf(db, attempt, schedule);
};

/** Backend asli menyimpan jawaban sebagai string JSON — disimulasikan agar normalisasi klien teruji. */
export const savedAnswers = (ctx: MockContext): SavedAnswer[] => {
  const user = student(ctx);
  const attempt = findOwnAttempt(loadDb(), user, ctx.params.id);
  return attempt.answers.map((a) => ({ ...a, answer: JSON.stringify(a.answer ?? []) }));
};

export const saveAnswers = (ctx: MockContext) => {
  const user = student(ctx);
  return mutateDb((db) => {
    const attempt = findOwnAttempt(db, user, ctx.params.id);
    if (attempt.submitted_at) fail(422, 'Tryout sudah dikumpulkan');
    attempt.answers = (ctx.body?.answers ?? attempt.answers) as AnswerPayloadItem[];
    return { practice_id: attempt.practice_id, saved_at: new Date().toISOString() };
  });
};

export const submitPractice = (ctx: MockContext) => {
  const user = student(ctx);
  return mutateDb((db) => {
    const attempt = findOwnAttempt(db, user, ctx.params.id);
    if (attempt.submitted_at) fail(422, 'Tryout sudah dikumpulkan');
    attempt.answers = (ctx.body?.answers ?? attempt.answers) as AnswerPayloadItem[];
    attempt.submitted_at = new Date().toISOString();
    gradeAttempt(db, attempt);
    return { practice_id: attempt.practice_id, score: attempt.score ?? 0 };
  });
};

export const reportViolation = (ctx: MockContext) => {
  const user = student(ctx);
  return mutateDb((db) => {
    const attempt = findOwnAttempt(db, user, ctx.params.id);
    attempt.violations = Number(ctx.body?.count ?? attempt.violations + 1);
    return { violations: attempt.violations };
  });
};

// ------------------------------------------------------------------ riwayat, pembahasan, laporan
const minutesTaken = (a: StoredAttempt) =>
  a.submitted_at
    ? Math.max(
        1,
        Math.round((new Date(a.submitted_at).getTime() - new Date(a.started_at).getTime()) / 60_000)
      )
    : 0;

export const history = (ctx: MockContext) => {
  const { db, user } = withSeed(ctx);
  const rows = db.attempts
    .filter((a) => a.user_email === user.email && a.submitted_at)
    .sort((a, b) => String(b.submitted_at).localeCompare(String(a.submitted_at)))
    .map((a) => ({
      practice_id: a.practice_id,
      package_id: a.package_id,
      code: a.schedule_code,
      title: findSchedule(db, a.schedule_code)?.title ?? 'Tryout',
      subject_name: subjectOf(db, a.package_id).name,
      score: a.score ?? 0,
      time: minutesTaken(a),
      total_question: questionsOf(db, a.package_id).length,
      submitted_at: a.submitted_at as string,
    }));
  return paginate(rows, ctx.query.page, ctx.query.per_page ?? 8);
};

const submittedAttempt = (ctx: MockContext) => {
  const user = student(ctx);
  const db = loadDb();
  const attempt = findOwnAttempt(db, user, ctx.params.id);
  if (!attempt.submitted_at) return fail(404, 'Tryout belum dikumpulkan');
  return { db, attempt };
};

export const explanation = (ctx: MockContext) => {
  const { db, attempt } = submittedAttempt(ctx);
  const questions = questionsOf(db, attempt.package_id);
  return {
    practice_id: attempt.practice_id,
    title: findSchedule(db, attempt.schedule_code)?.title ?? 'Tryout',
    user_name: attempt.user_name,
    subject_name: subjectOf(db, attempt.package_id).name,
    score: attempt.score ?? 0,
    total_questions: questions.length,
    questions: questions.map((q): ExplanationQuestion => {
      const answer = (attempt.answers.find((a) => Number(a.id) === q.id)?.answer ??
        []) as ExplanationQuestion['answer'];
      // B/S Kompleks: `selected` = siswa menjawab Benar untuk pernyataan tsb.
      const chosen = new Set(
        q.type_question_id === 4
          ? (answer as unknown[])
              .filter((row) => Array.isArray(row) && Number(row[1]) === 1 && row[1] !== null)
              .map((row) => String((row as unknown[])[0]))
          : (answer as unknown[]).map(String)
      );
      return {
        ...toExamQuestion(q),
        description: q.description,
        options: q.options.map((o) => ({
          id: o.id,
          option_text: o.option_text,
          order: o.order,
          is_true: Boolean(o.is_true),
          selected: chosen.has(String(o.id)),
        })),
        answer,
        score: attempt.question_scores[q.id] ?? 0,
      };
    }),
  };
};

/** Peserta leaderboard per paket: siswa dataset analitik + pengerjaan simulasi. */
const leaderboardRows = (db: MockDb, packageId: number, me?: TokenClaims) => {
  const schedules = db.schedules.filter((s) => s.package_id === packageId);
  const seeded = schedules.flatMap((s) => {
    const t = TRYOUTS.findIndex((tr) => tr.code === s.code);
    if (t < 0) return [];
    return STUDENTS.slice(1)
      .filter((st) => st.scores[t]?.done)
      .map((st) => ({
        user_id: st.id,
        full_name: st.name,
        email: st.email,
        school: st.school.name,
        city_name: st.school.city,
        province_name: st.school.region.name,
        score: st.scores[t]!.total,
        submitted_at: `${s.start_date.slice(0, 10)}T09:30:00.000Z`,
      }));
  });
  const simulated = db.attempts
    .filter((a) => a.package_id === packageId && a.submitted_at)
    .map((a) => {
      const account = db.accounts.find((acc) => acc.email === a.user_email);
      const school = SCHOOLS.find((sc) => sc.name === account?.school_name) ?? SCHOOLS[0];
      return {
        user_id: account?.id ?? a.practice_id,
        full_name: a.user_name,
        email: a.user_email,
        school: account?.school_name ?? school.name,
        city_name: school.city,
        province_name: school.region.name,
        score: a.score ?? 0,
        submitted_at: a.submitted_at as string,
      };
    });
  return [...seeded, ...simulated]
    .sort((a, b) => b.score - a.score)
    .map((row, i) => ({ ...row, rank: i + 1, is_me: row.email === me?.email }));
};

const stripEmail = ({
  email: _email,
  is_me: _me,
  ...row
}: LeaderboardRow & { email: string; is_me: boolean }) => row;

export const leaderboardOptions = (ctx: MockContext) => {
  const { db } = withSeed(ctx);
  return db.schedules
    .map((s) => withLiveStatus(db, s))
    .filter((s) => s.status !== 'scheduled')
    .sort((a, b) => b.start_date.localeCompare(a.start_date))
    .map((s) => ({ package_id: s.package_id, code: s.code, title: s.title }));
};

export const leaderboard = (ctx: MockContext) => {
  const { db, user } = withSeed(ctx);
  const all = leaderboardRows(db, Number(ctx.params.packageId), user);
  const search = String(ctx.query.search ?? '').toLowerCase();
  const rows = all.filter((r) => !search || r.full_name.toLowerCase().includes(search));
  const me = all.find((r) => r.is_me);
  return {
    ...paginate(rows.map(stripEmail), ctx.query.page, ctx.query.per_page ?? 10),
    my_rank: me ? stripEmail(me) : null,
  };
};

export const performanceReport = (ctx: MockContext): PerformanceReport => {
  const { db, attempt } = submittedAttempt(ctx);
  const questions = questionsOf(db, attempt.package_id);
  const answerOf = (id: number) => attempt.answers.find((a) => Number(a.id) === id);
  const correct = questions.filter((q) => (attempt.question_scores[q.id] ?? 0) >= 100).length;
  const unanswered = questions.filter((q) => !isAnswered(answerOf(q.id)?.answer)).length;
  const incorrect = questions.length - correct - unanswered;
  const ranks = leaderboardRows(db, attempt.package_id);
  const myRank = ranks.find((r) => r.email === attempt.user_email)?.rank ?? null;

  const groups = new Map<string, Question[]>();
  questions.forEach((q) => {
    const area = q.competency_name ?? 'Tanpa kompetensi';
    groups.set(area, [...(groups.get(area) ?? []), q]);
  });
  const breakdown: CompetencyBreakdown[] = Array.from(groups.entries()).map(([area, qs]) => {
    const score = Math.round(
      qs.reduce((sum, q) => sum + (attempt.question_scores[q.id] ?? 0), 0) / qs.length
    );
    const time = qs.reduce((sum, q) => sum + (answerOf(q.id)?.duration_seconds ?? 0), 0);
    return {
      area_name: area,
      score,
      status: score >= 70 ? 'Kuat' : 'Perlu Ditingkatkan',
      total_questions: qs.length,
      time_spent_seconds: time,
      avg_time_per_question_seconds: Math.round(time / qs.length),
    };
  });
  const sorted = [...breakdown].sort((a, b) => a.score - b.score);
  const score = attempt.score ?? 0;
  const accuracy = questions.length ? Math.round((correct / questions.length) * 100) : 0;
  const avgTime = Math.round(
    attempt.answers.reduce((s, a) => s + (a.duration_seconds ?? 0), 0) /
      Math.max(1, attempt.answers.length)
  );

  return {
    practice_id: attempt.practice_id,
    title: findSchedule(db, attempt.schedule_code)?.title ?? 'Tryout',
    user_name: attempt.user_name,
    score,
    rank_position: myRank,
    total_participants: ranks.length,
    total_questions: questions.length,
    correct,
    incorrect,
    unanswered,
    accuracy_percentage: accuracy,
    total_time_spent_minutes: minutesTaken(attempt),
    test_date: attempt.submitted_at as string,
    competency_breakdown: breakdown,
    summary: {
      executive_summary: `Kamu memperoleh skor ${score} (predikat ${getPredicate(score).toLowerCase()}) dengan akurasi ${accuracy}%. Laporan ini dihitung dari jawabanmu pada tryout ini.`,
      strengths: `Area terkuat: ${sorted[sorted.length - 1]?.area_name ?? '-'}.`,
      weaknesses: `Area yang perlu ditingkatkan: ${sorted[0]?.area_name ?? '-'}.`,
      time_management: `Rata-rata ${avgTime} detik per soal. Usahakan tidak lebih dari 90 detik untuk soal pilihan ganda.`,
    },
    recommendation: {
      learning_priorities: sorted.slice(0, 3).map((b) => ({
        title: b.area_name,
        brief: `Ulangi konsep ${b.area_name.toLowerCase()} dan kerjakan latihan bertahap dari soal mudah ke sulit.`,
      })),
      plan: { frequency: '3x seminggu', duration: '45 menit', question_count: '20 soal' },
    },
  };
};

// ------------------------------------------------------------------ wilayah (form data diri)
const PROVINCES = helpers.REGIONS.map((r) => ({ id: Number(r.id), name: r.name }));

const CITY_LIST = SCHOOLS.map((s) => ({ name: s.city, province_id: Number(s.region.id) }))
  .filter((c, i, arr) => arr.findIndex((x) => x.name === c.name) === i)
  .map((c, i) => ({ id: 3000 + i, ...c }));

export const provinces = () => PROVINCES;

export const cities = ({ query }: MockContext) =>
  CITY_LIST.filter((c) => !query.province_id || c.province_id === Number(query.province_id)).map(
    ({ id, name }) => ({ id, name })
  );

export const regionSchools = ({ query }: MockContext) => {
  const city = CITY_LIST.find((c) => c.id === Number(query.city_id))?.name;
  const q = String(query.search ?? '').toLowerCase();
  return SCHOOLS.filter(
    (s) => (!city || s.city === city) && (!q || s.name.toLowerCase().includes(q))
  ).map((s) => ({ id: s.id, name: s.name }));
};
