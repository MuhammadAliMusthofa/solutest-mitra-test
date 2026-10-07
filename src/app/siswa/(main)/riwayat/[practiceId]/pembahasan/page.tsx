import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { ExplanationContainer } from 'src/sections/tryout-siswa/container/history-containers';

export const metadata: Metadata = { title: 'Pembahasan' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ExplanationContainer />
    </Suspense>
  );
}
