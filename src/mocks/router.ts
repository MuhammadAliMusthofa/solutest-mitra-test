// Tabel route mode mock. Path = kontrak API (docs/api-contract.md), relatif ke NEXT_PUBLIC_API_URL.

import type { MockContext } from './utils';

import * as student from './handlers/student';
import * as account from './handlers/account';
import * as members from './handlers/members';
import * as packages from './handlers/packages';
import * as analytics from './handlers/analytics';
import { requireUser, schoolScope, PANEL_ROLES } from './utils';

type Handler = (ctx: MockContext) => unknown;

interface Route {
  method: string;
  pattern: RegExp;
  keys: string[];
  handle: Handler;
}

const route = (method: string, template: string, handle: Handler): Route => {
  const keys: string[] = [];
  const source = template.replace(/:([a-zA-Z]+)/g, (_, key: string) => {
    keys.push(key);
    return '([^/]+)';
  });
  return { method, pattern: new RegExp(`^${source}$`), keys, handle };
};

/** Param analitik + scope sekolah (guru hanya melihat sekolah yang diampu). */
const scoped = (ctx: MockContext) => {
  const user = requireUser(ctx, PANEL_ROLES);
  const q = ctx.query;
  return {
    ...q,
    page: q.page ? Number(q.page) : undefined,
    per_page: q.per_page ? Number(q.per_page) : undefined,
    school_ids: schoolScope(user),
  } as analytics.ScopedParams & { status?: never };
};

const progressParams = (ctx: MockContext) => {
  const p = scoped(ctx);
  return { ...p, status: ctx.query.status as never };
};

