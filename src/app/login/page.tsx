import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { LoginView } from 'src/sections/auth/view/login-view';

export const metadata: Metadata = { title: 'Masuk' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader fullscreen />}>
      <LoginView />
    </Suspense>
  );
}
