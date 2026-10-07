'use client';

import { useId, useState } from 'react';

import { Input } from 'src/components/ui/input';

import { isHexColor } from 'src/utils/theme';

interface Props {
  label: string;
  hint?: string;
  value: string;
  onChange: (hex: string) => void;
}

/** Pemilih warna: swatch native + input hex (divalidasi sebelum diterapkan). */
export function ColorField({ label, hint, value, onChange }: Props) {
  const id = useId();
  const [text, setText] = useState(value);
  const [prevValue, setPrevValue] = useState(value);
  if (value !== prevValue) {
    setPrevValue(value);
    setText(value);
  }
  const valid = isHexColor(text);

  return (
    <div className="flex items-center gap-3 rounded-xl p-3 ring-1 ring-border">
      <label
        htmlFor={`${id}-swatch`}
        className="relative size-11 shrink-0 cursor-pointer overflow-hidden rounded-lg ring-1 ring-black/10"
        style={{ background: value }}
      >
        <input
          id={`${id}-swatch`}
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value.toUpperCase())}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
          aria-label={`Pilih ${label}`}
        />
      </label>
      <div className="min-w-0 flex-1">
        <label htmlFor={`${id}-hex`} className="block text-sm font-medium">
          {label}
        </label>
        {hint && <p className="truncate text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Input
        id={`${id}-hex`}
        value={text}
        maxLength={7}
        onChange={(e) => {
          const v = e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}`;
          setText(v.toUpperCase());
          if (isHexColor(v)) onChange(v.toUpperCase());
        }}
        aria-invalid={!valid}
        className="w-28 font-mono text-sm uppercase"
      />
    </div>
  );
}
