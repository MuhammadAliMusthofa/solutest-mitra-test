'use client';

import Link from 'next/link';

import { Button } from 'src/components/ui/button';

import { withQuery } from 'src/config/paths';

import { usePanel } from 'src/hooks/use-panel';
import { useTenant } from 'src/hooks/use-tenant';
import { useUrlState } from 'src/hooks/use-url-state';
import { useCurrentUser } from 'src/hooks/use-session';

import { greeting, formatScore, formatNumber } from 'src/utils/format';

import { Iconify } from 'src/components/iconify/iconify';
import { KpiCard } from 'src/components/data-display/kpi-card';
import { WelcomeCard } from 'src/components/data-display/welcome-card';

import { TryoutFilter } from 'src/sections/_global/components/tryout-filter';

import { useDashboardData } from '../hooks/use-dashboard-data';
import {
  ScoreTrendCard,
  CompletionCard,
  TopStudentsCard,
  AnswerSummaryCard,
  ParticipantTrendCard,
  ScoreDistributionCard,
  SubjectPerformanceCard,
} from '../components/dashboard-cards';

/**
 * Ringkasan Utama (admin) / Ringkasan (guru). Data guru otomatis dibatasi backend ke sekolah
 * yang diampu. Filter tryout disimpan di `?code=` (kosong = semua tryout).
 */
export function DashboardContainer() {
  const { isAdmin, paths } = usePanel();
  const { user } = useCurrentUser();
  const { branding } = useTenant();
  const [{ code }, setFilter] = useUrlState({ code: '' });
  const d = useDashboardData(code);
  const k = d.kpi.data;
  const firstName = user?.full_name.split(' ').slice(0, 2).join(' ') ?? '';

  return (
    <div className="grid grid-cols-12 gap-5 md:gap-6">
      <div className="col-span-12 xl:col-span-6">
        <WelcomeCard
          className="h-full"
          title={`${greeting()}, ${firstName}`}
          subtitle={
            isAdmin
              ? `Pantau seluruh tryout ${branding.name}.`
              : 'Ringkasan hasil tryout siswa di sekolah yang Anda ampu.'
          }
        >
          <div className="mt-5 max-w-xs">
            <TryoutFilter
              value={code}
              onChange={(v) => setFilter({ code: v })}
              className="w-full"
            />
          </div>
          {Boolean(k?.active_sessions) && (
            <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <span className="relative flex size-2">
                <span className="absolute inline-flex size-full animate-ping rounded-full bg-success opacity-60 motion-reduce:animate-none" />
                <span className="relative inline-flex size-2 rounded-full bg-success" />
              </span>
              {formatNumber(k?.active_sessions)} siswa sedang mengerjakan
            </p>
          )}
        </WelcomeCard>
      </div>

      <div className="col-span-12 grid grid-cols-1 gap-5 sm:grid-cols-3 md:gap-6 xl:col-span-6">
        <KpiCard
          label="Peserta"
          value={formatNumber(k?.total_participants)}
          icon="solar:users-group-rounded-linear"
          delta={k?.total_participants_delta}
          trend={k?.total_participants_trend}
        />
        <KpiCard
          label="Rata-rata skor"
          value={formatScore(k?.national_average)}
          icon="solar:medal-ribbon-star-linear"
          tone="accent"
          delta={k?.national_average_delta}
          trend={k?.national_average_trend}
        />
        <KpiCard
          label="Sekolah"
          value={formatNumber(k?.total_schools)}
          icon="solar:buildings-2-linear"
          tone="secondary"
          delta={k?.total_schools_delta}
          trend={k?.total_schools_trend}
        />
      </div>

      <div className="col-span-12 xl:col-span-8">
        <ParticipantTrendCard
          query={d.trend}
          action={
            isAdmin ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={withQuery(paths.schoolRanking, { code })}>
                  Peringkat sekolah
                  <Iconify icon="solar:arrow-right-linear" size={16} />
                </Link>
              </Button>
            ) : null
          }
        />
      </div>
      <div className="col-span-12 md:col-span-6 xl:col-span-4">
        <ScoreTrendCard trend={k?.national_average_trend} loading={d.kpi.isPending} />
      </div>

      <div className="col-span-12 md:col-span-6 xl:col-span-4">
        <CompletionCard query={d.completion} />
      </div>
      <div className="col-span-12 md:col-span-6 xl:col-span-4">
        <ScoreDistributionCard query={d.distribution} />
      </div>
      <div className="col-span-12 md:col-span-6 xl:col-span-4">
        <SubjectPerformanceCard query={d.subjects} />
      </div>

      <div className="col-span-12 xl:col-span-5">
        <AnswerSummaryCard query={d.answers} />
      </div>
      <div className="col-span-12 xl:col-span-7">
        <TopStudentsCard query={d.top} allHref={withQuery(paths.studentScores, { code })} />
      </div>
    </div>
  );
}
