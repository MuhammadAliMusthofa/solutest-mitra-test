// Handler analitik & progres (port dari prototipe mitra fe-solutest). Bentuk response = `data`
// dari kontrak API. Param `school_ids` (disuntikkan router untuk role guru) membatasi data ke
// sekolah yang diampu guru.

import type { MockStudent } from '../data';
import type { Paginated } from 'src/models/api';
import type {
  ProgressPoint,
  ProgressListParams,
  SchoolProgressItem,
  StudentProgressItem,
  SchoolProgressDetail,
  StudentProgressDetail,
} from 'src/models/progress';
import type {
  RegionData,
  MapLocation,
  DashboardKpi,
  CategoryChart,
  PracticeDetail,
  CompetencyNode,
  SampleQuestion,
  RegionalSummary,
  AnalyticsParams,
  RegionalHeatmap,
  IndicatorFilters,
  IndicatorSummary,
  SchoolRankingItem,
  DashboardDistribusi,
  DashboardCompletion,
  DashboardTopStudent,
  ItemAnalysisResponse,
  StudentDetailResponse,
  SchoolSubjectsResponse,
  DashboardRataRataMapel,
  RegionalSchoolsResponse,
} from 'src/models/analytics';

import { getPredicate } from 'src/utils/predicate';
import { getTrendStatus } from 'src/utils/progress';

import { matches, paginate } from '../utils';
import {
  TRYOUTS,
  SCHOOLS,
  helpers,
  STUDENTS,
  SUBJECTS,
  SCHEDULES,
  COMPETENCIES,
  QUESTION_BANK,
} from '../data';

export type ScopedParams = AnalyticsParams & { school_ids?: number[] };

const inScope = (schoolId: number, scope?: number[]) => !scope || scope.includes(schoolId);

const { round1, between } = helpers;

const avg = (list: number[]) =>
  list.length ? round1(list.reduce((a, b) => a + b, 0) / list.length) : 0;

/** Index tryout yang termasuk filter `code` (kosong = semua). */
const tryoutIdx = (code?: string) =>
  TRYOUTS.map((t, i) => (!code || t.code === code ? i : -1)).filter((i) => i >= 0);

interface Attempt {
  student: MockStudent;
  t: number;
  total: number;
  subjects: number[];
  duration: number;
  done: boolean;
}

const attempts = (params: ScopedParams = {}): Attempt[] => {
  const idx = tryoutIdx(params.code);
  return STUDENTS.flatMap((student) =>
    idx
      .map((t) => {
        const s = student.scores[t];
        return s ? { student, t, ...s } : null;
      })
      .filter((a): a is Attempt => Boolean(a))
  )
    .filter((a) => !params.jenjang || a.student.school.level === params.jenjang)
    .filter((a) => inScope(a.student.school.id, params.school_ids));
};

const sparkline = (fn: (t: number) => number) => TRYOUTS.map((_, t) => round1(fn(t)));

// ---------------- Filter ----------------
export const mockTryoutList = () => TRYOUTS;

// ---------------- Dashboard ----------------
export const mockKpi = (params: ScopedParams): DashboardKpi => {
  const list = attempts(params);
  const done = list.filter((a) => a.done);
  const perTryout = (t: number) => attempts({ ...params, code: TRYOUTS[t].code });
  const participantsTrend = sparkline((t) => perTryout(t).length);
  const averageTrend = sparkline((t) => avg(perTryout(t).map((a) => a.total)));
  const schoolsTrend = sparkline((t) => new Set(perTryout(t).map((a) => a.student.school.id)).size);
  const completionTrend = sparkline((t) => {
    const l = perTryout(t);
    return l.length ? (l.filter((a) => a.done).length / l.length) * 100 : 0;
  });
  const delta = (trend: number[]) =>
    trend.length > 1 && trend[trend.length - 2]
      ? round1(
          ((trend[trend.length - 1] - trend[trend.length - 2]) / trend[trend.length - 2]) * 100
        )
      : 0;
  return {
    total_participants: list.length,
    total_participants_delta: delta(participantsTrend),
    total_participants_trend: participantsTrend,
    national_average: avg(done.map((a) => a.total)),
    national_average_delta: delta(averageTrend),
    national_average_trend: averageTrend,
    total_schools: new Set(list.map((a) => a.student.school.id)).size,
    total_schools_delta: delta(schoolsTrend),
    total_schools_trend: schoolsTrend,
    completion_rate: list.length ? round1((done.length / list.length) * 100) : 0,
    completion_rate_delta: delta(completionTrend),
    completion_rate_trend: completionTrend,
    active_sessions: list.filter((a) => !a.done).length,
  };
};

