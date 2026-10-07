import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { TryoutListContainer } from 'src/sections/tryout-siswa/container/tryout-list-container';

export const metadata: Metadata = { title: 'Tryout' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <TryoutListContainer />
    </Suspense>
  );
}
