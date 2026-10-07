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
  DeleteQuestionsBody,
} from 'src/models/question';

import { ROLES } from 'src/config/roles';

import { loadDb, nextId, resetDb, mutateDb, packageCode } from '../db';
import {
  MOCK_CLASSES,
  MOCK_SUBJECTS,
  MOCK_INDICATORS,
  MOCK_CATEGORIES,
  MOCK_COMPETENCIES,
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
export const listCompetencies = ({ query }: MockContext) =>
  MOCK_COMPETENCIES.filter(
    (c) =>
      (!query.class_id || c.class_id === Number(query.class_id)) &&
      (!query.subject_id || c.subject_id === Number(query.subject_id))
  );

export const listIndicators = ({ query }: MockContext) =>
  MOCK_INDICATORS.filter(
    (i) => !query.competency_id || i.competency_id === Number(query.competency_id)
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
  question_count: p.question_ids.length,
  schedule_count: scheduleCount(db, p.id),
  created_by: p.created_by,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

const toDetail = (db: MockDb, p: StoredPackage): PackageDetail => ({
  ...toPackage(db, p),
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
    case 4:
      if (options.length < 2) fail(422, 'Minimal 2 pernyataan');
      if (options.some((o) => !o.option_text.replace(/<[^>]+>/g, '').trim()))
        fail(422, 'Isi semua pernyataan');
      break;
    default:
      fail(422, 'Tipe soal tidak dikenal');
  }
};

const buildQuestion = (id: number, body: QuestionBody, previous?: Question): Question => {
  const now = new Date().toISOString();
  const category =
    MOCK_CATEGORIES.find((c) => c.id === Number(body.category_id)) ?? MOCK_CATEGORIES[0];
  const competency = MOCK_COMPETENCIES.find((c) => c.id === Number(body.competency_id));
  // indikator hanya berlaku bila milik kompetensi terpilih
  const indicator = MOCK_INDICATORS.find(
    (i) => i.id === Number(body.indicator_id) && i.competency_id === competency?.id
  );
  return {
    id,
    code: previous?.code ?? `MTR-${String(id).padStart(5, '0')}`,
    type_question_id: Number(body.type_question_id) as QuestionType,
    question_text: body.question_text,
    description: body.description ?? '',
    text: body.text ?? '',
    text_image: body.text_image ?? '',
    competency_id: competency?.id ?? null,
    competency_name: competency?.name ?? null,
    indicator_id: indicator?.id ?? null,
    indicator_name: indicator?.name ?? null,
    category_id: category.id,
    category_name: category.name,
    options: (body.options ?? []).map((o, i) => ({
      option_text: o.option_text,
      is_true: Boolean(o.is_true),
      id: id * 10 + i,
      order: o.order ?? i,
    })),
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

export const deleteQuestions = (ctx: MockContext) => {
  requireUser(ctx, PANEL_ROLES);
  const ids = new Set(((ctx.body as DeleteQuestionsBody)?.question_ids ?? []).map(Number));
  if (!ids.size) fail(422, 'Pilih minimal satu soal');
  return mutateDb((db) => {
    const pkg = findPackage(db, ctx.params.id);
    const before = pkg.question_ids.length;
    pkg.question_ids = pkg.question_ids.filter((id) => !ids.has(id));
    pkg.updatedAt = new Date().toISOString();
    return { deleted: before - pkg.question_ids.length };
  });
};

/** Salin paket: soal ikut disalin (id & kode soal baru) sehingga paket salinan bisa diubah bebas. */
export const duplicatePackage = (ctx: MockContext) => {
  const user = requireUser(ctx, PANEL_ROLES);
  return mutateDb((db) => {
    const source = findPackage(db, ctx.params.id);
    const now = new Date().toISOString();
    const questionIds = source.question_ids
      .map((qid) => db.questions[qid])
      .filter(Boolean)
      .map((q) => {
        const id = nextId(db);
        db.questions[id] = {
          ...q,
          id,
          code: `MTR-${String(id).padStart(5, '0')}`,
          options: q.options.map((o, i) => ({ ...o, id: id * 10 + i })),
          attachments: q.attachments.map((a) => ({ ...a })),
          createdAt: now,
          updatedAt: now,
        };
        return id;
      });
    const id = nextId(db);
    const pkg: StoredPackage = {
      ...source,
      id,
      code: packageCode(id),
      title: `Salinan — ${source.title}`,
      question_ids: questionIds,
      created_by: user.full_name,
      createdAt: now,
      updatedAt: now,
    };
    db.packages.unshift(pkg);
    return toPackage(db, pkg);
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
