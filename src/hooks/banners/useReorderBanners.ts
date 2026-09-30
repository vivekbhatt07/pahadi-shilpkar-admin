import { useMutation, useQueryClient } from '@tanstack/react-query';

import { bannersService } from '@/api/services/banners';
import { QUERY_KEYS } from '@/constants/query-key';
import type { ReorderBannersPayload } from '@/types/api';

/**
 * No success toast: the list reorders optimistically on drop, so one per
 * drop would be noise. A failure still toasts via the mutation cache, and
 * the refetch puts the list back in its saved order.
 */
export const useReorderBanners = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReorderBannersPayload) =>
      bannersService.reorder(payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANNERS.ALL });
    },
  });
};
