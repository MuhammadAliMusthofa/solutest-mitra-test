// Pengerjaan tryout siswa: mulai, simpan sementara, lanjutkan, kumpulkan, riwayat, pembahasan.
// `practice_id` = `attempt_id` di be-solutest-mitra.
//
// Format `answer` per tipe soal di FE (sama dengan solutest):
//  PG / Benar-Salah     : ["<optionId>"]
//  PG Kompleks          : ["<optionId>", ...]
//  Benar-Salah Kompleks : [[pernyataanId, 1 (Benar) | 0 (Salah) | null], ...]
// Backend menerima id opsi `number[]`; B/S Kompleks = id label jawaban per pernyataan
// (pemetaan di src/services/student.ts memakai `statement_labels`).

import type { Paginated } from './api';
import type { Predicate } from './analytics';
import type { Attachment, QuestionType } from './question';

export type AnswerValue = string[] | [number, number | null][];

export interface ExamOption {
  id: number;
  option_text: string;
  order: number;
}

/** Soal versi ujian: tanpa kunci jawaban & pembahasan. */
export interface ExamQuestion {
  id: number;
  type_question_id: QuestionType;
  question_text: string;
  text: string;
  text_image: string;
  options: ExamOption[];
  attachments: Attachment[];
  /** B/S Kompleks: id pernyataan → [id label Benar, id label Salah] */
  statement_labels?: Record<number, number[]>;
}

export interface ExamSection {
  subject_id: number;
  subject_name: string;
  questions: ExamQuestion[];
}

/** Data mulai/lanjutkan tryout; disimpan di store soal selama pengerjaan. */
export interface ExamSession {
  practice_id: number;
  schedule_id: number;
  package_id: number;
  code: string;
  title: string;
  subjects: { id: number; name: string }[];
  sections: ExamSection[];
  /** waktu siswa mulai mengerjakan (ISO) */
  start_time: string;
  /** batas akhir jadwal tryout (ISO) */
  end_time: string;
  /** durasi pengerjaan (menit) */
  duration: number;
  /** tenggat pengerjaan dari backend, sudah dikoreksi selisih jam server ↔ perangkat (ISO) */
  deadline: string;
  total: number;
  is_cheat_detection: boolean;
  max_violations: number;
  current_violations: number;
  /** jawaban sementara tersimpan di server (format FE) */
  saved_answers: SavedAnswer[];
}

/** Jawaban di store klien (persist) — sama dengan IAnswer solutest. */
export interface ExamAnswer {
  id: number;
  type: number;
  answer: AnswerValue;
  isCompleted?: boolean;
  isDoubt?: boolean;
  /** indeks soal (0-based) */
  index?: number;
  duration_seconds?: number;
  countListeningMedia?: number;
}

/** Payload simpan sementara & kumpulkan. */
export interface AnswerPayloadItem {
  id: number;
  type: number;
  answer: AnswerValue | null;
  duration_seconds: number;
  is_doubt?: boolean;
}

/** Jawaban tersimpan dari server; `answer` bisa berupa string JSON (dinormalisasi klien). */
export interface SavedAnswer {
  id: number;
  type: number;
  answer: unknown;
  duration_seconds?: number;
  is_doubt?: boolean;
}

export interface UnfinishedPractice {
  practice_id: number;
  code: string;
  title: string;
  subject_name: string;
  total_question: number;
  answered: number;
  started_at: string;
  deadline: string;
}

export interface TryoutDetail {
  /** id jadwal */
  id: number;
  code: string;
  title: string;
  package_id: number;
  description: string;
  subject_name: string | null;
  class_name: string | null;
  total_question: number;
  duration: number;
  start_date: string;
  end_date: string;
  status: 'scheduled' | 'ongoing' | 'finished';
  is_cheat_detection: boolean;
  max_violations: number;
  show_score: boolean;
  max_attempts: number;
  attempts_used: number;
  /** boleh mulai / lanjutkan sekarang */
  can_start: boolean;
  /** kesempatan habis (semua pengerjaan sudah dikumpulkan) */
  is_done: boolean;
  unfinished_practice_id: number | null;
}

export interface SubmitResult {
  practice_id: number;
  /** dikumpulkan setelah tenggat (masih dalam toleransi) */
  is_late: boolean;
}

export interface HistoryItem {
  practice_id: number;
  schedule_id: number;
  package_id: number;
  title: string;
  package_title: string;
  subject_name: string;
  /** null bila nilai disembunyikan atau masih dihitung */
  score: number | null;
  predicate: Predicate | null;
  is_processed: boolean;
  is_auto_ended: boolean;
  /** lama pengerjaan (menit) */
  time: number;
  started_at: string;
  submitted_at: string;
}

export interface HistoryList extends Paginated<HistoryItem> {
  summary: {
    total_attempt: number;
    total_scored: number;
    average_score: number | null;
    average_predicate: Predicate | null;
    highest_score: number | null;
  };
}

export interface ExplanationOption extends ExamOption {
  is_true: boolean;
  selected: boolean;
}

export interface ExplanationQuestion extends Omit<ExamQuestion, 'options'> {
  description: string;
  options: ExplanationOption[];
  answer: AnswerValue;
  /** skor soal 0–100 */
  score: number;
}

/** Soal pembahasan + info kompetensi & durasi (dipakai juga monitoring admin/guru). */
export interface ReviewQuestion extends ExplanationQuestion {
  competency_name: string | null;
  sub_competency_name: string | null;
  duration_seconds: number;
}

/** Hasil satu pengerjaan (`GET /student/attempts/:id`). */
export interface Explanation {
  practice_id: number;
  schedule_id: number;
  title: string;
  package_title: string;
  /** null bila nilai disembunyikan atau masih dihitung */
  score: number | null;
  predicate: Predicate | null;
  total_correct: number | null;
  is_processed: boolean;
  is_auto_ended: boolean;
  /** kunci & pembahasan dibuka setelah jadwal berakhir */
  review_available: boolean;
  schedule_end_at: string;
  started_at: string;
  submitted_at: string;
  questions: ReviewQuestion[];
}

export interface LeaderboardRow {
  rank: number;
  user_id: number;
  full_name: string;
  class_name: string | null;
  school: string;
  score: number;
  predicate: Predicate | null;
  duration_seconds: number | null;
  is_me: boolean;
}

export interface Leaderboard extends Paginated<LeaderboardRow> {
  my_rank: LeaderboardRow | null;
  total_participant: number;
}

export interface LeaderboardTryoutOption {
  schedule_id: number;
  code: string;
  title: string;
}

export interface CompetencyBreakdown {
  area_name: string;
  score: number;
  status: 'Kuat' | 'Perlu Ditingkatkan';
  total_questions: number;
  time_spent_seconds: number;
  avg_time_per_question_seconds: number;
}

export interface PerformanceReport {
  practice_id: number;
  title: string;
  user_name: string;
  score: number;
  rank_position: number | null;
  total_participants: number;
  total_questions: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy_percentage: number;
  total_time_spent_minutes: number;
  test_date: string;
  competency_breakdown: CompetencyBreakdown[];
  summary: {
    executive_summary: string;
    strengths: string;
    weaknesses: string;
    time_management: string;
  };
  recommendation: {
    learning_priorities: { title: string; brief: string }[];
    plan: { frequency: string; duration: string; question_count: string };
  };
}

export interface ViolationBody {
  reason: string;
  count: number;
  occurred_at: string;
}

export interface ViolationResult {
  current_violations: number;
  max_violations: number;
  is_cheat_detection: boolean;
  /** backend mengumpulkan otomatis karena batas pelanggaran tercapai */
  auto_ended: boolean;
}