export const mockTrend = (params: ScopedParams): CategoryChart => {
  const idx = tryoutIdx(params.code);
  return {
    categories: idx.map((t) => TRYOUTS[t].name.split('—')[0].trim()),
    series: [
      {
        name: 'Peserta',
        data: idx.map((t) => attempts({ ...params, code: TRYOUTS[t].code }).length),
      },
      {
        name: 'Selesai',
        data: idx.map(
          (t) => attempts({ ...params, code: TRYOUTS[t].code }).filter((a) => a.done).length
        ),
      },
    ],
  };
};

export const mockDistribusi = (params: ScopedParams): DashboardDistribusi => {
  const labels = ['0-20', '21-40', '41-60', '61-80', '81-100'];
  const data = [0, 0, 0, 0, 0];
  attempts(params)
    .filter((a) => a.done)
    .forEach((a) => {
      data[Math.min(4, Math.floor(Math.max(0, a.total - 0.01) / 20))] += 1;
    });
  return { labels, data };
};

export const mockRataRataMapel = (params: ScopedParams): DashboardRataRataMapel => {
  const list = attempts(params).filter((a) => a.done);
  return {
    subjects: SUBJECTS.map((s, i) => ({
      name: s.name,
      average: avg(list.map((a) => a.subjects[i])),
    })),
  };
};

export const mockCompletion = (params: ScopedParams): DashboardCompletion => {
  const list = attempts(params);
  const done = list.filter((a) => a.done).length;
  return {
    completion_rate: list.length ? round1((done / list.length) * 100) : 0,
    total_completed: done,
    total_incomplete: list.length - done,
  };
};

export const mockRingkasanSoal = (): CategoryChart => ({
  categories: SUBJECTS.map((s) => s.name),
  series: ['benar', 'salah', 'kosong'].map((key) => ({
    name: key[0].toUpperCase() + key.slice(1),
    data: SUBJECTS.map((s) =>
      avg(
        QUESTION_BANK.filter((q) => q.subject === s.name).map(
          (q) => q[key as 'benar' | 'salah' | 'kosong']
        )
      )
    ),
  })),
});

export const mockTopStudents = (params: ScopedParams): DashboardTopStudent[] =>
  attempts(params)
    .filter((a) => a.done)
    .sort((a, b) => b.total - a.total)
    // unik per siswa (skor terbaik) saat menggabungkan banyak tryout
    .filter((a, i, list) => list.findIndex((b) => b.student.id === a.student.id) === i)
    .slice(0, 5)
    .map((a) => ({
      id: a.student.id,
      name: a.student.name,
      school: a.student.school.name,
      class: a.student.class,
      duration: a.duration,
      total_score: a.total,
      avatar_seed: a.student.name,
    }));

// ---------------- Sekolah ----------------
const schoolStats = (params: ScopedParams) =>
  SCHOOLS.map((school) => {
    const list = attempts(params).filter((a) => a.student.school.id === school.id);
    const done = list.filter((a) => a.done);
    const totals = done.map((a) => a.total);
    return { school, list, done, totals };
  }).filter((s) => s.list.length);

