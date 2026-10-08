import type {
  BannerListParams,
  CategoryListParams,
  ComboListParams,
  CategoryTreeParams,
  InquiryListParams,
  ProductListParams,
  TestimonialFilter,
  TestimonialListParams,
  UserListParams,
} from '@/types/api';

export const QUERY_KEYS = {
  AUTH: {
    ME: ['auth', 'me'] as const,
  },
  CATEGORIES: {
    ALL: ['categories'] as const,
    LIST: (params: CategoryListParams = {}) =>
      ['categories', 'list', params] as const,
    TREE: (params: CategoryTreeParams = {}) =>
      ['categories', 'tree', params] as const,
    DETAIL: (slug: string) => ['categories', 'detail', slug] as const,
  },
  PRODUCTS: {
    ALL: ['products'] as const,
    LISTS: ['products', 'list'] as const,
    LIST: (params: ProductListParams) => ['products', 'list', params] as const,
    DETAILS: ['products', 'detail'] as const,
    DETAIL: (slug: string) => ['products', 'detail', slug] as const,
  },
  COMBOS: {
    ALL: ['combos'] as const,
    LIST: (params: ComboListParams) => ['combos', 'list', params] as const,
    DETAIL: (slug: string) => ['combos', 'detail', slug] as const,
  },
  STATS: ['stats'] as const,
  /**
   * Under STATS on purpose: every mutation invalidates STATS, and a product
   * save can email waiting shoppers and clear their alerts.
   */
  STOCK_ALERT_STATS: ['stats', 'stock-alerts'] as const,
  /** Deliberately not under STATS — admin writes never change storefront clicks. */
  BUY_CLICK_STATS: (days: number) => ['buy-click-stats', days] as const,
  TESTIMONIALS: {
    ALL: ['testimonials'] as const,
    LIST: (filter: TestimonialFilter) =>
      ['testimonials', 'list', filter] as const,
    ALL_LIST: (params: TestimonialListParams) =>
      ['testimonials', 'all', params] as const,
  },
  SETTINGS: {
    GET: ['settings'] as const,
  },
  BANNERS: {
    ALL: ['banners'] as const,
    LIST: (params: BannerListParams = {}) =>
      ['banners', 'list', params] as const,
  },
  INQUIRIES: {
    ALL: ['inquiries'] as const,
    LIST: (params: InquiryListParams) => ['inquiries', 'list', params] as const,
  },
  USERS: {
    ALL: ['users'] as const,
    LIST: (params: UserListParams) => ['users', 'list', params] as const,
  },
};
