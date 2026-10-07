'use client';

import type { IconProps } from '@iconify/react';

import { Icon } from '@iconify/react';

import { cn } from 'src/lib/utils';

export interface IconifyProps extends Omit<IconProps, 'width' | 'height'> {
  /** ukuran ikon dalam px (default 20) */
  size?: number;
}

/** Ikon Iconify (set `solar:*` dipakai di seluruh aplikasi, sama dengan fe-solutest). */
export function Iconify({ size = 20, className, ...props }: IconifyProps) {
  return (
    <Icon
      width={size}
      height={size}
      aria-hidden={props['aria-label'] ? undefined : true}
      className={cn('inline-block shrink-0', className)}
      {...props}
    />
  );
}
