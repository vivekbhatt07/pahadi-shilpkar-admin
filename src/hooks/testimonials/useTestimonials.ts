import { useQuery } from '@tanstack/react-query';

import { testimonialsService } from '@/api/services/testimonials';
import { QUERY_KEYS } from '@/constants/query-key';
import type { TestimonialFilter } from '@/types/api';

/** One product's or one combo's testimonials; the global feed is useAllTestimonials. */
export const useTestimonials = (filter: TestimonialFilter) =>
  useQuery({
    queryKey: QUERY_KEYS.TESTIMONIALS.LIST(filter),
    queryFn: async () => (await testimonialsService.list(filter)).data ?? [],
  });
