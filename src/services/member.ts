// Anggota mitra: siswa (import batch), guru, sekolah.

import type { Paginated, ListParams } from 'src/models/api';
import type {
  TeacherBody,
  SchoolOption,
  MitraTeacher,
  ImportStudentRow,
  MitraStudentList,
  ImportStudentResult,
} from 'src/models/member';

import { api } from 'src/core/http';

export const memberService = {
  schools: () => api.get<SchoolOption[]>('/schools'),

  students: (p: ListParams) => api.get<MitraStudentList>('/students', p),
  importStudents: (rows: ImportStudentRow[]) =>
    api.post<ImportStudentResult>('/students/import', { students: rows }),

  teachers: (p: ListParams & { status?: string }) =>
    api.get<Paginated<MitraTeacher>>('/teachers', p),
  createTeacher: (body: TeacherBody) => api.post<MitraTeacher>('/teachers', body),
  updateTeacher: (id: number, body: TeacherBody) => api.put<MitraTeacher>(`/teachers/${id}`, body),
  removeTeacher: (id: number) => api.delete<unknown>(`/teachers/${id}`),
};
