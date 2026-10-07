import type { Paginated } from './api';
import type { Predicate } from './analytics';

export type TrendStatus = 'naik' | 'stabil' | 'turun' | 'kurang-data';

/** Satu titik skor pada satu tryout (kronologis). */
export interface ProgressPoint {
  code: string;
  tryout_name: string;
  date: string;
  score: number;
  subjects: { name: string; score: number }[];
}

export interface ProgressListParams {
  search?: string;
  status?: TrendStatus | '';
  page?: number;
  per_page?: number;
  [key: string]: string | number | number[] | undefined;
}

export interface SchoolProgressItem {
  id: number;
  name: string;
  city: string;
  level: string;
  participants: number;
  tryout_count: number;
  /** skor rata-rata sekolah per tryout, urut kronologis */
  scores: number[];
  last_score: number | null;
  last_predicate: Predicate | null;
}

export interface StudentProgressItem {
  id: number;
  name: string;
  school: string;
  class: string | null;
  tryout_count: number;
  scores: number[];
  last_score: number | null;
  last_predicate: Predicate | null;
}

export type SchoolProgressList = Paginated<SchoolProgressItem>;
export type StudentProgressList = Paginated<StudentProgressItem>;

export interface SchoolProgressDetail {
  id: number;
  name: string;
  city: string;
  level: string;
  participants: number;
  points: ProgressPoint[];
  /** siswa sekolah ini dengan tren masing-masing */
  students: StudentProgressItem[];
}

export interface StudentProgressDetail {
  id: number;
  name: string;
  nisn: string | null;
  school: string;
  school_id: number;
  class: string | null;
  points: ProgressPoint[];
  /** rata-rata sekolah per tryout (kode yang sama dengan points) sebagai pembanding */
  school_average: { code: string; score: number }[];
}

export type { ProgressKind } from 'src/config/paths';

/** Baris tabel progres (sekolah atau siswa) yang sudah siap ditampilkan. */
export interface ProgressRow {
  id: number;
  name: string;
  /** keterangan di bawah nama, mis. "Bandung · SMA" atau "SMAN 1 · XII IPA 1" */
  caption: string;
  /** jumlah siswa; hanya untuk baris sekolah */
  participants?: number;
  tryout_count: number;
  scores: number[];
  last_score: number | null;
  last_predicate: Predicate | null;
  href: string;
}

/** Ringkasan tile progres: skor terakhir, status, perubahan sejak tryout pertama, pergeseran predikat. */
export interface ProgressSummary {
  last?: number;
  status: TrendStatus;
  delta: number | null;
  sinceFirst: number | null;
  tryoutCount: number;
  shift: { from: Predicate; to: Predicate; direction: 'up' | 'down' } | null;
}
