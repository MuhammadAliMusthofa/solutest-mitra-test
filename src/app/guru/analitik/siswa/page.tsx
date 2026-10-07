import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { StudentScoresContainer } from 'src/sections/analitik/container/student-scores-container';

export const metadata: Metadata = { title: 'Detail Siswa' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <StudentScoresContainer />
    </Suspense>
  );
}
