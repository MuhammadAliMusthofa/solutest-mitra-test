// Paket soal & soal (bank soal mitra). Dipakai admin & guru.

/**
 * Tipe soal (id sama dengan solutest):
 * 1 PG · 2 PG Kompleks · 3 Benar/Salah · 4 Menjodohkan · 5 Isian Singkat · 6 Esai
 */
export type QuestionType = 1 | 2 | 3 | 4 | 5 | 6;

export const QUESTION_TYPES: { id: QuestionType; name: string; short: string }[] = [
  { id: 1, name: 'Pilihan Ganda', short: 'PG' },
  { id: 2, name: 'Pilihan Ganda Kompleks', short: 'PG Kompleks' },
  { id: 3, name: 'Benar / Salah', short: 'Benar/Salah' },
  { id: 4, name: 'Menjodohkan', short: 'Menjodohkan' },
  { id: 5, name: 'Isian Singkat', short: 'Isian' },
  { id: 6, name: 'Esai', short: 'Esai' },
];

export const questionTypeName = (id: number) =>
  QUESTION_TYPES.find((t) => t.id === id)?.short ?? 'Soal';

export interface Attachment {
  type: 'image' | 'audio';
  path: string;
}

export interface QuestionOption {
  id: number;
  option_text: string;
  is_true?: boolean;
  order: number;
  /** khusus menjodohkan */
  type?: 'pernyataan' | 'jawaban';
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
  chapter_id: number | null;
  category_id: number;
  category_name: string;
  options: QuestionOption[];
  attachments: Attachment[];
  /** manual = dibuat mitra; bank = hasil generate dari bank soal */
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
  chapter_ids: number[];
  question_count: number;
  /** jumlah jadwal tryout yang memakai paket ini (paket terpakai tidak bisa dihapus) */
  schedule_count: number;
  created_by: string;
  createdAt: string;
  updatedAt: string;
}

export interface PackageDetail extends Package {
  chapters: ChapterOption[];
  questions: Question[];
}

export interface PackageBody {
  title: string;
  class_id: number;
  subject_id: number;
  chapter_ids: number[];
}

export interface QuestionBody {
  type_question_id: QuestionType;
  question_text: string;
  description: string;
  text: string;
  text_image: string;
  chapter_id: number | null;
  category_id: number;
  options: Omit<QuestionOption, 'id'>[];
  attachments: Attachment[];
}

export interface GenerateQuestionsBody {
  chapter_ids: number[];
  type_ids: QuestionType[];
  count: number;
}

export interface ClassOption {
  id: number;
  name: string;
}

export interface SubjectOption {
  id: number;
  name: string;
}

export interface ChapterOption {
  id: number;
  name: string;
  subject_id: number;
  class_id: number;
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
