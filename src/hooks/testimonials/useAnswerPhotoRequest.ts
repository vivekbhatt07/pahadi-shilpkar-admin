import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { testimonialsService } from '@/api/services/testimonials';
import { QUERY_KEYS } from '@/constants/query-key';
import type { AnswerPhotoRequestPayload } from '@/types/api';

type TVariables = { id: string; payload: AnswerPhotoRequestPayload };

/** Grant an author one more photo change, or decline with a note. */
export const useAnswerPhotoRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: TVariables) =>
      testimonialsService.answerPhotoRequest(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TESTIMONIALS.ALL });
    },
  });
};
