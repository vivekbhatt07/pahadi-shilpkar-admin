import { useQuery } from '@tanstack/react-query';

import { statsService } from '@/api/services/stats';
import { QUERY_KEYS } from '@/constants/query-key';

/**
 * One product's buy clicks and waiting shoppers, variant by variant. Only
 * fetched for a product with variants — the numbers are a nice-to-have, so
 * a failure stays quiet and the table simply goes without them.
 */
export const useProductDemand = (
  productId: string | undefined,
  days: number,
  enabled = true,
) =>
  useQuery({
    queryKey: QUERY_KEYS.PRODUCT_DEMAND(productId ?? '', days),
    queryFn: async () => {
      const response = await statsService.getProductDemand(productId!, days);
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
    enabled: Boolean(productId) && enabled,
    staleTime: 5 * 60 * 1000,
    meta: { silent: true },
  });
