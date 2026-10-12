import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { settingsService } from '@/api/services/settings';
import { QUERY_KEYS } from '@/constants/query-key';
import type { UpdateSettingsPayload } from '@/types/api';

export const useUpdateSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateSettingsPayload) =>
      settingsService.update(payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.setQueryData(QUERY_KEYS.SETTINGS.GET, response.data);
      // Every product's and combo's derived whatsappUrl depends on
      // whatsappNumber, and their delivery on the store default.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMBOS.ALL });
    },
  });
};
