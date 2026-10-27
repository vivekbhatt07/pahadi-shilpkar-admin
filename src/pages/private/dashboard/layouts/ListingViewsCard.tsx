import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { Eye } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ImageThumb from '@/components/custom/ImageThumb';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useViewStats } from '@/hooks/stats';
import { cn } from '@/lib/utils';
import type { ListingPerformance } from '@/types/api';

import WindowPicker, { type TWindow } from './WindowPicker';

/** Looked at this often without a single buy click is worth a look. */
const UNCLICKED_VIEWS = 20;

/** Clicks per view — capped, since one view can lead to two clicks. */
const clickRate = (clicks: number, views: number) =>
  views === 0 ? 0 : Math.min(100, Math.round((clicks / views) * 100));

const listingPath = ({ kind, slug }: ListingPerformance) =>
  kind === 'combo'
    ? ROUTES.PRIVATE.COMBOS.DETAIL(slug)
    : ROUTES.PRIVATE.PRODUCTS.DETAIL(slug);

/**
 * Product and combo page views against buy clicks — what gets looked at but
 * not ordered: a price, a photo or a sold-out size to look into.
 */
const ListingViewsCard = () => {
  const [days, setDays] = useState<TWindow>(30);
  const stats = useViewStats(days);
  const data = stats.data;

  return (
    <Card className="gap-0 sm:gap-0 md:gap-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-stone-100 pb-3 dark:border-stone-800">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <Eye className="size-4 text-stone-400" />
          Views and buy clicks
        </CardTitle>
        <WindowPicker value={days} onChange={setDays} />
      </CardHeader>

      <CardContent
        aria-busy={stats.isFetching}
        className={cn(
          'flex flex-col gap-5 pt-4 transition-opacity',
          stats.isPlaceholderData && 'opacity-60',
        )}
      >
        {stats.isPending ? (
          <div className="flex flex-col gap-3">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-3 w-40" />
            <Skeleton className="mt-2 h-32 w-full" />
          </div>
        ) : stats.isError || !data ? (
          <p className="py-6 text-center text-sm text-stone-500 dark:text-stone-400">
            Couldn't load page views.
          </p>
        ) : data.views === 0 ? (
          <EmptyState
            icon={<Eye className="size-5" />}
            title={`No page views in the last ${days} days`}
            description="Each time a shopper opens a product or combo page, it's counted here — set against its buy clicks."
            className="py-8"
          />
        ) : (
          <>
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-3xl leading-none font-semibold tracking-tight text-stone-900 dark:text-stone-50">
                  {data.views.toLocaleString('en-IN')}
                </p>
                <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                  page views in the last {days} days
                </p>
              </div>
              <dl className="flex gap-4 text-right text-xs">
                <div>
                  <dt className="text-stone-500 dark:text-stone-400">
                    Buy clicks
                  </dt>
                  <dd className="mt-0.5 font-semibold text-stone-900 dark:text-stone-50">
                    {data.clicks.toLocaleString('en-IN')}
                  </dd>
                </div>
                <div>
                  <dt className="text-stone-500 dark:text-stone-400">
                    Per view
                  </dt>
                  <dd className="mt-0.5 font-semibold text-stone-900 tabular-nums dark:text-stone-50">
                    {clickRate(data.clicks, data.views)}%
                  </dd>
                </div>
              </dl>
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase dark:text-stone-500">
                Most viewed
              </p>
              <ul className="-mx-2 flex flex-col">
                {data.top.map((row) => {
                  const unclicked =
                    row.clicks === 0 && row.views >= UNCLICKED_VIEWS;
                  return (
                    <li key={`${row.kind}-${row.id}`}>
                      <RouterLink
                        to={listingPath(row)}
                        className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/40"
                      >
                        <ImageThumb
                          src={row.image ?? undefined}
                          alt={row.name}
                          className="size-9"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-medium text-stone-900 group-hover:text-accent-600 dark:text-stone-50 dark:group-hover:text-accent-400">
                              {row.name}
                            </p>
                            {row.kind === 'combo' && (
                              <Badge variant="accent" className="shrink-0">
                                Combo
                              </Badge>
                            )}
                          </div>
                          <p
                            className={cn(
                              'mt-0.5 text-xs tabular-nums',
                              unclicked
                                ? 'text-amber-700 dark:text-amber-400'
                                : 'text-stone-400 dark:text-stone-500',
                            )}
                          >
                            {row.views} views · {row.clicks} buy clicks
                            {unclicked && ' — looked at, not ordered'}
                          </p>
                        </div>
                        <span className="shrink-0 text-sm font-semibold text-stone-900 tabular-nums dark:text-stone-50">
                          {clickRate(row.clicks, row.views)}%
                        </span>
                      </RouterLink>
                    </li>
                  );
                })}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default ListingViewsCard;
