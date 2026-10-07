import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { ReportContainer } from 'src/sections/tryout-siswa/container/report-container';

export const metadata: Metadata = { title: 'Laporan Performa' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ReportContainer />
    </Suspense>
  );
}
