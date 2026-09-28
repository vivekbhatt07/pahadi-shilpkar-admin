import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { getErrorMessage, isApiError } from '@/api/error';
import { productsService } from '@/api/services/products';
import { QUERY_KEYS } from '@/constants/query-key';
import { ROUTES } from '@/constants/routes';

/** The backend refuses (409) to delete a product while a combo contains it. */
export const isProductInCombosError = (error: unknown) =>
  isApiError(error) && error.status === 409;

/**
 * Hard delete. Also removes every testimonial on the product. The backend
 * refuses (409) while a combo still contains the product — the toast then
 * links to those combos.
 */
export const useDeleteProduct = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (id: string) => productsService.remove(id),
    meta: { silent: true },
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TESTIMONIALS.ALL });
    },
    onError: (error, id) => {
      if (isApiError(error) && error.handled) return;
      if (isProductInCombosError(error)) {
        toast.error(getErrorMessage(error), {
          action: {
            label: 'View combos',
            onClick: () =>
              navigate(`${ROUTES.PRIVATE.COMBOS.ROOT}?productId=${id}`),
          },
        });
        return;
      }
      toast.error(getErrorMessage(error));
    },
  });
};
