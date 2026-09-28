import api from '@/api';
import type {
  ApiResponse,
  CreateProductPayload,
  Paginated,
  Product,
  ProductDetail,
  ProductListParams,
  UpdateProductPayload,
} from '@/types/api';

const toQuery = (params: ProductListParams) => {
  const query: Record<string, string> = {};
  if (params.categoryId) query.categoryId = params.categoryId;
  if (params.categorySlug) query.categorySlug = params.categorySlug;
  if (params.isFeatured !== undefined) {
    query.isFeatured = String(params.isFeatured);
  }
  if (params.isBestseller !== undefined) {
    query.isBestseller = String(params.isBestseller);
  }
  if (params.availability) query.availability = params.availability;
  if (params.tag) query.tag = params.tag;
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

export const productsService = {
  /** Newest first by default. Without includeInactive only active products are returned. */
  list: async (params: ProductListParams = {}) => {
    const { data } = await api.get<ApiResponse<Paginated<Product>>>(
      '/products',
      { params: toQuery(params) },
    );
    return data;
  },

  getBySlug: async (slug: string, includeInactive = false) => {
    const { data } = await api.get<ApiResponse<ProductDetail>>(
      `/products/${slug}`,
      { params: includeInactive ? { includeInactive: 'true' } : {} },
    );
    return data;
  },

  create: async (payload: CreateProductPayload) => {
    const { data } = await api.post<ApiResponse<Product>>('/products', payload);
    return data;
  },

  update: async (id: string, payload: UpdateProductPayload) => {
    const { data } = await api.patch<ApiResponse<Product>>(
      `/products/${id}`,
      payload,
    );
    return data;
  },

  /**
   * Hard delete. Cascades every testimonial on the product. 409 while any
   * combo still contains it.
   */
  remove: async (id: string) => {
    const { data } = await api.delete<ApiResponse>(`/products/${id}`);
    return data;
  },
};
