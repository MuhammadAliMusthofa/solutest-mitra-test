// Analitik & progres (admin & guru). Semua endpoint menerima `code` opsional (kosong = semua
// tryout tenant). Scope guru (sekolah yang diampu) diterapkan backend dari JWT.

import type { Paginated } from 'src/models/api';
import type {
  ProgressListParams,
  SchoolProgressItem,
  StudentProgressItem,
  SchoolProgressDetail,
  StudentProgressDetail,
} from 'src/models/progress';
import type {
  RegionData,
  MapLocation,
  TryoutOption,
  DashboardKpi,
  CategoryChart,
  PracticeDetail,
  CompetencyNode,
  SampleQuestion,
  AnalyticsParams,
  RegionalSummary,
  RegionalHeatmap,
  IndicatorFilters,
  IndicatorSummary,
  SchoolRankingItem,
  DashboardCompletion,
  DashboardDistribusi,
  DashboardTopStudent,
  ItemAnalysisResponse,
  StudentDetailResponse,
  SchoolSubjectsResponse,
  DashboardRataRataMapel,
  RegionalSchoolsResponse,
} from 'src/models/analytics';

import { api } from 'src/core/http';

const A = '/analytics';

export const analyticsService = {
  tryoutOptions: () => api.get<TryoutOption[]>(`${A}/tryout-options`),

  kpi: (p: AnalyticsParams) => api.get<DashboardKpi>(`${A}/dashboard/kpi`, p),
  participantTrend: (p: AnalyticsParams) =>
    api.get<CategoryChart>(`${A}/dashboard/participant-trend`, p),
  scoreDistribution: (p: AnalyticsParams) =>
    api.get<DashboardDistribusi>(`${A}/dashboard/score-distribution`, p),
  subjectAverage: (p: AnalyticsParams) =>
    api.get<DashboardRataRataMapel>(`${A}/dashboard/subject-average`, p),
  completion: (p: AnalyticsParams) => api.get<DashboardCompletion>(`${A}/dashboard/completion`, p),
  answerSummary: (p: AnalyticsParams) => api.get<CategoryChart>(`${A}/dashboard/answer-summary`, p),
  topStudents: (p: AnalyticsParams) =>
    api.get<DashboardTopStudent[]>(`${A}/dashboard/top-students`, p),

  schoolRanking: (p: AnalyticsParams) =>
    api.get<Paginated<SchoolRankingItem>>(`${A}/schools/ranking`, p),
  schoolSubjects: (id: number, p: AnalyticsParams) =>
    api.get<SchoolSubjectsResponse>(`${A}/schools/${id}/subjects`, p),

  students: (p: AnalyticsParams) => api.get<StudentDetailResponse>(`${A}/students`, p),
  practice: (practiceId: number | string) =>
    api.get<PracticeDetail>(`${A}/practices/${practiceId}`),

  regionalSummary: (p: AnalyticsParams) => api.get<RegionalSummary>(`${A}/regional/summary`, p),
  regionalMap: (p: AnalyticsParams) =>
    api.get<{ locations: MapLocation[] }>(`${A}/regional/map`, p).then((r) => r.locations),
  regionalRegions: (p: AnalyticsParams) =>
    api.get<{ regions: RegionData[] }>(`${A}/regional/regions`, p).then((r) => r.regions),
  regionalHeatmap: (p: AnalyticsParams) => api.get<RegionalHeatmap>(`${A}/regional/heatmap`, p),
  regionalSchools: (p: AnalyticsParams) =>
    api.get<RegionalSchoolsResponse>(`${A}/regional/schools`, p),

  items: (p: AnalyticsParams) => api.get<ItemAnalysisResponse>(`${A}/items`, p),

  indicatorFilters: () => api.get<IndicatorFilters>(`${A}/indicators/filters`),
  indicatorSummary: (p: AnalyticsParams) => api.get<IndicatorSummary>(`${A}/indicators/summary`, p),
  indicatorHierarchy: (p: AnalyticsParams) =>
    api
      .get<{ competencies: CompetencyNode[] }>(`${A}/indicators/hierarchy`, p)
      .then((r) => r.competencies),
  indicatorQuestions: (ids: number[]) =>
    api.get<SampleQuestion[]>(`${A}/indicators/questions`, { question_ids: ids.join(',') }),
};

export const progressService = {
  schools: (p: ProgressListParams) =>
    api.get<Paginated<SchoolProgressItem>>('/progress/schools', p),
  school: (id: number | string) => api.get<SchoolProgressDetail>(`/progress/schools/${id}`),
  students: (p: ProgressListParams) =>
    api.get<Paginated<StudentProgressItem>>('/progress/students', p),
  student: (id: number | string) => api.get<StudentProgressDetail>(`/progress/students/${id}`),
};
