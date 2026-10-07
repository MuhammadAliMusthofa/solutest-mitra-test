import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { PaketDetailContainer } from 'src/sections/paket-soal/container/paket-detail-container';

export const metadata: Metadata = { title: 'Detail Paket Soal' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PaketDetailContainer />
    </Suspense>
  );
}
