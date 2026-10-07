import { ROLES } from 'src/config/roles';

import { RoleGuard } from 'src/components/layout/role-guard';
import { PanelShell } from 'src/components/layout/panel-shell';

export default function Layout({ children }: LayoutProps<'/admin'>) {
  return (
    <RoleGuard role={ROLES.admin}>
      <PanelShell role={ROLES.admin}>{children}</PanelShell>
    </RoleGuard>
  );
}
