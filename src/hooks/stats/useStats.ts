import { useQuery } from '@tanstack/react-query';

import { statsService } from '@/api/services/stats';
import { QUERY_KEYS } from '@/constants/query-key';

/** Every dashboard count in one request — see the query client for invalidation. */
export const useStats = () =>
  useQuery({
    queryKey: QUERY_KEYS.STATS,
    queryFn: async () => {
      const response = await statsService.get();
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
  });
