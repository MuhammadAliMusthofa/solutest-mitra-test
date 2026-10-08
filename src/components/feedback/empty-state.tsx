import type { ReactNode } from 'react';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

interface Props {
  title: string;
  description?: ReactNode;
  icon?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon = 'solar:inbox-line-linear',
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-2 px-6 py-12 text-center',
        className
      )}
    >
      <span className="relative mb-2 grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <span aria-hidden className="absolute -inset-2.5 rounded-[1.4rem] ring-1 ring-primary/10" />
        <Iconify icon={icon} size={30} />
      </span>
      <p className="text-base font-bold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
