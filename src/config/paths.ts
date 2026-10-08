// Path semua halaman. Tautan antar halaman memakai ini, bukan string literal.

import type { Panel } from './roles';

export type ProgressKind = 'sekolah' | 'siswa';

/** Path panel admin/guru. View yang dipakai bersama memanggil `panelPaths(panel)`. */
export const panelPaths = (panel: Panel) => {
  const base = `/${panel}`;
  return {
    root: base,
    analytics: `${base}/analitik`,
    schoolRanking: `${base}/analitik/sekolah`,
    studentScores: `${base}/analitik/siswa`,
    practiceDetail: (practiceId: number | string) => `${base}/analitik/siswa/hasil/${practiceId}`,
    regional: `${base}/analitik/regional`,
    itemAnalysis: `${base}/analitik/soal`,
    indicator: `${base}/analitik/indikator`,
    progressList: (kind: ProgressKind) => `${base}/progres/${kind}`,
    progressDetail: (kind: ProgressKind, id: number | string) => `${base}/progres/${kind}/${id}`,
    paketSoal: `${base}/paket-soal`,
    paketDetail: (id: number | string) => `${base}/paket-soal/${id}`,
    questionCreate: (paketId: number | string) => `${base}/paket-soal/${paketId}/soal/baru`,
    questionEdit: (paketId: number | string, questionId: number | string) =>
      `${base}/paket-soal/${paketId}/soal/${questionId}`,
    jadwalTryout: `${base}/jadwal-tryout`,
    hasilTryout: `${base}/hasil-tryout`,
    hasilTryoutDetail: (scheduleId: number | string) => `${base}/hasil-tryout/${scheduleId}`,
    attemptDetail: (attemptId: number | string) => `${base}/hasil-tryout/pengerjaan/${attemptId}`,
    sekolah: `${base}/sekolah`,
    siswa: `${base}/siswa`,
    importSiswa: `${base}/siswa/import`,
    studentHistory: (studentId: number | string) => `${base}/siswa/${studentId}`,
    guru: `${base}/guru`,
    pengaturan: `${base}/pengaturan`,
    profile: `${base}/profil`,
  };
};

export type PanelPaths = ReturnType<typeof panelPaths>;

const SISWA = '/siswa';

export const SISWA_PATHS = {
  root: SISWA,
  tryout: `${SISWA}/tryout`,
  tryoutDetail: (code: string) => `${SISWA}/tryout/${encodeURIComponent(code)}`,
  history: `${SISWA}/riwayat`,
  explanation: (practiceId: number | string) => `${SISWA}/riwayat/${practiceId}/pembahasan`,
  report: (practiceId: number | string) => `${SISWA}/riwayat/${practiceId}/laporan`,
  leaderboard: `${SISWA}/leaderboard`,
  profile: `${SISWA}/profil`,
  /** halaman pengerjaan; `nomor` sudah di-encode hashids (lihat sections/ujian/helpers) */
  exam: (practiceId: number | string, nomor: string) => `${SISWA}/ujian/${practiceId}/${nomor}`,
  examConfirm: (practiceId: number | string) => `${SISWA}/ujian/${practiceId}/konfirmasi`,
};

/** Tambah query string ke path; nilai kosong (undefined/null/'') diabaikan. */
export const withQuery = (
  path: string,
  query: Record<string, string | number | null | undefined>
) => {
  const search = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') search.set(key, String(value));
  });
  const qs = search.toString();
  return qs ? `${path}?${qs}` : path;
};
