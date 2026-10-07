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
  const [f, setF] = useUrlState({ search: '', status: '', page: '1' });
  const params = { search: f.search, status: f.status, page: Number(f.page), per_page: 10 };
  const query = useQuery({
    queryKey: ['members', 'teachers', params],
    queryFn: () => memberService.teachers(params),
    placeholderData: keepPreviousData,
  });
  const [dialog, setDialog] = useState<{ open: boolean; initial: MitraTeacher | null }>({
    open: false,
    initial: null,
  });
  const [toDelete, setToDelete] = useState<MitraTeacher | null>(null);
  const remove = useMutation({
    mutationFn: (id: number) => memberService.removeTeacher(id),
    onSuccess: () => {
      toast.success('Akun guru dihapus');
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ['members', 'teachers'] });
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
    { key: 'subject', header: 'Mapel', hideOnMobile: true, cell: (t) => t.subject ?? '-' },
    {
      key: 'schools',
      header: 'Sekolah diampu',
      cell: (t) => (
        <div className="flex max-w-md flex-wrap gap-1">
          {t.schools.slice(0, 2).map((s) => (
            <StatusPill key={s.id}>{s.name}</StatusPill>
          ))}
          {t.schools.length > 2 && (
            <StatusPill tone="primary">+{t.schools.length - 2} lainnya</StatusPill>
          )}
        </div>
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
            aria-label={`Ubah ${t.name}`}
            onClick={() => setDialog({ open: true, initial: t })}
          >
            <Iconify icon="solar:pen-linear" size={17} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Hapus ${t.name}`}
            onClick={() => setToDelete(t)}
            className="hover:text-destructive"
          >
            <Iconify icon="solar:trash-bin-trash-linear" size={17} />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Guru"
        description="Akun guru mitra. Guru dapat mengelola paket soal & jadwal, serta melihat analitik sekolah yang diampu."
        crumbs={[{ label: 'Ringkasan', href: paths.root }, { label: 'Kelola' }, { label: 'Guru' }]}
        actions={
          <Button onClick={() => setDialog({ open: true, initial: null })}>
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
            placeholder="Cari nama, email, mapel…"
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
        open={Boolean(toDelete)}
        onOpenChange={(v) => !v && setToDelete(null)}
        tone="danger"
        title="Hapus akun guru?"
        description={`${toDelete?.name} tidak akan bisa login lagi. Paket & jadwal yang dibuatnya tetap tersimpan.`}
        confirmLabel="Hapus"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </>
  );
}
