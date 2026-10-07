import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { ExamQuestionView } from 'src/sections/ujian/container/exam-question-view';

export const metadata: Metadata = { title: 'Mengerjakan Tryout' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ExamQuestionView />
    </Suspense>
  );
}
