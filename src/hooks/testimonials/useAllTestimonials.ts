import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { testimonialsService } from '@/api/services/testimonials';
import { QUERY_KEYS } from '@/constants/query-key';
import type { TestimonialListParams } from '@/types/api';

/** Admin-only global feed, across all products and combos. */
export const useAllTestimonials = (params: TestimonialListParams = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.TESTIMONIALS.ALL_LIST(params),
    queryFn: async () => {
      const response = await testimonialsService.listAll(params);
      return (
        response.data ?? {
          items: [],
          total: 0,
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          hasMore: false,
        }
      );
    },
    placeholderData: keepPreviousData,
  });
