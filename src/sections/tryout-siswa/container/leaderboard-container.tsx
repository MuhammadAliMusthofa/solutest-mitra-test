'use client';

import type { LeaderboardRow } from 'src/models/exam';

import { useEffect } from 'react';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { SISWA_PATHS } from 'src/config/paths';

import { useUrlState } from 'src/hooks/use-url-state';
import { useCurrentUser } from 'src/hooks/use-session';

import { cn } from 'src/lib/utils';
import { formatScore } from 'src/utils/format';

import { leaderboardService } from 'src/services/student';

import { Iconify } from 'src/components/iconify/iconify';
import { SearchInput } from 'src/components/form/search-input';
import { SelectField } from 'src/components/form/select-field';
import { EmptyState } from 'src/components/feedback/empty-state';
import { DataTable } from 'src/components/data-display/data-table';
import { UserAvatar } from 'src/components/data-display/user-avatar';
import { HeroBanner } from 'src/components/data-display/hero-banner';
import type { Column } from 'src/components/data-display/data-table';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { RankBadge } from 'src/sections/analitik/components/analytics-parts';

/** Warna podium (palet medali tetap, tidak ikut tema): 2 biru, 1 oranye, 3 ungu. */
const PODIUM = [
  { place: 2, height: 'h-36 sm:h-44', tone: 'bg-secondary text-secondary-foreground', avatar: 64 },
  { place: 1, height: 'h-48 sm:h-56', tone: 'bg-primary text-primary-foreground', avatar: 84 },
  {
    place: 3,
    height: 'h-28 sm:h-36',
    tone: 'bg-brand-accent text-brand-accent-foreground',
    avatar: 64,
  },
];

const formatDuration = (sec: number | null) => {
  if (sec === null) return '-';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const d = sec % 60;
  return [h, m, d].map((n) => String(n).padStart(2, '0')).join(':');
};

