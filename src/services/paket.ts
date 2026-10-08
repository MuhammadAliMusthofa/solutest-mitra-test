// Paket soal, soal, master data, katalog Solutest, dan jadwal tryout (admin mitra).
// Respons be-solutest-mitra dipetakan ke model FE di sini supaya komponen tidak tahu bentuk backend.

import type { Paginated, ListParams } from 'src/models/api';
import type {
  TryoutSchedule,
  TryoutScheduleStatus,
  CreateTryoutScheduleBody,
} from 'src/models/schedule';
import type {
  Package,
  Question,
  ClassOption,
  PackageBody,
  QuestionBody,
  QuestionType,
  PackageDetail,
  PackageOption,
  SubjectOption,
  PackageSource,
  CatalogPackage,
  QuestionOption,
  CompetencyOption,
  SubCompetencyOption,
  DeleteQuestionsBody,
} from 'src/models/question';

import { api } from 'src/core/http';

// ------------------------------------------------------------------ bentuk backend
interface BeOption {
  id: number;
  option_text: string;
  is_true: boolean;
  point: number;
  reason: string | null;
  order: number | null;
  file: string | null;
}

interface BeStatement {
  order: number;
  statement: BeOption;
  answers: BeOption[];
}

export interface BeQuestion {
  id: number;
  order: number;
  question_text: string;
  description: string | null;
  type_question_id: QuestionType;
  text_content: string | null;
  text_image: string | null;
  competency_id: number | null;
  competency_name: string | null;
  sub_competency_id: number | null;
  sub_competency_name: string | null;
  source_question_id: number | null;
  options: BeOption[];
  statements: BeStatement[] | null;
  attachments: string[];
}

interface BePackage {
  id: number;
  code: string;
  title: string;
  description: string | null;
  time: number;
  show_score: boolean;
  is_cheat_detection: boolean;
  max_violations: number;
  class_id: number | null;
  class_name: string | null;
  subject_id: number | null;
  subject_name: string | null;
  source: PackageSource;
  source_package_id: number | null;
  total_question?: number;
  total_schedule?: number;
  createdAt: string;
  updatedAt: string;
}

interface BePackageDetail extends BePackage {
  is_editable: boolean;
  questions: BeQuestion[];
}

export type BeScheduleStatus = 'upcoming' | 'active' | 'ended';

export interface BeSchedule {
  id: number;
  code: string;
  title: string;
  description: string | null;
  package_id: number;
  package: {
    id: number;
    code: string;
    title: string;
    time: number;
    is_cheat_detection: boolean;
  };
  start_at: string;
  end_at: string;
  duration: number;
  max_attempts: number;
  is_published: boolean;
  status: BeScheduleStatus;
  is_all_schools: boolean;
  schools: { id: number; name: string }[];
  total_participant?: number;
  total_submitted?: number;
  total_in_progress?: number;
}

// ------------------------------------------------------------------ pemetaan
const BENAR = '<p>Benar</p>';
const SALAH = '<p>Salah</p>';

/**
 * Benar/Salah Kompleks di backend dikelompokkan per `order`: opsi pertama = teks pernyataan,
 * sisanya label jawaban (Benar, Salah). Di FE satu pernyataan = satu opsi dengan `is_true` = kunci
 * Benar (label pertama), `id` = id opsi pernyataan.
 */
const statementOptions = (statements: BeStatement[]): QuestionOption[] =>
  statements.map((g) => ({
    id: g.statement.id,
    option_text: g.statement.option_text,
    is_true: g.answers.findIndex((a) => a.is_true) === 0,
    order: g.order,
  }));

export const toQuestion = (q: BeQuestion): Question => ({
  id: q.id,
  order: q.order,
  type_question_id: q.type_question_id,
  question_text: q.question_text,
  description: q.description ?? '',
  text: q.text_content ?? '',
  text_image: q.text_image ?? '',
  competency_id: q.competency_id,
  competency_name: q.competency_name,
  sub_competency_id: q.sub_competency_id,
  sub_competency_name: q.sub_competency_name,
  options:
    q.type_question_id === 9 && q.statements
      ? statementOptions(q.statements)
      : q.options.map((o, i) => ({
          id: o.id,
          option_text: o.option_text,
          is_true: o.is_true,
          order: o.order ?? i,
        })),
  attachments: q.attachments.map((path) => ({ type: 'image', path })),
  source_question_id: q.source_question_id,
});

