import { Loader2, RotateCcw, X } from 'lucide-react';

import Callout from '@/components/custom/Callout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime } from '@/helpers/format';
import { useDismissJob, useFailedJobs, useRetryJob } from '@/hooks/jobs';
import type { FailedJob, JobType } from '@/types/api';

import { JOB_DESCRIPTIONS } from '../constants';

type TFailedJobsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const describe = (type: string) =>
  JOB_DESCRIPTIONS[type as JobType] ?? { title: type, undone: '' };

const FailedJobRow = ({ job }: { job: FailedJob }) => {
  const retry = useRetryJob();
  const dismiss = useDismissJob();
  const { title, undone } = describe(job.type);
  const busy = retry.isPending || dismiss.isPending;

  return (
    <li className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
          {title}
        </p>
        <p className="text-xs text-stone-500 dark:text-stone-400">
          Gave up {formatDateTime(job.failedAt)} after {job.attempts}{' '}
          {job.attempts === 1 ? 'try' : 'tries'}
          {undone && ` · ${undone}`}
        </p>
        {job.lastError && (
          <p className="mt-1 font-mono text-xs break-words text-red-700 dark:text-red-300">
            {job.lastError}
          </p>
        )}
      </div>
      <div className="flex shrink-0 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={busy}
          onClick={() => retry.mutate(job.id)}
          startAdornment={
            retry.isPending ? (
              <Loader2 className="animate-spin" />
            ) : (
              <RotateCcw />
            )
          }
        >
          Try again
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={busy}
          onClick={() => dismiss.mutate(job.id)}
          aria-label={`Dismiss: ${title}`}
          startAdornment={<X />}
        >
          Dismiss
        </Button>
      </div>
    </li>
  );
};

/**
 * Background jobs that gave up — an email that never went out, a cleanup
 * that never ran — to try again or dismiss.
 */
const FailedJobsDialog = ({ open, onOpenChange }: TFailedJobsDialogProps) => {
  const failed = useFailedJobs({ enabled: open });
  const items = failed.data?.items ?? [];
  const hidden = (failed.data?.total ?? 0) - items.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Background tasks that gave up</DialogTitle>
          <DialogDescription>
            Each was tried five times over about 40 minutes. Try one again once
            whatever stopped it — usually the email service — is back.
          </DialogDescription>
        </DialogHeader>

        {failed.isPending ? (
          <div
            className="flex flex-col gap-3"
            role="status"
            aria-label="Loading"
          >
            <Skeleton className="h-14 w-full rounded-lg" />
            <Skeleton className="h-14 w-full rounded-lg" />
          </div>
        ) : failed.isError ? (
          <Callout variant="danger">{failed.error.message}</Callout>
        ) : items.length === 0 ? (
          <p className="text-sm text-stone-500 dark:text-stone-400">
            Nothing failed — every task went through.
          </p>
        ) : (
          <ul className="flex max-h-[60dvh] flex-col divide-y divide-stone-100 overflow-y-auto dark:divide-stone-800">
            {items.map((job) => (
              <FailedJobRow key={job.id} job={job} />
            ))}
          </ul>
        )}

        {hidden > 0 && (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            And {hidden} older — they show once these are dealt with.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FailedJobsDialog;
