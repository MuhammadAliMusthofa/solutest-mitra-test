// Aturan progres antar tryout: delta skor tryout terakhir vs sebelumnya;
// > +2 Naik, < −2 Turun, selain itu Stabil; < 2 tryout = Data belum cukup.

import type { Predicate } from 'src/models/analytics';
import type {
  TrendStatus,
  ProgressRow,
  ProgressPoint,
  ProgressSummary,
  SchoolProgressItem,
  StudentProgressItem,
} from 'src/models/progress';

import { getPredicate, PREDICATE_ORDER } from './predicate';

/** Selisih skor yang dianggap "stabil" (± poin). */
export const STABLE_THRESHOLD = 2;

/** Selisih skor tryout terakhir terhadap tryout sebelumnya; null bila < 2 tryout. */
export const getDelta = (scores: number[]): number | null => {
  if (scores.length < 2) return null;
  const last = scores[scores.length - 1];
  const prev = scores[scores.length - 2];
  return Math.round((last - prev) * 10) / 10;
};

export const getTrendStatus = (scores: number[]): TrendStatus => {
  const delta = getDelta(scores);
  if (delta === null) return 'kurang-data';
  if (delta > STABLE_THRESHOLD) return 'naik';
  if (delta < -STABLE_THRESHOLD) return 'turun';
  return 'stabil';
};

/** Perubahan predikat tryout sebelumnya → terakhir; null bila tidak berubah / data kurang. */
export const getPredicateShift = (
  scores: number[]
): { from: Predicate; to: Predicate; direction: 'up' | 'down' } | null => {
  if (scores.length < 2) return null;
  const from = getPredicate(scores[scores.length - 2]);
  const to = getPredicate(scores[scores.length - 1]);
  if (from === to) return null;
  const direction = PREDICATE_ORDER.indexOf(to) > PREDICATE_ORDER.indexOf(from) ? 'up' : 'down';
  return { from, to, direction };
};

export const TREND_STATUSES: TrendStatus[] = ['naik', 'stabil', 'turun', 'kurang-data'];

export const TREND_LABEL: Record<TrendStatus, string> = {
  naik: 'Naik',
  stabil: 'Stabil',
  turun: 'Turun',
  'kurang-data': 'Data belum cukup',
};

/** Jumlah item per status tren. */
export const countByTrend = (items: { scores: number[] }[]) =>
  items.reduce<Partial<Record<TrendStatus, number>>>((acc, item) => {
    const status = getTrendStatus(item.scores);
    return { ...acc, [status]: (acc[status] ?? 0) + 1 };
  }, {});

export const summarizeProgress = (points: ProgressPoint[]): ProgressSummary => {
  const scores = points.map((p) => p.score);
  const last = scores[scores.length - 1];
  return {
    last,
    status: getTrendStatus(scores),
    delta: getDelta(scores),
    sinceFirst: scores.length > 1 ? Math.round((last - scores[0]) * 10) / 10 : null,
    tryoutCount: points.length,
    shift: getPredicateShift(scores),
  };
};

export const schoolCaption = (s: Pick<SchoolProgressItem, 'city' | 'level'>) =>
  `${s.city} · ${s.level}`;

export const studentCaption = (
  s: Pick<StudentProgressItem, 'school' | 'class'>,
  { includeSchool = true } = {}
) => [includeSchool ? s.school : null, s.class].filter(Boolean).join(' · ');

export const schoolToRow = (s: SchoolProgressItem, href: string): ProgressRow => ({
  id: s.id,
  name: s.name,
  caption: schoolCaption(s),
  participants: s.participants,
  tryout_count: s.tryout_count,
  scores: s.scores,
  last_score: s.last_score,
  last_predicate: s.last_predicate,
  href,
});

export const studentToRow = (
  s: StudentProgressItem,
  href: string,
  options?: { includeSchool?: boolean }
): ProgressRow => ({
  id: s.id,
  name: s.name,
  caption: studentCaption(s, options),
  tryout_count: s.tryout_count,
  scores: s.scores,
  last_score: s.last_score,
  last_predicate: s.last_predicate,
  href,
});
