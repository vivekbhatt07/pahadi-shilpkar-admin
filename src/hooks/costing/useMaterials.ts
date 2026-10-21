import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { costingService } from '@/api/services/costing';
import { QUERY_KEYS } from '@/constants/query-key';
import type { MaterialListParams } from '@/types/api';

export const useMaterials = (params: MaterialListParams) =>
  useQuery({
    queryKey: QUERY_KEYS.COSTING.MATERIALS(params),
    queryFn: async () =>
      (await costingService.listMaterials(params)).data ?? {
        items: [],
        total: 0,
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        hasMore: false,
        categories: [],
      },
    placeholderData: keepPreviousData,
  });
