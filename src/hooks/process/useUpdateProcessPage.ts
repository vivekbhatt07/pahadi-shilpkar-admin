import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { processService } from '@/api/services/process';
import { QUERY_KEYS } from '@/constants/query-key';
import type { UpdateProcessPagePayload } from '@/types/api';

export const useUpdateProcessPage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: UpdateProcessPagePayload) =>
      processService.updatePage(payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROCESS.ALL });
    },
  });
};
