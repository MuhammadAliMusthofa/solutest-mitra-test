// Siswa tenant (daftar + import batch), guru (CRUD), dan daftar sekolah (mode mock).

import type { MockAccount } from '../db';
import type { MockContext } from '../utils';
import type { TeacherBody, MitraStudent, MitraTeacher, ImportStudentRow } from 'src/models/member';

import { ROLES } from 'src/config/roles';

import { getPredicate } from 'src/utils/predicate';

import { STUDENTS } from '../data';
import { loadDb, nextId, mutateDb, MOCK_PASSWORD } from '../db';
import { studentPointsOf, mockSchoolOptions } from './analytics';
import { fail, matches, paginate, requireUser, schoolScope, PANEL_ROLES } from '../utils';

// ------------------------------------------------------------------ sekolah
export const listSchools = (ctx: MockContext) => {
  const user = requireUser(ctx, PANEL_ROLES);
  return mockSchoolOptions(schoolScope(user));
};

// ------------------------------------------------------------------ siswa
const accountToStudent = (a: MockAccount): MitraStudent => ({
  id: a.id,
  name: a.full_name,
  email: a.email,
  nisn: a.nisn ?? null,
  school: a.school_name ?? '-',
  class: a.class_name ?? null,
  jenjang: a.jenjang ?? null,
  total_tryout: loadDb().attempts.filter((t) => t.user_email === a.email && t.submitted_at).length,
  last_score: null,
  last_predicate: null,
  created_at: a.created_at,
});

export const listStudents = (ctx: MockContext) => {
  requireUser(ctx, [ROLES.admin]);
  const { search, page, per_page, jenjang } = ctx.query;
  const accounts = loadDb()
    .accounts.filter((a) => a.role === ROLES.siswa)
    .map(accountToStudent);
  const dataset: MitraStudent[] = STUDENTS.map((s) => {
    const scores = studentPointsOf(s).map((p) => p.score);
    const last = scores.length ? scores[scores.length - 1] : null;
    return {
      id: s.id,
      name: s.name,
      email: s.email,
      nisn: s.nisn,
      school: s.school.name,
      class: s.class,
      jenjang: s.school.level,
      total_tryout: scores.length,
      last_score: last,
      last_predicate: last === null ? null : getPredicate(last),
      created_at: '2026-07-01',
    };
  });
  const rows = [...accounts, ...dataset]
    .filter((s) => matches(`${s.name} ${s.email} ${s.nisn ?? ''} ${s.school}`, search))
    .filter((s) => !jenjang || s.jenjang === jenjang);
  return paginate(rows, page, per_page);
};

export const importStudents = (ctx: MockContext) => {
  requireUser(ctx, [ROLES.admin]);
  const rows = (ctx.body?.students ?? []) as ImportStudentRow[];
  if (rows.length > 1000) fail(422, 'Maksimal 1000 baris per import');
  return mutateDb((db) => {
    const existing = new Set([
      ...db.accounts.map((a) => a.email.toLowerCase()),
      ...STUDENTS.map((s) => s.email.toLowerCase()),
    ]);
    const errors: { row: number; email: string; message: string }[] = [];
    let created = 0;
    rows.forEach((row, i) => {
      const email = row.email.trim().toLowerCase();
      if (existing.has(email)) {
        errors.push({ row: i + 1, email, message: 'Email sudah terdaftar' });
        return;
      }
      existing.add(email);
      created += 1;
      db.accounts.push({
        id: nextId(db),
        email,
        password: row.password || MOCK_PASSWORD,
        role: ROLES.siswa,
        full_name: row.name,
        phone: null,
        address: null,
        image_profile: null,
        created_at: new Date().toISOString().slice(0, 10),
        nisn: row.nisn || null,
        school_name: row.school,
        class_name: row.class || null,
        jenjang: row.jenjang || null,
      });
    });
    return { created, skipped: errors.length, errors };
  });
};

// ------------------------------------------------------------------ guru
const toTeacher = (a: MockAccount): MitraTeacher => {
  const schools = mockSchoolOptions();
  return {
    id: a.id,
    name: a.full_name,
    email: a.email,
    phone: a.phone,
    subject: a.subject ?? null,
    schools: schools.filter((s) => (a.school_ids ?? []).includes(s.id)),
    status: a.status ?? 'active',
    created_at: a.created_at,
  };
};

export const listTeachers = (ctx: MockContext) => {
  requireUser(ctx, [ROLES.admin]);
  const { search, status, page, per_page } = ctx.query;
  const rows = loadDb()
    .accounts.filter((a) => a.role === ROLES.guru)
    .map(toTeacher)
    .filter((t) => matches(`${t.name} ${t.email} ${t.subject ?? ''}`, search))
    .filter((t) => !status || t.status === status)
    .sort((a, b) => b.id - a.id);
  return paginate(rows, page, per_page);
};

const validateTeacher = (body: TeacherBody, creating: boolean, excludeId?: number) => {
  if (!body.name?.trim()) fail(422, 'Nama guru wajib diisi');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email ?? '')) fail(422, 'Format email tidak valid');
  if (!body.school_ids?.length) fail(422, 'Pilih minimal satu sekolah');
  if (creating && (body.password ?? '').length < 8) fail(422, 'Password minimal 8 karakter');
  const taken = loadDb().accounts.some(
    (a) => a.email.toLowerCase() === body.email.toLowerCase() && a.id !== excludeId
  );
  if (taken) fail(422, 'Email sudah dipakai akun lain');
};

export const createTeacher = (ctx: MockContext) => {
  requireUser(ctx, [ROLES.admin]);
  const body = ctx.body as TeacherBody;
  validateTeacher(body, true);
  return mutateDb((db) => {
    const account: MockAccount = {
      id: nextId(db),
      email: body.email.trim().toLowerCase(),
      password: body.password!,
      role: ROLES.guru,
      full_name: body.name.trim(),
      phone: body.phone || null,
      address: null,
      image_profile: null,
      created_at: new Date().toISOString().slice(0, 10),
      subject: body.subject || null,
      school_ids: body.school_ids,
      status: body.status ?? 'active',
    };
    db.accounts.push(account);
    return toTeacher(account);
  });
};

export const updateTeacher = (ctx: MockContext) => {
  requireUser(ctx, [ROLES.admin]);
  const id = Number(ctx.params.id);
  const body = ctx.body as TeacherBody;
  validateTeacher(body, false, id);
  return mutateDb((db) => {
    const account = db.accounts.find((a) => a.id === id && a.role === ROLES.guru);
    if (!account) return fail(404, 'Guru tidak ditemukan');
    Object.assign(account, {
      full_name: body.name.trim(),
      email: body.email.trim().toLowerCase(),
      phone: body.phone || null,
      subject: body.subject || null,
      school_ids: body.school_ids,
      status: body.status ?? account.status,
      ...(body.password ? { password: body.password } : {}),
    });
    return toTeacher(account);
  });
};

export const deleteTeacher = (ctx: MockContext) => {
  requireUser(ctx, [ROLES.admin]);
  const id = Number(ctx.params.id);
  return mutateDb((db) => {
    const index = db.accounts.findIndex((a) => a.id === id && a.role === ROLES.guru);
    if (index < 0) return fail(404, 'Guru tidak ditemukan');
    db.accounts.splice(index, 1);
    return { deleted: true };
  });
};
