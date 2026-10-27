import { lazy, type ComponentType } from 'react';

// Every page but the 404 loads on demand — sign-in too: a session lasts days,
// so most visits open straight on the dashboard, and needn't download the
// sign-in form (with zod and react-hook-form) first. Once signed in,
// preloadPagesWhenIdle() fetches the rest in the background and navigation
// never waits on a chunk.

type TPageModule = { default: ComponentType };

type TPageLoader = () => Promise<TPageModule>;

const loaders: TPageLoader[] = [];

/** React.lazy that also registers the import for preloading. */
const lazyPage = (load: TPageLoader) => {
  loaders.push(load);
  return lazy(load);
};

export const SignInPage = lazyPage(() => import('@/pages/public/auth/sign-in'));
export const ForgotPasswordPage = lazyPage(
  () => import('@/pages/public/auth/forgot-password'),
);
export const DashboardPage = lazyPage(
  () => import('@/pages/private/dashboard'),
);
export const ActivityPage = lazyPage(() => import('@/pages/private/activity'));
export const CategoriesPage = lazyPage(
  () => import('@/pages/private/categories'),
);
export const ProductsPage = lazyPage(() => import('@/pages/private/products'));
export const CreateProductPage = lazyPage(
  () => import('@/pages/private/products/create'),
);
export const ProductDetailPage = lazyPage(
  () => import('@/pages/private/products/detail'),
);
export const EditProductPage = lazyPage(
  () => import('@/pages/private/products/edit'),
);
export const VariantsPage = lazyPage(() => import('@/pages/private/variants'));
export const CombosPage = lazyPage(() => import('@/pages/private/combos'));
export const CreateComboPage = lazyPage(
  () => import('@/pages/private/combos/create'),
);
export const ComboDetailPage = lazyPage(
  () => import('@/pages/private/combos/detail'),
);
export const EditComboPage = lazyPage(
  () => import('@/pages/private/combos/edit'),
);
export const BannersPage = lazyPage(() => import('@/pages/private/banners'));
export const ProcessPage = lazyPage(() => import('@/pages/private/process'));
export const InquiriesPage = lazyPage(
  () => import('@/pages/private/inquiries'),
);
export const TestimonialsPage = lazyPage(
  () => import('@/pages/private/testimonials'),
);
export const CustomersPage = lazyPage(
  () => import('@/pages/private/customers'),
);
export const CostingOverviewPage = lazyPage(
  () => import('@/pages/private/costing'),
);
export const CostedListingsPage = lazyPage(
  () => import('@/pages/private/costing/listings'),
);
export const ProductCostingPage = lazyPage(
  () => import('@/pages/private/costing/product'),
);
export const ComboCostingPage = lazyPage(
  () => import('@/pages/private/costing/combo'),
);
export const MaterialsPage = lazyPage(
  () => import('@/pages/private/costing/materials'),
);
export const MaterialDetailPage = lazyPage(
  () => import('@/pages/private/costing/materials/detail'),
);
export const SalesPage = lazyPage(
  () => import('@/pages/private/costing/sales'),
);
export const SettingsLayout = lazyPage(
  () => import('@/pages/private/settings/layout'),
);
export const ProfilePage = lazyPage(
  () => import('@/pages/private/settings/profile'),
);
export const SecurityPage = lazyPage(
  () => import('@/pages/private/settings/security'),
);
export const StoreSettingsPage = lazyPage(
  () => import('@/pages/private/settings/store'),
);
export const CostingSettingsPage = lazyPage(
  () => import('@/pages/private/settings/costing'),
);
export const AppearancePage = lazyPage(
  () => import('@/pages/private/settings/appearance'),
);

/** Safari has no requestIdleCallback; a short timeout stands in for it. */
const IDLE_FALLBACK_MS = 1500;

/**
 * Fetches every page chunk once the browser is idle. import() is cached, so a
 * page that already loaded costs nothing. Returns a cleanup that cancels a
 * preload that hasn't started yet. `pageLoaders` is for tests.
 */
export const preloadPagesWhenIdle = (
  pageLoaders: readonly TPageLoader[] = loaders,
): (() => void) => {
  const preload = () => {
    // A failed fetch is cached by the browser for the session — skip while
    // offline rather than leave pages that can never load until a reload.
    if (!navigator.onLine) return;
    for (const load of pageLoaders) load().catch(() => undefined);
  };

  if (typeof window.requestIdleCallback === 'function') {
    const id = window.requestIdleCallback(preload);
    return () => window.cancelIdleCallback(id);
  }
  const id = window.setTimeout(preload, IDLE_FALLBACK_MS);
  return () => window.clearTimeout(id);
};
