import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { productsService } from '@/api/services/products';
import { QUERY_KEYS } from '@/constants/query-key';
import type { UpdateVariantPayload } from '@/types/api';

type TVariables = {
  productId: string;
  variantId: string;
  payload: UpdateVariantPayload;
};

/**
 * A quick edit of one variant — a restock, a new price, switching it off —
 * from the product page, without opening the whole form.
 */
export const useUpdateVariant = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ productId, variantId, payload }: TVariables) =>
      productsService.updateVariant(productId, variantId, payload),
    onSuccess: (response) => {
      // The product's derived figures moved, and so may its combos' worth
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMBOS.ALL });
      toast.success(response.message);
    },
  });
};
