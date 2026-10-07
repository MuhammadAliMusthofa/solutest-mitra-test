import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { ProfileContainer } from 'src/sections/profil/container/profile-container';

export const metadata: Metadata = { title: 'Profil Saya' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <ProfileContainer homeHref="/guru" />
    </Suspense>
  );
}
