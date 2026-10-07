'use client';

import type { Package } from 'src/models/question';

import Link from 'next/link';
import { toast } from 'sonner';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQueryClient } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';
import { Skeleton } from 'src/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';

import { ENV } from 'src/config/env';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { formatShortDate } from 'src/utils/format';

import { devService } from 'src/services/account';

import { Iconify } from 'src/components/iconify/iconify';
import { SearchInput } from 'src/components/form/search-input';
import { SelectField } from 'src/components/form/select-field';
import { EmptyState } from 'src/components/feedback/empty-state';
import { ErrorState } from 'src/components/feedback/error-state';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import { ConfirmDialog } from 'src/components/feedback/confirm-dialog';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { PackageFormDialog } from '../components/package-form-dialog';
import { usePackages, useMasterData, usePaketMutations } from '../hooks/use-paket';

export function PaketListContainer() {
  const router = useRouter();
  const qc = useQueryClient();
  const { paths } = usePanel();
  const [f, setF] = useUrlState({ search: '', subject_id: '', page: '1' });
  const query = usePackages({
    search: f.search,
    subject_id: f.subject_id,
    page: Number(f.page),
    per_page: 9,
  });
  const { subjects } = useMasterData();
  const { removePackage } = usePaketMutations();
  const [form, setForm] = useState<{ open: boolean; initial: Package | null }>({
    open: false,
    initial: null,
  });
  const [toDelete, setToDelete] = useState<Package | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);

  const resetSimulation = async () => {
    await devService.resetMock();
    qc.invalidateQueries();
    setConfirmReset(false);
    toast.success('Data simulasi dikembalikan ke kondisi awal');
  };

  return (
    <>
      <PageHeader
        title="Paket Soal"
        description="Susun paket soal dari soal buatan sendiri atau bank soal, lalu jadwalkan sebagai tryout."
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Kelola' },
          { label: 'Paket Soal' },
        ]}
        actions={
          <>
            {ENV.mock && (
              <Button variant="ghost" onClick={() => setConfirmReset(true)}>
                <Iconify icon="solar:restart-linear" size={18} />
                Reset data simulasi
              </Button>
            )}
            <Button onClick={() => setForm({ open: true, initial: null })}>
              <Iconify icon="solar:add-circle-linear" size={18} />
              Buat paket
            </Button>
          </>
        }
      />

      <SectionCard>
        <div className="mb-5 flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={f.search}
            onChange={(search) => setF({ search })}
            placeholder="Cari judul / kode paket…"
          />
          <SelectField
            aria-label="Filter mapel"
            value={f.subject_id}
            onChange={(subject_id) => setF({ subject_id })}
            options={(subjects.data ?? []).map((s) => ({ value: String(s.id), label: s.name }))}
            allLabel="Semua mapel"
          />
        </div>

        {query.isPending && (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-44 rounded-xl" />
            ))}
          </div>
        )}
        {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
        {query.data?.data.length === 0 && (
          <EmptyState
            title="Belum ada paket soal"
            description="Buat paket pertama lalu tambahkan soal."
            icon="solar:box-linear"
            action={
              <Button onClick={() => setForm({ open: true, initial: null })}>Buat paket</Button>
            }
          />
        )}
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {query.data?.data.map((p) => (
            <article
              key={p.id}
              className="lift relative flex flex-col rounded-xl p-5 ring-1 ring-border"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Iconify icon="solar:box-linear" size={22} />
                </span>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Aksi paket ${p.title}`}
                      className="relative z-10"
                    >
                      <Iconify icon="solar:menu-dots-bold" size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setForm({ open: true, initial: p })}>
                      <Iconify icon="solar:pen-linear" size={16} />
                      Ubah info paket
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={paths.questionCreate(p.id)}>
                        <Iconify icon="solar:add-square-linear" size={16} />
                        Tambah soal
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant="destructive"
                      onSelect={() => setToDelete(p)}
                      disabled={p.schedule_count > 0}
                    >
                      <Iconify icon="solar:trash-bin-trash-linear" size={16} />
                      Hapus
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
              <Link
                href={paths.paketDetail(p.id)}
                className="mt-4 after:absolute after:inset-0 after:content-['']"
              >
                <h3 className="line-clamp-2 font-semibold">{p.title}</h3>
              </Link>
              <p className="mt-1 text-xs text-muted-foreground">
                {p.subject_name} · Kelas {p.class_name}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusPill tone="primary" icon="solar:hashtag-linear">
                  {p.code}
                </StatusPill>
                <StatusPill>{p.question_count} soal</StatusPill>
                {p.schedule_count > 0 && (
                  <StatusPill tone="success" icon="solar:calendar-mark-linear">
                    Dipakai {p.schedule_count} jadwal
                  </StatusPill>
                )}
              </div>
              <p className="mt-auto pt-4 text-xs text-muted-foreground">
                Diperbarui {formatShortDate(p.updatedAt)} · oleh {p.created_by}
              </p>
            </article>
          ))}
        </div>
        <TablePagination
          meta={query.data?.pagination}
          onPageChange={(page) => setF({ page })}
          className="px-0 pb-0"
        />
      </SectionCard>

      <PackageFormDialog
        open={form.open}
        initial={form.initial}
        onOpenChange={(open) => setForm((s) => ({ ...s, open }))}
        onSaved={(pkg) => {
          if (!form.initial) router.push(paths.paketDetail(pkg.id));
        }}
      />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(open) => !open && setToDelete(null)}
        tone="danger"
        title="Hapus paket soal?"
        description={`Paket "${toDelete?.title}" beserta daftar soalnya akan dihapus.`}
        confirmLabel="Hapus"
        loading={removePackage.isPending}
        onConfirm={() =>
          toDelete && removePackage.mutate(toDelete.id, { onSuccess: () => setToDelete(null) })
        }
      />
      <ConfirmDialog
        open={confirmReset}
        onOpenChange={setConfirmReset}
        tone="warning"
        title="Reset data simulasi?"
        description="Paket, jadwal, pengerjaan siswa, guru, dan pengaturan mitra simulasi di browser ini akan kembali ke kondisi awal."
        confirmLabel="Reset"
        onConfirm={resetSimulation}
      />
    </>
  );
}
