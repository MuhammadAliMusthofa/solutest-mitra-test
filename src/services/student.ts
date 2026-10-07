// Siswa: tryout, pengerjaan (mulai/simpan/lanjutkan/kumpulkan), riwayat, leaderboard, wilayah.

import type { RegionOption } from 'src/models/user';
import type { StudentTryout } from 'src/models/schedule';
import type {
  Leaderboard,
  ExamSession,
  Explanation,
  HistoryList,
  SavedAnswer,
  SubmitResult,
  TryoutDetail,
  ViolationBody,
  AnswerPayloadItem,
  PerformanceReport,
  UnfinishedPractice,
  LeaderboardTryoutOption,
} from 'src/models/exam';

import { api } from 'src/core/http';

const P = '/student/practices';

export const studentTryoutService = {
  list: () => api.get<StudentTryout[]>('/student/tryouts'),
  detail: (code: string) => api.get<TryoutDetail>(`/student/tryouts/${encodeURIComponent(code)}`),
  start: (code: string) =>
    api.post<ExamSession>(`/student/tryouts/${encodeURIComponent(code)}/start`),
};

export const practiceService = {
  unfinished: () => api.get<UnfinishedPractice[]>(`${P}/unfinished`),
  resume: (practiceId: number) => api.get<ExamSession>(`${P}/${practiceId}/resume`),
  savedAnswers: (practiceId: number) => api.get<SavedAnswer[]>(`${P}/${practiceId}/answers`),
  saveAnswers: (practiceId: number, answers: AnswerPayloadItem[]) =>
    api.post<unknown>(`${P}/${practiceId}/answers`, { answers }),
  submit: (practiceId: number, answers: AnswerPayloadItem[]) =>
    api.post<SubmitResult>(`${P}/${practiceId}/submit`, { answers }),
  violation: (practiceId: number, body: ViolationBody) =>
    api.post<unknown>(`${P}/${practiceId}/violations`, body),
  explanation: (practiceId: number | string) =>
    api.get<Explanation>(`${P}/${practiceId}/explanation`),
  report: (practiceId: number | string) => api.get<PerformanceReport>(`${P}/${practiceId}/report`),
  history: (p: { page?: number; per_page?: number }) => api.get<HistoryList>('/student/history', p),
};

export const leaderboardService = {
  options: () => api.get<LeaderboardTryoutOption[]>('/student/leaderboard/options'),
  list: (packageId: number, p: { search?: string; page?: number }) =>
    api.get<Leaderboard>(`/student/leaderboard/${packageId}`, p),
};

export const regionService = {
  provinces: () => api.get<RegionOption[]>('/regions/provinces'),
  cities: (provinceId?: number | null) =>
    api.get<RegionOption[]>('/regions/cities', { province_id: provinceId ?? undefined }),
  schools: (cityId?: number | null, search?: string) =>
    api.get<RegionOption[]>('/regions/schools', { city_id: cityId ?? undefined, search }),
};
