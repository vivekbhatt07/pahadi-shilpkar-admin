import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { combosService } from '@/api/services/combos';
import { QUERY_KEYS } from '@/constants/query-key';

/** Removes the combo and its testimonials; its products are untouched. */
export const useDeleteCombo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => combosService.remove(id),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMBOS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.DETAILS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TESTIMONIALS.ALL });
    },
  });
};
