'use client';

import type { ReactNode } from 'react';

import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

import { Toaster } from 'src/components/ui/sonner';
import { TooltipProvider } from 'src/components/ui/tooltip';

import { ENV } from 'src/config/env';

import { scheduleAutoRefresh } from 'src/core/http';
import { getQueryClient } from 'src/core/query-client';

import { useSessionStore } from 'src/state/session-store';

import { ThemeSync } from './theme-sync';

/**
 * Baca sesi dari cookie & pasang jadwal auto-refresh token di ROOT aplikasi, supaya aktif di
 * semua route termasuk halaman pengerjaan soal (pelajaran dari issue #3 fe-solutest).
 */
function SessionBootstrap() {
  const sync = useSessionStore((s) => s.sync);
  useEffect(() => {
    sync();
    scheduleAutoRefresh();
  }, [sync]);
  return null;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={getQueryClient()}>
      <TooltipProvider delayDuration={200}>
        <SessionBootstrap />
        <ThemeSync />
        {children}
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
      {!ENV.isProduction && <ReactQueryDevtools buttonPosition="bottom-left" />}
    </QueryClientProvider>
  );
}
