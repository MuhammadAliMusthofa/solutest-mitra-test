'use client';

import { useState, useEffect } from 'react';

import { cn } from 'src/lib/utils';

import { Iconify } from 'src/components/iconify/iconify';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** jeda debounce sebelum onChange (ms) */
  delay?: number;
  className?: string;
}

/** Input pencarian dengan debounce; nilai eksternal tetap sinkron (mis. dari URL). */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Cari…',
  delay = 350,
  className,
}: Props) {
  const [text, setText] = useState(value);

  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value);
  }

  useEffect(() => {
    if (text === value) return undefined;
    const id = setTimeout(() => onChange(text), delay);
    return () => clearTimeout(id);
  }, [text, value, delay, onChange]);

  return (
    <label
      className={cn(
        'flex h-10 w-full items-center gap-2 rounded-lg border border-input bg-background px-3 transition-shadow focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15 sm:w-64',
        className
      )}
    >
      <Iconify icon="solar:magnifer-linear" size={18} className="text-muted-foreground" />
      <input
        type="search"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground [&::-webkit-search-cancel-button]:hidden"
      />
      {text && (
        <button
          type="button"
          aria-label="Hapus pencarian"
          onClick={() => {
            setText('');
            onChange('');
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <Iconify icon="solar:close-circle-linear" size={18} />
        </button>
      )}
    </label>
  );
}
