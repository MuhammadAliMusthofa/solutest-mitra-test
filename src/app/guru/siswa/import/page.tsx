import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { ImportSiswaContainer } from 'src/sections/manajemen-siswa/container/import-siswa-container';

export const metadata: Metadata = { title: 'Import Siswa' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ImportSiswaContainer />
    </Suspense>
  );
}
