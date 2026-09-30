import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { inquiriesService } from '@/api/services/inquiries';
import { QUERY_KEYS } from '@/constants/query-key';
import type { UpdateInquiryPayload } from '@/types/api';

type TVariables = { id: string; payload: UpdateInquiryPayload };

/** The stats refetch this triggers keeps the sidebar's "new" count right. */
export const useUpdateInquiry = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: TVariables) =>
      inquiriesService.update(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.INQUIRIES.ALL });
    },
  });
};
