import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { JadwalTryoutContainer } from 'src/sections/jadwal-tryout/container/jadwal-tryout-container';

export const metadata: Metadata = { title: 'Jadwal Tryout' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <JadwalTryoutContainer />
    </Suspense>
  );
}
