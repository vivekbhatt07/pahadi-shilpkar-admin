import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { bannersService } from '@/api/services/banners';
import { QUERY_KEYS } from '@/constants/query-key';

export const useDeleteBanner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => bannersService.remove(id),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.BANNERS.ALL });
    },
  });
};
