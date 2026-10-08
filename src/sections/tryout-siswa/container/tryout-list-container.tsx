'use client';

import type { TryoutScheduleStatus } from 'src/models/schedule';

import { Skeleton } from 'src/components/ui/skeleton';

import { SISWA_PATHS } from 'src/config/paths';

import { useUrlState } from 'src/hooks/use-url-state';

import { cn } from 'src/lib/utils';

import { ErrorState } from 'src/components/feedback/error-state';
import { EmptyState } from 'src/components/feedback/empty-state';
import { PageHeader } from 'src/components/data-display/page-header';

import { SCHEDULE_STATUS } from 'src/sections/jadwal-tryout/helpers/schedule';

import { TryoutCard } from '../components/tryout-cards';
import { useStudentTryouts } from '../hooks/use-student-data';

const TABS: ('' | TryoutScheduleStatus)[] = ['', 'ongoing', 'scheduled', 'finished'];

export function TryoutListContainer() {
  const [{ status }, setF] = useUrlState({ status: '' });
  const query = useStudentTryouts();
  const rows = (query.data ?? []).filter((t) => !status || t.status === status);

  return (
    <>
      <PageHeader
        title="Tryout"
        description="Semua tryout dari lembagamu. Klik kartu untuk melihat detail dan mulai mengerjakan."
        crumbs={[{ label: 'Beranda', href: SISWA_PATHS.root }, { label: 'Tryout' }]}
      />
      <div
        className="mb-6 flex w-fit flex-wrap gap-1 rounded-full bg-card p-1.5 shadow-card"
        role="tablist"
      >
        {TABS.map((t) => (
          <button
            key={t || 'all'}
            type="button"
            role="tab"
            aria-selected={status === t}
            onClick={() => setF({ status: t })}
            className={cn(
              'rounded-full px-5 py-2 text-sm font-semibold transition-[background-color,color,box-shadow] duration-150',
              status === t
                ? 'bg-primary text-primary-foreground shadow-btn'
                : 'text-foreground/65 hover:bg-primary/8 hover:text-primary'
            )}
          >
            {t ? SCHEDULE_STATUS[t].label : 'Semua'}
          </button>
        ))}
      </div>
      {query.isPending && (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-52 rounded-card" />
          ))}
        </div>
      )}
      {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
      {query.data && rows.length === 0 && (
        <EmptyState title="Tidak ada tryout" icon="solar:calendar-linear" />
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((t) => (
          <TryoutCard key={t.id} t={t} />
        ))}
      </div>
    </>
  );
}
