import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { StudentHistoryContainer } from 'src/sections/hasil-tryout/container/student-history-container';

export const metadata: Metadata = { title: 'Riwayat Siswa' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StudentHistoryContainer />
    </Suspense>
  );
}
