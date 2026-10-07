import { ROLES } from 'src/config/roles';

import { RoleGuard } from 'src/components/layout/role-guard';

/** Guard role siswa. Navbar dipasang di (main); halaman ujian (ujian/*) tanpa navbar. */
export default function Layout({ children }: LayoutProps<'/siswa'>) {
  return <RoleGuard role={ROLES.siswa}>{children}</RoleGuard>;
}
