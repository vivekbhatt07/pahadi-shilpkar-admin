import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { productsService } from '@/api/services/products';
import { QUERY_KEYS } from '@/constants/query-key';
import type { StockHistoryParams } from '@/types/api';

/** A product's stock history — what changed its count, and why. */
export const useStockHistory = (
  productId: string | undefined,
  params: StockHistoryParams = {},
) =>
  useQuery({
    queryKey: QUERY_KEYS.STOCK_HISTORY(productId ?? '', params),
    queryFn: async () => {
      const response = await productsService.getStockHistory(
        productId!,
        params,
      );
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
    enabled: Boolean(productId),
    placeholderData: keepPreviousData,
  });
