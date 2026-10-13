import api from '@/api';
import type {
  AnswerPhotoRequestPayload,
  ApiResponse,
  ModerateTestimonialsPayload,
  Paginated,
  TestimonialListParams,
  TestimonialWithListing,
} from '@/types/api';

export const testimonialsService = {
  /**
   * Newest first, across all products and combos, in every status unless
   * filtered — also one product's or combo's. Admin only.
   */
  listAll: async (params: TestimonialListParams = {}) => {
    const query: Record<string, string> = {};
    if (params.status) query.status = params.status;
    if (params.photoRequest) query.photoRequest = params.photoRequest;
    if (params.productId) query.productId = params.productId;
    if (params.comboId) query.comboId = params.comboId;
    if (params.withPhotos !== undefined) {
      query.withPhotos = String(params.withPhotos);
    }
    if (params.page) query.page = String(params.page);
    if (params.limit) query.limit = String(params.limit);

    const { data } = await api.get<
      ApiResponse<Paginated<TestimonialWithListing>>
    >('/testimonials/all', { params: query });
    return data;
  },

  /** Approve or reject 1–100 at once — all or nothing. */
  moderate: async (payload: ModerateTestimonialsPayload) => {
    const { data } = await api.patch<ApiResponse<{ updated: number }>>(
      '/testimonials/moderate',
      payload,
    );
    return data;
  },

  /** Pin to the storefront's slider — approved ones only (409 otherwise). */
  feature: async (id: string, isFeatured: boolean) => {
    const { data } = await api.patch<ApiResponse<TestimonialWithListing>>(
      `/testimonials/${id}/feature`,
      { isFeatured },
    );
    return data;
  },

  /** Grant or decline an author's request to change their photos. */
  answerPhotoRequest: async (
    id: string,
    payload: AnswerPhotoRequestPayload,
  ) => {
    const { data } = await api.patch<ApiResponse<TestimonialWithListing>>(
      `/testimonials/${id}/photo-request`,
      payload,
    );
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete<ApiResponse>(`/testimonials/${id}`);
    return data;
  },
};
