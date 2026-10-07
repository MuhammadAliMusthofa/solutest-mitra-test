import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { ExamShell } from 'src/sections/ujian/container/exam-shell';

/** Halaman pengerjaan: tanpa navbar siswa, dengan header ujian (timer, daftar soal). */
export default function Layout({ children }: LayoutProps<'/siswa/ujian/[practiceId]'>) {
  return (
    <Suspense fallback={<PageLoader fullscreen label="Menyiapkan soal…" />}>
      <ExamShell>{children}</ExamShell>
    </Suspense>
  );
}
