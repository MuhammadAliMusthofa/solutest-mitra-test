import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { ItemAnalysisContainer } from 'src/sections/analitik/container/item-analysis-container';

export const metadata: Metadata = { title: 'Analisis Butir Soal' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ItemAnalysisContainer />
    </Suspense>
  );
}
