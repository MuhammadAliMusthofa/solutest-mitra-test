import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { DashboardContainer } from 'src/sections/dashboard/container/dashboard-container';

export const metadata: Metadata = { title: 'Ringkasan' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <DashboardContainer />
    </Suspense>
  );
}
