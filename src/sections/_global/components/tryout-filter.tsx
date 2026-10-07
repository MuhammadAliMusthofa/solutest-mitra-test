'use client';

import { useQuery } from '@tanstack/react-query';

import { formatShortDate } from 'src/utils/format';

import { analyticsService } from 'src/services/analytics';

import { SelectField } from 'src/components/form/select-field';

interface Props {
  value: string;
  onChange: (code: string) => void;
  className?: string;
}

/** Filter tryout global analitik & progres: kosong = semua tryout tenant (query `?code=`). */
export function TryoutFilter({ value, onChange, className }: Props) {
  const { data = [], isLoading } = useQuery({
    queryKey: ['analytics', 'tryout-options'],
    queryFn: analyticsService.tryoutOptions,
    staleTime: 5 * 60_000,
  });

  return (
    <SelectField
      aria-label="Filter tryout"
      value={value}
      onChange={onChange}
      disabled={isLoading}
      allLabel="Semua tryout"
      className={className ?? 'sm:w-72'}
      options={data.map((t) => ({
        value: t.code,
        label: `${t.name} · ${formatShortDate(t.start_date)}`,
      }))}
    />
  );
}
