import { StudentShell } from 'src/components/layout/student-shell';

export default function Layout({ children }: { children: React.ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
