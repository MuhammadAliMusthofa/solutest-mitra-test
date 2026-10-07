import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { PaketListContainer } from 'src/sections/paket-soal/container/paket-list-container';

export const metadata: Metadata = { title: 'Paket Soal' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PaketListContainer />
    </Suspense>
  );
}