const ROUTES: Route[] = [
  // ---------- auth & akun
  route('POST', '/auth/login', account.login),
  route('POST', '/auth/refresh', account.refresh),
  route('POST', '/auth/logout', () => ({ logout: true })),
  route('GET', '/tenant/branding', account.getBranding),
  route('PUT', '/tenant/branding', account.updateBranding),
  route('GET', '/me', account.getProfile),
  route('PUT', '/me', account.updateProfile),
  route('POST', '/me/password', account.changePassword),
  route('POST', '/uploads', account.upload),
  route('POST', '/mock/reset', packages.resetSimulation),

  // ---------- analitik (admin & guru)
  route('GET', '/analytics/tryout-options', (ctx) => {
    requireUser(ctx, PANEL_ROLES);
    return analytics.mockTryoutList();
  }),
  route('GET', '/analytics/dashboard/kpi', (ctx) => analytics.mockKpi(scoped(ctx))),
  route('GET', '/analytics/dashboard/participant-trend', (ctx) => analytics.mockTrend(scoped(ctx))),
  route('GET', '/analytics/dashboard/score-distribution', (ctx) =>
    analytics.mockDistribusi(scoped(ctx))
  ),
  route('GET', '/analytics/dashboard/subject-average', (ctx) =>
    analytics.mockRataRataMapel(scoped(ctx))
  ),
  route('GET', '/analytics/dashboard/completion', (ctx) => analytics.mockCompletion(scoped(ctx))),
  route('GET', '/analytics/dashboard/answer-summary', (ctx) => {
    scoped(ctx);
    return analytics.mockRingkasanSoal();
  }),
  route('GET', '/analytics/dashboard/top-students', (ctx) =>
    analytics.mockTopStudents(scoped(ctx))
  ),
  route('GET', '/analytics/schools/ranking', (ctx) => analytics.mockSchoolRanking(scoped(ctx))),
  route('GET', '/analytics/schools/:id/subjects', (ctx) =>
    analytics.mockSchoolSubjects(Number(ctx.params.id), scoped(ctx))
  ),
  route('GET', '/analytics/students', (ctx) => analytics.mockStudentDetail(scoped(ctx))),
  route('GET', '/analytics/practices/:id', (ctx) => {
    scoped(ctx);
    return analytics.mockPracticeDetail(Number(ctx.params.id));
  }),
  route('GET', '/analytics/regional/summary', (ctx) => analytics.mockRegionalSummary(scoped(ctx))),
  route('GET', '/analytics/regional/map', (ctx) => ({
    locations: analytics.mockRegionalMap(scoped(ctx)),
  })),
  route('GET', '/analytics/regional/regions', (ctx) => ({
    regions: analytics.mockRegionalRegions(scoped(ctx)),
  })),
  route('GET', '/analytics/regional/heatmap', (ctx) => analytics.mockRegionalHeatmap(scoped(ctx))),
  route('GET', '/analytics/regional/schools', (ctx) => analytics.mockRegionalSchools(scoped(ctx))),
  route('GET', '/analytics/items', (ctx) => analytics.mockItemAnalysis(scoped(ctx))),
  route('GET', '/analytics/indicators/filters', (ctx) => {
    scoped(ctx);
    return analytics.mockIndicatorFilters();
  }),
  route('GET', '/analytics/indicators/summary', (ctx) =>
    analytics.mockIndicatorSummary(scoped(ctx))
  ),
  route('GET', '/analytics/indicators/hierarchy', (ctx) => ({
    competencies: analytics.mockIndicatorHierarchy(scoped(ctx)),
  })),
  route('GET', '/analytics/indicators/questions', (ctx) => {
    scoped(ctx);
    return analytics.mockSampleQuestions(
      String(ctx.query.question_ids ?? '')
        .split(',')
        .map(Number)
        .filter(Boolean)
    );
  }),

  // ---------- progres
  route('GET', '/progress/schools', (ctx) => analytics.mockSchoolProgressList(progressParams(ctx))),
  route('GET', '/progress/schools/:id', (ctx) => {
    scoped(ctx);
    return analytics.mockSchoolProgressDetail(Number(ctx.params.id));
  }),
  route('GET', '/progress/students', (ctx) =>
    analytics.mockStudentProgressList(progressParams(ctx))
  ),
  route('GET', '/progress/students/:id', (ctx) => {
    scoped(ctx);
    return analytics.mockStudentProgressDetail(Number(ctx.params.id));
  }),

  // ---------- master & paket soal
  route('GET', '/master/classes', packages.listClasses),
  route('GET', '/master/subjects', packages.listSubjects),
  route('GET', '/master/competencies', packages.listCompetencies),
  route('GET', '/master/sub-competencies', packages.listSubCompetencies),
  route('GET', '/master/indicators', packages.listIndicators),
  route('GET', '/master/categories', packages.listCategories),
  route('GET', '/packages', packages.listPackages),
  route('GET', '/packages/options', packages.packageOptions),
  route('POST', '/packages', packages.createPackage),
  route('GET', '/packages/:id', packages.getPackage),
  route('PUT', '/packages/:id', packages.updatePackage),
  route('DELETE', '/packages/:id', packages.deletePackage),
  route('POST', '/packages/:id/duplicate', packages.duplicatePackage),
  route('POST', '/packages/:id/questions', packages.createQuestion),
  route('POST', '/packages/:id/questions/bulk-delete', packages.deleteQuestions),
  route('GET', '/packages/:id/questions/:qid', packages.getQuestion),
  route('PUT', '/packages/:id/questions/:qid', packages.updateQuestion),
  route('DELETE', '/packages/:id/questions/:qid', packages.deleteQuestion),

  // ---------- jadwal tryout
  route('GET', '/schedules', packages.listSchedules),
  route('POST', '/schedules', packages.createSchedule),
  route('DELETE', '/schedules/:id', packages.deleteSchedule),

  // ---------- anggota mitra
  route('GET', '/schools', members.listSchools),
  route('GET', '/students', members.listStudents),
  route('POST', '/students/import', members.importStudents),
  route('GET', '/teachers', members.listTeachers),
  route('POST', '/teachers', members.createTeacher),
  route('PUT', '/teachers/:id', members.updateTeacher),
  route('DELETE', '/teachers/:id', members.deleteTeacher),

  // ---------- siswa: tryout
  route('GET', '/student/tryouts', student.listTryouts),
  route('GET', '/student/tryouts/:code', student.tryoutDetail),
  route('POST', '/student/tryouts/:code/start', student.startTryout),
  route('GET', '/student/practices/unfinished', student.listUnfinished),
  route('GET', '/student/practices/:id/resume', student.resumePractice),
  route('GET', '/student/practices/:id/answers', student.savedAnswers),
  route('POST', '/student/practices/:id/answers', student.saveAnswers),
  route('POST', '/student/practices/:id/submit', student.submitPractice),
  route('POST', '/student/practices/:id/violations', student.reportViolation),
  route('GET', '/student/practices/:id/explanation', student.explanation),
  route('GET', '/student/practices/:id/report', student.performanceReport),
  route('GET', '/student/history', student.history),
  route('GET', '/student/leaderboard/options', student.leaderboardOptions),
  route('GET', '/student/leaderboard/:packageId', student.leaderboard),

  // ---------- wilayah (form data diri siswa)
  route('GET', '/regions/provinces', student.provinces),
  route('GET', '/regions/cities', student.cities),
  route('GET', '/regions/schools', student.regionSchools),
];

export const resolveRoute = (method: string, path: string) => {
  for (const r of ROUTES) {
    if (r.method !== method) continue;
    const match = path.match(r.pattern);
    if (match) {
      const params = Object.fromEntries(
        r.keys.map((k, i) => [k, decodeURIComponent(match[i + 1])])
      );
      return { handle: r.handle, params };
    }
  }
  return null;
};
