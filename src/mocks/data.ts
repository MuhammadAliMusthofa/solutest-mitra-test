// Dataset analitik deterministik untuk mode mock (NEXT_PUBLIC_MOCK=true).
// Semua handler analitik diturunkan dari dataset ini agar filter `code` konsisten antar halaman.

import type { TryoutOption } from 'src/models/analytics';
import type { TryoutSchedule } from 'src/models/schedule';

const seeded = (seed: number) => {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
};

export const rand = seeded(20261005);
const between = (min: number, max: number) => min + rand() * (max - min);
const pick = <T>(list: T[]) => list[Math.floor(rand() * list.length)];
const round1 = (n: number) => Math.round(n * 10) / 10;
const clamp = (n: number) => Math.max(5, Math.min(98, n));

export const SUBJECTS = [
  { code: 'mat', name: 'Matematika', short: 'MAT' },
  { code: 'bind', name: 'B. Indonesia', short: 'BIN' },
  { code: 'bing', name: 'B. Inggris', short: 'BIG' },
];

const REGIONS = [
  { id: '31', name: 'DKI Jakarta', lat: -6.2088, lng: 106.8456 },
  { id: '32', name: 'Jawa Barat', lat: -6.9175, lng: 107.6191 },
  { id: '33', name: 'Jawa Tengah', lat: -7.0051, lng: 110.4381 },
  { id: '35', name: 'Jawa Timur', lat: -7.2504, lng: 112.7688 },
  { id: '36', name: 'Banten', lat: -6.1201, lng: 106.1503 },
];

export const TRYOUTS: TryoutOption[] = [
  {
    code: 'SLT-418203-TKA',
    name: 'Tryout TKA #1 — Juli',
    start_date: '2026-07-12',
    end_date: '2026-07-13',
    status: 'finished',
    participants: 0,
  },
  {
    code: 'SLT-552710-TKA',
    name: 'Tryout TKA #2 — Agustus',
    start_date: '2026-08-09',
    end_date: '2026-08-10',
    status: 'finished',
    participants: 0,
  },
  {
    code: 'SLT-630915-TKA',
    name: 'Tryout TKA #3 — September',
    start_date: '2026-09-13',
    end_date: '2026-09-14',
    status: 'finished',
    participants: 0,
  },
  {
    code: 'SLT-771046-TKA',
    name: 'Tryout TKA #4 — Oktober',
    start_date: '2026-10-04',
    end_date: '2026-10-06',
    status: 'ongoing',
    participants: 0,
  },
];

export interface MockSchool {
  id: number;
  name: string;
  city: string;
  level: string;
  region: (typeof REGIONS)[number];
  base: number;
  growth: number;
}

const SCHOOL_NAMES = [
  'SMA Negeri 1',
  'SMA Negeri 3',
  'SMA Negeri 8',
  'SMA Labschool',
  'SMA Kristen Petra',
  'SMA Muhammadiyah 2',
  'SMA Al-Azhar',
  'SMK Negeri 4',
  'SMA Taruna Bakti',
  'SMA Santa Ursula',
  'SMA Negeri 5',
  'SMK Telkom',
];
const CITIES: Record<string, string[]> = {
  '31': ['Jakarta Selatan', 'Jakarta Timur'],
  '32': ['Bandung', 'Bekasi'],
  '33': ['Semarang', 'Solo'],
  '35': ['Surabaya', 'Malang'],
  '36': ['Tangerang', 'Serang'],
};

export const SCHOOLS: MockSchool[] = SCHOOL_NAMES.map((name, i) => {
  const region = REGIONS[i % REGIONS.length];
  const city = pick(CITIES[region.id]);
  return {
    id: 101 + i,
    name: `${name} ${city}`,
    city,
    level: name.startsWith('SMK') ? 'SMK' : 'SMA',
    region,
    base: between(45, 72),
    growth: between(-3, 5),
  };
});

