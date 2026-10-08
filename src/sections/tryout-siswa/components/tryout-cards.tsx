'use client';

import type { StudentTryout } from 'src/models/schedule';
import type { UnfinishedPractice } from 'src/models/exam';

import Link from 'next/link';

import { Button } from 'src/components/ui/button';

import { SISWA_PATHS } from 'src/config/paths';

import { formatScore, formatDayTime, formatDateTime } from 'src/utils/format';

import { Iconify } from 'src/components/iconify/iconify';
import { StatusPill } from 'src/components/data-display/status-pill';
import { ToneIcon, toneStyle } from 'src/components/data-display/kpi-card';

import { secondsLeft } from 'src/sections/ujian/helpers/exam';
import { SCHEDULE_STATUS } from 'src/sections/jadwal-tryout/helpers/schedule';
import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

/** Kartu tryout untuk siswa (beranda & daftar): pita warna sesuai status, metrik, ajakan aksi. */
export function TryoutCard({ t }: { t: StudentTryout }) {
  const st = SCHEDULE_STATUS[t.status];
  const state = t.is_done
    ? {
        tone: 'secondary' as const,
        icon: 'solar:check-circle-bold',
        pill: 'success' as const,
        label: 'Sudah dikerjakan',
        pillIcon: 'solar:check-circle-linear',
        cta: 'Lihat hasil',
      }
    : t.unfinished_practice_id
      ? {
          tone: 'warning' as const,
          icon: 'solar:hourglass-line-bold',
          pill: 'warning' as const,
          label: 'Belum selesai',
          pillIcon: 'solar:clock-circle-linear',
          cta: 'Lanjutkan',
        }
      : t.status === 'ongoing'
        ? {
            tone: 'success' as const,
            icon: 'solar:pen-new-square-bold',
            pill: st.tone,
            label: st.label,
            pillIcon: st.icon,
            cta: 'Kerjakan sekarang',
          }
        : t.status === 'scheduled'
          ? {
              tone: 'primary' as const,
              icon: 'solar:calendar-bold',
              pill: st.tone,
              label: st.label,
              pillIcon: st.icon,
              cta: 'Lihat detail',
            }
          : {
              tone: 'info' as const,
              icon: 'solar:archive-check-bold',
              pill: st.tone,
              label: st.label,
              pillIcon: st.icon,
              cta: 'Lihat detail',
            };
  return (
    <article
      style={toneStyle(state.tone)}
      className="lift group/tryout relative flex flex-col overflow-hidden rounded-card bg-card shadow-card has-[a:focus-visible]:ring-4 has-[a:focus-visible]:ring-primary/30"
    >
      <div className="deco-rings flex items-start justify-between gap-2 bg-[color-mix(in_srgb,var(--tone)_10%,var(--card))] px-5 pt-5 pb-4">
        <ToneIcon icon={state.icon} tone={state.tone} solid />
        <StatusPill tone={state.pill} icon={state.pillIcon} className="bg-card">
          {state.label}
        </StatusPill>
      </div>
      <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
        <p className="font-mono text-xs font-bold text-(--tone-ink)">{t.code}</p>
        <Link
          href={SISWA_PATHS.tryoutDetail(t.code)}
          className="mt-1 after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
        >
          <h3 className="line-clamp-2 text-[1.05rem] leading-snug font-bold transition-colors group-hover/tryout:text-primary">
            {t.title}
          </h3>
        </Link>
        <ul className="mt-3 space-y-1.5 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <Iconify icon="solar:calendar-linear" size={16} className="shrink-0" />
            {formatDayTime(t.start_date)} – {formatDayTime(t.end_date)}
          </li>
        </ul>
        <dl className="mt-4 grid grid-cols-2 divide-x divide-border rounded-xl bg-muted/70 py-2.5 text-center">
          <div>
            <dt className="text-[0.7rem] font-semibold text-muted-foreground">Durasi</dt>
            <dd className="text-base font-bold tabular-nums">{t.duration} mnt</dd>
          </div>
          <div>
            <dt className="text-[0.7rem] font-semibold text-muted-foreground">Jumlah soal</dt>
            <dd className="text-base font-bold tabular-nums">{t.total_questions}</dd>
          </div>
        </dl>
        {t.is_done && t.score !== null && t.score !== undefined ? (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-success/8 px-3.5 py-2.5">
            <span className="text-sm text-foreground/75">
              Skor{' '}
              <span className="text-lg font-bold text-foreground tabular-nums">
                {formatScore(t.score)}
              </span>
            </span>
            <PredicateBadge score={t.score} />
          </div>
        ) : (
          <p className="mt-auto flex items-center gap-1.5 pt-4 text-sm font-bold text-(--tone-ink)">
            {state.cta}
            <Iconify
              icon="solar:arrow-right-linear"
              size={16}
              className="transition-transform group-hover/tryout:translate-x-1"
            />
          </p>
        )}
      </div>
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
    <article className="deco-rings flex flex-col gap-4 rounded-card bg-[color-mix(in_srgb,var(--warning)_9%,var(--card))] p-5 [--deco:var(--warning)] sm:flex-row sm:items-center md:p-6">
      <ToneIcon icon="solar:hourglass-line-bold" tone="warning" solid size="lg" />
      <div className="min-w-0 flex-1">
        <p className="text-base font-bold">{item.title}</p>
        <p className="text-sm text-muted-foreground">
          {item.subject_name} · dimulai {formatDateTime(item.started_at)} ·{' '}
          {timeOver ? (
            <span className="font-medium text-destructive">waktu habis, wajib dikumpulkan</span>
          ) : (
            `tenggat ${formatDayTime(item.deadline)}`
          )}
        </p>
        <div className="mt-2 flex items-center gap-2">
          <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-card">
            <div className="h-full rounded-full bg-warning" style={{ width: `${progress}%` }} />
          </div>
          <span className="text-xs font-semibold text-foreground/70 tabular-nums">
            {item.answered}/{item.total_question} dijawab
          </span>
        </div>
      </div>
      <Button
        onClick={onContinue}
        disabled={loading}
        size="lg"
        className="bg-warning text-white hover:bg-[color-mix(in_oklab,var(--warning),black_10%)] hover:shadow-[0_6px_16px_-6px_var(--warning)]"
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
