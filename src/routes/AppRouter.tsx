import { Navigate, Route, Routes } from 'react-router';

import BrandMark from '@/components/custom/BrandMark';
import PageLayout from '@/components/layouts/PageLayout';
import { Loader } from '@/components/ui/loader';
import { ROUTES } from '@/constants/routes';
import { useAuthBootstrap } from '@/hooks/auth';
import CategoriesPage from '@/pages/private/categories';
import CombosPage from '@/pages/private/combos';
import CreateComboPage from '@/pages/private/combos/create';
import ComboDetailPage from '@/pages/private/combos/detail';
import EditComboPage from '@/pages/private/combos/edit';
import DashboardPage from '@/pages/private/dashboard';
import ProductsPage from '@/pages/private/products';
import CreateProductPage from '@/pages/private/products/create';
import ProductDetailPage from '@/pages/private/products/detail';
import EditProductPage from '@/pages/private/products/edit';
import SettingsLayout from '@/pages/private/settings/layout';
import AppearancePage from '@/pages/private/settings/appearance';
import ProfilePage from '@/pages/private/settings/profile';
import SecurityPage from '@/pages/private/settings/security';
import StoreSettingsPage from '@/pages/private/settings/store';
import TestimonialsPage from '@/pages/private/testimonials';
import CustomersPage from '@/pages/private/customers';
import ForgotPasswordPage from '@/pages/public/auth/forgot-password';
import SignInPage from '@/pages/public/auth/sign-in';
import NotFoundPage from '@/pages/public/errors/not-found';

import ProtectedRoute from './ProtectedRoute';
import PublicOnlyRoute from './PublicOnlyRoute';

export const AppRouter = () => {
  const { isHydrating } = useAuthBootstrap();

  // Re-checking the persisted session against /auth/me before rendering
  // anything protected avoids a flash of stale admin UI.
  if (isHydrating) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center gap-5">
        <BrandMark size="lg" className="animate-pulse" />
        <div className="flex items-center gap-2 text-sm text-stone-500 dark:text-stone-400">
          <Loader size="sm" label="Restoring session…" />
          Restoring your session…
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route element={<PageLayout />}>
        {/* Public auth pages */}
        <Route element={<PublicOnlyRoute />}>
          <Route path={ROUTES.PUBLIC.AUTH.SIGN_IN} element={<SignInPage />} />
          <Route
            path={ROUTES.PUBLIC.AUTH.FORGOT_PASSWORD}
            element={<ForgotPasswordPage />}
          />
        </Route>

        {/* Admin pages */}
        <Route element={<ProtectedRoute />}>
          <Route path={ROUTES.PRIVATE.DASHBOARD} element={<DashboardPage />} />
          <Route
            path={ROUTES.PRIVATE.CATEGORIES}
            element={<CategoriesPage />}
          />
          <Route
            path={ROUTES.PRIVATE.PRODUCTS.ROOT}
            element={<ProductsPage />}
          />
          <Route
            path={ROUTES.PRIVATE.PRODUCTS.CREATE}
            element={<CreateProductPage />}
          />
          <Route
            path={ROUTES.PRIVATE.PRODUCTS.DETAIL(':slug')}
            element={<ProductDetailPage />}
          />
          <Route
            path={ROUTES.PRIVATE.PRODUCTS.EDIT(':slug')}
            element={<EditProductPage />}
          />
          <Route path={ROUTES.PRIVATE.COMBOS.ROOT} element={<CombosPage />} />
          <Route
            path={ROUTES.PRIVATE.COMBOS.CREATE}
            element={<CreateComboPage />}
          />
          <Route
            path={ROUTES.PRIVATE.COMBOS.DETAIL(':slug')}
            element={<ComboDetailPage />}
          />
          <Route
            path={ROUTES.PRIVATE.COMBOS.EDIT(':slug')}
            element={<EditComboPage />}
          />
          <Route
            path={ROUTES.PRIVATE.TESTIMONIALS}
            element={<TestimonialsPage />}
          />
          <Route path={ROUTES.PRIVATE.CUSTOMERS} element={<CustomersPage />} />
          <Route
            path={ROUTES.PRIVATE.SETTINGS.ROOT}
            element={<SettingsLayout />}
          >
            <Route
              index
              element={
                <Navigate to={ROUTES.PRIVATE.SETTINGS.PROFILE} replace />
              }
            />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="security" element={<SecurityPage />} />
            <Route path="store" element={<StoreSettingsPage />} />
            <Route path="appearance" element={<AppearancePage />} />
          </Route>
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
};
