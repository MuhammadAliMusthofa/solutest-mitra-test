'use client';

import type { StudentDetailItem } from 'src/models/analytics';

import Link from 'next/link';
import { toast } from 'sonner';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { exportSheet } from 'src/utils/export';
import { formatScore, formatDuration } from 'src/utils/format';

import { analyticsService } from 'src/services/analytics';

import { Iconify } from 'src/components/iconify/iconify';
import { SearchInput } from 'src/components/form/search-input';
import { SelectField } from 'src/components/form/select-field';
import { DataTable } from 'src/components/data-display/data-table';
import { FilterBar } from 'src/components/data-display/filter-bar';
import { StatusPill } from 'src/components/data-display/status-pill';
import { UserAvatar } from 'src/components/data-display/user-avatar';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { TryoutFilter } from 'src/sections/_global/components/tryout-filter';
import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

import { STUDENT_STATUS } from '../helpers/analytics';
import { RankBadge, ExportButton } from '../components/analytics-parts';

/** Detail Siswa: skor per siswa per tryout + nilai per mapel (baris dapat dibuka). */
export function StudentScoresContainer() {
  const { paths } = usePanel();
  const [f, setF] = useUrlState({ code: '', school_id: '', search: '', page: '1' });
  const params = {
    code: f.code,
    school_id: f.school_id,
    search: f.search,
    page: Number(f.page),
    per_page: 10,
  };
  const query = useQuery({
    queryKey: ['analytics', 'students', params],
    queryFn: () => analyticsService.students(params),
    placeholderData: keepPreviousData,
  });
  const schools = query.data?.filter_options.sekolah ?? [];

  const exportAll = async (format: 'xlsx' | 'csv') => {
    const all = await analyticsService.students({ ...params, page: 1, per_page: 2000 });
    await exportSheet(
      'detail-siswa',
      all.data.map((s) => ({
        Peringkat: s.rank,
        Nama: s.name,
        Sekolah: s.school,
        Kelas: s.class,
        Tryout: s.tryout_name,
        Skor: s.total_score,
        Predikat: s.total_predicate,
        Status: s.status,
        ...Object.fromEntries(s.subjects.map((sub) => [sub.name, sub.total_score])),
      })),
      format
    );
    toast.success('File detail siswa diunduh');
  };

  const columns: Column<StudentDetailItem>[] = [
    { key: 'rank', header: '#', cell: (s) => <RankBadge rank={s.rank} />, className: 'w-14' },
    {
      key: 'name',
      header: 'Siswa',
      cell: (s) => (
        <div className="flex min-w-52 items-center gap-3">
          <UserAvatar name={s.name} size={36} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{s.name}</p>
            <p className="truncate text-xs text-muted-foreground">
              {s.school} · {s.class}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'tryout',
      header: 'Tryout',
      hideOnMobile: true,
      cell: (s) => <span className="text-muted-foreground">{s.tryout_name}</span>,
    },
    {
      key: 'score',
      header: 'Skor',
      align: 'right',
      cell: (s) => <span className="font-semibold tabular-nums">{formatScore(s.total_score)}</span>,
    },
    {
      key: 'predicate',
      header: 'Predikat',
      cell: (s) => <PredicateBadge predicate={s.total_predicate} />,
    },
    {
      key: 'status',
      header: 'Status',
      hideOnMobile: true,
      cell: (s) => (
        <StatusPill tone={STUDENT_STATUS[s.status].tone} icon={STUDENT_STATUS[s.status].icon}>
          {s.status}
        </StatusPill>
      ),
    },
    {
      key: 'action',
      header: '',
      align: 'right',
      cell: (s) => (
        <Button variant="ghost" size="sm" asChild onClick={(e) => e.stopPropagation()}>
          <Link href={paths.practiceDetail(s.practice_id)}>
            Hasil
            <Iconify icon="solar:arrow-right-linear" size={16} />
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Detail Siswa"
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Analisis' },
          { label: 'Detail Siswa' },
        ]}
      />
      <SectionCard flush>
        <FilterBar
          actions={<ExportButton onExport={exportAll} disabled={!query.data?.data.length} />}
        >
          <TryoutFilter value={f.code} onChange={(code) => setF({ code })} />
          <SelectField
            aria-label="Filter sekolah"
            value={f.school_id}
            onChange={(school_id) => setF({ school_id })}
            options={schools.map((s) => ({ value: s.id, label: s.nama }))}
            allLabel="Semua sekolah"
            className="sm:w-64"
          />
          <SearchInput
            value={f.search}
            onChange={(search) => setF({ search })}
            placeholder="Cari siswa…"
          />
        </FilterBar>
        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={query.data?.data}
            rowKey={(s) => s.practice_id}
            loading={query.isPending}
            error={query.error}
            onRetry={() => query.refetch()}
            empty={{ title: 'Tidak ada siswa', description: 'Coba ubah filter atau kata kunci.' }}
            renderExpanded={(s) => (
              <div className="grid gap-3 sm:grid-cols-3">
                {s.subjects.map((sub) => (
                  <div key={sub.name} className="rounded-xl bg-card p-4 ring-1 ring-border">
                    <p className="text-sm text-muted-foreground">{sub.name}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xl font-semibold tabular-nums">
                        {formatScore(sub.total_score)}
                      </span>
                      <PredicateBadge predicate={sub.predicate} />
                    </div>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground sm:col-span-3">
                  Lama pengerjaan: {formatDuration(s.duration)}
                </p>
              </div>
            )}
          />
          <TablePagination meta={query.data?.pagination} onPageChange={(page) => setF({ page })} />
        </div>
      </SectionCard>
    </>
  );
}
