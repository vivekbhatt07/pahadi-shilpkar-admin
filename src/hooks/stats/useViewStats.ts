import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { statsService } from '@/api/services/stats';
import { QUERY_KEYS } from '@/constants/query-key';

/** Views only come from shoppers, so a few minutes of caching is plenty. */
export const useViewStats = (days: number) =>
  useQuery({
    queryKey: QUERY_KEYS.VIEW_STATS(days),
    queryFn: async () => {
      const response = await statsService.getViews(days);
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    placeholderData: keepPreviousData,
  });
