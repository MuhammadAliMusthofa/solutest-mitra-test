import type { Predicate } from 'src/models/analytics';

// Ambang predikat sama dengan be-solutest-mitra (src/lib/predicate.ts):
// Kurang < 55 ≤ Memadai < 70 ≤ Baik < 85 ≤ Istimewa. Backend sudah mengirim `predicate`;
// fungsi ini hanya untuk nilai yang dihitung di klien.
export const getPredicate = (score: number): Predicate => {
  if (score >= 85) return 'ISTIMEWA';
  if (score >= 70) return 'BAIK';
  if (score >= 55) return 'MEMADAI';
  return 'KURANG';
};

export const PREDICATE_ORDER: Predicate[] = ['KURANG', 'MEMADAI', 'BAIK', 'ISTIMEWA'];

export const PREDICATE_LABEL: Record<Predicate, string> = {
  KURANG: 'Kurang',
  MEMADAI: 'Memadai',
  BAIK: 'Baik',
  ISTIMEWA: 'Istimewa',
};

/**
 * Predikat dari backend ("Istimewa", huruf besar/kecil bebas) atau versi Inggris
 * (POOR/ADEQUATE/GOOD/EXCELLENT) → kunci FE. null bila kosong / tidak dikenal.
 */
export const normalizePredicate = (value?: string | null): Predicate | null => {
  if (!value) return null;
  const map: Record<string, Predicate> = {
    POOR: 'KURANG',
    ADEQUATE: 'MEMADAI',
    GOOD: 'BAIK',
    EXCELLENT: 'ISTIMEWA',
  };
  const upper = value.toUpperCase();
  if (map[upper]) return map[upper];
  return PREDICATE_ORDER.includes(upper as Predicate) ? (upper as Predicate) : null;
};
