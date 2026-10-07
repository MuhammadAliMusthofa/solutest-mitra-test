import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { PracticeDetailContainer } from 'src/sections/analitik/container/practice-detail-container';

export const metadata: Metadata = { title: 'Hasil Pengerjaan' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PracticeDetailContainer />
    </Suspense>
  );
}
