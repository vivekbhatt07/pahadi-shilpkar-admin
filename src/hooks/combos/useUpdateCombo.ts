import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { combosService } from '@/api/services/combos';
import { QUERY_KEYS } from '@/constants/query-key';
import type { UpdateComboPayload } from '@/types/api';

type TVariables = { id: string; payload: UpdateComboPayload };

export const useUpdateCombo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: TVariables) =>
      combosService.update(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMBOS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.DETAILS });
    },
  });
};
