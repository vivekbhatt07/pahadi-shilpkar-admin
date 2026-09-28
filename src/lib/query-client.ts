import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { isApiError } from '@/api/error';
import { QUERY_KEYS } from '@/constants/query-key';

declare module '@tanstack/react-query' {
  interface Register {
    queryMeta: { silent?: boolean };
    mutationMeta: { silent?: boolean };
  }
}

const notifyError = (error: unknown, silent?: boolean) => {
  if (silent) return;
  // 401/403/429 already produced their own UI in the API client.
  if (isApiError(error) && error.handled) return;
  toast.error(
    error instanceof Error && error.message
      ? error.message
      : 'Something went wrong. Please try again later',
  );
};

/**
 * Tuned for the backend's 100-requests / 15-minute rate limit: no automatic
 * retries, no refetch on window focus, and generous staleTimes so navigating
 * between pages reuses cached data.
 */
export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error, query) => notifyError(error, query.meta?.silent),
  }),
  mutationCache: new MutationCache({
    onError: (error, _variables, _context, mutation) =>
      notifyError(error, mutation.meta?.silent),
    // Almost any write moves a dashboard count, so mark the stats stale and
    // let the dashboard refetch them the next time it is shown.
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STATS });
    },
  }),
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
      staleTime: 60 * 1000,
    },
    mutations: {
      retry: false,
    },
  },
});