const toQuestionBody = (body: QuestionBody) => {
  const options =
    body.type_question_id === 9
      ? body.options.flatMap((o, i) => [
          { option_text: o.option_text, is_true: false, order: i + 1 },
          { option_text: BENAR, is_true: Boolean(o.is_true), order: i + 1 },
          { option_text: SALAH, is_true: !o.is_true, order: i + 1 },
        ])
      : body.options.map((o, i) => ({
          option_text: o.option_text,
          is_true: Boolean(o.is_true),
          order: i + 1,
        }));
  return {
    type_question_id: body.type_question_id,
    // backend mewajibkan teks soal; soal bergambar saja tetap dikirim paragraf kosong
    question_text: body.question_text || '<p></p>',
    description: body.description || null,
    text_content: body.text || null,
    text_image: body.text_image || null,
    competency_id: body.competency_id,
    sub_competency_id: body.sub_competency_id,
    options,
    attachments: body.attachments.filter((a) => a.type === 'image').map((a) => a.path),
  };
};

const toPackage = (p: BePackage): Package => ({
  id: p.id,
  code: p.code,
  title: p.title,
  description: p.description,
  time: p.time,
  show_score: p.show_score,
  is_cheat_detection: p.is_cheat_detection,
  max_violations: p.max_violations,
  class_id: p.class_id,
  class_name: p.class_name,
  subject_id: p.subject_id,
  subject_name: p.subject_name,
  source: p.source,
  source_package_id: p.source_package_id,
  question_count: p.total_question ?? 0,
  schedule_count: p.total_schedule ?? 0,
  createdAt: p.createdAt,
  updatedAt: p.updatedAt,
});

const toPackageDetail = (p: BePackageDetail): PackageDetail => ({
  ...toPackage(p),
  question_count: p.questions.length,
  is_editable: p.is_editable,
  questions: p.questions.map(toQuestion),
});

const mapPage = <A, B>(page: Paginated<A>, fn: (a: A) => B): Paginated<B> => ({
  ...page,
  data: page.data.map(fn),
});

const STATUS_FROM_BE: Record<BeScheduleStatus, TryoutScheduleStatus> = {
  upcoming: 'scheduled',
  active: 'ongoing',
  ended: 'finished',
};

const STATUS_TO_BE: Record<TryoutScheduleStatus, BeScheduleStatus> = {
  scheduled: 'upcoming',
  ongoing: 'active',
  finished: 'ended',
};

export const scheduleStatusFromBe = (status: BeScheduleStatus) => STATUS_FROM_BE[status];
export const scheduleStatusToBe = (status: TryoutScheduleStatus) => STATUS_TO_BE[status];

export const toSchedule = (s: BeSchedule): TryoutSchedule => ({
  id: s.id,
  code: s.code,
  title: s.title,
  package_id: s.package_id,
  package_title: s.package.title,
  package_code: s.package.code,
  start_date: s.start_at,
  end_date: s.end_at,
  duration: s.duration,
  description: s.description,
  is_cheat_detection: s.package.is_cheat_detection,
  max_attempts: s.max_attempts,
  is_published: s.is_published,
  is_all_schools: s.is_all_schools,
  schools: s.schools,
  participants: s.total_participant ?? 0,
  total_submitted: s.total_submitted ?? 0,
  total_in_progress: s.total_in_progress ?? 0,
  status: STATUS_FROM_BE[s.status],
});

// ------------------------------------------------------------------ service
const M = '/admin/masters';

export const masterService = {
  classes: () => api.get<ClassOption[]>(`${M}/classes`),
  subjects: () => api.get<SubjectOption[]>(`${M}/subjects`),
  competencies: (p: { class_id?: number; subject_id?: number; package_id?: number }) =>
    api.get<CompetencyOption[]>(`${M}/competencies`, p),
  subCompetencies: (p: { competency_id?: number }) =>
    api.get<SubCompetencyOption[]>(`${M}/sub-competencies`, p),
};

