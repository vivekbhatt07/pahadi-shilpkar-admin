import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { testimonialsService } from '@/api/services/testimonials';
import { QUERY_KEYS } from '@/constants/query-key';

type TVariables = { id: string; isFeatured: boolean };

/** Pin a testimonial to the front of the storefront's slider, or unpin it. */
export const useFeatureTestimonial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, isFeatured }: TVariables) =>
      testimonialsService.feature(id, isFeatured),
    onSuccess: (response) => {
      toast.success(response.message);
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TESTIMONIALS.ALL });
    },
  });
};
