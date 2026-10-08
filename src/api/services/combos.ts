import api from '@/api';
import type {
  ApiResponse,
  Combo,
  ComboListParams,
  CreateComboPayload,
  Paginated,
  UpdateComboPayload,
} from '@/types/api';

const toQuery = (params: ComboListParams) => {
  const query: Record<string, string> = {};
  if (params.productId) query.productId = params.productId;
  if (params.isFeatured !== undefined) {
    query.isFeatured = String(params.isFeatured);
  }
  if (params.search) query.search = params.search;
  if (params.minPrice !== undefined) query.minPrice = String(params.minPrice);
  if (params.maxPrice !== undefined) query.maxPrice = String(params.maxPrice);
  if (params.sort) query.sort = params.sort;
  if (params.page) query.page = String(params.page);
  if (params.limit) query.limit = String(params.limit);
  if (params.isActive !== undefined) query.isActive = String(params.isActive);
  if (params.includeInactive) query.includeInactive = 'true';
  return query;
};

export const combosService = {
  /**
   * Newest first by default. Without includeInactive only combos the
   * storefront shows are returned (active, with every product active).
   */
  list: async (params: ComboListParams = {}) => {
    const { data } = await api.get<ApiResponse<Paginated<Combo>>>('/combos', {
      params: toQuery(params),
    });
    return data;
  },

  getBySlug: async (slug: string, includeInactive = false) => {
    const { data } = await api.get<ApiResponse<Combo>>(`/combos/${slug}`, {
      params: includeInactive ? { includeInactive: 'true' } : {},
    });
    return data;
  },

  create: async (payload: CreateComboPayload) => {
    const { data } = await api.post<ApiResponse<Combo>>('/combos', payload);
    return data;
  },

  update: async (id: string, payload: UpdateComboPayload) => {
    const { data } = await api.patch<ApiResponse<Combo>>(
      `/combos/${id}`,
      payload,
    );
    return data;
  },

  /** Removes the combo and its testimonials; its products are untouched. */
  remove: async (id: string) => {
    const { data } = await api.delete<ApiResponse>(`/combos/${id}`);
    return data;
  },
};