export const paketService = {
  list: (p: ListParams & { source?: PackageSource; subject_id?: string | number }) =>
    api.get<Paginated<BePackage>>('/admin/packages', p).then((r) => mapPage(r, toPackage)),
  /** Paket yang sudah berisi soal (pilihan saat membuat jadwal). */
  options: () =>
    api
      .get<Paginated<BePackage>>('/admin/packages', { has_question: true, per_page: 100 })
      .then((r) =>
        r.data.map((p): PackageOption => ({
          id: p.id,
          code: p.code,
          title: p.title,
          time: p.time,
          question_count: p.total_question ?? 0,
        }))
      ),
  detail: (id: number | string) =>
    api.get<BePackageDetail>(`/admin/packages/${id}`).then(toPackageDetail),
  create: (body: PackageBody) => api.post<BePackage>('/admin/packages', body).then(toPackage),
  update: (id: number, body: Partial<PackageBody>) =>
    api.put<BePackage>(`/admin/packages/${id}`, body).then(toPackage),
  remove: (id: number) => api.delete<unknown>(`/admin/packages/${id}`),
  /** Salin paket beserta seluruh soalnya → paket baru (kode baru). */
  duplicate: (id: number) => api.post<BePackage>(`/admin/packages/${id}/duplicate`).then(toPackage),

  /** Backend tidak punya GET soal tunggal: ambil dari detail paket. */
  question: async (paketId: number | string, questionId: number | string) => {
    const detail = await paketService.detail(paketId);
    const question = detail.questions.find((q) => String(q.id) === String(questionId));
    if (!question) throw Object.assign(new Error('Soal tidak ditemukan'), { status: 404 });
    return question;
  },
  createQuestion: (paketId: number | string, body: QuestionBody) =>
    api
      .post<BeQuestion>(`/admin/packages/${paketId}/questions`, toQuestionBody(body))
      .then(toQuestion),
  updateQuestion: (_paketId: number | string, questionId: number | string, body: QuestionBody) =>
    api.put<BeQuestion>(`/admin/questions/${questionId}`, toQuestionBody(body)).then(toQuestion),
  removeQuestion: (_paketId: number | string, questionId: number) =>
    api.delete<unknown>(`/admin/questions/${questionId}`),
  removeQuestions: (paketId: number | string, body: DeleteQuestionsBody) =>
    api.post<{ deleted: number }>(`/admin/packages/${paketId}/questions/bulk-delete`, body),
};

export const catalogService = {
  /** Paket Solutest yang dibagikan ke mitra (hanya soal PG, PG Kompleks, B/S, B/S Kompleks). */
  list: (p: ListParams & { class_id?: number; subject_id?: number }) =>
    api.get<Paginated<CatalogPackage>>('/admin/catalog/packages', p),
  /** Salin paket Solutest ke mitra → paket mitra baru yang bisa diedit. */
  import: (id: number) =>
    api
      .post<BePackage & { skipped_question: number }>(`/admin/catalog/packages/${id}/import`)
      .then((p) => ({ ...toPackage(p), skipped_question: p.skipped_question })),
};

export const scheduleService = {
  list: (p: ListParams & { status?: TryoutScheduleStatus | '' }) =>
    api
      .get<Paginated<BeSchedule>>('/admin/schedules', {
        ...p,
        status: p.status ? STATUS_TO_BE[p.status] : undefined,
      })
      .then((r) => mapPage(r, toSchedule)),
  detail: (id: number) => api.get<BeSchedule>(`/admin/schedules/${id}`).then(toSchedule),
  create: (body: CreateTryoutScheduleBody) =>
    api.post<BeSchedule>('/admin/schedules', body).then(toSchedule),
  update: (id: number, body: Partial<CreateTryoutScheduleBody>) =>
    api.put<BeSchedule>(`/admin/schedules/${id}`, body).then(toSchedule),
  remove: (id: number) => api.delete<unknown>(`/admin/schedules/${id}`),
};
