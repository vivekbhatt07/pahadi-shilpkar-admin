import { BrowserRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';

import ErrorBoundary from '@/components/custom/ErrorBoundary';
import ErrorFallback from '@/components/custom/ErrorFallback';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { queryClient } from '@/lib/query-client';
import { AppRouter } from './routes/AppRouter';
import './App.css';

// Last resort for a crash outside a page (header, sidebar, providers) — pages
// have their own boundary in PageLayout that keeps the shell usable.
const renderAppFallback = (props: { error: Error; reset: () => void }) => (
  <div className="flex min-h-dvh items-center justify-center bg-stone-50 px-4 dark:bg-stone-950">
    <ErrorFallback {...props} />
  </div>
);

function App() {
  return (
    <ErrorBoundary fallback={renderAppFallback}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <BrowserRouter>
            <AppRouter />
          </BrowserRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
