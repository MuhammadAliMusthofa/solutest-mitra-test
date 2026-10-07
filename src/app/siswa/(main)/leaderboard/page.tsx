import type { Metadata } from 'next';

import { Suspense } from 'react';

import { PageLoader } from 'src/components/feedback/page-loader';

import { LeaderboardContainer } from 'src/sections/tryout-siswa/container/leaderboard-container';

export const metadata: Metadata = { title: 'Leaderboard' };

export default function Page() {
  return (
    <Suspense fallback={<PageLoader />}>
      <LeaderboardContainer />
    </Suspense>
  );
}
