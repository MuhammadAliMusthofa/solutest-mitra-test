'use client';

import type { MitraSchool, CirclSchool } from 'src/models/member';

import { toast } from 'sonner';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { Input } from 'src/components/ui/input';
import { Label } from 'src/components/ui/label';
import { Button } from 'src/components/ui/button';
import {
  Dialog,
  DialogTitle,
  DialogFooter,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from 'src/components/ui/dialog';

import { errorMessage } from 'src/core/http';

import { usePanel } from 'src/hooks/use-panel';
import { useUrlState } from 'src/hooks/use-url-state';

import { formatNumber } from 'src/utils/format';

import { schoolService } from 'src/services/member';

import { Iconify } from 'src/components/iconify/iconify';
import { SearchInput } from 'src/components/form/search-input';
import { SelectField } from 'src/components/form/select-field';
import { EmptyState } from 'src/components/feedback/empty-state';
import { ErrorState } from 'src/components/feedback/error-state';
import { DataTable } from 'src/components/data-display/data-table';
import { FilterBar } from 'src/components/data-display/filter-bar';
import { StatusPill } from 'src/components/data-display/status-pill';
import { PageHeader } from 'src/components/data-display/page-header';
import type { Column } from 'src/components/data-display/data-table';
import { ConfirmDialog } from 'src/components/feedback/confirm-dialog';
import { SectionCard } from 'src/components/data-display/section-card';
import { TablePagination } from 'src/components/data-display/table-pagination';

const LEVELS = ['SD', 'SMP', 'SMA', 'SMK', 'SLB'];

/** Cari sekolah se-Indonesia (data circl) lalu tambahkan ke mitra. */
function AddSchoolDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [q, setQ] = useState('');
  const [level, setLevel] = useState('');
  const [page, setPage] = useState(1);
  const params = { q, level, page, per_page: 8 };
  const query = useQuery({
    queryKey: ['member', 'circl', params],
    queryFn: () => schoolService.search(params),
    enabled: open && q.trim().length >= 3,
    placeholderData: keepPreviousData,
  });
  const add = useMutation({
    mutationFn: (s: CirclSchool) => schoolService.add(s),
    onSuccess: (s) => {
      toast.success(`${s.name} ditambahkan`);
      qc.invalidateQueries({ queryKey: ['member'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Tambah sekolah</DialogTitle>
          <DialogDescription>
            Cari dari data sekolah se-Indonesia (nama atau NPSN, minimal 3 karakter).
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchInput
            value={q}
            onChange={(v) => {
              setQ(v);
              setPage(1);
            }}
            placeholder="mis. SMA Negeri 1 Tegal / 20325xxx"
          />
          <SelectField
            aria-label="Jenjang"
            value={level}
            onChange={(v) => {
              setLevel(v);
              setPage(1);
            }}
            options={LEVELS.map((l) => ({ value: l, label: l }))}
            allLabel="Semua jenjang"
            className="sm:w-40"
          />
        </div>
        {q.trim().length < 3 && (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Ketik nama sekolah atau NPSN untuk mencari.
          </p>
        )}
        {query.isFetching && !query.data && (
          <p className="py-8 text-center text-sm text-muted-foreground">Mencari…</p>
        )}
        {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
        {query.data?.data.length === 0 && (
          <EmptyState title="Sekolah tidak ditemukan" icon="solar:buildings-2-linear" />
        )}
        <ul className="space-y-2">
          {query.data?.data.map((s) => (
            <li key={s.ref_id} className="flex items-start gap-3 rounded-xl p-3 ring-1 ring-border">
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{s.name}</p>
                <p className="text-xs text-muted-foreground">
                  {[
                    s.npsn && `NPSN ${s.npsn}`,
                    s.education_level,
                    s.status,
                    s.district_name,
                    s.city_name,
                    s.province_name,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              {s.mitra_school_id ? (
                <StatusPill tone="success" icon="solar:check-circle-linear">
                  Sudah ada
                </StatusPill>
              ) : (
                <Button
                  size="sm"
                  disabled={add.isPending}
                  onClick={() => add.mutate(s, { onSuccess: () => query.refetch() })}
                >
                  {add.isPending && add.variables?.ref_id === s.ref_id ? (
                    <Iconify icon="svg-spinners:180-ring" size={16} />
                  ) : (
                    <Iconify icon="solar:add-circle-linear" size={16} />
                  )}
                  Tambah
                </Button>
              )}
            </li>
          ))}
        </ul>
        <TablePagination meta={query.data?.pagination} onPageChange={setPage} className="px-0" />
      </DialogContent>
    </Dialog>
  );
}

/** Atur koordinat sekolah (dipakai peta analitik regional). */
function LocationDialog({ school, onClose }: { school: MitraSchool | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [lat, setLat] = useState('');
  const [lng, setLng] = useState('');
  const [prev, setPrev] = useState<MitraSchool | null>(null);
  if (school !== prev) {
    setPrev(school);
    setLat(school?.latitude?.toString() ?? '');
    setLng(school?.longitude?.toString() ?? '');
  }
  const latN = lat.trim() === '' ? null : Number(lat);
  const lngN = lng.trim() === '' ? null : Number(lng);
  const invalid =
    (latN === null) !== (lngN === null) ||
    (latN !== null && !(latN >= -90 && latN <= 90)) ||
    (lngN !== null && !(lngN >= -180 && lngN <= 180));
  const save = useMutation({
    mutationFn: () => schoolService.updateLocation(school!.id, { latitude: latN, longitude: lngN }),
    onSuccess: () => {
      toast.success('Lokasi sekolah disimpan');
      qc.invalidateQueries({ queryKey: ['member'] });
      onClose();
    },
    onError: (err) => toast.error(errorMessage(err)),
  });
  return (
    <Dialog open={Boolean(school)} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Lokasi {school?.name}</DialogTitle>
          <DialogDescription>
            Koordinat dipakai peta Analisis Regional. Salin dari Google Maps (klik kanan → angka
            koordinat). Kosongkan keduanya untuk menghapus.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="loc-lat">Latitude</Label>
            <Input
              id="loc-lat"
              inputMode="decimal"
              value={lat}
              onChange={(e) => setLat(e.target.value)}
              placeholder="-6.8694"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="loc-lng">Longitude</Label>
            <Input
              id="loc-lng"
              inputMode="decimal"
              value={lng}
              onChange={(e) => setLng(e.target.value)}
              placeholder="109.1402"
            />
          </div>
        </div>
        {invalid && (
          <p className="text-xs text-destructive">
            Isi keduanya dengan angka valid (latitude −90..90, longitude −180..180).
          </p>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button disabled={invalid || save.isPending} onClick={() => save.mutate()}>
            {save.isPending && <Iconify icon="svg-spinners:180-ring" size={16} />}
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SekolahContainer() {
  const qc = useQueryClient();
  const { paths } = usePanel();
  const [f, setF] = useUrlState({ search: '', education_level: '', page: '1' });
  const params = {
    search: f.search,
    education_level: f.education_level,
    page: Number(f.page),
    per_page: 10,
  };
  const query = useQuery({
    queryKey: ['member', 'schools', 'list', params],
    queryFn: () => schoolService.list(params),
    placeholderData: keepPreviousData,
  });
  const [addOpen, setAddOpen] = useState(false);
  const [toDelete, setToDelete] = useState<MitraSchool | null>(null);
  const [locating, setLocating] = useState<MitraSchool | null>(null);
  const remove = useMutation({
    mutationFn: (id: number) => schoolService.remove(id),
    onSuccess: () => {
      toast.success('Sekolah dihapus dari mitra');
      setToDelete(null);
      qc.invalidateQueries({ queryKey: ['member'] });
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  const columns: Column<MitraSchool>[] = [
    {
      key: 'name',
      header: 'Sekolah',
      cell: (s) => (
        <div className="min-w-56">
          <p className="font-semibold">{s.name}</p>
          <p className="text-xs text-muted-foreground">
            {[s.npsn && `NPSN ${s.npsn}`, s.level].filter(Boolean).join(' · ') || '-'}
          </p>
        </div>
      ),
    },
    {
      key: 'region',
      header: 'Wilayah',
      hideOnMobile: true,
      cell: (s) => (
        <div className="text-xs">
          <p>{[s.district_name, s.city, s.province_name].filter(Boolean).join(', ') || '-'}</p>
          {s.latitude === null && <p className="text-muted-foreground">Koordinat belum ada</p>}
        </div>
      ),
    },
    { key: 'guru', header: 'Guru', align: 'right', cell: (s) => formatNumber(s.total_guru) },
    { key: 'siswa', header: 'Siswa', align: 'right', cell: (s) => formatNumber(s.total_siswa) },
    {
      key: 'actions',
      header: '',
      align: 'right',
      cell: (s) => (
        <div className="flex justify-end gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Atur lokasi ${s.name}`}
            onClick={() => setLocating(s)}
          >
            <Iconify icon="solar:map-point-linear" size={17} />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label={`Hapus ${s.name}`}
            onClick={() => setToDelete(s)}
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
        title="Sekolah"
        description="Sekolah yang diikutkan mitra. Guru & siswa dihubungkan ke salah satu sekolah ini."
        crumbs={[
          { label: 'Ringkasan', href: paths.root },
          { label: 'Kelola' },
          { label: 'Sekolah' },
        ]}
        actions={
          <Button onClick={() => setAddOpen(true)}>
            <Iconify icon="solar:add-circle-linear" size={18} />
            Tambah sekolah
          </Button>
        }
      />
      <SectionCard flush>
        <FilterBar>
          <SearchInput
            value={f.search}
            onChange={(search) => setF({ search })}
            placeholder="Cari nama sekolah…"
          />
          <SelectField
            aria-label="Filter jenjang"
            value={f.education_level}
            onChange={(education_level) => setF({ education_level })}
            options={LEVELS.map((l) => ({ value: l, label: l }))}
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
            empty={{
              title: 'Belum ada sekolah',
              icon: 'solar:buildings-2-linear',
              action: <Button onClick={() => setAddOpen(true)}>Tambah sekolah</Button>,
            }}
          />
          <TablePagination meta={query.data?.pagination} onPageChange={(page) => setF({ page })} />
        </div>
      </SectionCard>
      <AddSchoolDialog open={addOpen} onOpenChange={setAddOpen} />
      <LocationDialog school={locating} onClose={() => setLocating(null)} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        onOpenChange={(v) => !v && setToDelete(null)}
        tone="danger"
        title="Hapus sekolah dari mitra?"
        description={`${toDelete?.name} tidak bisa dihapus bila masih ada guru/siswa aktif.`}
        confirmLabel="Hapus"
        loading={remove.isPending}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </>
  );
}
