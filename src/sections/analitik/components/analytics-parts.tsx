'use client';

import type { SchoolRankingItem } from 'src/models/analytics';

import { useQuery } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';
import { Skeleton } from 'src/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';

import { cn } from 'src/lib/utils';
import { formatScore } from 'src/utils/format';
import type { ExportFormat } from 'src/utils/export';

import { analyticsService } from 'src/services/analytics';

import { Iconify } from 'src/components/iconify/iconify';
import { ErrorState } from 'src/components/feedback/error-state';

import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

import { RANK_STYLE } from '../helpers/analytics';

export function RankBadge({ rank }: { rank: number }) {
  return (
    <span
      className={cn(
        'grid size-8 place-items-center rounded-full text-xs font-bold tabular-nums',
        RANK_STYLE[rank - 1] ?? 'bg-muted text-muted-foreground'
      )}
    >
      {rank}
    </span>
  );
}

/** Tombol ekspor Excel/CSV. */
export function ExportButton({
  onExport,
  disabled,
}: {
  onExport: (format: ExportFormat) => void;
  disabled?: boolean;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={disabled}>
          <Iconify icon="solar:export-linear" size={18} />
          Ekspor
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onSelect={() => onExport('xlsx')}>
          <Iconify icon="solar:file-text-linear" size={18} />
          Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onExport('csv')}>
          <Iconify icon="solar:document-linear" size={18} />
          CSV (.csv)
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** Isi baris sekolah yang dibuka: nilai per mapel + skor tertinggi/terendah. */
export function SchoolSubjectsPanel({ school, code }: { school: SchoolRankingItem; code: string }) {
  const query = useQuery({
    queryKey: ['analytics', 'school-subjects', school.id, code],
    queryFn: () => analyticsService.schoolSubjects(school.id, { code }),
  });
  if (query.isPending) return <Skeleton className="h-24 w-full rounded-xl" />;
  if (query.isError) return <ErrorState error={query.error} onRetry={() => query.refetch()} />;
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {query.data.subjects.map((s) => (
        <div key={s.code} className="rounded-xl bg-card p-4 ring-1 ring-border">
          <p className="text-sm text-muted-foreground">{s.name}</p>
          <div className="mt-1 flex items-center justify-between gap-2">
            <span className="text-xl font-semibold tabular-nums">{formatScore(s.average)}</span>
            <PredicateBadge predicate={s.predicate} />
          </div>
        </div>
      ))}
      <div className="rounded-xl bg-card p-4 ring-1 ring-border">
        <p className="text-sm text-muted-foreground">Rentang skor</p>
        <p className="mt-1 text-sm">
          Tertinggi{' '}
          <span className="font-semibold tabular-nums">
            {formatScore(query.data.statistics.highest_score)}
          </span>
        </p>
        <p className="text-sm">
          Terendah{' '}
          <span className="font-semibold tabular-nums">
            {formatScore(query.data.statistics.lowest_score)}
          </span>
        </p>
      </div>
    </div>
  );
}

/** Bar persentase kecil dengan label angka. */
export function PercentBar({ value, className }: { value: number; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="h-2 w-20 overflow-hidden rounded-full bg-muted">
        <div
          className="h-full rounded-full bg-primary"
          style={{ width: `${Math.min(100, value)}%` }}
        />
      </div>
      <span className="text-xs tabular-nums">{formatScore(value, 0)}%</span>
    </div>
  );
}