export const mockSchoolRanking = (params: ScopedParams): Paginated<SchoolRankingItem> => {
  const tryoutName = params.code
    ? (TRYOUTS.find((t) => t.code === params.code)?.name ?? '-')
    : 'Semua tryout';
  const rows = schoolStats(params)
    .map(({ school, list, done, totals }) => ({
      id: school.id,
      rank: 0,
      name: school.name,
      city: school.city,
      level: school.level,
      tryout_name: tryoutName,
      participants: list.length,
      average: avg(totals),
      highest_score: totals.length ? Math.max(...totals) : 0,
      lowest_score: totals.length ? Math.min(...totals) : 0,
      completion_rate: round1((done.length / list.length) * 100),
    }))
    .sort((a, b) => b.average - a.average)
    .map((row, i) => ({ ...row, rank: i + 1 }))
    .filter((row) => matches(row.name, params.search));
  return paginate(rows, params.page, params.per_page);
};

export const mockSchoolSubjects = (id: number, params: ScopedParams): SchoolSubjectsResponse => {
  const stat = schoolStats(params).find((s) => s.school.id === id);
  const done = stat?.done ?? [];
  return {
    school_id: id,
    subjects: SUBJECTS.map((s, i) => {
      const average = avg(done.map((a) => a.subjects[i]));
      return { code: s.code, name: s.name, average, predicate: getPredicate(average) };
    }),
    statistics: {
      highest_score: stat?.totals.length ? Math.max(...stat.totals) : 0,
      lowest_score: stat?.totals.length ? Math.min(...stat.totals) : 0,
    },
  };
};

// ---------------- Siswa ----------------
export const mockStudentDetail = (params: ScopedParams): StudentDetailResponse => {
  const rows = attempts(params)
    .filter((a) => !params.school_id || String(a.student.school.id) === String(params.school_id))
    .filter((a) => matches(a.student.name, params.search))
    .sort((a, b) => b.total - a.total)
    .map((a, i) => ({
      id: a.student.id,
      practice_id: a.student.id * 10 + a.t,
      rank: i + 1,
      name: a.student.name,
      avatar_seed: a.student.name,
      school: a.student.school.name,
      school_id: String(a.student.school.id),
      level: a.student.school.level,
      class: a.student.class,
      tryout_name: TRYOUTS[a.t].name,
      total_score: a.total,
      total_predicate: getPredicate(a.total),
      duration: a.duration,
      status: a.done ? ('Selesai' as const) : ('Sedang Mengerjakan' as const),
      subjects: SUBJECTS.map((s, si) => ({
        code: s.code,
        name: s.name,
        total_score: a.subjects[si],
        predicate: getPredicate(a.subjects[si]),
      })),
    }));
  return {
    ...paginate(rows, params.page, params.per_page),
    filter_options: {
      sekolah: SCHOOLS.filter((s) => inScope(s.id, params.school_ids)).map((s) => ({
        id: String(s.id),
        nama: s.name,
      })),
      jenjang: ['SMA', 'SMK'],
    },
  };
};

export const mockPracticeDetail = (practiceId: number): PracticeDetail => {
  const student = STUDENTS.find((s) => s.id === Math.floor(practiceId / 10)) ?? STUDENTS[0];
  const t = practiceId % 10;
  const score = student.scores[t]?.total ?? 0;
  const questions = QUESTION_BANK.slice(0, 15).map((q, i) => {
    const roll = (q.id * 31 + student.id) % 100;
    const status = roll < score ? 'correct' : roll < score + 8 ? 'unanswered' : 'incorrect';
    const correct = ['A', 'B', 'C', 'D'][q.id % 4];
    const studentAnswer =
      status === 'correct'
        ? correct
        : status === 'unanswered'
          ? null
          : ['A', 'B', 'C', 'D'][(q.id + 1) % 4];
    return {
      no: i + 1,
      question_id: q.id,
      question_code: q.code,
      question_text: q.question_text,
      question_type: 'PG',
      explanation: q.pembahasan,
      subject: q.subject,
      difficulty: (q.benar > 65 ? 'EASY' : q.benar > 35 ? 'MEDIUM' : 'HARD') as
        'EASY' | 'MEDIUM' | 'HARD',
      status: status as 'correct' | 'incorrect' | 'unanswered',
      student_answer: studentAnswer,
      correct_answer: correct,
      options: ['A', 'B', 'C', 'D'].map((label, oi) => ({
        id: q.id * 10 + oi,
        text: `${label}. Pilihan jawaban ${label}`,
        is_correct: label === correct,
        is_student_answer: label === studentAnswer,
      })),
    };
  });
  return {
    practice_id: practiceId,
    student: {
      name: student.name,
      nisn: student.nisn,
      school: student.school.name,
      class: student.class,
    },
    package: { title: SCHEDULES[t]?.package_title ?? '-', code: SCHEDULES[t]?.package_code ?? '-' },
    summary: {
      total_questions: questions.length,
      total_correct: questions.filter((q) => q.status === 'correct').length,
      total_incorrect: questions.filter((q) => q.status === 'incorrect').length,
      total_unanswered: questions.filter((q) => q.status === 'unanswered').length,
      score,
      submitted_at: `${TRYOUTS[t]?.end_date ?? '2026-10-01'} 10:24:00`,
    },
    questions,
  };
};

