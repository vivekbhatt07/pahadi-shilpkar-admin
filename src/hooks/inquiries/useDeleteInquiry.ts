import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { inquiriesService } from '@/api/services/inquiries';
import { QUERY_KEYS } from '@/constants/query-key';

export const useDeleteInquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => inquiriesService.remove(id),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INQUIRIES.ALL });
    },
  });
};
