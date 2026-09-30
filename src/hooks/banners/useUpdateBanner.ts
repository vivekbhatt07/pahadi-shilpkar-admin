import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { bannersService } from '@/api/services/banners';
import { QUERY_KEYS } from '@/constants/query-key';
import type { UpdateBannerPayload } from '@/types/api';

type TVariables = { id: string; payload: UpdateBannerPayload };

export const useUpdateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, payload }: TVariables) =>
      bannersService.update(id, payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANNERS.ALL });
    },
  });
};