// ---------------- Regional ----------------
const regionStats = (params: ScopedParams) =>
  helpers.REGIONS.map((region) => {
    const list = attempts(params).filter((a) => a.student.school.region.id === region.id);
    const done = list.filter((a) => a.done);
    return {
      region,
      participants: list.length,
      schools: new Set(list.map((a) => a.student.school.id)).size,
      average: avg(done.map((a) => a.total)),
      completion: list.length ? round1((done.length / list.length) * 100) : 0,
    };
  }).filter((r) => r.participants);

export const mockRegionalSummary = (params: ScopedParams): RegionalSummary => {
  const regions = regionStats(params);
  return {
    total_regions: regions.length,
    total_participants: regions.reduce((a, r) => a + r.participants, 0),
    total_schools: regions.reduce((a, r) => a + r.schools, 0),
    national_average: avg(
      attempts(params)
        .filter((a) => a.done)
        .map((a) => a.total)
    ),
  };
};

export const mockRegionalMap = (params: ScopedParams): MapLocation[] =>
  regionStats(params).map((r) => ({
    name: r.region.name,
    lat: r.region.lat,
    lng: r.region.lng,
    participants: r.participants,
    schools: r.schools,
    average: r.average,
  }));

export const mockRegionalRegions = (params: ScopedParams): RegionData[] =>
  regionStats(params)
    .map((r) => ({
      id: r.region.id,
      name: r.region.name,
      participants: r.participants,
      schools: r.schools,
      average: r.average,
      completion: r.completion,
    }))
    .sort((a, b) => b.average - a.average);

export const mockRegionalHeatmap = (params: ScopedParams): RegionalHeatmap => {
  const data = regionStats(params).map((r) => ({ label: r.region.name, value: r.average }));
  const values = data.map((d) => d.value);
  return {
    data,
    max_value: values.length ? Math.max(...values) : 0,
    min_value: values.length ? Math.min(...values) : 0,
    national_average: mockRegionalSummary(params).national_average,
  };
};

export const mockRegionalSchools = (params: ScopedParams): RegionalSchoolsResponse => {
  const rows = schoolStats(params)
    .filter(({ school }) => !params.wilayah || school.region.name === params.wilayah)
    .map(({ school, list, done }) => ({
      id: school.id,
      name: school.name,
      city: school.city,
      region: school.region.name,
      level: school.level,
      participants: list.length,
      average: avg(done.map((a) => a.total)),
      completion_rate: round1((done.length / list.length) * 100),
      subjects: SUBJECTS.map((s, i) => ({
        code: s.code,
        short_name: s.short,
        score: avg(done.map((a) => a.subjects[i])),
      })),
    }))
    .sort((a, b) => b.average - a.average);
  return {
    ...paginate(rows, params.page, params.per_page ?? 12),
    region_list: helpers.REGIONS.map((r) => r.name),
  };
};

