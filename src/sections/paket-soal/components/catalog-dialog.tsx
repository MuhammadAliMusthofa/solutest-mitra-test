'use client';

import type { Package, CatalogPackage } from 'src/models/question';

import { toast } from 'sonner';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient, keepPreviousData } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';
import {
  Dialog,
  DialogIcon,
  DialogTitle,
  DialogHeader,
  DialogContent,
  DialogDescription,
} from 'src/components/ui/dialog';

import { errorMessage } from 'src/core/http';

import { catalogService } from 'src/services/paket';

import { Iconify } from 'src/components/iconify/iconify';
import { SearchInput } from 'src/components/form/search-input';
import { EmptyState } from 'src/components/feedback/empty-state';
import { ErrorState } from 'src/components/feedback/error-state';
import { StatusPill } from 'src/components/data-display/status-pill';
import { HtmlContent } from 'src/components/data-display/html-content';
import { TablePagination } from 'src/components/data-display/table-pagination';

const PAGE_SIZE = 8;

/**
 * Katalog paket Solutest yang dibagikan ke mitra. "Ambil" menyalin paket beserta soalnya ke mitra
 * (bisa diedit tanpa mengubah paket asli). Soal di luar 4 tipe yang didukung dilewati.
 */
export function CatalogDialog({
  open,
  onOpenChange,
  onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported?: (pkg: Package) => void;
}) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const params = { search, page, per_page: PAGE_SIZE };
  const query = useQuery({
    queryKey: ['paket', 'catalog', params],
    queryFn: () => catalogService.list(params),
    enabled: open,
    placeholderData: keepPreviousData,
  });
  const importing = useMutation({
    mutationFn: (pkg: CatalogPackage) => catalogService.import(pkg.id),
    onSuccess: (pkg) => {
      qc.invalidateQueries({ queryKey: ['paket'] });
      qc.invalidateQueries({ queryKey: ['schedule', 'package-options'] });
      toast.success(
        pkg.skipped_question > 0
          ? `Paket disalin (${pkg.question_count} soal, ${pkg.skipped_question} soal tipe lain dilewati)`
          : `Paket disalin dengan ${pkg.question_count} soal`
      );
      onOpenChange(false);
      onImported?.(pkg);
    },
    onError: (err) => toast.error(errorMessage(err)),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogIcon>
            <Iconify icon="solar:import-linear" size={24} />
          </DialogIcon>
          <DialogTitle>Ambil paket dari Solutest</DialogTitle>
          <DialogDescription>
            Paket disalin ke mitra beserta soalnya, lalu bisa diedit dan dijadwalkan. Paket asli di
            Solutest tidak berubah.
          </DialogDescription>
        </DialogHeader>
        <SearchInput
          value={search}
          onChange={(value) => {
            setSearch(value);
            setPage(1);
          }}
          placeholder="Cari judul paket…"
        />
        {query.isPending && (
          <p className="py-10 text-center text-sm text-muted-foreground">Memuat katalog…</p>
        )}
        {query.isError && <ErrorState error={query.error} onRetry={() => query.refetch()} />}
        {query.data?.data.length === 0 && (
          <EmptyState
            title="Belum ada paket yang dibagikan"
            description="Paket Solutest muncul di sini setelah dibagikan ke mitra oleh tim Solutest."
            icon="solar:box-linear"
          />
        )}
        <ul className="space-y-3">
          {query.data?.data.map((p) => (
            <li key={p.id} className="flex items-start gap-3 rounded-xl p-4 ring-1 ring-border">
              <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-secondary/10 text-secondary">
                <Iconify icon="solar:box-linear" size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs text-muted-foreground">
                  {[p.subject_name, p.class_name && `Kelas ${p.class_name}`, p.category_name]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                {p.description && (
                  <HtmlContent
                    html={p.description}
                    className="mt-1 line-clamp-2 text-xs text-muted-foreground"
                  />
                )}
                <div className="mt-2 flex flex-wrap gap-2">
                  <StatusPill>{p.total_question} soal</StatusPill>
                  {p.time ? <StatusPill>{p.time} menit</StatusPill> : null}
                </div>
              </div>
              <Button
                size="sm"
                disabled={importing.isPending}
                onClick={() => importing.mutate(p)}
                aria-label={`Ambil paket ${p.title}`}
              >
                {importing.isPending && importing.variables?.id === p.id ? (
                  <Iconify icon="svg-spinners:180-ring" size={16} />
                ) : (
                  <Iconify icon="solar:import-linear" size={16} />
                )}
                Ambil
              </Button>
            </li>
          ))}
        </ul>
        <TablePagination meta={query.data?.pagination} onPageChange={setPage} className="px-0" />
      </DialogContent>
    </Dialog>
  );
}
