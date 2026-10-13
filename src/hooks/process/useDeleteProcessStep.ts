import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { processService } from '@/api/services/process';
import { QUERY_KEYS } from '@/constants/query-key';

export const useDeleteProcessStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => processService.removeStep(id),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROCESS.ALL });
    },
  });
};
