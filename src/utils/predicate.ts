import type { Predicate } from 'src/models/analytics';

// Ambang predikat sama dengan pantau solutest:
// Kurang < 33.33 ≤ Memadai < 56.67 ≤ Baik < 72.5 ≤ Istimewa
export const getPredicate = (score: number): Predicate => {
  if (score >= 72.5) return 'ISTIMEWA';
  if (score >= 56.67) return 'BAIK';
  if (score >= 33.33) return 'MEMADAI';
  return 'KURANG';
};

export const PREDICATE_ORDER: Predicate[] = ['KURANG', 'MEMADAI', 'BAIK', 'ISTIMEWA'];

export const PREDICATE_LABEL: Record<Predicate, string> = {
  KURANG: 'Kurang',
  MEMADAI: 'Memadai',
  BAIK: 'Baik',
  ISTIMEWA: 'Istimewa',
};

/** Nama predikat versi Inggris (POOR/ADEQUATE/GOOD/EXCELLENT) → versi Indonesia. */
export const normalizePredicate = (value: string): Predicate => {
  const map: Record<string, Predicate> = {
    POOR: 'KURANG',
    ADEQUATE: 'MEMADAI',
    GOOD: 'BAIK',
    EXCELLENT: 'ISTIMEWA',
  };
  return map[value] ?? (value as Predicate);
};
