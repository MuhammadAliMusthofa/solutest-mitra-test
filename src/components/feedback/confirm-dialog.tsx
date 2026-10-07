'use client';

import type { ReactNode } from 'react';

import { Button } from 'src/components/ui/button';
import {
  AlertDialog,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogDescription,
} from 'src/components/ui/alert-dialog';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

type Tone = 'default' | 'danger' | 'warning';

interface Props {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  title: string;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string | null;
  tone?: Tone;
  icon?: string;
  loading?: boolean;
  onConfirm: () => void;
  children?: ReactNode;
}

const TONE: Record<Tone, { icon: string; circle: string; button: 'default' | 'destructive' }> = {
  default: {
    icon: 'solar:question-circle-linear',
    circle: 'bg-primary/10 text-primary',
    button: 'default',
  },
  danger: {
    icon: 'solar:trash-bin-trash-linear',
    circle: 'bg-destructive/10 text-destructive',
    button: 'destructive',
  },
  warning: {
    icon: 'solar:danger-triangle-linear',
    circle: 'bg-warning/12 text-warning',
    button: 'default',
  },
};

/**
 * Dialog konfirmasi global (padanan DialogConfirmation fe-solutest).
 * `cancelLabel={null}` + `onOpenChange` no-op → dialog wajib (mis. waktu habis).
 */
export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = 'Ya, lanjutkan',
  cancelLabel = 'Batal',
  tone = 'default',
  icon,
  loading,
  onConfirm,
  children,
}: Props) {
  const t = TONE[tone];
  return (
    <AlertDialog open={open} onOpenChange={(v) => !loading && onOpenChange?.(v)}>
      <AlertDialogContent className="sm:max-w-md">
        <AlertDialogHeader className="items-center text-center sm:items-center sm:text-center">
          <span className={cn('mb-1 grid size-14 place-items-center rounded-full', t.circle)}>
            <Iconify icon={icon ?? t.icon} size={28} />
          </span>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          {description && (
            <AlertDialogDescription className="text-center">{description}</AlertDialogDescription>
          )}
        </AlertDialogHeader>
        {children}
        <AlertDialogFooter className="gap-2 sm:justify-center">
          {cancelLabel !== null && (
            <Button
              variant="outline"
              className="sm:min-w-32"
              disabled={loading}
              onClick={() => onOpenChange?.(false)}
            >
              {cancelLabel}
            </Button>
          )}
          <Button
            variant={t.button === 'destructive' ? 'destructive' : 'default'}
            className={cn(
              'sm:min-w-32',
              t.button === 'destructive' && 'bg-destructive text-white hover:bg-destructive/90'
            )}
            disabled={loading}
            onClick={onConfirm}
          >
            {loading && <Iconify icon="svg-spinners:180-ring" size={16} />}
            {confirmLabel}
          </Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
