import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { HasilListContainer } from 'src/sections/hasil-tryout/container/hasil-list-container';

export const metadata: Metadata = { title: 'Hasil Tryout' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <HasilListContainer />
    </Suspense>
  );
}
