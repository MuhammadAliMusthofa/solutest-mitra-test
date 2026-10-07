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
      <span className="mb-1 grid size-14 place-items-center rounded-full bg-primary/8 text-primary">
        <Iconify icon={icon} size={28} />
      </span>
      <p className="font-semibold text-foreground">{title}</p>
      {description && <p className="max-w-sm text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
