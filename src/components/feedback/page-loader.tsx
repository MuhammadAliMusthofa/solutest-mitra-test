import { cn } from 'src/lib/utils';

interface Props {
  fullscreen?: boolean;
  label?: string;
  className?: string;
}

/** Indikator muat halaman (fallback Suspense & guard). */
export function PageLoader({ fullscreen, label = 'Memuat…', className }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center gap-3 text-sm text-muted-foreground',
        fullscreen ? 'min-h-dvh' : 'min-h-[40vh]',
        className
      )}
    >
      <span className="relative flex size-10">
        <span className="absolute inset-0 rounded-full border-4 border-primary/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary motion-reduce:animate-none" />
      </span>
      <span>{label}</span>
    </div>
  );
}
