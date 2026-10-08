// Anggota mitra (guru & siswa) dan sekolah mitra. Akun memakai akun Solutest; nama & email tidak
// bisa diubah dari app mitra, hanya sekolah / NISN / kelas dan status aktif.

import type { Paginated } from './api';
import type { Predicate } from './analytics';

export interface MitraStudent {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  nisn: string | null;
  school_id: number | null;
  school: string;
  class: string | null;
  /** jenjang sekolah (dari data sekolah circl) */
  jenjang: string | null;
  is_active: boolean;
  total_tryout: number;
  last_score: number | null;
  last_predicate: Predicate | null;
  last_submitted_at: string | null;
  created_at: string;
}

export type MitraStudentList = Paginated<MitraStudent>;

export interface StudentListParams {
  search?: string;
  school_id?: number | string;
  class_name?: string;
  is_active?: boolean | string;
  page?: number;
  per_page?: number;
}

export interface StudentBody {
  name: string;
  email: string;
  /** wajib bila email belum punya akun Solutest (min 6) */
  password?: string;
  phone?: string;
  nisn?: string;
  class?: string;
  /** admin wajib; guru otomatis sekolahnya */
  school_id?: number;
}

export interface UpdateStudentBody {
  nisn?: string | null;
  class?: string | null;
  /** admin saja */
  school_id?: number;
}

export interface ImportStudentRow {
  name: string;
  email: string;
  password: string;
  nisn: string;
  /** nama / NPSN sekolah mitra (admin, opsional bila sekolah dipilih sekali) */
  school: string;
  class: string;
  phone: string;
}

export type ImportRowStatus = 'created' | 'existing_account' | 'skipped' | 'failed';

export interface ImportStudentResult {
  summary: {
    total: number;
    created: number;
    existing_account: number;
    skipped: number;
    failed: number;
  };
  results: {
    row: number;
    email: string;
    status: ImportRowStatus;
    user_id: number | null;
    error: string | null;
  }[];
}

/** Sekolah yang sudah diikutkan mitra (`GET /admin/schools`). */
export interface SchoolOption {
  id: number;
  name: string;
  npsn: string | null;
  city: string;
  level: string;
}

export interface MitraSchool extends SchoolOption {
  ref_id: string | null;
  province_name: string | null;
  district_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  total_guru: number;
  total_siswa: number;
  created_at: string;
}

/** Hasil cari sekolah se-Indonesia (circl) — `GET /admin/schools/search`. */
export interface CirclSchool {
  ref_id: string;
  npsn: string | null;
  name: string;
  education_level: string | null;
  status: string | null;
  address: string | null;
  province_name: string | null;
  city_name: string | null;
  district_name: string | null;
  /** id sekolah mitra bila sudah ditambahkan */
  mitra_school_id: number | null;
}

export interface MitraTeacher {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  /** guru hanya mengampu satu sekolah */
  school_id: number | null;
  school_name: string | null;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface TeacherBody {
  name: string;
  email: string;
  phone?: string;
  school_id: number;
  /** wajib bila email belum punya akun Solutest (min 6) */
  password?: string;
}

export interface Quota {
  guru: { limit: number; used: number };
  siswa: { limit: number; used: number };
}
