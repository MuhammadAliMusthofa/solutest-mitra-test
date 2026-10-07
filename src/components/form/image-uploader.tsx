'use client';

/* eslint-disable @next/next/no-img-element -- pratinjau unggahan (data URL / storage eksternal) */

import { toast } from 'sonner';
import { useId, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';

import { Button } from 'src/components/ui/button';

import { errorMessage } from 'src/core/http';

import { cn } from 'src/lib/utils';

import { uploadService } from 'src/services/account';

import { Iconify } from 'src/components/iconify/iconify';

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  hint?: string;
  /** bentuk pratinjau */
  shape?: 'square' | 'wide' | 'circle';
  className?: string;
}

const MAX_MB = 2;

/** Unggah gambar (PNG/JPG/WEBP/SVG, maks 2 MB) → URL; dengan pratinjau & hapus. */
export function ImageUploader({
  value,
  onChange,
  label = 'Unggah gambar',
  hint,
  shape = 'square',
  className,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const upload = useMutation({
    mutationFn: uploadService.image,
    onSuccess: (res) => onChange(res.url),
    onError: (err) => toast.error(errorMessage(err)),
  });

  const pick = (file?: File) => {
    if (!file) return;
    if (file.size > MAX_MB * 1024 * 1024) {
      toast.error(`Ukuran file maksimal ${MAX_MB} MB`);
      return;
    }
    upload.mutate(file);
  };

  return (
    <div className={cn('flex flex-wrap items-center gap-4', className)}>
      <div
        className={cn(
          'grid shrink-0 place-items-center overflow-hidden bg-muted ring-1 ring-border',
          shape === 'square' && 'size-24 rounded-xl',
          shape === 'circle' && 'size-24 rounded-full',
          shape === 'wide' && 'h-28 w-48 rounded-xl'
        )}
      >
        {upload.isPending ? (
          <Iconify icon="svg-spinners:180-ring" size={24} className="text-primary" />
        ) : value ? (
          <img src={value} alt="Pratinjau" className="size-full object-contain p-1" />
        ) : (
          <Iconify icon="solar:gallery-add-linear" size={28} className="text-muted-foreground" />
        )}
      </div>
      <div className="space-y-2">
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          className="sr-only"
          onChange={(e) => {
            pick(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={upload.isPending}
          >
            <Iconify icon="solar:upload-linear" size={16} />
            {value ? 'Ganti' : label}
          </Button>
          {value && (
            <Button type="button" variant="ghost" size="sm" onClick={() => onChange(null)}>
              <Iconify icon="solar:trash-bin-trash-linear" size={16} />
              Hapus
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          {hint ?? `PNG, JPG, WEBP, atau SVG · maks ${MAX_MB} MB`}
        </p>
      </div>
    </div>
  );
}
