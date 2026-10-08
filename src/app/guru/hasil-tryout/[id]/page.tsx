import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { HasilDetailContainer } from 'src/sections/hasil-tryout/container/hasil-detail-container';

export const metadata: Metadata = { title: 'Hasil Tryout' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <HasilDetailContainer />
    </Suspense>
  );
}
