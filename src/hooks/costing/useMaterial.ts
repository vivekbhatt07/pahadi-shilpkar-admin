import { useQuery } from '@tanstack/react-query';

import { costingService } from '@/api/services/costing';
import { QUERY_KEYS } from '@/constants/query-key';

/** With its price history and where it's used. */
export const useMaterial = (id: string | undefined) =>
  useQuery({
    queryKey: QUERY_KEYS.COSTING.MATERIAL(id ?? ''),
    queryFn: async () => (await costingService.getMaterial(id!)).data ?? null,
    enabled: Boolean(id),
  });
