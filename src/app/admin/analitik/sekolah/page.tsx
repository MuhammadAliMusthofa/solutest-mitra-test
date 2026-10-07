import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { SchoolRankingContainer } from 'src/sections/analitik/container/school-ranking-container';

export const metadata: Metadata = { title: 'Peringkat Sekolah' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SchoolRankingContainer />
    </Suspense>
  );
}
