// Tipe data analitik (lihat docs/api-contract.md §4).
// Semua endpoint menerima `code` opsional: kosong = semua tryout milik tenant.
// Untuk role guru, backend membatasi data ke sekolah yang diampu guru tersebut.

import type { Paginated } from './api';

export type Predicate = 'KURANG' | 'MEMADAI' | 'BAIK' | 'ISTIMEWA';

export interface AnalyticsParams {
  code?: string;
  jenjang?: string;
  search?: string;
  page?: number;
  per_page?: number;
  [key: string]: string | number | number[] | undefined;
}

// ---------- Filter ----------
export interface TryoutOption {
  code: string;
  name: string;
  start_date: string;
  end_date: string;
  status: 'scheduled' | 'ongoing' | 'finished';
  participants: number;
}

// ---------- Dashboard ----------
export interface DashboardKpi {
  total_participants: number;
  total_participants_delta: number;
  total_participants_trend: number[];
  national_average: number;
  national_average_delta: number;
  national_average_trend: number[];
  total_schools: number;
  total_schools_delta: number;
  total_schools_trend: number[];
  completion_rate: number;
  completion_rate_delta: number;
  completion_rate_trend: number[];
  active_sessions: number;
}

export interface ChartSeries {
  name: string;
  data: number[];
}

export interface CategoryChart {
  categories: string[];
  series: ChartSeries[];
}

export interface DashboardDistribusi {
  labels: string[];
  data: number[];
}

export interface DashboardRataRataMapel {
  subjects: { name: string; average: number }[];
}

export interface DashboardCompletion {
  completion_rate: number;
  total_completed: number;
  total_incomplete: number;
}

export interface DashboardTopStudent {
  id: number;
  name: string;
  school: string;
  class: string;
  duration: number;
  total_score: number;
  avatar_seed?: string;
}

// ---------- Sekolah ----------
export interface SchoolRankingItem {
  id: number;
  rank: number;
  name: string;
  city: string;
  level: string;
  tryout_name: string;
  participants: number;
  average: number;
  highest_score: number;
  lowest_score: number;
  completion_rate: number;
}

export interface SchoolSubject {
  code: string;
  name: string;
  average: number;
  predicate: Predicate;
}

export interface SchoolSubjectsResponse {
  school_id: number;
  subjects: SchoolSubject[];
  statistics: { highest_score: number; lowest_score: number };
}

// ---------- Siswa ----------
export interface StudentSubjectScore {
  code?: string;
  name: string;
  total_score: number;
  predicate: Predicate;
}

export interface StudentDetailItem {
  id: number;
  practice_id: number;
  rank: number;
  name: string;
  avatar_seed: string;
  school: string;
  school_id: string;
  level: string;
  class: string;
  tryout_name: string;
  total_score: number;
  total_predicate: Predicate;
  duration: number;
  status: 'Selesai' | 'Belum Selesai' | 'Sedang Mengerjakan';
  subjects: StudentSubjectScore[];
}

export interface StudentDetailResponse extends Paginated<StudentDetailItem> {
  filter_options: { sekolah: { id: string; nama: string }[]; jenjang: string[] };
}

export interface PracticeOption {
  id: number;
  text: string;
  is_correct: boolean;
  is_student_answer: boolean;
}

export interface PracticeQuestion {
  no: number;
  question_id: number;
  question_code: string;
  question_text: string;
  question_type: string;
  explanation: string;
  subject: string;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: 'correct' | 'incorrect' | 'unanswered';
  student_answer: string | null;
  correct_answer: string | null;
  options: PracticeOption[];
}

export interface PracticeDetail {
  practice_id: number;
  student: { name: string; nisn: string; school: string; class: string };
  package: { title: string; code: string };
  summary: {
    total_questions: number;
    total_correct: number;
    total_incorrect: number;
    total_unanswered: number;
    score: number;
    submitted_at: string;
  };
  questions: PracticeQuestion[];
}

// ---------- Regional ----------
export interface RegionalSummary {
  total_regions: number;
  total_participants: number;
  total_schools: number;
  national_average: number;
}

export interface MapLocation {
  name: string;
  lat: number;
  lng: number;
  participants: number;
  schools: number;
  average: number;
}

export interface RegionData {
  id: string;
  name: string;
  participants: number;
  schools: number;
  average: number;
  completion: number;
}

export interface RegionalHeatmap {
  data: { label: string; value: number }[];
  max_value: number;
  min_value: number;
  national_average: number;
}

export interface RegionalSchool {
  id: number;
  name: string;
  city: string;
  region: string;
  level: string;
  participants: number;
  average: number;
  completion_rate: number;
  subjects: { code: string; short_name: string; score: number }[];
}

export interface RegionalSchoolsResponse extends Paginated<RegionalSchool> {
  region_list: string[];
}

// ---------- Butir soal ----------
export type Difficulty = 'MUDAH' | 'SEDANG' | 'SULIT';

export interface ItemAnalysisQuestion {
  id: number;
  question_text: string | null;
  pembahasan: string | null;
  subject_name: string | null;
  total_participants: number;
  benar: number;
  salah: number;
  kosong: number;
  difficulty: Difficulty;
}

export interface ItemAnalysisResponse extends Paginated<ItemAnalysisQuestion> {
  summary: { mudah: number; sedang: number; sulit: number };
  subjects: string[];
}

// ---------- Indikator ----------
export interface IndicatorFilters {
  subjects: string[];
  jenjang: string[];
}

export interface IndicatorSummary {
  total_sekolah: number;
  total_peserta: number;
}

export interface IndicatorNode {
  id: number;
  name: string;
  percentage: number;
  question_ids: number[];
}

export interface SubCompetencyNode {
  id: number;
  name: string;
  percentage: number;
  indicators: IndicatorNode[];
}

export interface CompetencyNode {
  id: number;
  name: string;
  percentage: number;
  sub_competencies: SubCompetencyNode[];
}

export interface SampleQuestion {
  id: number;
  code: string | null;
  question_text: string;
  question_type: string;
  competency_name: string;
  sub_competency_name: string;
  indicator_name: string;
  options: { id: number; option_text: string; is_true: boolean }[];
}
