import { useQuery } from '@tanstack/react-query';

import { statsService } from '@/api/services/stats';
import { QUERY_KEYS } from '@/constants/query-key';

/** Unmet demand — refreshed after any admin write, like the other stats. */
export const useStockAlertStats = () =>
  useQuery({
    queryKey: QUERY_KEYS.STOCK_ALERT_STATS,
    queryFn: async () => {
      const response = await statsService.getStockAlerts();
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
  });
