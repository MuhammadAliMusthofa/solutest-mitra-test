// "Database" simulasi mode mock, disimpan di localStorage agar bertahan setelah refresh dan dipakai
// bersama oleh admin, guru, dan siswa di browser yang sama (mis. jadwal buatan admin langsung bisa
// dikerjakan siswa). Reset lewat tombol "Reset data simulasi" atau resetDb().

import type { TenantBranding } from 'src/models/tenant';
import type { AnswerPayloadItem } from 'src/models/exam';
import type { TryoutSchedule } from 'src/models/schedule';
import type { Question, QuestionType } from 'src/models/question';

import { ROLES } from 'src/config/roles';
import type { Role } from 'src/config/roles';
import { DEFAULT_THEME } from 'src/config/theme';

import { SCHOOLS, SCHEDULES, TENANT_NAME } from './data';
import { buildBankQuestion, MOCK_COMPETENCIES } from './seed';

export const DB_KEY = 'st_mock_db';
// v2: tipe soal disederhanakan menjadi 4 (PG, PG Kompleks, Benar/Salah, Benar/Salah Kompleks)
// v3: bab paket diganti kompetensi & indikator per soal
// v4: tambah sub kompetensi (kompetensi → sub kompetensi → indikator)
const VERSION = 4;
export const MOCK_PASSWORD = 'mitra123';

export interface MockAccount {
  id: number;
  email: string;
  password: string;
  role: Role;
  full_name: string;
  phone: string | null;
  address: string | null;
  image_profile: string | null;
  created_at: string;
  /** guru */
  school_ids?: number[];
  subject?: string | null;
  status?: 'active' | 'inactive';
  /** siswa */
  nisn?: string | null;
  school_name?: string | null;
  class_name?: string | null;
  jenjang?: string | null;
  province_id?: number | null;
  city_id?: number | null;
}

export interface StoredPackage {
  id: number;
  code: string;
  title: string;
  class_id: number;
  subject_id: number;
  question_ids: number[];
  created_by: string;
  createdAt: string;
  updatedAt: string;
}

export interface StoredAttempt {
  practice_id: number;
  schedule_code: string;
  package_id: number;
  user_email: string;
  user_name: string;
  started_at: string;
  submitted_at: string | null;
  /** jawaban terakhir (simpan sementara / kumpulkan) */
  answers: AnswerPayloadItem[];
  score: number | null;
  question_scores: Record<number, number>;
  violations: number;
}

export interface MockDb {
  version: number;
  nextId: number;
  tenant: TenantBranding;
  accounts: MockAccount[];
  packages: StoredPackage[];
  questions: Record<number, Question>;
  schedules: TryoutSchedule[];
  attempts: StoredAttempt[];
}

