import { useQuery } from '@tanstack/react-query';

import { processService } from '@/api/services/process';
import { QUERY_KEYS } from '@/constants/query-key';
import type { ProcessParams } from '@/types/api';

/** The "How we make it" page — its words and its steps, in order. */
export const useProcess = (params: ProcessParams = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.PROCESS.GET(params),
    queryFn: async () => {
      const response = await processService.get(params);
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
  });
