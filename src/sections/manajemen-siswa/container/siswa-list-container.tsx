'use client';

import type { MitraStudent } from 'src/models/member';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';

import { errorMessage } from 'src/core/http';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { formatScore, formatShortDate } from 'src/utils/format';

import { memberService } from 'src/services/member';

import { Iconify } from 'src/components/iconify/iconify';
import { SearchInput } from 'src/components/form/search-input';
import { SelectField } from 'src/components/form/select-field';
import { DataTable } from 'src/components/data-display/data-table';
import { FilterBar } from 'src/components/data-display/filter-bar';
import { StatusPill } from 'src/components/data-display/status-pill';
import { UserAvatar } from 'src/components/data-display/user-avatar';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { ConfirmDialog } from 'src/components/feedback/confirm-dialog';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { PredicateBadge } from 'src/sections/_global/components/predicate-badge';

import { StudentDialog } from '../components/student-dialog';

/** Daftar siswa — admin (semua sekolah) & guru (sekolahnya saja, dibatasi backend). */
export function SiswaListContainer() {
  const qc = useQueryClient();
  const { panel, isAdmin, paths } = usePanel();
  const [f, setF] = useUrlState({
    search: '',
    school_id: '',
    class_name: '',
    status: '',
    page: '1',
  });
  const params = {
    search: f.search,
    school_id: isAdmin ? f.school_id : undefined,
    class_name: f.class_name,
    is_active: f.status ? f.status === 'active' : undefined,
    page: Number(f.page),
    per_page: 10,
  };
  const query = useQuery({
    queryKey: ['member', 'students', panel, params],
    queryFn: () => memberService.students(panel, params),
    placeholderData: keepPreviousData,
  });
  const schools = useQuery({
    queryKey: ['member', 'schools', 'options'],
    queryFn: memberService.schools,
    enabled: isAdmin,
  });
  const quota = useQuery({
    queryKey: ['member', 'quota'],
    queryFn: memberService.quota,
    enabled: isAdmin,
  });
  const [dialog, setDialog] = useState<{ open: boolean; initial: MitraStudent | null }>({
    open: false,
    initial: null,
  });
  const [toToggle, setToToggle] = useState<MitraStudent | null>(null);
  const toggle = useMutation({
    mutationFn: (s: MitraStudent) => memberService.setStudentActive(panel, s.id, !s.is_active),
    onSuccess: (_, s) => {
      toast.success(s.is_active ? 'Siswa dinonaktifkan' : 'Siswa diaktifkan kembali');
      setToToggle(null);
      qc.invalidateQueries({ queryKey: ['member'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const columns: Column<MitraStudent>[] = [
    {
      key: 'name',
      header: 'Siswa',
      cell: (s) => (
        <Link href={paths.studentHistory(s.id)} className="flex min-w-56 items-center gap-3">
          <UserAvatar name={s.name} size={36} />
          <div className="min-w-0">
            <p className="truncate font-semibold hover:text-primary">{s.name}</p>
            <p className="truncate text-xs text-muted-foreground">{s.email}</p>
          </div>
        </Link>
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
      header: isAdmin ? 'Sekolah' : 'Kelas',
      cell: (s) =>
        isAdmin ? (
          <div className="min-w-44">
            <p>{s.school}</p>
            <p className="text-xs text-muted-foreground">
              {[s.class, s.jenjang].filter(Boolean).join(' · ') || '-'}
            </p>
          </div>
        ) : (
          (s.class ?? '-')
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
      key: 'status',
      header: 'Status',
      hideOnMobile: true,
      cell: (s) => (
        <div className="flex flex-col items-start gap-0.5">
          <StatusPill tone={s.is_active ? 'success' : 'neutral'}>
            {s.is_active ? 'Aktif' : 'Nonaktif'}
          </StatusPill>
          <span className="text-[11px] text-muted-foreground">
            sejak {formatShortDate(s.created_at)}
          </span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (s) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Ubah ${s.name}`}
            onClick={() => setDialog({ open: true, initial: s })}
          >
            <Iconify icon="solar:pen-linear" size={17} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={s.is_active ? `Nonaktifkan ${s.name}` : `Aktifkan ${s.name}`}
            onClick={() => setToToggle(s)}
            className={s.is_active ? 'hover:text-destructive' : 'hover:text-success'}
          >
            <Iconify
              icon={s.is_active ? 'solar:user-block-linear' : 'solar:user-check-linear'}
              size={17}
            />
          </Button>
        </div>
      ),
    },
  ];

  const quotaFull = Boolean(quota.data && quota.data.siswa.used >= quota.data.siswa.limit);

  return (
    <>
      <PageHeader
        title="Siswa"
        description={
          isAdmin
            ? `Akun siswa mitra.${quota.data ? ` Kuota siswa: ${quota.data.siswa.used}/${quota.data.siswa.limit}.` : ''}`
            : 'Siswa di sekolah Anda. Tambahkan satu per satu atau import Excel/CSV.'
        }
        crumbs={[{ label: 'Ringkasan', href: paths.root }, { label: 'Kelola' }, { label: 'Siswa' }]}
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href={paths.importSiswa}>
                <Iconify icon="solar:import-linear" size={18} />
                Import siswa
              </Link>
            </Button>
            <Button
              onClick={() => setDialog({ open: true, initial: null })}
              disabled={quotaFull}
              title={quotaFull ? 'Kuota siswa penuh' : undefined}
            >
              <Iconify icon="solar:user-plus-linear" size={18} />
              Tambah siswa
            </Button>
          </>
        }
      />
      <SectionCard flush>
        <FilterBar>
          <SearchInput
            value={f.search}
            onChange={(search) => setF({ search })}
            placeholder="Cari nama, email, NISN…"
          />
          {isAdmin && (
            <SelectField
              aria-label="Filter sekolah"
              value={f.school_id}
              onChange={(school_id) => setF({ school_id })}
              options={(schools.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))}
              allLabel="Semua sekolah"
              className="sm:w-56"
            />
          )}
          <SearchInput
            value={f.class_name}
            onChange={(class_name) => setF({ class_name })}
            placeholder="Kelas (persis)…"
            className="sm:w-40"
          />
          <SelectField
            aria-label="Filter status"
            value={f.status}
            onChange={(status) => setF({ status })}
            options={[
              { value: 'active', label: 'Aktif' },
              { value: 'inactive', label: 'Nonaktif' },
            ]}
            allLabel="Semua status"
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

      <StudentDialog
        open={dialog.open}
        initial={dialog.initial}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
      <ConfirmDialog
        open={Boolean(toToggle)}
        onOpenChange={(v) => !v && setToToggle(null)}
        tone={toToggle?.is_active ? 'danger' : 'warning'}
        title={toToggle?.is_active ? 'Nonaktifkan siswa?' : 'Aktifkan kembali siswa?'}
        description={
          toToggle?.is_active
            ? `${toToggle?.name} tidak bisa login ke aplikasi mitra. Riwayat tryout tetap tersimpan.`
            : `${toToggle?.name} bisa login kembali (memakai 1 kuota siswa).`
        }
        confirmLabel={toToggle?.is_active ? 'Nonaktifkan' : 'Aktifkan'}
        loading={toggle.isPending}
        onConfirm={() => toToggle && toggle.mutate(toToggle)}
      />
    </>
  );
}
