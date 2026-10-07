'use client';

import { useQuery } from '@tanstack/react-query';

import { analyticsService } from 'src/services/analytics';

/** Semua data Ringkasan Utama untuk tryout terpilih (`code` kosong = semua tryout). */
export function useDashboardData(code: string) {
  const p = { code };
  const key = (name: string) => ['analytics', 'dashboard', name, code] as const;
  return {
    kpi: useQuery({ queryKey: key('kpi'), queryFn: () => analyticsService.kpi(p) }),
    trend: useQuery({
      queryKey: key('trend'),
      queryFn: () => analyticsService.participantTrend(p),
    }),
    distribution: useQuery({
      queryKey: key('distribution'),
      queryFn: () => analyticsService.scoreDistribution(p),
    }),
    subjects: useQuery({
      queryKey: key('subjects'),
      queryFn: () => analyticsService.subjectAverage(p),
    }),
    completion: useQuery({
      queryKey: key('completion'),
      queryFn: () => analyticsService.completion(p),
    }),
    answers: useQuery({
      queryKey: key('answers'),
      queryFn: () => analyticsService.answerSummary(p),
    }),
    top: useQuery({ queryKey: key('top'), queryFn: () => analyticsService.topStudents(p) }),
  };
}
