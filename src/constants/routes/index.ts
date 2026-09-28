export const ROUTES = {
  PRIVATE: {
    DASHBOARD: '/',
    CATEGORIES: '/categories',
    PRODUCTS: {
      ROOT: '/products',
      CREATE: '/products/new',
      DETAIL: (slug: string) => `/products/${slug}`,
      EDIT: (slug: string) => `/products/${slug}/edit`,
    },
    COMBOS: {
      ROOT: '/combos',
      CREATE: '/combos/new',
      DETAIL: (slug: string) => `/combos/${slug}`,
      EDIT: (slug: string) => `/combos/${slug}/edit`,
    },
    TESTIMONIALS: '/testimonials',
    CUSTOMERS: '/customers',
    SETTINGS: {
      ROOT: '/settings',
      PROFILE: '/settings/profile',
      SECURITY: '/settings/security',
      STORE: '/settings/store',
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
