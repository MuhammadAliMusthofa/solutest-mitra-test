// Hasil tryout & ringkasan beranda untuk admin (/admin) dan guru (/teacher).

import type { BeSchedule } from './paket';
import type { BeReviewQuestion } from './student';
import type { Paginated, ListParams } from 'src/models/api';
import type { TryoutScheduleStatus } from 'src/models/schedule';
import type {
  AdminSummary,
  AttemptDetail,
  StudentHistory,
  TeacherSummary,
  ScheduleSummary,
  ScheduleResultRow,
  MonitoringSchedule,
} from 'src/models/monitoring';

import type { Panel } from 'src/config/roles';

import { api } from 'src/core/http';

import { normalizePredicate } from 'src/utils/predicate';

import { toReviewQuestion } from './student';
import { toSchedule, scheduleStatusToBe } from './paket';

const base = (panel: Panel) => `${panel === 'admin' ? '/admin' : '/teacher'}/monitoring`;

type WithPredicate<T> = Omit<T, 'predicate'> & { predicate: string | null };

export const monitoringService = {
  schedules: (
    panel: Panel,
    p: ListParams & { status?: TryoutScheduleStatus | ''; school_id?: string | number }
  ) =>
    api
      .get<Paginated<BeSchedule & { total_submitted: number; average_score: number | null }>>(
        `${base(panel)}/schedules`,
        { ...p, status: p.status ? scheduleStatusToBe(p.status) : undefined }
      )
      .then((r): Paginated<MonitoringSchedule> => ({
        ...r,
        data: r.data.map((s) => ({
          ...toSchedule(s),
          submitted_count: s.total_submitted,
          average_score: s.average_score,
        })),
      })),
  summary: (panel: Panel, scheduleId: number | string, schoolId?: number | string) =>
    api
      .get<{ schedule: BeSchedule; schools: ScheduleSummary['schools'] }>(
        `${base(panel)}/schedules/${scheduleId}/summary`,
        { school_id: schoolId }
      )
      .then((r): ScheduleSummary => ({
        schedule: toSchedule(r.schedule),
        schools: r.schools.map((s) => ({
          ...s,
          average_predicate: normalizePredicate(s.average_predicate),
        })),
      })),
  results: (
    panel: Panel,
    scheduleId: number | string,
    p: ListParams & { school_id?: string | number; class_name?: string }
  ) =>
    api
      .get<Paginated<WithPredicate<ScheduleResultRow>>>(
        `${base(panel)}/schedules/${scheduleId}/results`,
        p
      )
      .then((r): Paginated<ScheduleResultRow> => ({
        ...r,
        data: r.data.map((row) => ({ ...row, predicate: normalizePredicate(row.predicate) })),
      })),
  attempt: (panel: Panel, attemptId: number | string) =>
    api
      .get<
        Omit<AttemptDetail, 'predicate' | 'questions'> & {
          predicate: string | null;
          questions: BeReviewQuestion[];
        }
      >(`${base(panel)}/attempts/${attemptId}`)
      .then((r): AttemptDetail => ({
        ...r,
        predicate: normalizePredicate(r.predicate),
        questions: r.questions.map(toReviewQuestion),
      })),
  studentHistory: (panel: Panel, studentId: number | string, p: ListParams) =>
    api
      .get<
        Omit<StudentHistory, 'data'> & {
          data: WithPredicate<StudentHistory['data'][number]>[];
        }
      >(`${base(panel)}/students/${studentId}/history`, p)
      .then((r): StudentHistory => ({
        ...r,
        data: r.data.map((row) => ({ ...row, predicate: normalizePredicate(row.predicate) })),
      })),
};

export const summaryService = {
  admin: () => api.get<AdminSummary>('/admin/summary'),
  teacher: () => api.get<TeacherSummary>('/teacher/summary'),
};