// ---------------- Butir soal ----------------
export const mockItemAnalysis = (params: ScopedParams): ItemAnalysisResponse => {
  const participants = attempts(params).length;
  const rows = QUESTION_BANK.filter((q) => !params.subject || q.subject === params.subject)
    .map((q) => ({
      id: q.id,
      question_text: q.question_text,
      pembahasan: q.pembahasan,
      subject_name: q.subject,
      total_participants: participants,
      benar: q.benar,
      salah: q.salah,
      kosong: q.kosong,
      difficulty: (q.benar > 65 ? 'MUDAH' : q.benar > 35 ? 'SEDANG' : 'SULIT') as
        'MUDAH' | 'SEDANG' | 'SULIT',
    }))
    .filter((q) => !params.difficulty || q.difficulty === params.difficulty);
  return {
    ...paginate(rows, params.page, params.per_page ?? 10),
    summary: {
      mudah: rows.filter((r) => r.difficulty === 'MUDAH').length,
      sedang: rows.filter((r) => r.difficulty === 'SEDANG').length,
      sulit: rows.filter((r) => r.difficulty === 'SULIT').length,
    },
    subjects: SUBJECTS.map((s) => s.name),
  };
};

// ---------------- Indikator ----------------
export const mockIndicatorFilters = (): IndicatorFilters => ({
  subjects: SUBJECTS.map((s) => s.name),
  jenjang: ['SMA', 'SMK'],
});

export const mockIndicatorSummary = (params: ScopedParams): IndicatorSummary => {
  const list = attempts(params);
  return {
    total_sekolah: new Set(list.map((a) => a.student.school.id)).size,
    total_peserta: list.length,
  };
};

export const mockIndicatorHierarchy = (params: ScopedParams): CompetencyNode[] => {
  const offset = (params.code ? params.code.charCodeAt(5) % 7 : 0) - 3;
  return COMPETENCIES.filter((c) => !params.subject || c.subject === params.subject).map((c) => {
    const subs = [1, 2].map((n) => {
      const indicators = [1, 2, 3].map((k) => ({
        id: c.id * 100 + n * 10 + k,
        name: `Indikator ${c.id}.${n}.${k} — ${c.name}`,
        percentage: round1(between(30, 90) + offset),
        question_ids: QUESTION_BANK.filter((q) => q.subject === c.subject)
          .slice(k - 1, k + 1)
          .map((q) => q.id),
      }));
      return {
        id: c.id * 10 + n,
        name: `Sub-kompetensi ${c.id}.${n}`,
        percentage: avg(indicators.map((i) => i.percentage)),
        indicators,
      };
    });
    return {
      id: c.id,
      name: c.name,
      percentage: avg(subs.map((s) => s.percentage)),
      sub_competencies: subs,
    };
  });
};

export const mockSampleQuestions = (ids: number[]): SampleQuestion[] =>
  QUESTION_BANK.filter((q) => ids.includes(q.id)).map((q) => {
    const competency = COMPETENCIES.find((c) => c.subject === q.subject) ?? COMPETENCIES[0];
    return {
      id: q.id,
      code: q.code,
      question_text: q.question_text,
      question_type: 'PG',
      competency_name: competency.name,
      sub_competency_name: `Sub-kompetensi ${competency.id}.1`,
      indicator_name: `Indikator ${competency.id}.1.1`,
      options: ['A', 'B', 'C', 'D'].map((label, i) => ({
        id: q.id * 10 + i,
        option_text: `<p>Pilihan ${label}</p>`,
        is_true: i === q.id % 4,
      })),
    };
  });

// ---------------- Progres ----------------
const studentPoints = (student: MockStudent): ProgressPoint[] =>
  TRYOUTS.map((tryout, t) => {
    const s = student.scores[t];
    if (!s || !s.done) return null;
    return {
      code: tryout.code,
      tryout_name: tryout.name,
      date: tryout.start_date,
      score: s.total,
      subjects: SUBJECTS.map((sub, i) => ({ name: sub.name, score: s.subjects[i] })),
    };
  }).filter((p): p is ProgressPoint => Boolean(p));

