import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { combosService } from '@/api/services/combos';
import { QUERY_KEYS } from '@/constants/query-key';
import type { CreateComboPayload } from '@/types/api';

export const useCreateCombo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateComboPayload) => combosService.create(payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMBOS.ALL });
      // Product detail pages list the combos each product belongs to.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.DETAILS });
    },
  });
};
