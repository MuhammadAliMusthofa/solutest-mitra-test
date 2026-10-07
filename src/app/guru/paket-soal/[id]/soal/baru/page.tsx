import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { QuestionEditorContainer } from 'src/sections/paket-soal/container/question-editor-container';

export const metadata: Metadata = { title: 'Tambah Soal' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <QuestionEditorContainer />
    </Suspense>
  );
}
