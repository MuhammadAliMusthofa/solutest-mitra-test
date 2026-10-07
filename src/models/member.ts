// Anggota mitra: siswa (import batch) & guru (dibuat admin mitra).

import type { Paginated } from './api';
import type { Predicate } from './analytics';

export interface MitraStudent {
  id: number;
  name: string;
  email: string;
  nisn: string | null;
  school: string;
  class: string | null;
  jenjang: string | null;
  total_tryout: number;
  last_score: number | null;
  last_predicate: Predicate | null;
  created_at: string;
}

export type MitraStudentList = Paginated<MitraStudent>;

export interface ImportStudentRow {
  name: string;
  email: string;
  password: string;
  nisn: string;
  school: string;
  class: string;
  jenjang: string;
}

export interface ImportStudentResult {
  created: number;
  skipped: number;
  errors: { row: number; email: string; message: string }[];
}

export interface SchoolOption {
  id: number;
  name: string;
  city: string;
  level: string;
}

export interface MitraTeacher {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  schools: SchoolOption[];
  status: 'active' | 'inactive';
  created_at: string;
}

export interface TeacherBody {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  school_ids: number[];
  /** wajib saat membuat; opsional saat mengubah */
  password?: string;
  status?: MitraTeacher['status'];
}
