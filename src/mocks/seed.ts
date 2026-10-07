// Master data & bank soal simulasi (kelas, mapel, bab, kategori) untuk paket soal mitra.

import type { Question, QuestionType, ChapterOption, QuestionOption } from 'src/models/question';

export const MOCK_CLASSES = [
  { id: 10, name: 'X' },
  { id: 11, name: 'XI' },
  { id: 12, name: 'XII' },
];

export const MOCK_SUBJECTS = [
  { id: 8, name: 'Matematika' },
  { id: 5, name: 'Bahasa Indonesia' },
  { id: 4, name: 'Bahasa Inggris' },
];

export const MOCK_CATEGORIES = [
  { id: 1, name: 'Ujian Sekolah' },
  { id: 2, name: 'Formatif' },
  { id: 3, name: 'Sumatif' },
  { id: 4, name: 'Olimpiade' },
  { id: 5, name: 'AKM' },
];

const CHAPTER_NAMES: Record<number, string[]> = {
  8: ['Bilangan & Eksponen', 'Persamaan dan Fungsi', 'Geometri', 'Statistika dan Peluang'],
  5: ['Teks Eksposisi', 'Teks Argumentasi', 'Kebahasaan dan Ejaan'],
  4: ['Reading Comprehension', 'Grammar in Context', 'Vocabulary'],
};

export const MOCK_CHAPTERS: ChapterOption[] = MOCK_CLASSES.flatMap((cls) =>
  MOCK_SUBJECTS.flatMap((sub) =>
    CHAPTER_NAMES[sub.id].map((name, i) => ({
      id: cls.id * 100 + sub.id * 10 + i + 1,
      name,
      subject_id: sub.id,
      class_id: cls.id,
      order: i + 1,
    }))
  )
);

export const TYPE_NAMES: Record<number, string> = {
  1: 'PG',
  2: 'PG Kompleks',
  3: 'Benar/Salah',
  4: 'Menjodohkan',
  5: 'Isian Singkat',
  6: 'Esai',
};

const opt = (
  id: number,
  option_text: string,
  order: number,
  extra: Partial<QuestionOption> = {}
): QuestionOption => ({ id, option_text, order, is_true: false, ...extra });

const STIMULUS = `<p><b>Bacalah teks berikut.</b></p><p>Kota Tegal dikenal sebagai kota bahari di pesisir utara Jawa. Selain warteg yang tersebar di berbagai kota, Tegal juga memiliki tradisi sedekah laut yang digelar nelayan setiap tahun sebagai wujud syukur atas hasil tangkapan.</p>`;

/** Membuat satu soal bank (hasil generate) untuk bab & tipe tertentu. */
export const buildBankQuestion = (
  id: number,
  chapter: ChapterOption,
  type: QuestionType,
  categoryId: number
): Question => {
  const subject = MOCK_SUBJECTS.find((s) => s.id === chapter.subject_id)?.name ?? 'Mapel';
  const category = MOCK_CATEGORIES.find((c) => c.id === categoryId) ?? MOCK_CATEGORIES[0];
  const n = id % 97;
  const now = new Date().toISOString();
  const base = {
    id,
    code: `BNK-${String(id).padStart(5, '0')}`,
    description: `<p>Pembahasan: soal ini menguji pemahaman <b>${chapter.name}</b> (${subject}). Uraikan langkah penyelesaian secara bertahap lalu bandingkan dengan pilihan jawaban.</p>`,
    text: chapter.subject_id === 5 && n % 3 === 0 ? STIMULUS : '',
    text_image: '',
    category_id: category.id,
    category_name: category.name,
    type_question_id: type,
    chapter_id: chapter.id,
    attachments: [],
    source: 'bank' as const,
    createdAt: now,
    updatedAt: now,
  };
  const o = (k: number) => id * 10 + k;

  switch (type) {
    case 2:
      return {
        ...base,
        question_text: `<p>[${chapter.name}] Pilih <b>semua</b> pernyataan yang benar terkait konsep nomor ${n}.</p>`,
        options: ['Pernyataan A', 'Pernyataan B', 'Pernyataan C', 'Pernyataan D'].map((t, i) =>
          opt(o(i), `<p>${t} tentang ${chapter.name.toLowerCase()}</p>`, i, {
            is_true: i % 2 === 0,
          })
        ),
      };
    case 3:
      return {
        ...base,
        question_text: `<p>[${chapter.name}] Tentukan apakah pernyataan berikut benar atau salah: konsep ${n} berlaku untuk semua kasus.</p>`,
        options: [
          opt(o(0), '<p>Benar</p>', 0, { is_true: n % 2 === 0 }),
          opt(o(1), '<p>Salah</p>', 1, { is_true: n % 2 !== 0 }),
        ],
      };
    case 4:
      return {
        ...base,
        question_text: `<p>[${chapter.name}] Jodohkan pernyataan di kiri dengan jawaban yang tepat di kanan.</p>`,
        options: [
          ...['Istilah 1', 'Istilah 2', 'Istilah 3'].map((t, i) =>
            opt(o(i), `<p>${t}</p>`, i, { type: 'pernyataan' })
          ),
          ...['Definisi 1', 'Definisi 2', 'Definisi 3'].map((t, i) =>
            opt(o(i + 3), `<p>${t}</p>`, i + 3, { type: 'jawaban', is_true: true })
          ),
        ],
      };
    case 5:
      return {
        ...base,
        question_text: `<p>[${chapter.name}] Isilah titik-titik berikut dengan jawaban singkat yang tepat (soal ${n}).</p>`,
        options: [opt(o(0), `<p>${n * 3}</p>`, 0, { is_true: true })],
      };
    case 6:
      return {
        ...base,
        question_text: `<p>[${chapter.name}] Jelaskan dengan kata-katamu sendiri penerapan konsep ini dalam kehidupan sehari-hari (soal ${n}).</p>`,
        options: [
          opt(o(0), '<p>Jawaban memuat definisi, contoh, dan alasan yang runtut.</p>', 0, {
            is_true: true,
          }),
        ],
      };
    default:
      return {
        ...base,
        type_question_id: 1,
        question_text: `<p>[${chapter.name}] Soal ${subject} nomor ${n}: manakah pernyataan berikut yang paling tepat?</p>`,
        options: ['A', 'B', 'C', 'D', 'E'].map((label, i) =>
          opt(o(i), `<p>Pilihan ${label}</p>`, i, { is_true: i === n % 5 })
        ),
      };
  }
};
