'use client';

import type { ReactNode } from 'react';

import { Fragment, useState } from 'react';

import { Skeleton } from 'src/components/ui/skeleton';
import {
  Table,
  TableRow,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
} from 'src/components/ui/table';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';
import { EmptyState } from 'src/components/feedback/empty-state';
import { ErrorState } from 'src/components/feedback/error-state';

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  align?: 'left' | 'center' | 'right';
  className?: string;
  /** sembunyikan di layar kecil */
  hideOnMobile?: boolean;
}

interface Props<T> {
  columns: Column<T>[];
  rows: T[] | undefined;
  rowKey: (row: T) => string | number;
  loading?: boolean;
  error?: unknown;
  onRetry?: () => void;
  empty?: { title: string; description?: string; icon?: string; action?: ReactNode };
  onRowClick?: (row: T) => void;
  /** baris bisa dibuka (detail di bawah baris) */
  renderExpanded?: (row: T) => ReactNode;
  skeletonRows?: number;
  className?: string;
}

const alignClass = (align?: Column<unknown>['align']) =>
  align === 'right' ? 'text-right' : align === 'center' ? 'text-center' : 'text-left';

/** Tabel data generik: loading skeleton, error + coba lagi, kosong, baris dapat dibuka. */
export function DataTable<T>({
  columns,
  rows,
  rowKey,
  loading,
  error,
  onRetry,
  empty = { title: 'Belum ada data' },
  onRowClick,
  renderExpanded,
  skeletonRows = 6,
  className,
}: Props<T>) {
  const [expanded, setExpanded] = useState<Set<string | number>>(new Set());
  const colCount = columns.length + (renderExpanded ? 1 : 0);

  const toggle = (key: string | number) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });

  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {renderExpanded && <TableHead className="w-10" aria-label="Buka detail" />}
            {columns.map((col) => (
              <TableHead
                key={col.key}
                className={cn(
                  'whitespace-nowrap',
                  alignClass(col.align),
                  col.hideOnMobile && 'hidden md:table-cell',
                  col.className
                )}
              >
                {col.header}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading &&
            Array.from({ length: skeletonRows }, (_, i) => (
              <TableRow key={`sk-${i}`} className="hover:bg-transparent">
                {Array.from({ length: colCount }, (__, j) => (
                  <TableCell key={j} className="py-4">
                    <Skeleton className="h-4 w-full max-w-36" />
                  </TableCell>
                ))}
              </TableRow>
            ))}

          {!loading && Boolean(error) && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colCount}>
                <ErrorState error={error} onRetry={onRetry} />
              </TableCell>
            </TableRow>
          )}

          {!loading && !error && rows?.length === 0 && (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={colCount}>
                <EmptyState {...empty} />
              </TableCell>
            </TableRow>
          )}

          {!loading &&
            !error &&
            rows?.map((row, index) => {
              const key = rowKey(row);
              const isOpen = expanded.has(key);
              return (
                <Fragment key={key}>
                  <TableRow
                    onClick={onRowClick ? () => onRowClick(row) : undefined}
                    className={cn(
                      'group/row',
                      (onRowClick || renderExpanded) && 'cursor-pointer',
                      isOpen && 'bg-primary/[0.04] hover:bg-primary/[0.04]'
                    )}
                  >
                    {renderExpanded && (
                      <TableCell className="w-10 py-3">
                        <button
                          type="button"
                          aria-expanded={isOpen}
                          aria-label={isOpen ? 'Tutup detail' : 'Buka detail'}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggle(key);
                          }}
                          className={cn(
                            'grid size-8 place-items-center rounded-full transition-colors hover:bg-primary/10 hover:text-primary',
                            isOpen &&
                              'bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground'
                          )}
                        >
                          <Iconify
                            icon="solar:alt-arrow-down-linear"
                            size={16}
                            className={cn('transition-transform', isOpen && 'rotate-180')}
                          />
                        </button>
                      </TableCell>
                    )}
                    {columns.map((col) => (
                      <TableCell
                        key={col.key}
                        className={cn(
                          'py-3.5 text-sm text-foreground/90',
                          alignClass(col.align),
                          col.hideOnMobile && 'hidden md:table-cell',
                          col.className
                        )}
                      >
                        {col.cell(row, index)}
                      </TableCell>
                    ))}
                  </TableRow>
                  {renderExpanded && isOpen && (
                    <TableRow className="bg-primary/[0.025] hover:bg-primary/[0.025]">
                      <TableCell colSpan={colCount} className="p-0">
                        <div className="px-4 py-4 md:px-12">{renderExpanded(row)}</div>
                      </TableCell>
                    </TableRow>
                  )}
                </Fragment>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
