'use client';

import type { MitraStudent } from 'src/models/member';

import Link from 'next/link';
import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { formatScore, formatShortDate } from 'src/utils/format';

import { memberService } from 'src/services/member';

import { Iconify } from 'src/components/iconify/iconify';
import { SearchInput } from 'src/components/form/search-input';
import { SelectField } from 'src/components/form/select-field';
import { DataTable } from 'src/components/data-display/data-table';
import { FilterBar } from 'src/components/data-display/filter-bar';
import { UserAvatar } from 'src/components/data-display/user-avatar';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

import { JENJANG_OPTIONS } from '../helpers/import-siswa';

export function SiswaListContainer() {
  const { paths } = usePanel();
  const [f, setF] = useUrlState({ search: '', jenjang: '', page: '1' });
  const params = { search: f.search, jenjang: f.jenjang, page: Number(f.page), per_page: 10 };
  const query = useQuery({
    queryKey: ['members', 'students', params],
    queryFn: () => memberService.students(params),
    placeholderData: keepPreviousData,
  });

  const columns: Column<MitraStudent>[] = [
    {
      key: 'name',
      header: 'Siswa',
      cell: (s) => (
        <div className="flex min-w-56 items-center gap-3">
          <UserAvatar name={s.name} size={36} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{s.name}</p>
            <p className="truncate text-xs text-muted-foreground">{s.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'nisn',
      header: 'NISN',
      hideOnMobile: true,
      cell: (s) => <span className="font-mono text-xs">{s.nisn ?? '-'}</span>,
    },
    {
      key: 'school',
      header: 'Sekolah',
      cell: (s) => (
        <div className="min-w-44">
          <p>{s.school}</p>
          <p className="text-xs text-muted-foreground">
            {[s.class, s.jenjang].filter(Boolean).join(' · ') || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'tryout',
      header: 'Tryout',
      align: 'right',
      hideOnMobile: true,
      cell: (s) => s.total_tryout,
    },
    {
      key: 'last',
      header: 'Skor terakhir',
      align: 'right',
      cell: (s) => <span className="font-semibold tabular-nums">{formatScore(s.last_score)}</span>,
    },
    {
      key: 'predicate',
      header: 'Predikat',
      hideOnMobile: true,
      cell: (s) => <PredicateBadge predicate={s.last_predicate} />,
    },
    {
      key: 'created',
      header: 'Terdaftar',
      hideOnMobile: true,
      cell: (s) => <span className="text-xs">{formatShortDate(s.created_at)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Siswa"
        description="Akun siswa mitra. Tambahkan siswa secara massal lewat import Excel/CSV."
        crumbs={[{ label: 'Ringkasan', href: paths.root }, { label: 'Kelola' }, { label: 'Siswa' }]}
        actions={
          <Button asChild>
            <Link href={paths.importSiswa}>
              <Iconify icon="solar:import-linear" size={18} />
              Import siswa
            </Link>
          </Button>
        }
      />
      <SectionCard flush>
        <FilterBar>
          <SearchInput
            value={f.search}
            onChange={(search) => setF({ search })}
            placeholder="Cari nama, email, NISN…"
          />
          <SelectField
            aria-label="Filter jenjang"
            value={f.jenjang}
            onChange={(jenjang) => setF({ jenjang })}
            options={JENJANG_OPTIONS.map((j) => ({ value: j, label: j }))}
            allLabel="Semua jenjang"
            className="sm:w-40"
          />
        </FilterBar>
        <div className="mt-4">
          <DataTable
            columns={columns}
            rows={query.data?.data}
            rowKey={(s) => s.id}
            loading={query.isPending}
            error={query.error}
            onRetry={() => query.refetch()}
            empty={{ title: 'Belum ada siswa', icon: 'solar:user-id-linear' }}
          />
          <TablePagination meta={query.data?.pagination} onPageChange={(page) => setF({ page })} />
        </div>
      </SectionCard>
    </>
  );
}
