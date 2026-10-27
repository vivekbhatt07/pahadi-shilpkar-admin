export const ROUTES = {
  PRIVATE: {
    DASHBOARD: '/',
    /** Every change admins made — who, what and when. */
    ACTIVITY: '/activity',
    CATEGORIES: '/categories',
    PRODUCTS: {
      ROOT: '/products',
      CREATE: '/products/new',
      DETAIL: (slug: string) => `/products/${slug}`,
      EDIT: (slug: string) => `/products/${slug}/edit`,
    },
    /** Every variant across products — stock at a glance. */
    VARIANTS: '/variants',
    COMBOS: {
      ROOT: '/combos',
      CREATE: '/combos/new',
      DETAIL: (slug: string) => `/combos/${slug}`,
      EDIT: (slug: string) => `/combos/${slug}/edit`,
    },
    BANNERS: '/banners',
    PROCESS: '/how-we-make',
    INQUIRIES: '/inquiries',
    TESTIMONIALS: '/testimonials',
    CUSTOMERS: '/customers',
    /** What things cost to make, and what the store earned. */
    COSTING: {
      ROOT: '/costing',
      LISTINGS: '/costing/products',
      PRODUCT: (productId: string) => `/costing/products/${productId}`,
      COMBO: (comboId: string) => `/costing/combos/${comboId}`,
      MATERIALS: '/costing/materials',
      MATERIAL: (id: string) => `/costing/materials/${id}`,
      SALES: '/costing/sales',
    },
    SETTINGS: {
      ROOT: '/settings',
      PROFILE: '/settings/profile',
      SECURITY: '/settings/security',
      STORE: '/settings/store',
      COSTING: '/settings/costing',
      APPEARANCE: '/settings/appearance',
    },
  },
  PUBLIC: {
    AUTH: {
      SIGN_IN: '/sign-in',
      FORGOT_PASSWORD: '/forgot-password',
    },
  },
};