const pad = (n: number) => String(n).padStart(2, '0');
/** "YYYY-MM-DD HH:mm:ss" waktu lokal, `days` dari hari ini */
const dayAt = (days: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(hour)}:00:00`;
};

export const packageCode = (id: number) => `PKT-${id.toString(36).toUpperCase()}`;

const createInitialDb = (): MockDb => {
  let nextId = 100000;
  const questions: Record<number, Question> = {};
  const now = new Date().toISOString();

  const makePackage = (
    id: number,
    title: string,
    subjectId: number,
    types: QuestionType[],
    code = packageCode(id),
    createdAt = now
  ): StoredPackage => {
    const competencies = MOCK_COMPETENCIES.filter(
      (c) => c.class_id === 12 && c.subject_id === subjectId
    );
    const questionIds = competencies.flatMap((competency, ci) =>
      types.map((type, k) => {
        nextId += 1;
        questions[nextId] = buildBankQuestion(nextId, competency, type, ((ci + k) % 5) + 1);
        return nextId;
      })
    );
    return {
      id,
      code,
      title,
      class_id: 12,
      subject_id: subjectId,
      question_ids: questionIds,
      created_by: 'Admin Dinas Pendidikan',
      createdAt,
      updatedAt: createdAt,
    };
  };

  // Paket untuk tryout historis (dataset analitik) + paket untuk tryout yang sedang berjalan.
  const subjects = [8, 5, 4, 8];
  const packages = SCHEDULES.map((s, i) =>
    makePackage(
      s.package_id,
      s.package_title,
      subjects[i % subjects.length],
      [1, 2, 3, 1, 4],
      s.package_code,
      `${s.start_date.slice(0, 10)}T00:00:00.000Z`
    )
  );
  const live = makePackage(
    7101,
    'Paket TKA Bahasa Indonesia — Semua Tipe Soal',
    5,
    [1, 2, 3, 4, 1, 4]
  );
  const upcoming = makePackage(7102, 'Paket TKA Matematika — November', 8, [1, 1, 2, 3, 4]);
  packages.push(live, upcoming);

  const schedules: TryoutSchedule[] = [
    ...SCHEDULES.map((s) => ({ ...s, status: 'finished' as const })),
    {
      id: 9101,
      code: 'SLT-805512-TKA',
      title: 'Tryout TKA #5 — Simulasi Berjalan',
      package_id: live.id,
      package_title: live.title,
      package_code: live.code,
      start_date: dayAt(-1, 7),
      end_date: dayAt(14, 21),
      duration: 90,
      description: 'Tryout simulasi yang sedang berlangsung — bisa langsung dikerjakan siswa demo.',
      is_cheat_detection: true,
      participants: 0,
      status: 'ongoing',
      created_by: 'Admin Dinas Pendidikan',
    },
    {
      id: 9102,
      code: 'SLT-913377-TKA',
      title: 'Tryout TKA #6 — November',
      package_id: upcoming.id,
      package_title: upcoming.title,
      package_code: upcoming.code,
      start_date: dayAt(20, 8),
      end_date: dayAt(21, 17),
      duration: 120,
      description: '',
      is_cheat_detection: true,
      participants: 0,
      status: 'scheduled',
      created_by: 'Bu Ratna Kusuma',
    },
  ];

  const account = (
    a: Partial<MockAccount> & Pick<MockAccount, 'id' | 'email' | 'role' | 'full_name'>
  ) =>
    ({
      password: MOCK_PASSWORD,
      phone: null,
      address: null,
      image_profile: null,
      created_at: '2026-07-01',
      ...a,
    }) as MockAccount;

  const accounts: MockAccount[] = [
    account({
      id: 1,
      email: 'admin@mitra.test',
      role: ROLES.admin,
      full_name: 'Admin Dinas Pendidikan',
    }),
    account({
      id: 201,
      email: 'guru@mitra.test',
      role: ROLES.guru,
      full_name: 'Bu Ratna Kusuma',
      phone: '081234567801',
      subject: 'Matematika',
      school_ids: [SCHOOLS[0].id, SCHOOLS[1].id, SCHOOLS[2].id],
      status: 'active',
    }),
    account({
      id: 202,
      email: 'pak.hendra@mitra.test',
      role: ROLES.guru,
      full_name: 'Pak Hendra Wijaya',
      phone: '081234567802',
      subject: 'Bahasa Indonesia',
      school_ids: [SCHOOLS[3].id, SCHOOLS[4].id],
      status: 'active',
    }),
    account({
      id: 203,
      email: 'bu.sari@mitra.test',
      role: ROLES.guru,
      full_name: 'Bu Sari Anggraini',
      subject: 'Bahasa Inggris',
      school_ids: [SCHOOLS[5].id],
      status: 'inactive',
    }),
    account({
      id: 5000,
      email: 'siswa@mitra.test',
      role: ROLES.siswa,
      full_name: 'Siswa Mitra Demo',
      nisn: '0051234567',
      school_name: SCHOOLS[0].name,
      class_name: 'XII IPA 1',
      jenjang: SCHOOLS[0].level,
    }),
  ];

  return {
    version: VERSION,
    nextId,
    tenant: {
      id: 'tenant-demo',
      name: TENANT_NAME,
      short_name: 'Disdik Tegal',
      tagline: 'Tryout & analitik hasil belajar siswa Kota Tegal',
      logo_url: null,
      theme: DEFAULT_THEME,
      updated_at: now,
    },
    accounts,
    packages,
    questions,
    schedules,
    attempts: [],
  };
};

let cache: MockDb | null = null;

export const loadDb = (): MockDb => {
  if (cache) return cache;
  try {
    const raw = localStorage.getItem(DB_KEY);
    const parsed = raw ? (JSON.parse(raw) as MockDb) : null;
    cache = parsed?.version === VERSION ? parsed : createInitialDb();
  } catch {
    cache = createInitialDb();
  }
  return cache;
};

export const saveDb = (db: MockDb) => {
  cache = db;
  try {
    localStorage.setItem(DB_KEY, JSON.stringify(db));
  } catch {
    // Kuota penuh (mis. banyak gambar data-URL): tetap jalan di memori untuk sesi ini.
  }
};

/** Ubah db lalu simpan; mengembalikan hasil `fn`. */
export const mutateDb = <T>(fn: (db: MockDb) => T): T => {
  const db = loadDb();
  const result = fn(db);
  saveDb(db);
  return result;
};

export const resetDb = () => {
  cache = null;
  try {
    localStorage.removeItem(DB_KEY);
  } catch {
    // abaikan
  }
};

export const nextId = (db: MockDb) => {
  db.nextId += 1;
  return db.nextId;
};
