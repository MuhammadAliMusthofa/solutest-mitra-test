'use client';

import {
  Select,
  SelectItem,
  SelectValue,
  SelectContent,
  SelectTrigger,
} from 'src/components/ui/select';

import { cn } from 'src/lib/utils';

export interface Option {
  value: string;
  label: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  options: Option[];
  placeholder?: string;
  /** opsi "semua" bernilai '' (Radix Select tidak menerima value kosong, dipetakan ke '__all') */
  allLabel?: string;
  className?: string;
  disabled?: boolean;
  id?: string;
  'aria-label'?: string;
  invalid?: boolean;
}

const ALL = '__all';

/** Select sederhana berbasis Radix untuk filter & form (nilai '' = semua/kosong). */
export function SelectField({
  value,
  onChange,
  options,
  placeholder = 'Pilih…',
  allLabel,
  className,
  disabled,
  id,
  invalid,
  ...rest
}: Props) {
  return (
    <Select
      value={value === '' ? (allLabel ? ALL : undefined) : value}
      onValueChange={(v) => onChange(v === ALL ? '' : v)}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        aria-label={rest['aria-label']}
        aria-invalid={invalid}
        className={cn('w-full sm:w-52', className)}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allLabel && <SelectItem value={ALL}>{allLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
