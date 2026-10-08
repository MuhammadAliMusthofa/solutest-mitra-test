// Anggota mitra: sekolah (circl), guru, siswa (+ import), kuota.
// Admin memakai prefix /admin; guru /teacher (backend membatasi ke sekolah guru).

import type { MitraUser } from 'src/models/auth';
import type { Paginated, ListParams } from 'src/models/api';
import type {
  Quota,
  CirclSchool,
  MitraSchool,
  StudentBody,
  TeacherBody,
  MitraStudent,
  MitraTeacher,
  SchoolOption,
  ImportStudentRow,
  MitraStudentList,
  StudentListParams,
  UpdateStudentBody,
  ImportStudentResult,
} from 'src/models/member';

import type { Panel } from 'src/config/roles';

import { api } from 'src/core/http';

import { normalizePredicate } from 'src/utils/predicate';

interface BeStudent extends MitraUser {
  total_tryout?: number;
  last_score?: number | null;
  last_predicate?: string | null;
  last_submitted_at?: string | null;
}

interface BeSchool {
  id: number;
  ref_id: string | null;
  name: string;
  npsn: string | null;
  education_level: string | null;
  province_name: string | null;
  city_name: string | null;
  district_name: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  total_guru: number;
  total_siswa: number;
  createdAt: string;
}

const toStudent = (u: BeStudent): MitraStudent => ({
  id: u.id,
  name: u.full_name,
  email: u.email,
  phone: u.phone,
  nisn: u.nisn,
  school_id: u.school_id,
  school: u.school_name ?? '-',
  class: u.class_name,
  jenjang: u.education_level ?? null,
  is_active: u.is_active,
  total_tryout: u.total_tryout ?? 0,
  last_score: u.last_score ?? null,
  last_predicate: normalizePredicate(u.last_predicate),
  last_submitted_at: u.last_submitted_at ?? null,
  created_at: u.createdAt,
});

const toTeacher = (u: MitraUser): MitraTeacher => ({
  id: u.id,
  name: u.full_name,
  email: u.email,
  phone: u.phone,
  school_id: u.school_id,
  school_name: u.school_name,
  status: u.is_active ? 'active' : 'inactive',
  created_at: u.createdAt,
});

const toSchool = (s: BeSchool): MitraSchool => ({
  id: s.id,
  ref_id: s.ref_id,
  name: s.name,
  npsn: s.npsn,
  city: s.city_name ?? '',
  level: s.education_level ?? '',
  province_name: s.province_name,
  district_name: s.district_name,
  address: s.address,
  latitude: s.latitude ?? null,
  longitude: s.longitude ?? null,
  total_guru: s.total_guru,
  total_siswa: s.total_siswa,
  created_at: s.createdAt,
});

const mapPage = <A, B>(page: Paginated<A>, fn: (a: A) => B): Paginated<B> => ({
  ...page,
  data: page.data.map(fn),
});

const prefix = (panel: Panel) => (panel === 'admin' ? '/admin' : '/teacher');

const studentBody = (b: StudentBody) => ({
  email: b.email.trim().toLowerCase(),
  full_name: b.name.trim(),
  ...(b.password ? { password: b.password } : {}),
  ...(b.phone ? { phone: b.phone } : {}),
  ...(b.nisn ? { nisn: b.nisn } : {}),
  ...(b.class ? { class_name: b.class } : {}),
  ...(b.school_id ? { school_id: b.school_id } : {}),
});

export const schoolService = {
  /** Sekolah mitra (paginasi) untuk halaman Sekolah. */
  list: (p: ListParams & { education_level?: string }) =>
    api.get<Paginated<BeSchool>>('/admin/schools', p).then((r) => mapPage(r, toSchool)),
  /** Cari sekolah se-Indonesia (circl) untuk ditambahkan. */
  search: (p: { q?: string; level?: string; page?: number; per_page?: number }) =>
    api.get<Paginated<CirclSchool>>('/admin/schools/search', p),
  add: (s: CirclSchool) =>
    api
      .post<BeSchool>('/admin/schools', {
        ref_id: s.ref_id,
        ...(s.npsn ? { npsn: s.npsn } : { name: s.name }),
      })
      .then(toSchool),
  remove: (id: number) => api.delete<unknown>(`/admin/schools/${id}`),
  /** Koordinat untuk peta analitik regional (null = kosongkan). */
  updateLocation: (id: number, body: { latitude: number | null; longitude: number | null }) =>
    api.patch<BeSchool>(`/admin/schools/${id}/location`, body).then(toSchool),
};

