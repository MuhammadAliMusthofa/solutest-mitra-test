// Master data & soal contoh simulasi (kelas, mapel, kompetensi, indikator, kategori) untuk paket soal.

import type {
  Question,
  QuestionType,
  QuestionOption,
  IndicatorOption,
  CompetencyOption,
} from 'src/models/question';

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

/** Kompetensi per mapel; tiap kompetensi punya beberapa indikator. */
const COMPETENCY_TREE: Record<number, { name: string; indicators: string[] }[]> = {
  8: [
    {
      name: 'Bilangan & Eksponen',
      indicators: [
        'Menyederhanakan bentuk pangkat dan akar',
        'Menyelesaikan masalah kontekstual eksponen',
      ],
    },
    {
      name: 'Aljabar: Persamaan dan Fungsi',
      indicators: [
        'Menentukan penyelesaian persamaan linear dan kuadrat',
        'Menganalisis grafik fungsi',
        'Menyusun model fungsi dari masalah sehari-hari',
      ],
    },
    {
      name: 'Geometri dan Pengukuran',
      indicators: ['Menghitung luas dan volume bangun', 'Menerapkan teorema Pythagoras'],
    },
    {
      name: 'Data dan Peluang',
      indicators: ['Menafsirkan penyajian data', 'Menentukan peluang suatu kejadian'],
    },
  ],
  5: [
    {
      name: 'Memahami Teks Eksposisi',
      indicators: ['Menentukan gagasan utama paragraf', 'Mengidentifikasi struktur teks'],
    },
    {
      name: 'Menilai Teks Argumentasi',
      indicators: ['Membedakan fakta dan opini', 'Menilai kekuatan argumen penulis'],
    },
    {
      name: 'Kebahasaan dan Ejaan',
      indicators: ['Menggunakan ejaan dan tanda baca yang tepat', 'Memilih kata baku'],
    },
  ],
  4: [
    {
      name: 'Reading Comprehension',
      indicators: ['Identifying the main idea', 'Finding detailed information'],
    },
    {
      name: 'Grammar in Context',
      indicators: ['Using tenses correctly', 'Using conjunctions and connectors'],
    },
    {
      name: 'Vocabulary',
      indicators: ['Determining word meaning from context', 'Using synonyms and antonyms'],
    },
  ],
};

export const MOCK_COMPETENCIES: CompetencyOption[] = MOCK_CLASSES.flatMap((cls) =>
  MOCK_SUBJECTS.flatMap((sub) =>
    COMPETENCY_TREE[sub.id].map((c, i) => ({
      id: cls.id * 100 + sub.id * 10 + i + 1,
      code: `K${i + 1}`,
      name: c.name,
      subject_id: sub.id,
      class_id: cls.id,
      order: i + 1,
    }))
  )
);

export const MOCK_INDICATORS: IndicatorOption[] = MOCK_COMPETENCIES.flatMap((comp) =>
  COMPETENCY_TREE[comp.subject_id][comp.order - 1].indicators.map((name, i) => ({
    id: comp.id * 10 + i + 1,
    code: `${comp.code}.${i + 1}`,
    name,
    competency_id: comp.id,
    order: i + 1,
  }))
);

const opt = (
  id: number,
  option_text: string,
  order: number,
  extra: Partial<QuestionOption> = {}
): QuestionOption => ({ id, option_text, order, is_true: false, ...extra });

const STIMULUS = `<p><b>Bacalah teks berikut.</b></p><p>Kota Tegal dikenal sebagai kota bahari di pesisir utara Jawa. Selain warteg yang tersebar di berbagai kota, Tegal juga memiliki tradisi sedekah laut yang digelar nelayan setiap tahun sebagai wujud syukur atas hasil tangkapan.</p>`;

/** Membuat satu soal contoh (data awal simulasi) untuk kompetensi & tipe tertentu. */
export const buildBankQuestion = (
  id: number,
  competency: CompetencyOption,
  type: QuestionType,
  categoryId: number
): Question => {
  const subject = MOCK_SUBJECTS.find((s) => s.id === competency.subject_id)?.name ?? 'Mapel';
  const category = MOCK_CATEGORIES.find((c) => c.id === categoryId) ?? MOCK_CATEGORIES[0];
  const indicators = MOCK_INDICATORS.filter((ind) => ind.competency_id === competency.id);
  const indicator = indicators[id % indicators.length] ?? null;
  const n = id % 97;
  const now = new Date().toISOString();
  const base = {
    id,
    code: `BNK-${String(id).padStart(5, '0')}`,
    description: `<p>Pembahasan: soal ini menguji pemahaman <b>${competency.name}</b> (${subject}). Uraikan langkah penyelesaian secara bertahap lalu bandingkan dengan pilihan jawaban.</p>`,
    text: competency.subject_id === 5 && n % 3 === 0 ? STIMULUS : '',
    text_image: '',
    category_id: category.id,
    category_name: category.name,
    type_question_id: type,
    competency_id: competency.id,
    competency_name: competency.name,
    indicator_id: indicator?.id ?? null,
    indicator_name: indicator?.name ?? null,
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
        question_text: `<p>[${competency.name}] Pilih <b>semua</b> pernyataan yang benar terkait konsep nomor ${n}.</p>`,
        options: ['Pernyataan A', 'Pernyataan B', 'Pernyataan C', 'Pernyataan D'].map((t, i) =>
          opt(o(i), `<p>${t} tentang ${competency.name.toLowerCase()}</p>`, i, {
            is_true: i % 2 === 0,
          })
        ),
      };
    case 3:
      return {
        ...base,
        question_text: `<p>[${competency.name}] Tentukan apakah pernyataan berikut benar atau salah: konsep ${n} berlaku untuk semua kasus.</p>`,
        options: [
          opt(o(0), '<p>Benar</p>', 0, { is_true: n % 2 === 0 }),
          opt(o(1), '<p>Salah</p>', 1, { is_true: n % 2 !== 0 }),
        ],
      };
    case 4:
      return {
        ...base,
        question_text: `<p>[${competency.name}] Tentukan <b>Benar</b> atau <b>Salah</b> untuk setiap pernyataan berikut (soal ${n}).</p>`,
        options: ['Pernyataan 1', 'Pernyataan 2', 'Pernyataan 3', 'Pernyataan 4'].map((t, i) =>
          opt(o(i), `<p>${t} tentang ${competency.name.toLowerCase()}</p>`, i, {
            is_true: (n + i) % 2 === 0,
          })
        ),
      };
    default:
      return {
        ...base,
        type_question_id: 1,
        question_text: `<p>[${competency.name}] Soal ${subject} nomor ${n}: manakah pernyataan berikut yang paling tepat?</p>`,
        options: ['A', 'B', 'C', 'D', 'E'].map((label, i) =>
          opt(o(i), `<p>Pilihan ${label}</p>`, i, { is_true: i === n % 5 })
        ),
      };
  }
};
