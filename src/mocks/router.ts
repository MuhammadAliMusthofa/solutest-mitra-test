// Tabel route mode mock: hanya analitik & progres (belum tersedia di be-solutest-mitra).
// Path relatif ke NEXT_PUBLIC_API_URL; endpoint lain selalu ke backend asli (src/core/http.ts).

import type { MockContext } from './utils';

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
