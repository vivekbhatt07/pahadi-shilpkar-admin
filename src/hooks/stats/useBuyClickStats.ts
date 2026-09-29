import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { statsService } from '@/api/services/stats';
import { QUERY_KEYS } from '@/constants/query-key';

/** Clicks only come from shoppers, so a few minutes of caching is plenty. */
export const useBuyClickStats = (days: number) =>
  useQuery({
    queryKey: QUERY_KEYS.BUY_CLICK_STATS(days),
    queryFn: async () => {
      const response = await statsService.getBuyClicks(days);
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    // Switching the window keeps the old numbers up until the new ones land.
    placeholderData: keepPreviousData,
  });
