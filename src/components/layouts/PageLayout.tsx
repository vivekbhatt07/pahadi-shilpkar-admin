import { Suspense, useEffect, useRef } from 'react';
import { Outlet, useLocation } from 'react-router';

import CommandPalette from '@/components/custom/CommandPalette';
import ErrorBoundary from '@/components/custom/ErrorBoundary';
import ErrorFallback from '@/components/custom/ErrorFallback';
import RateLimitBanner from '@/components/custom/RateLimitBanner';
import TopProgressBar from '@/components/custom/TopProgressBar';
import { Loader } from '@/components/ui/loader';
import { ROUTES } from '@/constants/routes';
import { cn } from '@/lib/utils';
import { preloadPagesWhenIdle } from '@/routes/pages';
import { useAuthStore } from '@/store/authStore';
import Header from './Header';
import Sidebar from './Sidebar';

/** While a page's code downloads — held back briefly so fast loads don't flash. */
const PageFallback = () => (
  <div className="flex flex-1 animate-fade-up items-center justify-center py-24 [animation-delay:150ms]">
    <Loader label="Loading page…" />
  </div>
);

const PageLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { pathname } = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  // <main> is the scroll container, so the browser won't reset it between
  // routes on its own.
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  // Signed in: fetch the other pages' code while the browser is idle.
  useEffect(() => {
    if (isAuthenticated) return preloadPagesWhenIdle();
  }, [isAuthenticated]);

  // Settings tabs animate their own content; keep the settings shell still.
  const transitionKey = pathname.startsWith(ROUTES.PRIVATE.SETTINGS.ROOT)
    ? ROUTES.PRIVATE.SETTINGS.ROOT
    : pathname;

  return (
    <div className="flex h-dvh flex-col bg-stone-50 dark:bg-stone-950">
      <TopProgressBar />
      <Header />
      <RateLimitBanner />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {isAuthenticated && <Sidebar />}
        <main
          ref={mainRef}
          className="flex min-w-0 flex-1 overflow-y-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8"
        >
          {/* Suspense sits outside the keyed page so it outlives navigation:
              React Router navigates in a transition, which then keeps the
              current page up while the next one's code loads. */}
          <Suspense fallback={<PageFallback />}>
            {/* Column, so each page keeps its natural height: in a row it would
                be stretched to the viewport and tall pages would squash
                overflow-clipping children (e.g. the settings tab bar). */}
            <div
              key={transitionKey}
              className={cn(
                'flex min-w-0 flex-1 flex-col animate-page-in',
                isAuthenticated && 'mx-auto w-full max-w-350',
              )}
            >
              <ErrorBoundary
                resetKey={pathname}
                fallback={(props) => <ErrorFallback {...props} />}
              >
                <Outlet />
              </ErrorBoundary>
            </div>
          </Suspense>
        </main>
      </div>
      {isAuthenticated && <CommandPalette />}
    </div>
  );
};

export default PageLayout;
