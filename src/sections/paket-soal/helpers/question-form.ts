// State form editor soal <-> body API. Opsi ditulis teks polos di form, disimpan sebagai HTML <p>.

import type { Question, QuestionBody, QuestionType } from 'src/models/question';

export interface ChoiceDraft {
  text: string;
  correct: boolean;
}

/** Satu baris tabel Benar/Salah Kompleks. */
export interface StatementDraft {
  text: string;
  value: 'benar' | 'salah';
}

export interface QuestionForm {
  type: QuestionType;
  categoryId: string;
  competencyId: string;
  indicatorId: string;
  questionText: string;
  useStimulus: boolean;
  stimulus: string;
  image: string | null;
  explanation: string;
  choices: ChoiceDraft[];
  trueFalse: 'benar' | 'salah';
  statements: StatementDraft[];
}

const escapeHtml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export const toHtml = (text: string) => `<p>${escapeHtml(text.trim())}</p>`;

export const fromHtml = (html: string) =>
  html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

export const emptyForm = (): QuestionForm => ({
  type: 1,
  categoryId: '1',
  competencyId: '',
  indicatorId: '',
  questionText: '',
  useStimulus: false,
  stimulus: '',
  image: null,
  explanation: '',
  choices: ['', '', '', ''].map((text, i) => ({ text, correct: i === 0 })),
  trueFalse: 'benar',
  statements: [
    { text: '', value: 'benar' },
    { text: '', value: 'salah' },
    { text: '', value: 'benar' },
  ],
});

export const questionToForm = (q: Question): QuestionForm => {
  const base = emptyForm();
  const byOrder = [...q.options].sort((a, b) => a.order - b.order);
  return {
    ...base,
    type: q.type_question_id,
    categoryId: String(q.category_id),
    competencyId: q.competency_id ? String(q.competency_id) : '',
    indicatorId: q.indicator_id ? String(q.indicator_id) : '',
    questionText: q.question_text,
    useStimulus: Boolean(q.text),
    stimulus: q.text,
    image: q.attachments.find((a) => a.type === 'image')?.path ?? null,
    explanation: q.description,
    choices:
      q.type_question_id === 1 || q.type_question_id === 2
        ? byOrder.map((o) => ({ text: fromHtml(o.option_text), correct: Boolean(o.is_true) }))
        : base.choices,
    trueFalse:
      q.type_question_id === 3 &&
      fromHtml(byOrder.find((o) => o.is_true)?.option_text ?? '').toLowerCase() === 'salah'
        ? 'salah'
        : 'benar',
    statements:
      q.type_question_id === 4
        ? byOrder.map((o) => ({
            text: fromHtml(o.option_text),
            value: o.is_true ? ('benar' as const) : ('salah' as const),
          }))
        : base.statements,
  };
};

/** Validasi per tipe; kembalikan pesan error pertama atau ''. */
export const validateForm = (f: QuestionForm): string => {
  if (!fromHtml(f.questionText) && !f.image) return 'Teks soal atau gambar wajib diisi';
  if (f.useStimulus && !fromHtml(f.stimulus)) return 'Isi teks stimulus atau matikan stimulus';
  switch (f.type) {
    case 1:
    case 2: {
      const filled = f.choices.filter((c) => c.text.trim());
      if (filled.length < 2 || filled.length !== f.choices.length)
        return 'Isi semua pilihan jawaban (minimal 2)';
      const correct = f.choices.filter((c) => c.correct).length;
      if (f.type === 1 && correct !== 1) return 'Tandai tepat satu jawaban benar';
      if (f.type === 2 && correct < 1) return 'Tandai minimal satu jawaban benar';
      return '';
    }
    case 4:
      if (f.statements.length < 2 || f.statements.some((s) => !s.text.trim()))
        return 'Isi semua pernyataan (minimal 2)';
      return '';
    default:
      return '';
  }
};

export const formToBody = (f: QuestionForm): QuestionBody => {
  let options: QuestionBody['options'] = [];
  switch (f.type) {
    case 1:
    case 2:
      options = f.choices.map((c, i) => ({
        option_text: toHtml(c.text),
        is_true: c.correct,
        order: i,
      }));
      break;
    case 3:
      options = [
        { option_text: '<p>Benar</p>', is_true: f.trueFalse === 'benar', order: 0 },
        { option_text: '<p>Salah</p>', is_true: f.trueFalse === 'salah', order: 1 },
      ];
      break;
    case 4:
      options = f.statements.map((s, i) => ({
        option_text: toHtml(s.text),
        is_true: s.value === 'benar',
        order: i,
      }));
      break;
    default:
      break;
  }
  return {
    type_question_id: f.type,
    question_text: f.questionText,
    description: f.explanation,
    text: f.useStimulus ? f.stimulus : '',
    text_image: '',
    competency_id: f.competencyId ? Number(f.competencyId) : null,
    indicator_id: f.competencyId && f.indicatorId ? Number(f.indicatorId) : null,
    category_id: Number(f.categoryId) || 1,
    options,
    attachments: f.image ? [{ type: 'image', path: f.image }] : [],
  };
};
