// Master data & soal contoh simulasi (kelas, mapel, kompetensi, sub kompetensi, indikator, kategori) untuk paket soal.

import type {
  Question,
  QuestionType,
  QuestionOption,
  IndicatorOption,
  CompetencyOption,
  SubCompetencyOption,
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

/** Kompetensi per mapel → sub kompetensi → indikator. */
type Tree = Record<number, { name: string; subs: { name: string; indicators: string[] }[] }[]>;

const COMPETENCY_TREE: Tree = {
  8: [
    {
      name: 'Bilangan & Eksponen',
      subs: [
        {
          name: 'Bentuk pangkat dan akar',
          indicators: ['Menyederhanakan bentuk pangkat', 'Merasionalkan penyebut bentuk akar'],
        },
        {
          name: 'Fungsi eksponen',
          indicators: ['Menyelesaikan masalah kontekstual eksponen'],
        },
      ],
    },
    {
      name: 'Aljabar: Persamaan dan Fungsi',
      subs: [
        {
          name: 'Persamaan linear dan kuadrat',
          indicators: [
            'Menentukan penyelesaian persamaan linear',
            'Menentukan akar persamaan kuadrat',
          ],
        },
        {
          name: 'Fungsi dan grafiknya',
          indicators: [
            'Menganalisis grafik fungsi',
            'Menyusun model fungsi dari masalah sehari-hari',
          ],
        },
      ],
    },
    {
      name: 'Geometri dan Pengukuran',
      subs: [
        {
          name: 'Bangun ruang',
          indicators: ['Menghitung luas permukaan bangun ruang', 'Menghitung volume bangun ruang'],
        },
        { name: 'Segitiga siku-siku', indicators: ['Menerapkan teorema Pythagoras'] },
      ],
    },
    {
      name: 'Data dan Peluang',
      subs: [
        {
          name: 'Statistika',
          indicators: ['Menafsirkan penyajian data', 'Menentukan ukuran pemusatan data'],
        },
        { name: 'Peluang', indicators: ['Menentukan peluang suatu kejadian'] },
      ],
    },
  ],
  5: [
    {
      name: 'Memahami Teks Eksposisi',
      subs: [
        { name: 'Isi teks', indicators: ['Menentukan gagasan utama paragraf'] },
        {
          name: 'Struktur teks',
          indicators: ['Mengidentifikasi tesis', 'Mengidentifikasi penegasan ulang'],
        },
      ],
    },
    {
      name: 'Menilai Teks Argumentasi',
      subs: [
        { name: 'Fakta dan opini', indicators: ['Membedakan fakta dan opini'] },
        {
          name: 'Kualitas argumen',
          indicators: ['Menilai kekuatan argumen penulis', 'Menilai relevansi bukti'],
        },
      ],
    },
    {
      name: 'Kebahasaan dan Ejaan',
      subs: [
        { name: 'Ejaan', indicators: ['Menggunakan ejaan dan tanda baca yang tepat'] },
        { name: 'Diksi', indicators: ['Memilih kata baku', 'Memilih kata bermakna tepat'] },
      ],
    },
  ],
  4: [
    {
      name: 'Reading Comprehension',
      subs: [
        { name: 'Main idea', indicators: ['Identifying the main idea of a paragraph'] },
        {
          name: 'Specific information',
          indicators: ['Finding detailed information', 'Making inferences from the text'],
        },
      ],
    },
    {
      name: 'Grammar in Context',
      subs: [
        { name: 'Tenses', indicators: ['Using present and past tenses correctly'] },
        { name: 'Connectors', indicators: ['Using conjunctions and connectors'] },
      ],
    },
    {
      name: 'Vocabulary',
      subs: [
        { name: 'Word meaning', indicators: ['Determining word meaning from context'] },
        { name: 'Word relations', indicators: ['Using synonyms and antonyms'] },
      ],
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

const subsOf = (comp: CompetencyOption) => COMPETENCY_TREE[comp.subject_id][comp.order - 1].subs;

export const MOCK_SUB_COMPETENCIES: SubCompetencyOption[] = MOCK_COMPETENCIES.flatMap((comp) =>
  subsOf(comp).map((s, i) => ({
    id: comp.id * 10 + i + 1,
    code: `${comp.code}.${i + 1}`,
    name: s.name,
    competency_id: comp.id,
    order: i + 1,
  }))
);

export const MOCK_INDICATORS: IndicatorOption[] = MOCK_SUB_COMPETENCIES.flatMap((sub) => {
  const comp = MOCK_COMPETENCIES.find((c) => c.id === sub.competency_id)!;
  return subsOf(comp)[sub.order - 1].indicators.map((name, i) => ({
    id: sub.id * 10 + i + 1,
    code: `${sub.code}.${i + 1}`,
    name,
    sub_competency_id: sub.id,
    order: i + 1,
  }));
});

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
  const subs = MOCK_SUB_COMPETENCIES.filter((s) => s.competency_id === competency.id);
  const subCompetency = subs[id % subs.length] ?? null;
  const indicators = MOCK_INDICATORS.filter((i) => i.sub_competency_id === subCompetency?.id);
  const indicator = indicators[id % Math.max(indicators.length, 1)] ?? null;
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
    sub_competency_id: subCompetency?.id ?? null,
    sub_competency_name: subCompetency?.name ?? null,
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
