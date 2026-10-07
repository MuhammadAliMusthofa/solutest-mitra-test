import { QueryClient } from '@tanstack/react-query';

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        retry: (count, error) => {
          const status = (error as { response?: { status?: number } })?.response?.status ?? 0;
          // 4xx tidak akan berubah dengan diulang
          return status >= 400 && status < 500 ? false : count < 1;
        },
        refetchOnWindowFocus: false,
      },
      mutations: { retry: false },
    },
  });

let browserQueryClient: QueryClient | undefined;

/** Server: client baru per render. Browser: satu client dipakai ulang. */
export const getQueryClient = () => {
  if (typeof window === 'undefined') return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
};
