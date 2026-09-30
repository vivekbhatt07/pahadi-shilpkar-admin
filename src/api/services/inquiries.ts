import api from '@/api';
import type {
  ApiResponse,
  Inquiry,
  InquiryListParams,
  Paginated,
  UpdateInquiryPayload,
} from '@/types/api';

export const inquiriesService = {
  /** Newest first. Admin only. */
  list: async (params: InquiryListParams = {}) => {
    const query: Record<string, string> = {};
    if (params.status) query.status = params.status;
    if (params.type) query.type = params.type;
    if (params.page) query.page = String(params.page);
    if (params.limit) query.limit = String(params.limit);

    const { data } = await api.get<ApiResponse<Paginated<Inquiry>>>(
      '/inquiries',
      { params: query },
    );
    return data;
  },

  update: async (id: string, payload: UpdateInquiryPayload) => {
    const { data } = await api.patch<ApiResponse<Inquiry>>(
      `/inquiries/${id}`,
      payload,
    );
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete<ApiResponse>(`/inquiries/${id}`);
    return data;
  },
};
