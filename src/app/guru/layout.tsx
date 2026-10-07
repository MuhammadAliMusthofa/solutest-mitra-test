import { ROLES } from 'src/config/roles';

import { RoleGuard } from 'src/components/layout/role-guard';
import { PanelShell } from 'src/components/layout/panel-shell';

export default function Layout({ children }: LayoutProps<'/guru'>) {
  return (
    <RoleGuard role={ROLES.guru}>
      <PanelShell role={ROLES.guru}>{children}</PanelShell>
    </RoleGuard>
  );
}
