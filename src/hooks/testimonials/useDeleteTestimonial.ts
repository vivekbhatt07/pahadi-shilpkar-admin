import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { testimonialsService } from '@/api/services/testimonials';
import { QUERY_KEYS } from '@/constants/query-key';

/** Pass the slug of whichever was reviewed — the product or the combo. */
type TVariables = { id: string; productSlug?: string; comboSlug?: string };

export const useDeleteTestimonial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: TVariables) => testimonialsService.remove(id),
    onSuccess: (response, { productSlug, comboSlug }) => {
      toast.success(response.message);
      // Prefix match: also covers the per-listing LIST and the global ALL_LIST.
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.TESTIMONIALS.ALL });
      // avgRating / testimonialCount live on the product or combo detail.
      if (productSlug) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.PRODUCTS.DETAIL(productSlug),
        });
      }
      if (comboSlug) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.COMBOS.DETAIL(comboSlug),
        });
      }
    },
  });
};
