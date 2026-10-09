'use client';

import type { Package } from 'src/models/question';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from 'src/components/ui/button';
import { Skeleton } from 'src/components/ui/skeleton';
import {
  DropdownMenu,
  DropdownMenuItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from 'src/components/ui/dropdown-menu';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { formatShortDate } from 'src/utils/format';

import { Iconify } from 'src/components/iconify/iconify';
import { SearchInput } from 'src/components/form/search-input';
import { SelectField } from 'src/components/form/select-field';
import { EmptyState } from 'src/components/feedback/empty-state';
import { ErrorState } from 'src/components/feedback/error-state';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import { ConfirmDialog } from 'src/components/feedback/confirm-dialog';
import { ToneIcon, toneStyle } from 'src/components/data-display/kpi-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

import { CatalogDialog } from '../components/catalog-dialog';
import { subjectIcon, subjectTone } from '../helpers/subject-style';
import { PackageFormDialog } from '../components/package-form-dialog';
import { usePackages, useMasterData, usePaketMutations } from '../hooks/use-paket';

export function PaketListContainer() {
  const router = useRouter();
  const { paths } = usePanel();
  const [f, setF] = useUrlState({ search: '', subject_id: '', source: '', page: '1' });
  const query = usePackages({
    search: f.search,
    subject_id: f.subject_id,
    source: (f.source || undefined) as Package['source'] | undefined,
    page: Number(f.page),
    per_page: 9,
  });
  const { subjects } = useMasterData();
  const { removePackage, duplicatePackage } = usePaketMutations();
  const [form, setForm] = useState<{ open: boolean; initial: Package | null }>({
    open: false,
    initial: null,
  });
  const [toDelete, setToDelete] = useState<Package | null>(null);
  const [toCopy, setToCopy] = useState<Package | null>(null);
  const [catalogOpen, setCatalogOpen] = useState(false);

  return (
    <>
      <PageHeader
        title="Paket Soal"
        description="Susun paket soal dari soal buatan sendiri (PG, PG Kompleks, Benar/Salah, Benar/Salah Kompleks), salin paket yang ada, lalu jadwalkan sebagai tryout."
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Kelola' },
          { label: 'Paket Soal' },
        ]}
        actions={
          <>
            <Button variant="outline" onClick={() => setCatalogOpen(true)}>
              <Iconify icon="solar:import-linear" size={18} />
              Ambil dari Solutest
            </Button>
            <Button onClick={() => setForm({ open: true, initial: null })}>
              <Iconify icon="solar:add-circle-linear" size={18} />
              Buat paket
            </Button>
          </>
        }
      />

      <div className="mb-6 flex flex-col gap-3 rounded-card bg-card p-4 shadow-card sm:flex-row sm:flex-wrap sm:items-center md:px-5">
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
        <SelectField
          aria-label="Filter sumber paket"
          value={f.source}
          onChange={(source) => setF({ source })}
          options={[
            { value: 'MITRA', label: 'Buatan mitra' },
            { value: 'SOLUTEST', label: 'Salinan Solutest' },
          ]}
          allLabel="Semua sumber"
        />
        {query.data && (
          <p className="text-sm text-muted-foreground sm:ml-auto">
            <span className="font-bold text-foreground tabular-nums">
              {query.data.pagination.total_items.toLocaleString('id-ID')}
            </span>{' '}
            paket
          </p>
        )}
      </div>

      {query.isPending && (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Skeleton key={i} className="h-72 rounded-card" />
          ))}
        </div>
      )}
      {query.isError && (
        <div className="rounded-card bg-card shadow-card">
          <ErrorState error={query.error} onRetry={() => query.refetch()} />
        </div>
      )}
      {query.data?.data.length === 0 && (
        <div className="rounded-card bg-card shadow-card">
          <EmptyState
            title="Belum ada paket soal"
            description="Buat paket sendiri atau ambil paket yang dibagikan Solutest."
            icon="solar:box-linear"
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button variant="outline" onClick={() => setCatalogOpen(true)}>
                  Ambil dari Solutest
                </Button>
                <Button onClick={() => setForm({ open: true, initial: null })}>Buat paket</Button>
              </div>
            }
          />
        </div>
      )}

      <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
        {query.data?.data.map((p) => {
          const tone = subjectTone(p.subject_id ?? p.id);
          return (
            <article
              key={p.id}
              style={toneStyle(tone)}
              className="lift group/paket relative flex flex-col overflow-hidden rounded-card bg-card shadow-card has-[a:focus-visible]:ring-4 has-[a:focus-visible]:ring-primary/30"
            >
              <div className="deco-rings relative z-10 flex items-start justify-between gap-2 bg-[color-mix(in_srgb,var(--tone)_10%,var(--card))] px-5 pt-5 pb-4">
                <div className="flex min-w-0 items-center gap-3">
                  <ToneIcon icon={subjectIcon(p.subject_name)} tone={tone} solid />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-(--tone-ink)">
                      {p.subject_name ?? 'Mapel belum diatur'}
                    </p>
                    <p className="text-xs text-foreground/60">
                      {p.class_name ? `Kelas ${p.class_name}` : 'Kelas belum diatur'}
                    </p>
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Aksi paket ${p.title}`}
                      className="relative z-10 bg-card/80 hover:bg-card"
                    >
                      <Iconify icon="solar:menu-dots-bold" size={18} />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onSelect={() => setForm({ open: true, initial: p })}>
                      <Iconify icon="solar:pen-linear" size={16} />
                      Edit paket
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setToCopy(p)}>
                      <Iconify icon="solar:copy-linear" size={16} />
                      Salin paket
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
                      Hapus paket
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              <div className="flex flex-1 flex-col px-5 pt-4 pb-5">
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 font-mono text-xs leading-none font-bold text-foreground/75">
                    <Iconify icon="solar:hashtag-linear" size={12} />
                    {p.code}
                  </span>
                  {p.source === 'SOLUTEST' && (
                    <StatusPill tone="secondary" icon="solar:import-linear">
                      Solutest
                    </StatusPill>
                  )}
                  {p.question_count === 0 && (
                    <StatusPill tone="warning" icon="solar:danger-circle-linear">
                      Belum ada soal
                    </StatusPill>
                  )}
                </div>
                <Link
                  href={paths.paketDetail(p.id)}
                  className="mt-3 rounded-sm after:absolute after:inset-0 after:content-[''] focus-visible:outline-none"
                >
                  <h3 className="line-clamp-2 text-[1.05rem] leading-snug font-bold transition-colors group-hover/paket:text-primary">
                    {p.title}
                  </h3>
                </Link>

                <dl className="mt-4 grid grid-cols-3 divide-x divide-border rounded-xl bg-muted/70 py-2.5 text-center">
                  {[
                    { label: 'Soal', value: p.question_count, icon: 'solar:document-text-linear' },
                    { label: 'Menit', value: p.time, icon: 'solar:clock-circle-linear' },
                    {
                      label: 'Jadwal',
                      value: p.schedule_count,
                      icon: 'solar:calendar-mark-linear',
                    },
                  ].map((m) => (
                    <div key={m.label} className="px-2">
                      <dt className="flex items-center justify-center gap-1 text-[0.7rem] font-semibold text-muted-foreground">
                        <Iconify icon={m.icon} size={13} />
                        {m.label}
                      </dt>
                      <dd className="mt-0.5 text-base font-bold tabular-nums">{m.value}</dd>
                    </div>
                  ))}
                </dl>

                <p className="mt-auto flex items-center gap-1.5 pt-4 text-xs text-muted-foreground">
                  <Iconify icon="solar:refresh-circle-linear" size={14} />
                  Diperbarui {formatShortDate(p.updatedAt)}
                  {p.schedule_count > 0 && (
                    <span className="ml-auto inline-flex items-center gap-1 font-semibold text-success">
                      <span className="size-1.5 rounded-full bg-success" />
                      Terpakai
                    </span>
                  )}
                </p>
              </div>
            </article>
          );
        })}
      </div>

      {query.data && query.data.pagination.total_items > 0 && (
        <div className="mt-6 rounded-card bg-card shadow-card">
          <TablePagination meta={query.data.pagination} onPageChange={(page) => setF({ page })} />
        </div>
      )}

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
        open={Boolean(toCopy)}
        onOpenChange={(open) => !open && setToCopy(null)}
        icon="solar:copy-linear"
        title="Salin paket soal?"
        description={`Paket "${toCopy?.title}" beserta seluruh soalnya akan disalin menjadi paket baru dengan kode baru.`}
        confirmLabel="Ya, salin"
        loading={duplicatePackage.isPending}
        onConfirm={() =>
          toCopy && duplicatePackage.mutate(toCopy.id, { onSuccess: () => setToCopy(null) })
        }
      />
      <CatalogDialog
        open={catalogOpen}
        onOpenChange={setCatalogOpen}
        onImported={(pkg) => router.push(paths.paketDetail(pkg.id))}
      />
    </>
  );
}
