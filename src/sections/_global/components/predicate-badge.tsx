import type { Predicate } from 'src/models/analytics';
import type { TrendStatus } from 'src/models/progress';

import { formatScore, formatSigned } from 'src/utils/format';
import { getPredicate, PREDICATE_LABEL } from 'src/utils/predicate';
import { getDelta, TREND_LABEL, getTrendStatus } from 'src/utils/progress';

import { StatusPill } from 'src/components/data-display/status-pill';
import type { PillTone } from 'src/components/data-display/status-pill';

const PREDICATE_TONE: Record<Predicate, PillTone> = {
  KURANG: 'danger',
  MEMADAI: 'warning',
  BAIK: 'primary',
  ISTIMEWA: 'success',
};

/** Pill predikat (Kurang/Memadai/Baik/Istimewa). */
export function PredicateBadge({
  predicate,
  score,
}: {
  predicate?: Predicate | null;
  score?: number;
}) {
  const value = predicate ?? (score !== undefined ? getPredicate(score) : null);
  if (!value) return <span className="text-muted-foreground">-</span>;
  return <StatusPill tone={PREDICATE_TONE[value]}>{PREDICATE_LABEL[value]}</StatusPill>;
}

const TREND_TONE: Record<TrendStatus, { tone: PillTone; icon: string }> = {
  naik: { tone: 'success', icon: 'solar:graph-up-linear' },
  stabil: { tone: 'primary', icon: 'solar:minus-circle-linear' },
  turun: { tone: 'danger', icon: 'solar:graph-down-linear' },
  'kurang-data': { tone: 'neutral', icon: 'solar:info-circle-linear' },
};

/** Badge status tren progres (ikon + label + delta), tidak mengandalkan warna saja. */
export function TrendBadge({ scores, status }: { scores?: number[]; status?: TrendStatus }) {
  const value = status ?? getTrendStatus(scores ?? []);
  const delta = scores ? getDelta(scores) : null;
  const cfg = TREND_TONE[value];
  return (
    <StatusPill tone={cfg.tone} icon={cfg.icon}>
      {TREND_LABEL[value]}
      {delta !== null && value !== 'kurang-data' ? ` (${formatSigned(delta)})` : ''}
    </StatusPill>
  );
}

/** Skor dengan angka tabular. */
export function ScoreText({ value }: { value?: number | null }) {
  return <span className="font-semibold tabular-nums">{formatScore(value)}</span>;
}
