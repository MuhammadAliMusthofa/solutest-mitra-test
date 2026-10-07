import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { BerandaSiswaContainer } from 'src/sections/tryout-siswa/container/beranda-siswa-container';

export const metadata: Metadata = { title: 'Beranda' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <BerandaSiswaContainer />
    </Suspense>
  );
}
