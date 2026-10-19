import { Navigate, Route, Routes } from 'react-router';

import BrandMark from '@/components/custom/BrandMark';
import PageLayout from '@/components/layouts/PageLayout';
import { Loader } from '@/components/ui/loader';
import { ROUTES } from '@/constants/routes';
import { useAuthBootstrap } from '@/hooks/auth';
import SignInPage from '@/pages/public/auth/sign-in';
import NotFoundPage from '@/pages/public/errors/not-found';

import {
  AppearancePage,
  BannersPage,
  CategoriesPage,
  ComboDetailPage,
  CombosPage,
  CreateComboPage,
  CreateProductPage,
  CustomersPage,
  DashboardPage,
  EditComboPage,
  EditProductPage,
  ForgotPasswordPage,
  InquiriesPage,
  ProcessPage,
  ProductDetailPage,
  ProductsPage,
  ProfilePage,
  SecurityPage,
  SettingsLayout,
  StoreSettingsPage,
  TestimonialsPage,
  VariantsPage,
} from './pages';
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
          <Route path={ROUTES.PRIVATE.VARIANTS} element={<VariantsPage />} />
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
          <Route path={ROUTES.PRIVATE.BANNERS} element={<BannersPage />} />
          <Route path={ROUTES.PRIVATE.PROCESS} element={<ProcessPage />} />
          <Route path={ROUTES.PRIVATE.INQUIRIES} element={<InquiriesPage />} />
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
