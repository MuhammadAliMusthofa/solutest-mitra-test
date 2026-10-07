import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { ExamConfirmView } from 'src/sections/ujian/container/exam-confirm-view';

export const metadata: Metadata = { title: 'Kumpulkan Tryout' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ExamConfirmView />
    </Suspense>
  );
}
