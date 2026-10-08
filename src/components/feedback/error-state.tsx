'use client';

import { Button } from 'src/components/ui/button';

import { errorMessage } from 'src/core/http';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

interface Props {
  error?: unknown;
  title?: string;
  onRetry?: () => void;
  className?: string;
}

/** Tampilan gagal memuat data + tombol coba lagi. */
export function ErrorState({ error, title = 'Gagal memuat data', onRetry, className }: Props) {
  return (
    <div
      role="alert"
      className={cn('flex flex-col items-center gap-2 px-6 py-10 text-center', className)}
    >
      <span className="relative mb-2 grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <span
          aria-hidden
          className="absolute -inset-2.5 rounded-[1.4rem] ring-1 ring-destructive/10"
        />
        <Iconify icon="solar:danger-triangle-linear" size={28} />
      </span>
      <p className="text-base font-bold">{title}</p>
      {error ? (
        <p className="max-w-md text-sm text-muted-foreground">{errorMessage(error)}</p>
      ) : null}
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
          <Iconify icon="solar:refresh-linear" size={16} />
          Coba lagi
        </Button>
      )}
    </div>
  );
}
