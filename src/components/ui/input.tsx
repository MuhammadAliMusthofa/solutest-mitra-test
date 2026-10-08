import * as React from "react"
import { cn } from "src/lib/utils"

/** Kelas bersama field teks (Input, Textarea, SelectTrigger) — gaya form-control Spike. */
export const fieldClass =
  "w-full min-w-0 rounded-md border border-input bg-card text-base transition-[border-color,box-shadow,background-color] duration-150 outline-none placeholder:text-muted-foreground/80 hover:border-[color-mix(in_oklab,var(--input),var(--foreground)_18%)] focus-visible:border-primary focus-visible:ring-4 focus-visible:ring-primary/12 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-60 aria-invalid:border-destructive aria-invalid:ring-4 aria-invalid:ring-destructive/12 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        fieldClass,
        "h-11 px-3.5 py-1 file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  )
}

export { Input }
