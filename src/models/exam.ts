// Pengerjaan tryout siswa: mulai, simpan sementara, lanjutkan, kumpulkan, riwayat, pembahasan.
//
// Format `answer` per tipe soal (sama dengan solutest):
//  PG / Benar-Salah : ["<optionId>"]
//  PG Kompleks      : ["<optionId>", ...]
//  Menjodohkan      : [[pernyataanId, jawabanId | null], ...]
//  Isian Singkat    : ["teks kolom 1", ...]
//  Esai             : ["teks"]

import type { Paginated } from './api';
import type { Attachment, QuestionType } from './question';

export type AnswerValue = string[] | [number, number | null][];

export interface ExamOption {
  id: number;
  option_text: string;
  order: number;
  type?: 'pernyataan' | 'jawaban';
}

/** Soal versi ujian: tanpa kunci jawaban & pembahasan. */
export interface ExamQuestion {
  id: number;
  code: string;
  type_question_id: QuestionType;
  question_text: string;
  text: string;
  text_image: string;
  /** jumlah kolom isian (tipe 5) */
  column_answer: number;
  options: ExamOption[];
  attachments: Attachment[];
}

export interface ExamSection {
  subject_id: number;
  subject_name: string;
  questions: ExamQuestion[];
}

/** Data mulai/lanjutkan tryout; disimpan di store soal selama pengerjaan. */
export interface ExamSession {
  practice_id: number;
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
  /** tenggat pengerjaan = min(start_time + duration, end_time) — dihitung klien (ISO) */
  deadline: string;
  total: number;
  is_cheat_detection: boolean;
  max_violations: number;
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
  code: string;
  title: string;
  package_id: number;
  description: string;
  subject_name: string;
  class_name: string;
  total_question: number;
  duration: number;
  start_date: string;
  end_date: string;
  status: 'scheduled' | 'ongoing' | 'finished';
  is_cheat_detection: boolean;
  max_violations: number;
  is_done: boolean;
  unfinished_practice_id: number | null;
  tenant_name: string;
}

export interface SubmitResult {
  practice_id: number;
  score: number;
}

export interface HistoryItem {
  practice_id: number;
  package_id: number;
  code: string;
  title: string;
  subject_name: string;
  score: number;
  /** lama pengerjaan (menit) */
  time: number;
  total_question: number;
  submitted_at: string;
}

export type HistoryList = Paginated<HistoryItem>;

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

export interface Explanation {
  practice_id: number;
  title: string;
  user_name: string;
  subject_name: string;
  score: number;
  total_questions: number;
  questions: ExplanationQuestion[];
}

export interface LeaderboardRow {
  rank: number;
  user_id: number;
  full_name: string;
  school: string;
  city_name: string;
  province_name: string;
  score: number;
  submitted_at: string;
}

export interface Leaderboard extends Paginated<LeaderboardRow> {
  my_rank: LeaderboardRow | null;
}

export interface LeaderboardTryoutOption {
  package_id: number;
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
