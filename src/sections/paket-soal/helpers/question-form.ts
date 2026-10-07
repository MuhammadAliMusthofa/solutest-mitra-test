// State form editor soal <-> body API. Opsi ditulis teks polos di form, disimpan sebagai HTML <p>.

import type { Question, QuestionBody, QuestionType } from 'src/models/question';

export interface ChoiceDraft {
  text: string;
  correct: boolean;
}

export interface PairDraft {
  statement: string;
  answer: string;
}

export interface QuestionForm {
  type: QuestionType;
  categoryId: string;
  chapterId: string;
  questionText: string;
  useStimulus: boolean;
  stimulus: string;
  image: string | null;
  explanation: string;
  choices: ChoiceDraft[];
  trueFalse: 'benar' | 'salah';
  pairs: PairDraft[];
  keys: string[];
  rubric: string;
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
  chapterId: '',
  questionText: '',
  useStimulus: false,
  stimulus: '',
  image: null,
  explanation: '',
  choices: ['', '', '', ''].map((text, i) => ({ text, correct: i === 0 })),
  trueFalse: 'benar',
  pairs: [
    { statement: '', answer: '' },
    { statement: '', answer: '' },
  ],
  keys: [''],
  rubric: '',
});

export const questionToForm = (q: Question): QuestionForm => {
  const base = emptyForm();
  const byOrder = [...q.options].sort((a, b) => a.order - b.order);
  const statements = byOrder.filter((o) => o.type === 'pernyataan');
  const answers = byOrder.filter((o) => o.type === 'jawaban');
  return {
    ...base,
    type: q.type_question_id,
    categoryId: String(q.category_id),
    chapterId: q.chapter_id ? String(q.chapter_id) : '',
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
    pairs: statements.length
      ? statements.map((s, i) => ({
          statement: fromHtml(s.option_text),
          answer: fromHtml(answers[i]?.option_text ?? ''),
        }))
      : base.pairs,
    keys: q.type_question_id === 5 ? byOrder.map((o) => fromHtml(o.option_text)) : base.keys,
    rubric: q.type_question_id === 6 ? fromHtml(byOrder[0]?.option_text ?? '') : '',
  };
};

/** Validasi per tipe; kembalikan pesan error pertama atau ''. */
export const validateForm = (f: QuestionForm): string => {
  if (!fromHtml(f.questionText) && !f.image) return 'Teks soal wajib diisi';
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
      if (f.pairs.length < 2 || f.pairs.some((p) => !p.statement.trim() || !p.answer.trim()))
        return 'Isi semua pasangan pernyataan–jawaban (minimal 2)';
      return '';
    case 5:
      if (!f.keys.length || f.keys.some((k) => !k.trim())) return 'Isi semua kunci jawaban isian';
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
      options = [
        ...f.pairs.map((p, i) => ({
          option_text: toHtml(p.statement),
          order: i,
          type: 'pernyataan' as const,
        })),
        ...f.pairs.map((p, i) => ({
          option_text: toHtml(p.answer),
          order: f.pairs.length + i,
          type: 'jawaban' as const,
          is_true: true,
        })),
      ];
      break;
    case 5:
      options = f.keys.map((k, i) => ({ option_text: toHtml(k), is_true: true, order: i }));
      break;
    case 6:
      options = f.rubric.trim() ? [{ option_text: toHtml(f.rubric), is_true: true, order: 0 }] : [];
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
    chapter_id: f.chapterId ? Number(f.chapterId) : null,
    category_id: Number(f.categoryId) || 1,
    options,
    attachments: f.image ? [{ type: 'image', path: f.image }] : [],
  };
};