const schoolPoints = (schoolId: number): ProgressPoint[] =>
  TRYOUTS.map((tryout, t) => {
    const done = STUDENTS.filter((s) => s.school.id === schoolId)
      .map((s) => s.scores[t])
      .filter((s): s is NonNullable<typeof s> => Boolean(s && s.done));
    if (!done.length) return null;
    return {
      code: tryout.code,
      tryout_name: tryout.name,
      date: tryout.start_date,
      score: avg(done.map((d) => d.total)),
      subjects: SUBJECTS.map((sub, i) => ({
        name: sub.name,
        score: avg(done.map((d) => d.subjects[i])),
      })),
    };
  }).filter((p): p is ProgressPoint => Boolean(p));

const toStudentProgress = (student: MockStudent): StudentProgressItem => {
  const scores = studentPoints(student).map((p) => p.score);
  const last = scores.length ? scores[scores.length - 1] : null;
  return {
    id: student.id,
    name: student.name,
    school: student.school.name,
    class: student.class,
    tryout_count: scores.length,
    scores,
    last_score: last,
    last_predicate: last === null ? null : getPredicate(last),
  };
};

const filterStatus = <T extends { scores: number[] }>(list: T[], status?: string) =>
  status ? list.filter((item) => getTrendStatus(item.scores) === status) : list;

export const mockSchoolProgressList = (
  params: ProgressListParams & { school_ids?: number[] }
): Paginated<SchoolProgressItem> => {
  const rows = SCHOOLS.filter((school) => inScope(school.id, params.school_ids))
    .map((school) => {
      const scores = schoolPoints(school.id).map((p) => p.score);
      const last = scores.length ? scores[scores.length - 1] : null;
      return {
        id: school.id,
        name: school.name,
        city: school.city,
        level: school.level,
        participants: STUDENTS.filter((s) => s.school.id === school.id).length,
        tryout_count: scores.length,
        scores,
        last_score: last,
        last_predicate: last === null ? null : getPredicate(last),
      };
    })
    .filter((row) => matches(row.name, params.search));
  return paginate(filterStatus(rows, params.status), params.page, params.per_page);
};

export const mockSchoolProgressDetail = (id: number): SchoolProgressDetail => {
  const school = SCHOOLS.find((s) => s.id === id) ?? SCHOOLS[0];
  const students = STUDENTS.filter((s) => s.school.id === school.id);
  return {
    id: school.id,
    name: school.name,
    city: school.city,
    level: school.level,
    participants: students.length,
    points: schoolPoints(school.id),
    students: students.map(toStudentProgress),
  };
};

export const mockStudentProgressList = (
  params: ProgressListParams & { school_ids?: number[] }
): Paginated<StudentProgressItem> => {
  const rows = STUDENTS.filter((s) => inScope(s.school.id, params.school_ids))
    .map(toStudentProgress)
    .filter((row) => matches(row.name, params.search))
    .filter(
      (row) =>
        !params.school_id ||
        String(STUDENTS.find((s) => s.id === row.id)?.school.id) === String(params.school_id)
    );
  return paginate(filterStatus(rows, params.status), params.page, params.per_page);
};

export const mockStudentProgressDetail = (id: number): StudentProgressDetail => {
  const student = STUDENTS.find((s) => s.id === id) ?? STUDENTS[0];
  return {
    id: student.id,
    name: student.name,
    nisn: student.nisn,
    school: student.school.name,
    school_id: student.school.id,
    class: student.class,
    points: studentPoints(student),
    school_average: schoolPoints(student.school.id).map((p) => ({ code: p.code, score: p.score })),
  };
};

/** Daftar sekolah tenant (untuk penugasan guru & filter). */
export const mockSchoolOptions = (scope?: number[]) =>
  SCHOOLS.filter((s) => inScope(s.id, scope)).map((s) => ({
    id: s.id,
    name: s.name,
    city: s.city,
    level: s.level,
  }));

/** Siswa dataset analitik (untuk daftar siswa tenant & leaderboard). */
export const studentPointsOf = studentPoints;
export { SCHEDULES };
