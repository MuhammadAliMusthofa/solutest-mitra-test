'use client';

import type { StudentTryout } from 'src/models/schedule';
import type { UnfinishedPractice } from 'src/models/exam';

import Link from 'next/link';

import { Button } from 'src/components/ui/button';

import { SISWA_PATHS } from 'src/config/paths';

import { formatScore, formatDayTime, formatDateTime } from 'src/utils/format';

import { Iconify } from 'src/components/iconify/iconify';
import { StatusPill } from 'src/components/data-display/status-pill';

import { secondsLeft } from 'src/sections/ujian/helpers/exam';
import { SCHEDULE_STATUS } from 'src/sections/jadwal-tryout/helpers/schedule';
import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

/** Kartu tryout untuk siswa (beranda & daftar). */
export function TryoutCard({ t }: { t: StudentTryout }) {
  const st = SCHEDULE_STATUS[t.status];
  return (
    <article className="lift relative flex flex-col rounded-card bg-card p-5 shadow-card">
      <div className="flex items-start justify-between gap-2">
        <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
          <Iconify icon="solar:pen-new-square-linear" size={22} />
        </span>
        {t.is_done ? (
          <StatusPill tone="success" icon="solar:check-circle-linear">
            Sudah dikerjakan
          </StatusPill>
        ) : t.unfinished_practice_id ? (
          <StatusPill tone="warning" icon="solar:clock-circle-linear">
            Belum selesai
          </StatusPill>
        ) : (
          <StatusPill tone={st.tone} icon={st.icon}>
            {st.label}
          </StatusPill>
        )}
      </div>
      <Link
        href={SISWA_PATHS.tryoutDetail(t.code)}
        className="mt-4 after:absolute after:inset-0 after:content-['']"
      >
        <h3 className="line-clamp-2 font-semibold">{t.title}</h3>
      </Link>
      <p className="mt-1 font-mono text-xs text-muted-foreground">{t.code}</p>
      <ul className="mt-4 space-y-1.5 text-sm text-muted-foreground">
        <li className="flex items-center gap-2">
          <Iconify icon="solar:calendar-linear" size={16} />
          {formatDayTime(t.start_date)} – {formatDayTime(t.end_date)}
        </li>
        <li className="flex items-center gap-2">
          <Iconify icon="solar:clock-circle-linear" size={16} />
          {t.duration} menit · {t.total_questions} soal
        </li>
      </ul>
      {t.is_done && t.score !== null && t.score !== undefined && (
        <div className="mt-4 flex items-center justify-between rounded-xl bg-muted/60 px-3 py-2">
          <span className="text-sm">
            Skor <span className="font-semibold tabular-nums">{formatScore(t.score)}</span>
          </span>
          <PredicateBadge score={t.score} />
        </div>
      )}
    </article>
  );
}

/** Kartu "Tryout belum selesai" + tombol Lanjutkan (resume). */
export function UnfinishedCard({
  item,
  loading,
  onContinue,
}: {
  item: UnfinishedPractice;
  loading: boolean;
  onContinue: () => void;
}) {
  const timeOver = secondsLeft(item.deadline) <= 0;
  const progress = item.total_question
    ? Math.round((item.answered / item.total_question) * 100)
    : 0;
  return (
    <article className="flex flex-col gap-4 rounded-card bg-card p-5 shadow-card ring-2 ring-warning/40 sm:flex-row sm:items-center">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-warning/12 text-warning">
        <Iconify icon="solar:hourglass-line-linear" size={26} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-semibold">{item.title}</p>
        <p className="text-sm text-muted-foreground">
          {item.subject_name} · dimulai {formatDateTime(item.started_at)} ·{' '}
          {timeOver ? (
            <span className="font-medium text-destructive">waktu habis, wajib dikumpulkan</span>
          ) : (
            `tenggat ${formatDayTime(item.deadline)}`
          )}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-warning" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs text-muted-foreground tabular-nums">
            {item.answered}/{item.total_question} dijawab
          </span>
        </div>
      </div>
      <Button
        onClick={onContinue}
        disabled={loading}
        className="bg-warning text-white hover:bg-warning/90"
      >
        {loading ? (
          <Iconify icon="svg-spinners:180-ring" size={18} />
        ) : (
          <Iconify icon="solar:play-linear" size={18} />
        )}
        {timeOver ? 'Kumpulkan' : 'Lanjutkan'}
      </Button>
    </article>
  );
}
