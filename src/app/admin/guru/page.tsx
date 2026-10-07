import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { GuruListContainer } from 'src/sections/manajemen-guru/container/guru-list-container';

export const metadata: Metadata = { title: 'Guru' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <GuruListContainer />
    </Suspense>
  );
}
