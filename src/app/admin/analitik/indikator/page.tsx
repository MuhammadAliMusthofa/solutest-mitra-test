import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { IndicatorContainer } from 'src/sections/analitik/container/indicator-container';

export const metadata: Metadata = { title: 'Analisis Indikator' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <IndicatorContainer />
    </Suspense>
  );
}
