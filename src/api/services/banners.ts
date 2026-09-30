import api from '@/api';
import type {
  ApiResponse,
  Banner,
  BannerListParams,
  CreateBannerPayload,
  ReorderBannersPayload,
  UpdateBannerPayload,
} from '@/types/api';

export const bannersService = {
  /** In storefront order (sortOrder, then newest). Not paginated. */
  list: async (params: BannerListParams = {}) => {
    const { data } = await api.get<ApiResponse<Banner[]>>('/banners', {
      params: params.includeInactive ? { includeInactive: 'true' } : {},
    });
    return data;
  },

  create: async (payload: CreateBannerPayload) => {
    const { data } = await api.post<ApiResponse<Banner>>('/banners', payload);
    return data;
  },

  update: async (id: string, payload: UpdateBannerPayload) => {
    const { data } = await api.patch<ApiResponse<Banner>>(
      `/banners/${id}`,
      payload,
    );
    return data;
  },

  /** Applied in one transaction. 1–50 items; an unknown id fails them all. */
  reorder: async (payload: ReorderBannersPayload) => {
    const { data } = await api.patch<ApiResponse>('/banners/reorder', payload);
    return data;
  },

  remove: async (id: string) => {
    const { data } = await api.delete<ApiResponse>(`/banners/${id}`);
    return data;
  },
};
