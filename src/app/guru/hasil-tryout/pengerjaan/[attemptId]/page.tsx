import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { AttemptDetailContainer } from 'src/sections/hasil-tryout/container/attempt-detail-container';

export const metadata: Metadata = { title: 'Detail Pengerjaan' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <AttemptDetailContainer />
    </Suspense>
  );
}
