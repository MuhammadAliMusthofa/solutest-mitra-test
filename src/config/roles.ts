// Role (klaim JWT `role` dari be-solutest-mitra) dan prefix route masing-masing.

export const ROLES = {
  admin: 'ADMIN',
  guru: 'GURU',
  siswa: 'SISWA',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

/** Panel = area dashboard bersidebar (admin & guru berbagi view yang sama). */
export type Panel = 'admin' | 'guru';

export const ROLE_PREFIX: Record<Role, string> = {
  [ROLES.admin]: '/admin',
  [ROLES.guru]: '/guru',
  [ROLES.siswa]: '/siswa',
};

export const ROLE_LABEL: Record<Role, string> = {
  [ROLES.admin]: 'Admin Mitra',
  [ROLES.guru]: 'Guru',
  [ROLES.siswa]: 'Siswa',
};

export const PANEL_ROLE: Record<Panel, Role> = {
  admin: ROLES.admin,
  guru: ROLES.guru,
};

export const LOGIN_PATH = '/login';

export const isRole = (value: unknown): value is Role =>
  Object.values(ROLES).includes(value as Role);

export const homeOf = (role?: string | null) => (isRole(role) ? ROLE_PREFIX[role] : LOGIN_PATH);

/** Role yang boleh membuka prefix URL tertentu (dipakai proxy & guard klien). */
export const roleForPath = (pathname: string): Role | null => {
  const entry = Object.entries(ROLE_PREFIX).find(
    ([, prefix]) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
  return entry ? (entry[0] as Role) : null;
};
