import { CloudDownload, RefreshCw, TriangleAlert } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import { Button } from '@/components/ui/button';
import { isChunkLoadError } from '@/helpers/chunk-error';
import { cn } from '@/lib/utils';

type TErrorFallbackProps = {
  error: Error;
  reset: () => void;
  className?: string;
};

const reloadPage = () => window.location.reload();

/** What an ErrorBoundary shows in place of a page that crashed. */
const ErrorFallback = ({ error, reset, className }: TErrorFallbackProps) => {
  // A stale chunk fails the same way on every retry — only a reload helps
  if (isChunkLoadError(error)) {
    return (
      <EmptyState
        className={className}
        icon={<CloudDownload className="size-5" />}
        title="A new version of the admin is available"
        description="Reload to finish loading this page. Unsaved changes on this page will be lost."
        action={
          <Button onClick={reloadPage}>
            <RefreshCw />
            Reload
          </Button>
        }
      />
    );
  }

  return (
    <EmptyState
      className={className}
      icon={<TriangleAlert className="size-5" />}
      title="This page ran into a problem"
      description="Try again, or reload if it keeps happening."
      action={
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={reloadPage}>
              Reload
            </Button>
            <Button onClick={reset}>
              <RefreshCw />
              Try again
            </Button>
          </div>
          {import.meta.env.DEV && (
            <pre
              className={cn(
                'max-w-xl overflow-x-auto rounded-lg bg-stone-100 px-3 py-2 text-left text-xs text-red-700',
                'dark:bg-stone-900 dark:text-red-400',
              )}
            >
              {error.message}
            </pre>
          )}
        </div>
      }
    />
  );
};

export default ErrorFallback;
