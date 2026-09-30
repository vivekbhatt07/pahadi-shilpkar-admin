import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { bannersService } from '@/api/services/banners';
import { QUERY_KEYS } from '@/constants/query-key';
import type { CreateBannerPayload } from '@/types/api';

export const useCreateBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateBannerPayload) =>
      bannersService.create(payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANNERS.ALL });
    },
  });
};
