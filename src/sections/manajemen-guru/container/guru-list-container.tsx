'use client';

import type { MitraTeacher } from 'src/models/member';

import { toast } from 'sonner';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';

import { errorMessage } from 'src/core/http';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

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

import { TeacherDialog } from '../components/teacher-dialog';

export function GuruListContainer() {
  const qc = useQueryClient();
  const { paths } = usePanel();
  const [f, setF] = useUrlState({ search: '', status: '', school_id: '', page: '1' });
  const params = {
    search: f.search,
    status: f.status,
    school_id: f.school_id,
    page: Number(f.page),
    per_page: 10,
  };
  const query = useQuery({
    queryKey: ['member', 'teachers', params],
    queryFn: () => memberService.teachers(params),
    placeholderData: keepPreviousData,
  });
  const schools = useQuery({
    queryKey: ['member', 'schools', 'options'],
    queryFn: memberService.schools,
  });
  const quota = useQuery({ queryKey: ['member', 'quota'], queryFn: memberService.quota });
  const [dialog, setDialog] = useState<{ open: boolean; initial: MitraTeacher | null }>({
    open: false,
    initial: null,
  });
  const [toToggle, setToToggle] = useState<MitraTeacher | null>(null);
  const toggle = useMutation({
    mutationFn: (t: MitraTeacher) => memberService.setTeacherActive(t.id, t.status !== 'active'),
    onSuccess: (_, t) => {
      toast.success(t.status === 'active' ? 'Guru dinonaktifkan' : 'Guru diaktifkan kembali');
      setToToggle(null);
      qc.invalidateQueries({ queryKey: ['member'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const columns: Column<MitraTeacher>[] = [
    {
      key: 'name',
      header: 'Guru',
      cell: (t) => (
        <div className="flex min-w-56 items-center gap-3">
          <UserAvatar name={t.name} size={36} />
          <div className="min-w-0">
            <p className="truncate font-semibold">{t.name}</p>
            <p className="truncate text-xs text-muted-foreground">{t.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'phone',
      header: 'No. HP',
      hideOnMobile: true,
      cell: (t) => <span className="text-xs">{t.phone ?? '-'}</span>,
    },
    {
      key: 'school',
      header: 'Sekolah',
      cell: (t) =>
        t.school_name ? (
          <StatusPill>{t.school_name}</StatusPill>
        ) : (
          <StatusPill tone="warning" icon="solar:danger-triangle-linear">
            Belum diatur
          </StatusPill>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (t) => (
        <StatusPill tone={t.status === 'active' ? 'success' : 'neutral'}>
          {t.status === 'active' ? 'Aktif' : 'Nonaktif'}
        </StatusPill>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (t) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Ubah sekolah ${t.name}`}
            onClick={() => setDialog({ open: true, initial: t })}
          >
            <Iconify icon="solar:pen-linear" size={17} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={t.status === 'active' ? `Nonaktifkan ${t.name}` : `Aktifkan ${t.name}`}
            onClick={() => setToToggle(t)}
            className={t.status === 'active' ? 'hover:text-destructive' : 'hover:text-success'}
          >
            <Iconify
              icon={t.status === 'active' ? 'solar:user-block-linear' : 'solar:user-check-linear'}
              size={17}
            />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Guru"
        description={`Guru mengelola siswa & memantau hasil tryout di sekolahnya.${
          quota.data ? ` Kuota guru: ${quota.data.guru.used}/${quota.data.guru.limit}.` : ''
        }`}
        crumbs={[{ label: 'Ringkasan', href: paths.root }, { label: 'Kelola' }, { label: 'Guru' }]}
        actions={
          <Button
            onClick={() => setDialog({ open: true, initial: null })}
            disabled={Boolean(quota.data && quota.data.guru.used >= quota.data.guru.limit)}
          >
            <Iconify icon="solar:user-plus-linear" size={18} />
            Tambah guru
          </Button>
        }
      />
      <SectionCard flush>
        <FilterBar>
          <SearchInput
            value={f.search}
            onChange={(search) => setF({ search })}
            placeholder="Cari nama atau email…"
          />
          <SelectField
            aria-label="Filter sekolah"
            value={f.school_id}
            onChange={(school_id) => setF({ school_id })}
            options={(schools.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))}
            allLabel="Semua sekolah"
            className="sm:w-56"
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
            rowKey={(t) => t.id}
            loading={query.isPending}
            error={query.error}
            onRetry={() => query.refetch()}
            empty={{ title: 'Belum ada guru', icon: 'solar:square-academic-cap-linear' }}
          />
          <TablePagination meta={query.data?.pagination} onPageChange={(page) => setF({ page })} />
        </div>
      </SectionCard>
      <TeacherDialog
        open={dialog.open}
        initial={dialog.initial}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
      <ConfirmDialog
        open={Boolean(toToggle)}
        onOpenChange={(v) => !v && setToToggle(null)}
        tone={toToggle?.status === 'active' ? 'danger' : 'warning'}
        title={toToggle?.status === 'active' ? 'Nonaktifkan guru?' : 'Aktifkan kembali guru?'}
        description={
          toToggle?.status === 'active'
            ? `${toToggle?.name} tidak bisa login ke aplikasi mitra dan kuota guru dikembalikan. Data siswa tetap tersimpan.`
            : `${toToggle?.name} bisa login kembali (memakai 1 kuota guru).`
        }
        confirmLabel={toToggle?.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
        loading={toggle.isPending}
        onConfirm={() => toToggle && toggle.mutate(toToggle)}
      />
    </>
  );
}
