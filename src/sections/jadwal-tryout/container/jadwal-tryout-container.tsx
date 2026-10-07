'use client';

import type { TryoutSchedule } from 'src/models/schedule';

import { toast } from 'sonner';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';

import { errorMessage } from 'src/core/http';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { formatNumber, formatDateTime } from 'src/utils/format';

import { scheduleService } from 'src/services/paket';

import { Iconify } from 'src/components/iconify/iconify';
import { SearchInput } from 'src/components/form/search-input';
import { SelectField } from 'src/components/form/select-field';
import { DataTable } from 'src/components/data-display/data-table';
import { FilterBar } from 'src/components/data-display/filter-bar';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { ConfirmDialog } from 'src/components/feedback/confirm-dialog';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { ScheduleDialog } from '../components/schedule-dialog';
import { SCHEDULE_STATUS, SCHEDULE_STATUSES } from '../helpers/schedule';

const copy = (code: string) =>
  navigator.clipboard.writeText(code).then(() => toast.success(`Kode ${code} disalin`));

export function JadwalTryoutContainer() {
  const qc = useQueryClient();
  const { paths } = usePanel();
  const [f, setF] = useUrlState({ status: '', search: '', page: '1' });
  const params = { status: f.status, search: f.search, page: Number(f.page), per_page: 10 };
  const query = useQuery({
    queryKey: ['schedule', 'list', params],
    queryFn: () => scheduleService.list(params),
    placeholderData: keepPreviousData,
  });
  const [open, setOpen] = useState(false);
  const [created, setCreated] = useState<TryoutSchedule | null>(null);
  const [toDelete, setToDelete] = useState<TryoutSchedule | null>(null);
  const remove = useMutation({
    mutationFn: (id: number) => scheduleService.remove(id),
    onSuccess: () => {
      toast.success('Jadwal dihapus');
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ['schedule'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const columns: Column<TryoutSchedule>[] = [
    {
      key: 'title',
      header: 'Tryout',
      cell: (s) => (
        <div className="min-w-56">
          <p className="font-semibold">{s.title}</p>
          <p className="text-xs text-muted-foreground">
            {s.package_title} · {s.package_code}
          </p>
        </div>
      ),
    },
    {
      key: 'code',
      header: 'Kode',
      cell: (s) => (
        <button
          type="button"
          onClick={() => copy(s.code)}
          className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 font-mono text-xs font-semibold hover:bg-primary/10 hover:text-primary"
          aria-label={`Salin kode ${s.code}`}
        >
          {s.code}
          <Iconify icon="solar:copy-linear" size={14} />
        </button>
      ),
    },
    {
      key: 'time',
      header: 'Waktu',
      hideOnMobile: true,
      cell: (s) => (
        <div className="text-xs">
          <p>{formatDateTime(s.start_date)}</p>
          <p className="text-muted-foreground">s.d. {formatDateTime(s.end_date)}</p>
        </div>
      ),
    },
    { key: 'duration', header: 'Durasi', hideOnMobile: true, cell: (s) => `${s.duration} mnt` },
    {
      key: 'participants',
      header: 'Peserta',
      align: 'right',
      cell: (s) => formatNumber(s.participants),
    },
    {
      key: 'status',
      header: 'Status',
      cell: (s) => (
        <div className="flex flex-col items-start gap-1">
          <StatusPill tone={SCHEDULE_STATUS[s.status].tone} icon={SCHEDULE_STATUS[s.status].icon}>
            {SCHEDULE_STATUS[s.status].label}
          </StatusPill>
          {s.is_cheat_detection && (
            <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Iconify icon="solar:shield-check-linear" size={13} />
              Anti-curang
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (s) =>
        s.status === 'scheduled' ? (
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Hapus jadwal ${s.title}`}
            onClick={() => setToDelete(s)}
            className="hover:text-destructive"
          >
            <Iconify icon="solar:trash-bin-trash-linear" size={17} />
          </Button>
        ) : null,
    },
  ];

  return (
    <>
      <PageHeader
        title="Jadwal Tryout"
        description="Tryout yang dijadwalkan otomatis tampil di beranda semua siswa mitra."
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Kelola' },
          { label: 'Jadwal Tryout' },
        ]}
        actions={
          <Button onClick={() => setOpen(true)}>
            <Iconify icon="solar:calendar-add-linear" size={18} />
            Jadwalkan tryout
          </Button>
        }
      />
      <SectionCard flush>
        <FilterBar>
          <SelectField
            aria-label="Filter status"
            value={f.status}
            onChange={(status) => setF({ status })}
            options={SCHEDULE_STATUSES.map((s) => ({ value: s, label: SCHEDULE_STATUS[s].label }))}
            allLabel="Semua status"
            className="sm:w-44"
          />
          <SearchInput
            value={f.search}
            onChange={(search) => setF({ search })}
            placeholder="Cari judul / kode…"
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
            empty={{
              title: 'Belum ada jadwal',
              icon: 'solar:calendar-linear',
              action: <Button onClick={() => setOpen(true)}>Jadwalkan tryout</Button>,
            }}
          />
          <TablePagination meta={query.data?.pagination} onPageChange={(page) => setF({ page })} />
        </div>
      </SectionCard>

      <ScheduleDialog open={open} onOpenChange={setOpen} onCreated={setCreated} />
      <ConfirmDialog
        open={Boolean(created)}
        onOpenChange={(v) => !v && setCreated(null)}
        icon="solar:check-circle-linear"
        title="Tryout terjadwal"
        description="Bagikan kode berikut kepada siswa (tryout juga otomatis muncul di beranda mereka)."
        cancelLabel={null}
        confirmLabel="Salin kode & tutup"
        onConfirm={() => {
          if (created) copy(created.code);
          setCreated(null);
        }}
      >
        <p className="rounded-xl bg-primary/8 py-4 text-center font-mono text-2xl font-semibold tracking-wider text-primary">
          {created?.code}
        </p>
      </ConfirmDialog>
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(v) => !v && setToDelete(null)}
        tone="danger"
        title="Hapus jadwal?"
        description={`Jadwal "${toDelete?.title}" (${toDelete?.code}) akan dihapus dan kodenya tidak bisa dipakai lagi.`}
        confirmLabel="Hapus"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </>
  );
}
