'use client';

import type { PaginationMeta } from 'src/models/api';

import { Button } from 'src/components/ui/button';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

interface Props {
  meta?: PaginationMeta;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Halaman yang ditampilkan: 1 … 4 5 6 … 12 */
const pageWindow = (current: number, total: number): (number | '…')[] => {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  return sorted.flatMap((p, i) => (i > 0 && p - sorted[i - 1] > 1 ? (['…', p] as const) : [p]));
};

export function TablePagination({ meta, onPageChange, className }: Props) {
  if (!meta || meta.total_items === 0) return null;
  const { current_page: page, total_pages: total, per_page: size, total_items: count } = meta;
  const from = (page - 1) * size + 1;
  const to = Math.min(page * size, count);

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-between gap-3 px-5 py-4 text-sm text-muted-foreground sm:flex-row md:px-6',
        className
      )}
    >
      <p>
        Menampilkan <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> dari{' '}
        <span className="font-medium text-foreground">{count.toLocaleString('id-ID')}</span>
      </p>
      {total > 1 && (
        <nav aria-label="Paginasi" className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Halaman sebelumnya"
          >
            <Iconify icon="solar:alt-arrow-left-linear" size={16} />
          </Button>
          {pageWindow(page, total).map((p, i) =>
            p === '…' ? (
              <span key={`gap-${i}`} className="px-1">
                …
              </span>
            ) : (
              <Button
                key={p}
                variant={p === page ? 'default' : 'ghost'}
                size="icon-sm"
                aria-current={p === page ? 'page' : undefined}
                onClick={() => onPageChange(p)}
                className="tabular-nums"
              >
                {p}
              </Button>
            )
          )}
          <Button
            variant="ghost"
            size="icon-sm"
            disabled={page >= total}
            onClick={() => onPageChange(page + 1)}
            aria-label="Halaman berikutnya"
          >
            <Iconify icon="solar:alt-arrow-right-linear" size={16} />
          </Button>
        </nav>
      )}
    </div>
  );
}
