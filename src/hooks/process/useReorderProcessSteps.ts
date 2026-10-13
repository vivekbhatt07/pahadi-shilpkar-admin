import { useMutation, useQueryClient } from '@tanstack/react-query';

import { processService } from '@/api/services/process';
import { QUERY_KEYS } from '@/constants/query-key';
import type { ReorderProcessStepsPayload } from '@/types/api';

/**
 * No success toast: the list reorders optimistically on drop, so one per
 * drop would be noise. A failure still toasts via the mutation cache, and
 * the refetch puts the list back in its saved order.
 */
export const useReorderProcessSteps = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReorderProcessStepsPayload) =>
      processService.reorderSteps(payload),
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROCESS.ALL });
    },
  });
};
