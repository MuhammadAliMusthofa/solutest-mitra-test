import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { TryoutDetailContainer } from 'src/sections/tryout-siswa/container/tryout-detail-container';

export const metadata: Metadata = { title: 'Detail Tryout' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TryoutDetailContainer />
    </Suspense>
  );
}
