import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { SekolahContainer } from 'src/sections/sekolah/container/sekolah-container';

export const metadata: Metadata = { title: 'Sekolah' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SekolahContainer />
    </Suspense>
  );
}