const FIRST = [
  'Adit',
  'Bunga',
  'Citra',
  'Dimas',
  'Eka',
  'Fajar',
  'Gita',
  'Hana',
  'Ilham',
  'Joko',
  'Kirana',
  'Lutfi',
  'Maya',
  'Nanda',
  'Oki',
  'Putri',
  'Raka',
  'Salsa',
  'Tegar',
  'Wulan',
];
const LAST = [
  'Pratama',
  'Saputra',
  'Lestari',
  'Wijaya',
  'Hidayat',
  'Nugroho',
  'Permata',
  'Kusuma',
  'Ramadhan',
  'Anggraini',
];

export interface MockStudent {
  id: number;
  name: string;
  email: string;
  nisn: string;
  school: MockSchool;
  class: string;
  /** skor per tryout (index sama dengan TRYOUTS); null = tidak ikut */
  scores: ({ total: number; subjects: number[]; duration: number; done: boolean } | null)[];
}

export const STUDENTS: MockStudent[] = Array.from({ length: 72 }, (_, i) => {
  const school = SCHOOLS[i % SCHOOLS.length];
  const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 7) % LAST.length]}`;
  const talent = between(-12, 14);
  const personalGrowth = school.growth + between(-4, 4);
  const scores = TRYOUTS.map((tryout, t) => {
    if (rand() < 0.12) return null;
    const subjects = SUBJECTS.map(() =>
      round1(clamp(school.base + talent + personalGrowth * t + between(-9, 9)))
    );
    const total = round1(subjects.reduce((a, b) => a + b, 0) / subjects.length);
    const done = tryout.status === 'finished' || rand() > 0.3;
    return { total, subjects, duration: Math.round(between(2400, 5400)), done };
  });
  return {
    id: 5001 + i,
    name,
    email: `${name.toLowerCase().replace(/\s+/g, '.')}${i}@tegal.sch.id`,
    nisn: String(1000000000 + Math.floor(rand() * 899999999)),
    school,
    class: pick(['XII IPA 1', 'XII IPA 2', 'XII IPS 1', 'XI IPA 1']),
    scores,
  };
});

TRYOUTS.forEach((tryout, t) => {
  tryout.participants = STUDENTS.filter((s) => s.scores[t]).length;
});

export const SCHEDULES: TryoutSchedule[] = TRYOUTS.map((tryout, i) => ({
  id: 9001 + i,
  code: tryout.code,
  title: tryout.name,
  package_id: 7001 + i,
  package_title: `Paket TKA SMA Paket ${String.fromCharCode(65 + i)}`,
  package_code: `PKT-${(7001 + i).toString(36).toUpperCase()}`,
  start_date: `${tryout.start_date} 08:00:00`,
  end_date: `${tryout.end_date} 17:00:00`,
  duration: 120,
  is_cheat_detection: true,
  participants: tryout.participants,
  status: tryout.status,
}));

export const QUESTION_BANK = Array.from({ length: 30 }, (_, i) => {
  const subject = SUBJECTS[i % SUBJECTS.length];
  const benar = Math.round(between(15, 88));
  const kosong = Math.round(between(0, 12));
  const salah = Math.max(0, 100 - benar - kosong);
  return {
    id: 300 + i,
    code: `${subject.short}-${String(i + 1).padStart(3, '0')}`,
    subject: subject.name,
    question_text: `<p>Soal ${subject.name} nomor ${i + 1}: Tentukan jawaban yang paling tepat berdasarkan informasi berikut.</p>`,
    pembahasan: `<p>Pembahasan soal ${i + 1}: gunakan konsep dasar ${subject.name.toLowerCase()} dan eliminasi opsi yang tidak sesuai.</p>`,
    benar,
    salah,
    kosong,
  };
});

export const COMPETENCIES = [
  { id: 1, name: 'Bilangan & Aljabar', subject: 'Matematika' },
  { id: 2, name: 'Geometri & Pengukuran', subject: 'Matematika' },
  { id: 3, name: 'Membaca Pemahaman', subject: 'B. Indonesia' },
  { id: 4, name: 'Kebahasaan', subject: 'B. Indonesia' },
  { id: 5, name: 'Reading Comprehension', subject: 'B. Inggris' },
];

export const helpers = { between, pick, round1, clamp, REGIONS };

export const TENANT_NAME = 'Dinas Pendidikan Kota Tegal';
