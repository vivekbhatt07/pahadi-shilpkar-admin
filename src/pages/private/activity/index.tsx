import { useSearchParams } from 'react-router';
import { History } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import PageHeader from '@/components/custom/PageHeader';
import TablePagination from '@/components/custom/TablePagination';
import { Card, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useActivity } from '@/hooks/activity';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { ActivityArea } from '@/types/api';

import { ACTIVITY_AREA_OPTIONS } from './helpers';
import ActivityList from './layouts/ActivityList';

const LIMIT = 25;
const ALL = 'all';

/**
 * /activity — every change an admin made, newest first: who, what and when,
 * and which fields — never their values. Filtered by area, in the URL.
 */
const ActivityPage = () => {
  useDocumentTitle('Activity');
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const area = (searchParams.get('area') as ActivityArea | null) ?? undefined;

  const activity = useActivity({ page, limit: LIMIT, area });
  const items = activity.data?.items ?? [];

  const update = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Activity"
        count={activity.data?.total}
        description="Every change made in the admin panel — who made it, and when. The fields changed are named; their values aren't kept."
      />

      <div className="flex">
        <Select
          value={area ?? ALL}
          onValueChange={(value) =>
            update({ area: value === ALL ? undefined : value, page: undefined })
          }
        >
          <SelectTrigger
            className={cn(
              'sm:w-52',
              area &&
                'border-accent-300 bg-accent-50/60 text-accent-800 dark:border-accent-800 dark:bg-accent-950/30 dark:text-accent-200',
            )}
            aria-label="Filter by area"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL}>Everything</SelectItem>
            {ACTIVITY_AREA_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {activity.isPending ? (
        <ListSkeleton rows={8} media="circle" trailing={1} />
      ) : items.length > 0 ? (
        <div
          aria-busy={activity.isPlaceholderData}
          className={cn(
            'flex flex-col gap-4 transition-opacity duration-200',
            activity.isPlaceholderData && 'pointer-events-none opacity-60',
          )}
        >
          <Card className="py-0 sm:py-0 md:py-0">
            <CardContent className="px-0 sm:px-0 md:px-0">
              <ActivityList activities={items} />
            </CardContent>
          </Card>
          <TablePagination
            page={activity.data?.page ?? page}
            limit={activity.data?.limit ?? LIMIT}
            total={activity.data?.total ?? 0}
            hasMore={activity.data?.hasMore ?? false}
            isFetching={activity.isFetching}
            onPageChange={(next) =>
              update({ page: next > 1 ? String(next) : undefined })
            }
          />
        </div>
      ) : (
        <EmptyState
          icon={<History className="size-5" />}
          title={area ? 'Nothing changed here yet' : 'No activity yet'}
          description="Each change an admin saves is listed here from now on."
        />
      )}
    </div>
  );
};

export default ActivityPage;
