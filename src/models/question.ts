// Paket soal & soal (be-solutest-mitra, khusus admin mitra).

/**
 * Tipe soal (id sama dengan Solutest pusat):
 * 1 PG · 2 PG Kompleks · 3 Benar/Salah · 9 Benar/Salah Kompleks (tabel pernyataan Benar/Salah)
 */
export type QuestionType = 1 | 2 | 3 | 9;

export const QUESTION_TYPES: { id: QuestionType; name: string; short: string }[] = [
  { id: 1, name: 'Pilihan Ganda', short: 'PG' },
  { id: 2, name: 'Pilihan Ganda Kompleks', short: 'PG Kompleks' },
  { id: 3, name: 'Benar / Salah', short: 'Benar/Salah' },
  { id: 9, name: 'Benar / Salah Kompleks', short: 'B/S Kompleks' },
];

export const questionTypeName = (id: number) =>
  QUESTION_TYPES.find((t) => t.id === id)?.short ?? 'Soal';

export interface Attachment {
  type: 'image' | 'audio';
  path: string;
}

export interface QuestionOption {
  id: number;
  /** teks pilihan · B/S Kompleks: teks pernyataan (satu baris tabel) */
  option_text: string;
  /** pilihan benar · B/S Kompleks: pernyataan bernilai Benar (false = Salah) */
  is_true?: boolean;
  order: number;
}

export interface Question {
  id: number;
  order: number;
  type_question_id: QuestionType;
  question_text: string;
  /** pembahasan */
  description: string;
  /** stimulus/bacaan (HTML), opsional */
  text: string;
  text_image: string;
  /** kompetensi soal (master /master/competencies sesuai kelas & mapel paket) */
  competency_id: number | null;
  competency_name: string | null;
  /** sub kompetensi (master /master/sub-competencies milik kompetensi) */
  sub_competency_id: number | null;
  sub_competency_name: string | null;
  options: QuestionOption[];
  attachments: Attachment[];
  /** id soal Solutest asal (paket hasil import katalog) */
  source_question_id: number | null;
}

export type PackageSource = 'MITRA' | 'SOLUTEST';

export interface Package {
  id: number;
  code: string;
  title: string;
  /** HTML/null */
  description: string | null;
  /** durasi bawaan pengerjaan (menit) */
  time: number;
  show_score: boolean;
  is_cheat_detection: boolean;
  max_violations: number;
  class_id: number | null;
  class_name: string | null;
  subject_id: number | null;
  subject_name: string | null;
  /** MITRA = dibuat mitra · SOLUTEST = disalin dari katalog Solutest */
  source: PackageSource;
  source_package_id: number | null;
  question_count: number;
  /** jumlah jadwal tryout yang memakai paket ini (paket terpakai tidak bisa dihapus) */
  schedule_count: number;
  createdAt: string;
  updatedAt: string;
}

export interface PackageDetail extends Package {
  /** false bila sudah ada siswa mengerjakan → soal terkunci, duplikat untuk mengedit */
  is_editable: boolean;
  questions: Question[];
}

export interface PackageBody {
  title: string;
  class_id: number;
  subject_id: number;
  description?: string | null;
  time?: number;
  show_score?: boolean;
  is_cheat_detection?: boolean;
  max_violations?: number;
}

export interface QuestionBody {
  type_question_id: QuestionType;
  question_text: string;
  description: string;
  text: string;
  text_image: string;
  /** dihilangkan dari body bila tidak diisi (backend menolak null/0) */
  competency_id?: number;
  sub_competency_id?: number;
  options: Omit<QuestionOption, 'id'>[];
  attachments: Attachment[];
}

export interface DeleteQuestionsBody {
  question_ids: number[];
}

export interface ClassOption {
  id: number;
  name: string;
}

export interface SubjectOption {
  id: number;
  name: string;
}

/** Kompetensi per kelas & mapel — GET /admin/masters/competencies?class_id&subject_id */
export interface CompetencyOption {
  id: number;
  name: string;
  class_id: number;
  subject_id: number;
}

/** Sub kompetensi milik satu kompetensi — GET /admin/masters/sub-competencies?competency_id */
export interface SubCompetencyOption {
  id: number;
  name: string;
  competency_id: number;
}

export interface PackageOption {
  id: number;
  code: string;
  title: string;
  time: number;
  question_count: number;
}

/** Paket Solutest yang dibagikan ke mitra — GET /admin/catalog/packages */
export interface CatalogPackage {
  id: number;
  code: string | null;
  title: string;
  description: string | null;
  time: number | null;
  class_id: number | null;
  class_name: string | null;
  subject_id: number | null;
  subject_name: string | null;
  category_name: string | null;
  total_question: number;
}
