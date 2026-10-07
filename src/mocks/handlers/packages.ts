// Paket soal, soal, master data, dan jadwal tryout (mode mock). Dipakai admin & guru.

import type { MockContext } from '../utils';
import type { MockDb, StoredPackage } from '../db';
import type { TryoutSchedule, CreateTryoutScheduleBody } from 'src/models/schedule';
import type {
  Package,
  Question,
  PackageBody,
  QuestionBody,
  QuestionType,
  PackageDetail,
  GenerateQuestionsBody,
} from 'src/models/question';

import { ROLES } from 'src/config/roles';

import { loadDb, nextId, resetDb, mutateDb, packageCode } from '../db';
import {
  MOCK_CLASSES,
  MOCK_CHAPTERS,
  MOCK_SUBJECTS,
  MOCK_CATEGORIES,
  buildBankQuestion,
} from '../seed';
import {
  fail,
  matches,
  paginate,
  parseDate,
  requireUser,
  PANEL_ROLES,
  scheduleStatus,
} from '../utils';

// ------------------------------------------------------------------ master
export const listClasses = () => MOCK_CLASSES;
export const listSubjects = () => MOCK_SUBJECTS;
export const listCategories = () => MOCK_CATEGORIES;
export const listChapters = ({ query }: MockContext) =>
  MOCK_CHAPTERS.filter(
    (c) =>
      (!query.class_id || c.class_id === Number(query.class_id)) &&
      (!query.subject_id || c.subject_id === Number(query.subject_id))
  );

// ------------------------------------------------------------------ paket
const scheduleCount = (db: MockDb, packageId: number) =>
  db.schedules.filter((s) => s.package_id === packageId).length;