export const memberService = {
  /** Semua sekolah mitra (pilihan di form guru/siswa/jadwal). */
  schools: () =>
    api
      .get<Paginated<BeSchool>>('/admin/schools', { per_page: 100 })
      .then((r): SchoolOption[] => r.data.map(toSchool)),
  quota: () => api.get<Quota>('/admin/quota'),

  students: (panel: Panel, p: StudentListParams) =>
    api
      .get<Paginated<BeStudent>>(`${prefix(panel)}/students`, p)
      .then((r): MitraStudentList => mapPage(r, toStudent)),
  createStudent: (panel: Panel, body: StudentBody) =>
    api
      .post<BeStudent>(`${prefix(panel)}/students`, studentBody(body))
      .then((u) => ({ ...toStudent(u), is_new_account: Boolean(u.is_new_account) })),
  updateStudent: (panel: Panel, id: number, body: UpdateStudentBody) =>
    api
      .put<BeStudent>(panel === 'admin' ? `/admin/users/${id}` : `/teacher/students/${id}`, {
        ...(body.nisn !== undefined ? { nisn: body.nisn || null } : {}),
        ...(body.class !== undefined ? { class_name: body.class || null } : {}),
        ...(panel === 'admin' && body.school_id ? { school_id: body.school_id } : {}),
      })
      .then(toStudent),
  setStudentActive: (panel: Panel, id: number, isActive: boolean) =>
    api.patch<unknown>(
      panel === 'admin' ? `/admin/users/${id}/status` : `/teacher/students/${id}/status`,
      { is_active: isActive }
    ),
  /**
   * Import maks. 200 baris per request (batas backend); `schoolId` = sekolah bawaan baris tanpa
   * sekolah (admin). Guru: sekolah selalu sekolah guru.
   */
  importStudents: (
    panel: Panel,
    rows: (ImportStudentRow & { school_id?: number })[],
    schoolId?: number
  ) =>
    api.post<ImportStudentResult>(`${prefix(panel)}/students/import`, {
      ...(panel === 'admin' && schoolId ? { school_id: schoolId } : {}),
      students: rows.map((r) =>
        studentBody({
          name: r.name,
          email: r.email,
          password: r.password,
          phone: r.phone,
          nisn: r.nisn,
          class: r.class,
          school_id: panel === 'admin' ? r.school_id : undefined,
        })
      ),
    }),

  teachers: (p: ListParams & { status?: string; school_id?: string | number }) =>
    api
      .get<Paginated<MitraUser>>('/admin/teachers', {
        search: p.search,
        page: p.page,
        per_page: p.per_page,
        school_id: p.school_id,
        is_active: p.status ? p.status === 'active' : undefined,
      })
      .then((r) => mapPage(r, toTeacher)),
  createTeacher: (body: TeacherBody) =>
    api
      .post<MitraUser>('/admin/teachers', {
        email: body.email.trim().toLowerCase(),
        full_name: body.name.trim(),
        school_id: body.school_id,
        ...(body.password ? { password: body.password } : {}),
        ...(body.phone ? { phone: body.phone } : {}),
      })
      .then((u) => ({ ...toTeacher(u), is_new_account: Boolean(u.is_new_account) })),
  /** Nama & email dikelola di akun Solutest; admin hanya memindah sekolah guru. */
  updateTeacher: (id: number, body: { school_id: number }) =>
    api.put<MitraUser>(`/admin/users/${id}`, body).then(toTeacher),
  setTeacherActive: (id: number, isActive: boolean) =>
    api.patch<unknown>(`/admin/users/${id}/status`, { is_active: isActive }),
};
