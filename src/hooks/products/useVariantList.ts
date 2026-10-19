import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { productsService } from '@/api/services/products';
import { QUERY_KEYS } from '@/constants/query-key';
import type { VariantListParams } from '@/types/api';

/** Every variant across products, for the Variants page. */
export const useVariantList = (params: VariantListParams = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.PRODUCTS.VARIANTS(params),
    queryFn: async () => {
      const response = await productsService.listVariants(params);
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
    // Paging and filtering keep the old rows up until the new ones land
    placeholderData: keepPreviousData,
  });
