import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { ProgressListContainer } from 'src/sections/progres/container/progress-list-container';

export const metadata: Metadata = { title: 'Progres Siswa' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProgressListContainer kind="siswa" />
    </Suspense>
  );
}