function Podium({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="flex items-end justify-center gap-3 pt-4 sm:gap-8">
      {PODIUM.map(({ place, height, tone, avatar }) => {
        const r = rows.find((x) => x.rank === place);
        if (!r) return <div key={place} className="w-24 sm:w-36" />;
        return (
          <div key={place} className="flex w-24 flex-col items-center text-center sm:w-40">
            <UserAvatar name={r.full_name} size={avatar} className="shadow-card ring-4 ring-card" />
            <p className="mt-3 line-clamp-2 text-sm leading-tight font-extrabold sm:text-base">
              {r.full_name}
            </p>
            <p className="mt-1 line-clamp-2 text-[0.7rem] leading-tight text-muted-foreground uppercase sm:text-xs">
              {r.school}
            </p>
            <p className="mt-2 flex items-center gap-1 text-xs font-semibold tabular-nums sm:text-sm">
              <Iconify icon="solar:star-circle-bold" size={15} className="text-warning" />
              {formatScore(r.score)}
            </p>
            <p className="mt-0.5 flex items-center gap-1 text-xs font-medium tabular-nums sm:text-sm">
              <Iconify icon="solar:clock-circle-bold" size={15} className="text-warning" />
              {formatDuration(r.duration_seconds)}
            </p>
            <div
              className={cn(
                'mt-3 grid w-full place-items-center rounded-t-2xl text-5xl font-extrabold shadow-[0_-6px_20px_-12px_rgb(0_0_0/0.35)] sm:text-6xl',
                height,
                tone
              )}
            >
              {place}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function LeaderboardContainer() {
  const { user } = useCurrentUser();
  const [f, setF] = useUrlState({ paket: '', scope: 'all', search: '', page: '1' });
  const options = useQuery({
    queryKey: ['student', 'leaderboard-options'],
    queryFn: leaderboardService.options,
  });
  const packageId = Number(f.paket || options.data?.[0]?.schedule_id || 0);

  useEffect(() => {
    if (!f.paket && options.data?.[0]) setF({ paket: String(options.data[0].schedule_id) });
  }, [f.paket, options.data, setF]);

  const params = {
    search: f.search,
    page: Number(f.page),
    scope: (f.scope === 'school' ? 'school' : 'all') as 'all' | 'school',
  };
  const query = useQuery({
    queryKey: ['student', 'leaderboard', packageId, params],
    queryFn: () => leaderboardService.list(packageId, params),
    enabled: packageId > 0,
    placeholderData: keepPreviousData,
  });
  const me = query.data?.my_rank;

  const columns: Column<LeaderboardRow>[] = [
    { key: 'rank', header: '#', cell: (r) => <RankBadge rank={r.rank} />, className: 'w-14' },
    {
      key: 'name',
      header: 'Siswa',
      cell: (r) => (
        <div className="flex min-w-48 items-center gap-3">
          <UserAvatar name={r.full_name} size={34} />
          <div className="min-w-0">
            <p className={cn('truncate font-semibold', r.user_id === user?.id && 'text-primary')}>
              {r.full_name}
              {r.user_id === user?.id && ' (kamu)'}
            </p>
            <p className="truncate text-xs text-muted-foreground">{r.school}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'class',
      header: 'Kelas',
      hideOnMobile: true,
      cell: (r) => r.class_name ?? '-',
    },
    {
      key: 'duration',
      header: 'Waktu',
      hideOnMobile: true,
      cell: (r) => <span className="tabular-nums">{formatDuration(r.duration_seconds)}</span>,
    },
    {
      key: 'score',
      header: 'Skor',
      align: 'right',
      cell: (r) => <span className="font-semibold tabular-nums">{formatScore(r.score)}</span>,
    },
  ];

  const resetFilters = () => setF({ scope: 'all', search: '' });

  return (
    <>
      <HeroBanner
        title="Leaderboard"
        description="Lihat peringkatmu di antara peserta tryout lain dan terus tingkatkan skormu."
        crumbs={[{ label: 'Tryout', href: SISWA_PATHS.tryout }, { label: 'Leaderboard' }]}
        icon="solar:cup-star-bold-duotone"
      />
      {options.data?.length === 0 ? (
        <SectionCard>
          <EmptyState
            title="Belum ada leaderboard"
            description="Leaderboard tersedia setelah tryout dimulai."
            icon="solar:cup-star-linear"
          />
        </SectionCard>
      ) : (
        <div className="space-y-8">
          <div className="flex flex-col gap-3 rounded-card bg-card p-3 shadow-card md:flex-row md:items-center">
            <SelectField
              aria-label="Pilih tryout"
              value={f.paket}
              onChange={(paket) => setF({ paket })}
              options={(options.data ?? []).map((o) => ({
                value: String(o.schedule_id),
                label: o.title,
              }))}
              placeholder="Pilih tryout"
              className="md:w-80"
            />
            <SelectField
              aria-label="Cakupan peringkat"
              value={f.scope}
              onChange={(scope) => setF({ scope })}
              options={[
                { value: 'all', label: 'Semua sekolah' },
                { value: 'school', label: 'Sekolahku' },
              ]}
              className="md:w-52"
            />
            <SearchInput
              value={f.search}
              onChange={(search) => setF({ search })}
              placeholder="Cari nama siswa"
              className="md:flex-1"
            />
            <button
              type="button"
              onClick={resetFilters}
              aria-label="Atur ulang filter"
              className="grid size-11 shrink-0 place-items-center self-end rounded-full bg-destructive/10 text-destructive transition-colors hover:bg-destructive hover:text-white md:self-auto"
            >
              <Iconify icon="solar:restart-bold" size={20} />
            </button>
          </div>

          {query.data && Number(f.page) === 1 && !f.search && query.data.data.length > 0 && (
            <Podium rows={query.data.data.slice(0, 3)} />
          )}

          {me && (
            <div className="flex flex-wrap items-center gap-4 rounded-card bg-primary/20 px-5 py-4">
              <UserAvatar name={me.full_name} size={44} />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-foreground/70">Peringkatmu</p>
                <p className="truncate font-bold">{me.full_name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-extrabold tabular-nums">#{me.rank}</p>
                <p className="text-xs font-semibold text-foreground/70 tabular-nums">
                  Skor {formatScore(me.score)}
                </p>
              </div>
            </div>
          )}

          <SectionCard flush title="Peringkat lengkap" icon="solar:ranking-linear">
            <DataTable
              columns={columns}
              rows={query.data?.data}
              rowKey={(r) => `${r.rank}-${r.user_id}`}
              loading={query.isPending && packageId > 0}
              error={query.error}
              onRetry={() => query.refetch()}
              empty={{ title: 'Belum ada peserta' }}
            />
            <TablePagination
              meta={query.data?.pagination}
              onPageChange={(page) => setF({ page })}
            />
          </SectionCard>
        </div>
      )}
    </>
  );
}
