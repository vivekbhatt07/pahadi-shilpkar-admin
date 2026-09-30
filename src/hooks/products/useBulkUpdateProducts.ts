import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { productsService } from '@/api/services/products';
import { QUERY_KEYS } from '@/constants/query-key';
import type { BulkUpdateProductsPayload } from '@/types/api';

/** One change to many products — see `productsService.bulkUpdate`. */
export const useBulkUpdateProducts = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: BulkUpdateProductsPayload) =>
      productsService.bulkUpdate(payload),
    onSuccess: (response) => {
      // Combos derive their worth and availability from their products.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMBOS.ALL });
      const updated = response.data?.updated ?? 0;
      toast.success(response.message, {
        description: `${updated} ${updated === 1 ? 'product' : 'products'} changed.`,
      });
    },
  });
};
