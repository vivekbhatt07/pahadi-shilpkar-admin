import { Link as RouterLink } from 'react-router';
import { BellRing } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ImageThumb from '@/components/custom/ImageThumb';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { formatDate } from '@/helpers/format';
import { useStockAlertStats } from '@/hooks/stats';

import {
  AVAILABILITY_LABELS,
  availabilityVariant,
} from '../../products/helpers';
import ListSkeletonRows from './ListSkeletonRows';

/**
 * Products shoppers asked to be emailed about ("Notify me"), most wanted
 * first — what to make or restock next. Rows open the edit form: saving one
 * as In stock or Made to order emails everyone waiting and clears it from
 * this list.
 */
const RestockDemandCard = () => {
  const stats = useStockAlertStats();
  const data = stats.data;

  return (
    <Card className="gap-0 sm:gap-0 md:gap-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-stone-100 pb-3 dark:border-stone-800">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <BellRing className="size-4 text-stone-400" />
          Waiting for restock
        </CardTitle>
        {data && data.total > 0 && (
          <Badge variant="accent" className="tabular-nums">
            {data.total} {data.total === 1 ? 'shopper' : 'shoppers'}
          </Badge>
        )}
      </CardHeader>

      <CardContent className="px-0 sm:px-0 md:px-0">
        {stats.isPending ? (
          <ListSkeletonRows avatar="square" />
        ) : stats.isError || !data ? (
          <p className="py-10 text-center text-sm text-stone-500 dark:text-stone-400">
            Couldn't load restock demand.
          </p>
        ) : data.products.length === 0 ? (
          <EmptyState
            icon={<BellRing className="size-5" />}
            title="Nobody is waiting"
            description="When shoppers tap “Notify me” on a sold-out or coming-soon product, it shows up here."
            className="py-10"
          />
        ) : (
          <ul className="divide-y divide-stone-100 dark:divide-stone-800">
            {data.products.map(({ product, waiting, since }) => (
              <li key={product.id}>
                <RouterLink
                  to={ROUTES.PRIVATE.PRODUCTS.EDIT(product.slug)}
                  className="group flex items-center gap-3 px-3 py-3 transition-colors outline-none hover:bg-stone-50 focus-visible:bg-stone-50 sm:px-4 md:px-6 dark:hover:bg-stone-800/40 dark:focus-visible:bg-stone-800/40"
                >
                  <ImageThumb
                    src={product.images[0]}
                    alt={product.name}
                    className="size-10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-stone-900 group-hover:text-accent-600 dark:text-stone-50 dark:group-hover:text-accent-400">
                      {product.name}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-stone-400 dark:text-stone-500">
                      Waiting since {formatDate(since)}
                    </p>
                  </div>
                  <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    {!product.isActive && (
                      <Badge variant="secondary">Inactive</Badge>
                    )}
                    <Badge variant={availabilityVariant(product.availability)}>
                      {AVAILABILITY_LABELS[product.availability]}
                    </Badge>
                  </div>
                  <span className="shrink-0 text-right text-sm font-semibold whitespace-nowrap text-stone-900 tabular-nums dark:text-stone-50">
                    {waiting} waiting
                  </span>
                </RouterLink>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default RestockDemandCard;
