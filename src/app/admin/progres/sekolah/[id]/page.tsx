import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { ProgressDetailContainer } from 'src/sections/progres/container/progress-detail-container';

export const metadata: Metadata = { title: 'Detail Progres Sekolah' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProgressDetailContainer kind="sekolah" />
    </Suspense>
  );
}
