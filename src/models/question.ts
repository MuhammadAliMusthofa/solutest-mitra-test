// Paket soal & soal (bank soal mitra). Dipakai admin & guru.

/**
 * Tipe soal:
 * 1 PG · 2 PG Kompleks · 3 Benar/Salah · 4 Benar/Salah Kompleks (tabel pernyataan Benar/Salah)
 */
export type QuestionType = 1 | 2 | 3 | 4;

export const QUESTION_TYPES: { id: QuestionType; name: string; short: string }[] = [
  { id: 1, name: 'Pilihan Ganda', short: 'PG' },
  { id: 2, name: 'Pilihan Ganda Kompleks', short: 'PG Kompleks' },
  { id: 3, name: 'Benar / Salah', short: 'Benar/Salah' },
  { id: 4, name: 'Benar / Salah Kompleks', short: 'B/S Kompleks' },
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
  code: string;
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
  /** indikator soal (master /master/indicators milik sub kompetensi) */
  indicator_id: number | null;
  indicator_name: string | null;
  category_id: number;
  category_name: string;
  options: QuestionOption[];
  attachments: Attachment[];
  /** manual = dibuat mitra; bank = soal contoh bawaan */
  source: 'manual' | 'bank';
  createdAt: string;
  updatedAt: string;
}

export interface Package {
  id: number;
  code: string;
  title: string;
  class_id: number;
  class_name: string;
  subject_id: number;
  subject_name: string;
  question_count: number;
  /** jumlah jadwal tryout yang memakai paket ini (paket terpakai tidak bisa dihapus) */
  schedule_count: number;
  created_by: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageDetail extends Package {
  questions: Question[];
}

export interface PackageBody {
  title: string;
  class_id: number;
  subject_id: number;
}

export interface QuestionBody {
  type_question_id: QuestionType;
  question_text: string;
  description: string;
  text: string;
  text_image: string;
  competency_id: number | null;
  sub_competency_id: number | null;
  indicator_id: number | null;
  category_id: number;
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

/** Kompetensi per kelas & mapel — GET /master/competencies?class_id&subject_id */
export interface CompetencyOption {
  id: number;
  code: string;
  name: string;
  class_id: number;
  subject_id: number;
  order: number;
}

/** Sub kompetensi milik satu kompetensi — GET /master/sub-competencies?competency_id */
export interface SubCompetencyOption {
  id: number;
  code: string;
  name: string;
  competency_id: number;
  order: number;
}

/** Indikator milik satu sub kompetensi — GET /master/indicators?sub_competency_id */
export interface IndicatorOption {
  id: number;
  code: string;
  name: string;
  sub_competency_id: number;
  order: number;
}

export interface CategoryOption {
  id: number;
  name: string;
}

export interface PackageOption {
  id: number;
  code: string;
  title: string;
  question_count: number;
}
