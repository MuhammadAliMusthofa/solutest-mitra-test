import { Avatar, AvatarImage, AvatarFallback } from 'src/components/ui/avatar';

import { cn } from 'src/lib/utils';
import { initials } from 'src/utils/format';

interface Props {
  name?: string | null;
  src?: string | null;
  size?: number;
  className?: string;
  /** titik hijau status online */
  online?: boolean;
}

export function UserAvatar({ name, src, size = 40, className, online }: Props) {
  return (
    <span className="relative inline-flex shrink-0">
      <Avatar className={cn('shrink-0', className)} style={{ width: size, height: size }}>
        {src ? <AvatarImage src={src} alt={name ?? ''} className="object-cover" /> : null}
        <AvatarFallback
          className="bg-primary/10 font-semibold text-primary"
          style={{ fontSize: Math.max(11, size * 0.36) }}
        >
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      {online && (
        <span className="absolute top-0 right-0 size-2.5 rounded-full border-2 border-card bg-success" />
      )}
    </span>
  );
}
