import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { processService } from '@/api/services/process';
import { QUERY_KEYS } from '@/constants/query-key';
import type { UpdateProcessStepPayload } from '@/types/api';

type TVariables = { id: string; payload: UpdateProcessStepPayload };

export const useUpdateProcessStep = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: TVariables) =>
      processService.updateStep(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PROCESS.ALL });
    },
  });
};
