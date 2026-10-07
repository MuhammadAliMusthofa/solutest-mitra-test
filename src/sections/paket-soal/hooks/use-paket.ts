'use client';

import type { ListParams } from 'src/models/api';
import type { PackageBody, QuestionBody, GenerateQuestionsBody } from 'src/models/question';

import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { errorMessage } from 'src/core/http';

import { paketService, masterService } from 'src/services/paket';

const KEY = 'paket';

export function useMasterData(filter?: { class_id?: number; subject_id?: number }) {
  return {
    classes: useQuery({
      queryKey: ['master', 'classes'],
      queryFn: masterService.classes,
      staleTime: Infinity,
    }),
    subjects: useQuery({
      queryKey: ['master', 'subjects'],
      queryFn: masterService.subjects,
      staleTime: Infinity,
    }),
    categories: useQuery({
      queryKey: ['master', 'categories'],
      queryFn: masterService.categories,
      staleTime: Infinity,
    }),
    chapters: useQuery({
      queryKey: ['master', 'chapters', filter?.class_id, filter?.subject_id],
      queryFn: () => masterService.chapters(filter ?? {}),
      enabled: Boolean(filter?.class_id && filter?.subject_id),
      staleTime: Infinity,
    }),
  };
}

export const usePackages = (params: ListParams) =>
  useQuery({ queryKey: [KEY, 'list', params], queryFn: () => paketService.list(params) });

export const usePackageDetail = (id: string | number) =>
  useQuery({ queryKey: [KEY, 'detail', String(id)], queryFn: () => paketService.detail(id) });

/** Mutasi paket & soal; semua menyegarkan cache paket (dan opsi paket untuk jadwal). */
export function usePaketMutations() {
  const qc = useQueryClient();
  const refresh = () => {
    qc.invalidateQueries({ queryKey: [KEY] });
    qc.invalidateQueries({ queryKey: ['schedule', 'package-options'] });
  };
  const onError = (err: unknown) => toast.error(errorMessage(err));

  return {
    savePackage: useMutation({
      mutationFn: ({ id, body }: { id?: number; body: PackageBody }) =>
        id ? paketService.update(id, body) : paketService.create(body),
      onSuccess: (_, v) => {
        toast.success(v.id ? 'Paket diperbarui' : 'Paket dibuat');
        refresh();
      },
      onError,
    }),
    removePackage: useMutation({
      mutationFn: (id: number) => paketService.remove(id),
      onSuccess: () => {
        toast.success('Paket dihapus');
        refresh();
      },
      onError,
    }),
    saveQuestion: useMutation({
      mutationFn: ({
        paketId,
        questionId,
        body,
      }: {
        paketId: string;
        questionId?: string;
        body: QuestionBody;
      }) =>
        questionId
          ? paketService.updateQuestion(paketId, questionId, body)
          : paketService.createQuestion(paketId, body),
      onSuccess: (_, v) => {
        toast.success(v.questionId ? 'Soal diperbarui' : 'Soal ditambahkan');
        refresh();
      },
      onError,
    }),
    removeQuestion: useMutation({
      mutationFn: ({ paketId, questionId }: { paketId: string; questionId: number }) =>
        paketService.removeQuestion(paketId, questionId),
      onSuccess: () => {
        toast.success('Soal dihapus dari paket');
        refresh();
      },
      onError,
    }),
    generate: useMutation({
      mutationFn: ({ paketId, body }: { paketId: string; body: GenerateQuestionsBody }) =>
        paketService.generate(paketId, body),
      onSuccess: (_, v) => {
        toast.success(`${v.body.count} soal dari bank soal ditambahkan`);
        refresh();
      },
      onError,
    }),
  };
}
