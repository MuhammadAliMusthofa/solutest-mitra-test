// Menu navigasi per role. Admin & guru: sidebar; siswa: navbar.

import type { Role } from './roles';

import { ROLES } from './roles';
import { panelPaths, SISWA_PATHS } from './paths';

export interface NavChild {
  title: string;
  path: string;
}

export interface NavItem {
  title: string;
  path: string;
  /** nama ikon Iconify (set solar) */
  icon: string;
  /** indeks warna aksen hover/aktif (lihat ACCENT_CLASSES di sidebar) */
  accent: number;
  /** aktif hanya jika path persis sama (menu beranda) */
  exact?: boolean;
  children?: NavChild[];
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

const A = panelPaths('admin');
const G = panelPaths('guru');
const S = SISWA_PATHS;

export const NAV: Record<Role, NavSection[]> = {
  [ROLES.admin]: [
    {
      title: 'Beranda',
      items: [
        {
          title: 'Ringkasan Utama',
          path: A.root,
          icon: 'solar:widget-5-linear',
          accent: 0,
          exact: true,
        },
      ],
    },
    {
      title: 'Analisis',
      items: [
        {
          title: 'Sekolah & Siswa',
          path: A.schoolRanking,
          icon: 'solar:users-group-rounded-linear',
          accent: 1,
          children: [
            { title: 'Peringkat Sekolah', path: A.schoolRanking },
            { title: 'Detail Siswa', path: A.studentScores },
          ],
        },
        { title: 'Analisis Regional', path: A.regional, icon: 'solar:map-point-linear', accent: 2 },
        {
          title: 'Progres Tryout',
          path: A.progressList('sekolah'),
          icon: 'solar:graph-up-linear',
          accent: 4,
          children: [
            { title: 'Progres Sekolah', path: A.progressList('sekolah') },
            { title: 'Progres Siswa', path: A.progressList('siswa') },
          ],
        },
        {
          title: 'Analisis Butir Soal',
          path: A.itemAnalysis,
          icon: 'solar:document-text-linear',
          accent: 3,
        },
        {
          title: 'Analisis Indikator',
          path: A.indicator,
          icon: 'solar:checklist-minimalistic-linear',
          accent: 0,
        },
      ],
    },
    {
      title: 'Kelola',
      items: [
        { title: 'Paket Soal', path: A.paketSoal, icon: 'solar:box-linear', accent: 2 },
        {
          title: 'Jadwal Tryout',
          path: A.jadwalTryout,
          icon: 'solar:calendar-mark-linear',
          accent: 1,
        },
        { title: 'Siswa', path: A.siswa, icon: 'solar:user-id-linear', accent: 3 },
        { title: 'Guru', path: A.guru, icon: 'solar:square-academic-cap-linear', accent: 4 },
      ],
    },
    {
      title: 'Akun',
      items: [
        {
          title: 'Pengaturan Mitra',
          path: A.pengaturan,
          icon: 'solar:pallete-2-linear',
          accent: 0,
        },
        { title: 'Profil Saya', path: A.profile, icon: 'solar:user-circle-linear', accent: 4 },
      ],
    },
  ],
  [ROLES.guru]: [
    {
      title: 'Beranda',
      items: [
        { title: 'Ringkasan', path: G.root, icon: 'solar:widget-5-linear', accent: 0, exact: true },
      ],
    },
    {
      title: 'Analisis',
      items: [
        {
          title: 'Detail Siswa',
          path: G.studentScores,
          icon: 'solar:users-group-rounded-linear',
          accent: 1,
        },
        {
          title: 'Progres Siswa',
          path: G.progressList('siswa'),
          icon: 'solar:graph-up-linear',
          accent: 4,
        },
        {
          title: 'Analisis Butir Soal',
          path: G.itemAnalysis,
          icon: 'solar:document-text-linear',
          accent: 3,
        },
        {
          title: 'Analisis Indikator',
          path: G.indicator,
          icon: 'solar:checklist-minimalistic-linear',
          accent: 0,
        },
      ],
    },
    {
      title: 'Kelola',
      items: [
        { title: 'Paket Soal', path: G.paketSoal, icon: 'solar:box-linear', accent: 2 },
        {
          title: 'Jadwal Tryout',
          path: G.jadwalTryout,
          icon: 'solar:calendar-mark-linear',
          accent: 1,
        },
      ],
    },
    {
      title: 'Akun',
      items: [
        { title: 'Profil Saya', path: G.profile, icon: 'solar:user-circle-linear', accent: 4 },
      ],
    },
  ],
  [ROLES.siswa]: [
    {
      title: 'Menu',
      items: [
        { title: 'Beranda', path: S.root, icon: 'solar:home-2-linear', accent: 0, exact: true },
        {
          title: 'Tryout',
          path: S.tryout,
          icon: 'solar:pen-new-square-linear',
          accent: 1,
        },
        { title: 'Riwayat', path: S.history, icon: 'solar:history-linear', accent: 2 },
        { title: 'Leaderboard', path: S.leaderboard, icon: 'solar:cup-star-linear', accent: 3 },
      ],
    },
  ],
};

/** Quick link di topbar panel (padanan "Apps · Chat · Calendar" Spike). */
export const QUICK_LINKS: Partial<Record<Role, NavChild[]>> = {
  [ROLES.admin]: [
    { title: 'Jadwal Tryout', path: A.jadwalTryout },
    { title: 'Paket Soal', path: A.paketSoal },
    { title: 'Siswa', path: A.siswa },
  ],
  [ROLES.guru]: [
    { title: 'Jadwal Tryout', path: G.jadwalTryout },
    { title: 'Paket Soal', path: G.paketSoal },
  ],
};

/** Path menu paling spesifik (terpanjang) yang cocok dengan URL aktif. */
export const resolveActivePath = (pathname: string, sections: NavSection[]) => {
  const paths = sections.flatMap((s) =>
    s.items.flatMap((item) => [
      { path: item.path, exact: item.exact },
      ...(item.children ?? []).map((c) => ({ path: c.path, exact: false })),
    ])
  );
  return (
    paths
      .filter(({ path, exact }) =>
        exact ? pathname === path : pathname === path || pathname.startsWith(`${path}/`)
      )
      .sort((a, b) => b.path.length - a.path.length)[0]?.path ?? ''
  );
};
