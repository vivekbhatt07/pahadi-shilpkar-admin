import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { productsService } from '@/api/services/products';
import { QUERY_KEYS } from '@/constants/query-key';
import { ROUTES } from '@/constants/routes';

/**
 * Creates a hidden copy and opens it in the edit form — the copy keeps the
 * original's purchase links and WhatsApp message, which usually need a look
 * before it goes live.
 */
export const useDuplicateProduct = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: (id: string) => productsService.duplicate(id),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      const copy = response.data;
      toast.success(response.message, {
        description: copy
          ? `“${copy.name}” stays hidden until you activate it.`
          : undefined,
      });
      if (copy) navigate(ROUTES.PRIVATE.PRODUCTS.EDIT(copy.slug));
    },
  });
};
