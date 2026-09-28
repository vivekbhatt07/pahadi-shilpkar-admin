import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { getErrorMessage, isApiError } from '@/api/error';
import { productsService } from '@/api/services/products';
import { QUERY_KEYS } from '@/constants/query-key';
import type { UpdateProductPayload } from '@/types/api';

type TVariables = { id: string; payload: UpdateProductPayload };

const UNDO_TOAST_DURATION_MS = 12_000;

/**
 * Deactivating (`isActive: false`) hides the product from the storefront and
 * public API; the panel keeps it visible (it always requests
 * `includeInactive=true`) and can flip it back via the same PATCH, offered
 * here as a quick "Undo" action right after saving.
 */
export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  // Combos derive their worth and availability from their products.
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
    queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMBOS.ALL });
  };

  const reactivate = async (id: string) => {
    try {
      const response = await productsService.update(id, { isActive: true });
      toast.success(response.message);
      invalidate();
    } catch (error) {
      if (!(isApiError(error) && error.handled)) {
        toast.error(getErrorMessage(error));
      }
    }
  };

  return useMutation({
    mutationFn: ({ id, payload }: TVariables) =>
      productsService.update(id, payload),
    onSuccess: (response, { payload }) => {
      invalidate();
      const updated = response.data;

      if (payload.isActive === false && updated) {
        toast.success(response.message, {
          description: `"${updated.name}" is now hidden from the storefront and this panel.`,
          duration: UNDO_TOAST_DURATION_MS,
          action: {
            label: 'Undo',
            onClick: () => void reactivate(updated.id),
          },
        });
        return;
      }

      toast.success(response.message);
    },
  });
};