const toPackage = (db: MockDb, p: StoredPackage): Package => ({
  id: p.id,
  code: p.code,
  title: p.title,
  class_id: p.class_id,
  class_name: MOCK_CLASSES.find((c) => c.id === p.class_id)?.name ?? '-',
  subject_id: p.subject_id,
  subject_name: MOCK_SUBJECTS.find((s) => s.id === p.subject_id)?.name ?? '-',
  chapter_ids: p.chapter_ids,
  question_count: p.question_ids.length,
  schedule_count: scheduleCount(db, p.id),
  created_by: p.created_by,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

const toDetail = (db: MockDb, p: StoredPackage): PackageDetail => ({
  ...toPackage(db, p),
  chapters: MOCK_CHAPTERS.filter((c) => p.chapter_ids.includes(c.id)),
  questions: p.question_ids.map((id) => db.questions[id]).filter(Boolean),
});

const findPackage = (db: MockDb, id: number | string) =>
  db.packages.find((p) => p.id === Number(id)) ?? fail(404, 'Paket soal tidak ditemukan');

export const listPackages = (ctx: MockContext) => {
  requireUser(ctx, PANEL_ROLES);
  const { search, subject_id, page, per_page } = ctx.query;
  const db = loadDb();
  const rows = db.packages
    .filter((p) => matches(`${p.title} ${p.code}`, search))
    .filter((p) => !subject_id || p.subject_id === Number(subject_id))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
    .map((p) => toPackage(db, p));
  return paginate(rows, page, per_page ?? 9);
};

export const packageOptions = (ctx: MockContext) => {
  requireUser(ctx, PANEL_ROLES);
  return loadDb()
    .packages.filter((p) => p.question_ids.length)
    .map((p) => ({
      id: p.id,
      code: p.code,
      title: p.title,
      question_count: p.question_ids.length,
    }));
};

const validatePackage = (body: PackageBody) => {
  if (!body.title?.trim()) fail(422, 'Judul paket wajib diisi');
  if (!body.class_id) fail(422, 'Pilih kelas');
  if (!body.subject_id) fail(422, 'Pilih mata pelajaran');
};

export const createPackage = (ctx: MockContext) => {
  const user = requireUser(ctx, PANEL_ROLES);
  const body = ctx.body as PackageBody;
  validatePackage(body);
  return mutateDb((db) => {
    const id = nextId(db);
    const now = new Date().toISOString();
    const pkg: StoredPackage = {
      id,
      code: packageCode(id),
      title: body.title.trim(),
      class_id: Number(body.class_id),
      subject_id: Number(body.subject_id),
      chapter_ids: body.chapter_ids ?? [],
      question_ids: [],
      created_by: user.full_name,
      createdAt: now,
      updatedAt: now,
    };
    db.packages.unshift(pkg);
    return toPackage(db, pkg);
  });
};

export const getPackage = (ctx: MockContext) => {
  requireUser(ctx, PANEL_ROLES);
  const db = loadDb();
  return toDetail(db, findPackage(db, ctx.params.id));
};

export const updatePackage = (ctx: MockContext) => {
  requireUser(ctx, PANEL_ROLES);
  const body = ctx.body as PackageBody;
  validatePackage(body);
  return mutateDb((db) => {
    const pkg = findPackage(db, ctx.params.id);
    Object.assign(pkg, {
      title: body.title.trim(),
      class_id: Number(body.class_id),
      subject_id: Number(body.subject_id),
      chapter_ids: body.chapter_ids ?? pkg.chapter_ids,
      updatedAt: new Date().toISOString(),
    });
    return toPackage(db, pkg);
  });
};

export const deletePackage = (ctx: MockContext) => {
  requireUser(ctx, PANEL_ROLES);
  return mutateDb((db) => {
    const pkg = findPackage(db, ctx.params.id);
    if (scheduleCount(db, pkg.id))
      fail(422, 'Paket sudah dipakai jadwal tryout sehingga tidak bisa dihapus');
    db.packages = db.packages.filter((p) => p.id !== pkg.id);
    return { deleted: true };
  });
};

// ------------------------------------------------------------------ soal
const validateQuestion = (body: QuestionBody) => {
  const text = (body.question_text ?? '').replace(/<[^>]+>/g, '').trim();
  if (!text && !body.attachments?.length) fail(422, 'Teks soal wajib diisi');
  const options = body.options ?? [];
  switch (body.type_question_id) {
    case 1:
    case 3:
      if (options.length < 2) fail(422, 'Minimal 2 pilihan jawaban');
      if (options.filter((o) => o.is_true).length !== 1)
        fail(422, 'Tandai tepat satu jawaban benar');
      break;
    case 2:
      if (options.length < 2) fail(422, 'Minimal 2 pilihan jawaban');
      if (!options.some((o) => o.is_true)) fail(422, 'Tandai minimal satu jawaban benar');
      break;
    case 4: {
      const statements = options.filter((o) => o.type === 'pernyataan').length;
      const answers = options.filter((o) => o.type === 'jawaban').length;
      if (statements < 2 || statements !== answers)
        fail(422, 'Isi minimal 2 pasangan pernyataan–jawaban');
      break;
    }
    case 5:
      if (!options.some((o) => o.option_text.trim())) fail(422, 'Isi kunci jawaban');
      break;
    default:
      break;
  }
};

const buildQuestion = (id: number, body: QuestionBody, previous?: Question): Question => {
  const now = new Date().toISOString();
  const category =
    MOCK_CATEGORIES.find((c) => c.id === Number(body.category_id)) ?? MOCK_CATEGORIES[0];
  return {
    id,
    code: previous?.code ?? `MTR-${String(id).padStart(5, '0')}`,
    type_question_id: Number(body.type_question_id) as QuestionType,
    question_text: body.question_text,
    description: body.description ?? '',
    text: body.text ?? '',
    text_image: body.text_image ?? '',
    chapter_id: body.chapter_id ?? null,
    category_id: category.id,
    category_name: category.name,
    options: (body.options ?? []).map((o, i) => ({ ...o, id: id * 10 + i, order: o.order ?? i })),
    attachments: body.attachments ?? [],
    source: previous?.source ?? 'manual',
    createdAt: previous?.createdAt ?? now,
    updatedAt: now,
  };
};

export const getQuestion = (ctx: MockContext) => {
  requireUser(ctx, PANEL_ROLES);
  const db = loadDb();
  const pkg = findPackage(db, ctx.params.id);
  const qid = Number(ctx.params.qid);
  if (!pkg.question_ids.includes(qid)) return fail(404, 'Soal tidak ditemukan di paket ini');
  return db.questions[qid];
};

export const createQuestion = (ctx: MockContext) => {
  requireUser(ctx, PANEL_ROLES);
  const body = ctx.body as QuestionBody;
  validateQuestion(body);
  return mutateDb((db) => {
    const pkg = findPackage(db, ctx.params.id);
    const question = buildQuestion(nextId(db), body);
    db.questions[question.id] = question;
    pkg.question_ids.push(question.id);
    pkg.updatedAt = question.updatedAt;
    return question;
  });
};

export const updateQuestion = (ctx: MockContext) => {
  requireUser(ctx, PANEL_ROLES);
  const body = ctx.body as QuestionBody;
  validateQuestion(body);
  return mutateDb((db) => {
    const pkg = findPackage(db, ctx.params.id);
    const qid = Number(ctx.params.qid);
    if (!pkg.question_ids.includes(qid)) return fail(404, 'Soal tidak ditemukan di paket ini');
    const question = buildQuestion(qid, body, db.questions[qid]);
    db.questions[qid] = question;
    pkg.updatedAt = question.updatedAt;
    return question;
  });
};

export const deleteQuestion = (ctx: MockContext) => {
  requireUser(ctx, PANEL_ROLES);
  return mutateDb((db) => {
    const pkg = findPackage(db, ctx.params.id);
    const qid = Number(ctx.params.qid);
    pkg.question_ids = pkg.question_ids.filter((id) => id !== qid);
    pkg.updatedAt = new Date().toISOString();
    return { deleted: true };
  });
};

export const generateQuestions = (ctx: MockContext) => {
  requireUser(ctx, PANEL_ROLES);
  const body = ctx.body as GenerateQuestionsBody;
  const count = Math.min(Math.max(Number(body.count) || 0, 1), 50);
  if (!body.chapter_ids?.length) fail(422, 'Pilih minimal satu bab');
  if (!body.type_ids?.length) fail(422, 'Pilih minimal satu tipe soal');
  return mutateDb((db) => {
    const pkg = findPackage(db, ctx.params.id);
    const chapters = MOCK_CHAPTERS.filter((c) => body.chapter_ids.includes(c.id));
    for (let i = 0; i < count; i += 1) {
      const id = nextId(db);
      const chapter = chapters[i % chapters.length];
      const type = body.type_ids[i % body.type_ids.length];
      db.questions[id] = buildBankQuestion(id, chapter, type, (i % 5) + 1);
      pkg.question_ids.push(id);
    }
    pkg.chapter_ids = Array.from(new Set([...pkg.chapter_ids, ...body.chapter_ids]));
    pkg.updatedAt = new Date().toISOString();
    return toDetail(db, pkg);
  });
};

export const resetSimulation = () => {
  resetDb();
  return { reset: true };
};

// ------------------------------------------------------------------ jadwal tryout
const participantsOf = (db: MockDb, s: TryoutSchedule) =>
  s.participants + db.attempts.filter((a) => a.schedule_code === s.code && a.submitted_at).length;

export const withLiveStatus = (db: MockDb, s: TryoutSchedule): TryoutSchedule => ({
  ...s,
  status: scheduleStatus(s.start_date, s.end_date),
  participants: participantsOf(db, s),
});

export const listSchedules = (ctx: MockContext) => {
  requireUser(ctx, PANEL_ROLES);
  const { search, status, page, per_page } = ctx.query;
  const db = loadDb();
  const rows = db.schedules
    .map((s) => withLiveStatus(db, s))
    .filter((s) => matches(`${s.title} ${s.code} ${s.package_title}`, search))
    .filter((s) => !status || s.status === status)
    .sort((a, b) => b.start_date.localeCompare(a.start_date));
  return paginate(rows, page, per_page ?? 10);
};

export const createSchedule = (ctx: MockContext) => {
  const user = requireUser(ctx, PANEL_ROLES);
  const body = ctx.body as CreateTryoutScheduleBody;
  if (!body.title?.trim()) fail(422, 'Judul wajib diisi');
  if (!(Number(body.duration) > 0)) fail(422, 'Durasi harus lebih dari 0');
  if (parseDate(body.end_date) <= parseDate(body.start_date))
    fail(422, 'Waktu selesai harus setelah waktu mulai');
  return mutateDb((db) => {
    const pkg = findPackage(db, body.package_id);
    if (!pkg.question_ids.length) fail(422, 'Paket soal masih kosong');
    let code = '';
    do {
      code = `SLT-${String(Math.floor(100000 + Math.random() * 899999))}-TKA`;
    } while (db.schedules.some((s) => s.code === code));
    const schedule: TryoutSchedule = {
      id: nextId(db),
      code,
      title: body.title.trim(),
      package_id: pkg.id,
      package_title: pkg.title,
      package_code: pkg.code,
      start_date: body.start_date,
      end_date: body.end_date,
      duration: Number(body.duration),
      description: body.description ?? '',
      is_cheat_detection: Boolean(body.is_cheat_detection),
      participants: 0,
      status: scheduleStatus(body.start_date, body.end_date),
      created_by: user.full_name,
    };
    db.schedules.unshift(schedule);
    return schedule;
  });
};

export const deleteSchedule = (ctx: MockContext) => {
  requireUser(ctx, [ROLES.admin, ROLES.guru]);
  return mutateDb((db) => {
    const schedule = db.schedules.find((s) => s.id === Number(ctx.params.id));
    if (!schedule) return fail(404, 'Jadwal tidak ditemukan');
    if (scheduleStatus(schedule.start_date, schedule.end_date) !== 'scheduled')
      fail(422, 'Hanya jadwal yang belum dimulai yang bisa dihapus');
    db.schedules = db.schedules.filter((s) => s.id !== schedule.id);
    return { deleted: true };
  });
};
