import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { testimonialsService } from '@/api/services/testimonials';
import { QUERY_KEYS } from '@/constants/query-key';
import type { ModerateTestimonialsPayload } from '@/types/api';

/**
 * Approve or reject one testimonial or a selection. Ratings count approved
 * testimonials only, so products and combos refresh too.
 */
export const useModerateTestimonials = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ModerateTestimonialsPayload) =>
      testimonialsService.moderate(payload),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TESTIMONIALS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMBOS.ALL });
    },
  });
};
