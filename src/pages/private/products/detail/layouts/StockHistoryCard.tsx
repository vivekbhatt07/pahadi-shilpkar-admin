import { useState } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { History } from 'lucide-react';

import TablePagination from '@/components/custom/TablePagination';
import { Badge, type badgeVariants } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDateTime, getDisplayName } from '@/helpers/format';
import { useStockHistory } from '@/hooks/products';
import { cn } from '@/lib/utils';
import type { StockMovementReason } from '@/types/api';

const LIMIT = 10;

const REASONS: Record<
  StockMovementReason,
  { label: string; variant: VariantProps<typeof badgeVariants>['variant'] }
> = {
  ADJUSTED: { label: 'Set by hand', variant: 'secondary' },
  RESTOCKED: { label: 'Restocked', variant: 'success' },
  SOLD: { label: 'Sold', variant: 'accent' },
  SALE_EDITED: { label: 'Sale edited', variant: 'warning' },
  SALE_DELETED: { label: 'Sale deleted', variant: 'outline' },
};

/**
 * Every change to the product's stock count — or its variants' — and why,
 * newest first: so "why is it 3?" has an answer.
 */
const StockHistoryCard = ({ productId }: { productId: string }) => {
  const [page, setPage] = useState(1);
  const history = useStockHistory(productId, { page, limit: LIMIT });
  const data = history.data;

  return (
    <Card className="gap-0 sm:gap-0 md:gap-0">
      <CardHeader className="border-b border-stone-100 pb-3 dark:border-stone-800">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <History className="size-4 text-stone-400" />
          Stock history
        </CardTitle>
      </CardHeader>
      <CardContent
        aria-busy={history.isFetching}
        className={cn(
          'flex flex-col gap-4 px-0 sm:px-0 md:px-0',
          history.isPlaceholderData && 'opacity-60',
        )}
      >
        {history.isPending ? (
          <div className="flex flex-col gap-3 p-4 md:px-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : history.isError || !data ? (
          <p className="p-4 text-sm text-stone-500 md:px-6 dark:text-stone-400">
            Couldn't load the stock history.
          </p>
        ) : data.items.length === 0 ? (
          <p className="p-4 text-sm text-stone-500 md:px-6 dark:text-stone-400">
            No stock changes recorded yet — each one from now on is listed here,
            with who made it.
          </p>
        ) : (
          <>
            <ul className="divide-y divide-stone-100 dark:divide-stone-800">
              {data.items.map((movement) => {
                const reason = REASONS[movement.reason];
                return (
                  <li
                    key={movement.id}
                    className="flex items-center gap-3 px-4 py-3 md:px-6"
                  >
                    <span
                      className={cn(
                        'w-12 shrink-0 text-right text-sm font-semibold tabular-nums',
                        movement.change > 0
                          ? 'text-emerald-700 dark:text-emerald-400'
                          : 'text-red-700 dark:text-red-400',
                      )}
                    >
                      {movement.change > 0 ? '+' : '−'}
                      {Math.abs(movement.change)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <Badge variant={reason.variant}>{reason.label}</Badge>
                        {movement.variantTitle && (
                          <span className="truncate text-sm text-stone-700 dark:text-stone-300">
                            {movement.variantTitle}
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">
                        {formatDateTime(movement.createdAt)}
                        {movement.user && ` · ${getDisplayName(movement.user)}`}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs text-stone-500 tabular-nums dark:text-stone-400">
                      {movement.stockAfter} left
                    </span>
                  </li>
                );
              })}
            </ul>
            {data.total > LIMIT && (
              <div className="px-4 pb-4 md:px-6">
                <TablePagination
                  page={data.page}
                  limit={data.limit}
                  total={data.total}
                  hasMore={data.hasMore}
                  isFetching={history.isFetching}
                  onPageChange={setPage}
                />
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default StockHistoryCard;
