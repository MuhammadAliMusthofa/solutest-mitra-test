import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { SiswaListContainer } from 'src/sections/manajemen-siswa/container/siswa-list-container';

export const metadata: Metadata = { title: 'Siswa' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <SiswaListContainer />
    </Suspense>
  );
}
