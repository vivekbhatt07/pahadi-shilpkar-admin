import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { combosService } from '@/api/services/combos';
import { QUERY_KEYS } from '@/constants/query-key';
import type { ComboListParams } from '@/types/api';

export const useCombos = (
  params: ComboListParams = {},
  options: { enabled?: boolean } = {},
) =>
  useQuery({
    enabled: options.enabled,
    queryKey: QUERY_KEYS.COMBOS.LIST(params),
    queryFn: async () => {
      const response = await combosService.list(params);
      return (
        response.data ?? {
          items: [],
          total: 0,
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          hasMore: false,
        }
      );
    },
    placeholderData: keepPreviousData,
  });
