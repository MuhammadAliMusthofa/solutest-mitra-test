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
import { FilterBar } from 'src/components/data-display/filter-bar';
import { UserAvatar } from 'src/components/data-display/user-avatar';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { RankBadge } from 'src/sections/analitik/components/analytics-parts';

const PODIUM = [
  { place: 2, height: 'h-24', tone: 'bg-[#E4E8ED]' },
  { place: 1, height: 'h-32', tone: 'bg-[#F6E7B8]' },
  { place: 3, height: 'h-20', tone: 'bg-[#F1DCCB]' },
];

function Podium({ rows }: { rows: LeaderboardRow[] }) {
  return (
    <div className="flex items-end justify-center gap-3 sm:gap-6">
      {PODIUM.map(({ place, height, tone }) => {
        const r = rows.find((x) => x.rank === place);
        if (!r) return <div key={place} className="w-24" />;
        return (
          <div key={place} className="flex w-24 flex-col items-center text-center sm:w-32">
            <UserAvatar name={r.full_name} size={place === 1 ? 64 : 52} />
            <p className="mt-2 line-clamp-1 text-sm font-semibold">{r.full_name}</p>
            <p className="line-clamp-1 text-xs text-muted-foreground">{r.school}</p>
            <p className="mt-1 font-semibold tabular-nums">{formatScore(r.score)}</p>
            <div
              className={cn(
                'mt-2 grid w-full place-items-center rounded-t-xl text-2xl font-bold text-foreground/70',
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
  const [f, setF] = useUrlState({ paket: '', search: '', page: '1' });
  const options = useQuery({
    queryKey: ['student', 'leaderboard-options'],
    queryFn: leaderboardService.options,
  });
  const packageId = Number(f.paket || options.data?.[0]?.package_id || 0);

  useEffect(() => {
    if (!f.paket && options.data?.[0]) setF({ paket: String(options.data[0].package_id) });
  }, [f.paket, options.data, setF]);

  const params = { search: f.search, page: Number(f.page) };
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
      key: 'region',
      header: 'Wilayah',
      hideOnMobile: true,
      cell: (r) => `${r.city_name}, ${r.province_name}`,
    },
    {
      key: 'score',
      header: 'Skor',
      align: 'right',
      cell: (r) => <span className="font-semibold tabular-nums">{formatScore(r.score)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Leaderboard"
        crumbs={[{ label: 'Beranda', href: SISWA_PATHS.root }, { label: 'Leaderboard' }]}
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
        <div className="space-y-6">
          <SectionCard>
            <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <SelectField
                aria-label="Pilih tryout"
                value={f.paket}
                onChange={(paket) => setF({ paket })}
                options={(options.data ?? []).map((o) => ({
                  value: String(o.package_id),
                  label: o.title,
                }))}
                placeholder="Pilih tryout"
                className="sm:w-80"
              />
              {me && (
                <div className="flex items-center gap-3 rounded-xl bg-primary/8 px-4 py-2">
                  <Iconify icon="solar:user-rounded-linear" size={20} className="text-primary" />
                  <span className="text-sm">
                    Peringkatmu <span className="font-semibold">#{me.rank}</span> · skor{' '}
                    <span className="font-semibold tabular-nums">{formatScore(me.score)}</span>
                  </span>
                </div>
              )}
            </div>
            {query.data && Number(f.page) === 1 && !f.search && (
              <Podium rows={query.data.data.slice(0, 3)} />
            )}
          </SectionCard>
          <SectionCard flush>
            <FilterBar>
              <SearchInput
                value={f.search}
                onChange={(search) => setF({ search })}
                placeholder="Cari nama…"
              />
            </FilterBar>
            <div className="mt-4">
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
            </div>
          </SectionCard>
        </div>
      )}
    </>
  );
}
