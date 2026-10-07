// Paket soal, soal, master data, dan jadwal tryout (admin & guru).

import type { Paginated, ListParams } from 'src/models/api';
import type { TryoutSchedule, CreateTryoutScheduleBody } from 'src/models/schedule';
import type {
  Package,
  Question,
  ClassOption,
  PackageBody,
  QuestionBody,
  PackageDetail,
  PackageOption,
  ChapterOption,
  SubjectOption,
  CategoryOption,
  GenerateQuestionsBody,
} from 'src/models/question';

import { api } from 'src/core/http';

export const masterService = {
  classes: () => api.get<ClassOption[]>('/master/classes'),
  subjects: () => api.get<SubjectOption[]>('/master/subjects'),
  categories: () => api.get<CategoryOption[]>('/master/categories'),
  chapters: (p: { class_id?: number; subject_id?: number }) =>
    api.get<ChapterOption[]>('/master/chapters', p),
};

export const paketService = {
  list: (p: ListParams) => api.get<Paginated<Package>>('/packages', p),
  options: () => api.get<PackageOption[]>('/packages/options'),
  detail: (id: number | string) => api.get<PackageDetail>(`/packages/${id}`),
  create: (body: PackageBody) => api.post<Package>('/packages', body),
  update: (id: number, body: PackageBody) => api.put<Package>(`/packages/${id}`, body),
  remove: (id: number) => api.delete<unknown>(`/packages/${id}`),

  question: (paketId: number | string, questionId: number | string) =>
    api.get<Question>(`/packages/${paketId}/questions/${questionId}`),
  createQuestion: (paketId: number | string, body: QuestionBody) =>
    api.post<Question>(`/packages/${paketId}/questions`, body),
  updateQuestion: (paketId: number | string, questionId: number | string, body: QuestionBody) =>
    api.put<Question>(`/packages/${paketId}/questions/${questionId}`, body),
  removeQuestion: (paketId: number | string, questionId: number) =>
    api.delete<unknown>(`/packages/${paketId}/questions/${questionId}`),
  generate: (paketId: number | string, body: GenerateQuestionsBody) =>
    api.post<PackageDetail>(`/packages/${paketId}/generate`, body),
};

export const scheduleService = {
  list: (p: ListParams & { status?: string }) =>
    api.get<Paginated<TryoutSchedule>>('/schedules', p),
  create: (body: CreateTryoutScheduleBody) => api.post<TryoutSchedule>('/schedules', body),
  remove: (id: number) => api.delete<unknown>(`/schedules/${id}`),
};
