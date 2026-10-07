import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { PengaturanContainer } from 'src/sections/pengaturan-mitra/container/pengaturan-container';

export const metadata: Metadata = { title: 'Pengaturan Mitra' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <PengaturanContainer />
    </Suspense>
  );
}
