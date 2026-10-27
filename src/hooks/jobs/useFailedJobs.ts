import { useQuery } from '@tanstack/react-query';

import { jobsService } from '@/api/services/jobs';
import { QUERY_KEYS } from '@/constants/query-key';

/** Background jobs that gave up — asked for when the list is opened. */
export const useFailedJobs = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.FAILED_JOBS,
    queryFn: async () => {
      const response = await jobsService.failed();
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
    enabled,
  });
