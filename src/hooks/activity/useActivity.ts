import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { activityService } from '@/api/services/activity';
import { QUERY_KEYS } from '@/constants/query-key';
import type { ActivityListParams } from '@/types/api';

/** The activity log — refreshed after any change, since each adds an entry. */
export const useActivity = (params: ActivityListParams) =>
  useQuery({
    queryKey: QUERY_KEYS.ACTIVITY(params),
    queryFn: async () => {
      const response = await activityService.list(params);
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
    // Paging keeps the old rows up until the new ones land.
    placeholderData: keepPreviousData,
  });
