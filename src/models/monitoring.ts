// Hasil tryout (monitoring) untuk admin & guru — be-solutest-mitra /admin|teacher/monitoring.
// Data guru dibatasi backend ke sekolahnya.

import type { PaginationMeta } from './api';
import type { Predicate } from './analytics';
import type { ReviewQuestion } from './exam';
import type { TryoutSchedule } from './schedule';

export interface MonitoringSchedule extends TryoutSchedule {
  /** pengerjaan yang sudah dikumpulkan (dalam cakupan sekolah) */
  submitted_count: number;
  average_score: number | null;
}

export interface SchoolResultSummary {
  school_id: number | null;
  school_name: string | null;
  total_participant: number;
  total_submitted: number;
  average_score: number | null;
  average_predicate: Predicate | null;
  highest_score: number | null;
  lowest_score: number | null;
}

export interface ScheduleSummary {
  schedule: TryoutSchedule;
  schools: SchoolResultSummary[];
}

export type AttemptStatus = 'in_progress' | 'scoring' | 'scored';

export interface StudentRef {
  id: number;
  full_name: string;
  email: string;
  nisn: string | null;
  class_name: string | null;
}

export interface ScheduleResultRow {
  attempt_id: number;
  student: StudentRef;
  school: { id: number; name: string } | null;
  started_at: string;
  submitted_at: string | null;
  status: AttemptStatus;
  is_auto_ended: boolean;
  total_violation: number;
  score: number | null;
  predicate: Predicate | null;
  total_correct: number | null;
}

export interface AttemptViolation {
  id: number;
  violation_type: string;
  note: string | null;
  createdAt: string;
}

export interface AttemptDetail {
  attempt_id: number;
  student: StudentRef;
  school: { id: number; name: string } | null;
  schedule: { id: number; title: string };
  package: { id: number; title: string };
  started_at: string;
  deadline_at: string;
  submitted_at: string | null;
  is_auto_ended: boolean;
  is_processed: boolean;
  score: number | null;
  predicate: Predicate | null;
  total_correct: number | null;
  violations: AttemptViolation[];
  questions: ReviewQuestion[];
}

export interface StudentHistoryRow {
  attempt_id: number;
  schedule: { id: number; title: string };
  package: { id: number; title: string; subject_name: string | null };
  submitted_at: string;
  is_auto_ended: boolean;
  is_processed: boolean;
  score: number | null;
  predicate: Predicate | null;
}

export interface StudentHistory {
  student: StudentRef;
  summary: { total_attempt: number; average_score: number | null; highest_score: number | null };
  data: StudentHistoryRow[];
  pagination: PaginationMeta;
}

/** Ringkasan beranda admin (`GET /admin/summary`). */
export interface AdminSummary {
  total_school: number;
  total_teacher: number;
  total_student: number;
  total_package: number;
  schedules: { total: number; upcoming: number; active: number; ended: number };
  quota: { guru: { limit: number; used: number }; siswa: { limit: number; used: number } } | null;
}

/** Ringkasan beranda guru (`GET /teacher/summary`). */
export interface TeacherSummary {
  school: { id: number; name: string } | null;
  total_student: number;
  schedules: { total: number; upcoming: number; active: number; ended: number };
}
