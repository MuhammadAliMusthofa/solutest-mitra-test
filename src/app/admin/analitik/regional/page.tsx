import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { RegionalContainer } from 'src/sections/analitik/container/regional-container';

export const metadata: Metadata = { title: 'Analisis Regional' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <RegionalContainer />
    </Suspense>
  );
}
