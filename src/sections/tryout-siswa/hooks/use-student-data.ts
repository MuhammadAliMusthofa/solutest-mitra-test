'use client';

import { useQuery } from '@tanstack/react-query';

import { practiceService, studentTryoutService } from 'src/services/student';

export const useStudentTryouts = () =>
  useQuery({ queryKey: ['student', 'tryouts'], queryFn: studentTryoutService.list });

export const useUnfinished = () =>
  useQuery({ queryKey: ['student', 'unfinished'], queryFn: practiceService.unfinished });

export const useTryoutDetail = (code: string) =>
  useQuery({
    queryKey: ['student', 'tryout', code],
    queryFn: () => studentTryoutService.detail(code),
  });
