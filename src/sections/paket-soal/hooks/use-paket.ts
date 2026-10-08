'use client';

import type { ListParams } from 'src/models/api';
import type { PackageBody, QuestionBody } from 'src/models/question';

import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { errorMessage } from 'src/core/http';

import { paketService, masterService } from 'src/services/paket';

const KEY = 'paket';

/** Master Solutest; kompetensi butuh kelas & mapel paket → sub kompetensi butuh kompetensi. */
export function useMasterData(filter?: {
  class_id?: number;
  subject_id?: number;
  competency_id?: number;
}) {
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
    competencies: useQuery({
      queryKey: ['master', 'competencies', filter?.class_id, filter?.subject_id],
      queryFn: () =>
        masterService.competencies({
          class_id: filter?.class_id,
          subject_id: filter?.subject_id,
        }),
      enabled: Boolean(filter?.class_id && filter?.subject_id),
      staleTime: Infinity,
    }),
    subCompetencies: useQuery({
      queryKey: ['master', 'sub-competencies', filter?.competency_id],
      queryFn: () => masterService.subCompetencies({ competency_id: filter?.competency_id }),
      enabled: Boolean(filter?.competency_id),
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
    removeQuestions: useMutation({
      mutationFn: ({ paketId, ids }: { paketId: string; ids: number[] }) =>
        paketService.removeQuestions(paketId, { question_ids: ids }),
      onSuccess: (_, v) => {
        toast.success(`${v.ids.length} soal dihapus dari paket`);
        refresh();
      },
      onError,
    }),
    duplicatePackage: useMutation({
      mutationFn: (id: number) => paketService.duplicate(id),
      onSuccess: (pkg) => {
        toast.success(`Paket disalin sebagai "${pkg.title}"`);
        refresh();
      },
      onError,
    }),
  };
}
