import api from '@/api';
import type {
  ApiResponse,
  Paginated,
  Testimonial,
  TestimonialFilter,
  TestimonialListParams,
  TestimonialWithListing,
} from '@/types/api';

export const testimonialsService = {
  /**
   * One product's or one combo's testimonials, newest first, not paginated.
   * The admin token also returns those of inactive products and hidden combos.
   */
  list: async (filter: TestimonialFilter) => {
    const { data } = await api.get<ApiResponse<Testimonial[]>>(
      '/testimonials',
      { params: filter },
    );
    return data;
  },

  /** Newest first, across all products and combos. Admin only. */
  listAll: async (params: TestimonialListParams = {}) => {
    const query: Record<string, string> = {};
    if (params.page) query.page = String(params.page);
    if (params.limit) query.limit = String(params.limit);

    const { data } = await api.get<
      ApiResponse<Paginated<TestimonialWithListing>>
    >('/testimonials/all', { params: query });
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete<ApiResponse>(`/testimonials/${id}`);
    return data;
  },
};
