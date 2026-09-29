import { useState } from 'react';
import { Link as RouterLink } from 'react-router';
import { MousePointerClick } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ImageThumb from '@/components/custom/ImageThumb';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ROUTES } from '@/constants/routes';
import { useBuyClickStats } from '@/hooks/stats';
import { cn } from '@/lib/utils';
import type { BuyClickCounts, BuyClickStats } from '@/types/api';

import { PURCHASE_LINK_PLATFORM_OPTIONS } from '../../products/constants';

const WINDOWS = [7, 30, 90] as const;
type TWindow = (typeof WINDOWS)[number];

const TOP_LIMIT = 5;

const PLATFORM_LABELS: Record<string, string> = Object.fromEntries(
  PURCHASE_LINK_PLATFORM_OPTIONS.map((option) => [option.value, option.label]),
);

type TTopRow = BuyClickCounts & {
  key: string;
  name: string;
  image: string | undefined;
  to: string;
  isCombo: boolean;
};

/** Products and combos in one "most clicked" list. */
const toTopRows = (stats: BuyClickStats): TTopRow[] =>
  [
    ...stats.topProducts.map(({ product, ...counts }) => ({
      ...counts,
      key: `product-${product.id}`,
      name: product.name,
      image: product.images[0],
      to: ROUTES.PRIVATE.PRODUCTS.DETAIL(product.slug),
      isCombo: false,
    })),
    ...stats.topCombos.map(({ combo, ...counts }) => ({
      ...counts,
      key: `combo-${combo.id}`,
      name: combo.name,
      image: combo.images[0],
      to: ROUTES.PRIVATE.COMBOS.DETAIL(combo.slug),
      isCombo: true,
    })),
  ]
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, TOP_LIMIT);

const WindowPicker = ({
  value,
  onChange,
}: {
  value: TWindow;
  onChange: (value: TWindow) => void;
}) => (
  <div
    role="group"
    aria-label="Time window"
    className="flex rounded-lg bg-stone-100 p-0.5 dark:bg-stone-800"
  >
    {WINDOWS.map((option) => (
      <button
        key={option}
        type="button"
        aria-pressed={value === option}
        onClick={() => onChange(option)}
        className={cn(
          'cursor-pointer rounded-md px-2 py-1 text-xs font-medium tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30',
          value === option
            ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-900 dark:text-stone-50'
            : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50',
        )}
      >
        {option}d
      </button>
    ))}
  </div>
);

/**
 * Storefront buy-button clicks — orders happen on WhatsApp or a marketplace,
 * so this is the only signal of what people want to buy.
 */
const BuyingInterestCard = () => {
  const [days, setDays] = useState<TWindow>(30);
  const stats = useBuyClickStats(days);
  const data = stats.data;

  return (
    <Card className="gap-0 sm:gap-0 md:gap-0">
      <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-stone-100 pb-3 dark:border-stone-800">
        <CardTitle className="flex items-center gap-2 text-sm font-semibold">
          <MousePointerClick className="size-4 text-stone-400" />
          Buying interest
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
            <Skeleton className="h-2 w-full rounded-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : stats.isError || !data ? (
          <p className="py-6 text-center text-sm text-stone-500 dark:text-stone-400">
            Couldn't load buying interest.
          </p>
        ) : data.total === 0 ? (
          <EmptyState
            icon={<MousePointerClick className="size-5" />}
            title={`No buy clicks in the last ${days} days`}
            description="Every tap on “Order on WhatsApp” or a marketplace link on the storefront is counted here."
            className="py-8"
          />
        ) : (
          <>
            <div className="flex flex-col gap-3">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-3xl leading-none font-semibold tracking-tight text-stone-900 tabular-nums dark:text-stone-50">
                    {data.total.toLocaleString('en-IN')}
                  </p>
                  <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
                    buy-button clicks in the last {days} days
                  </p>
                </div>
                <dl className="flex gap-4 text-right text-xs">
                  <div>
                    <dt className="text-stone-500 dark:text-stone-400">
                      WhatsApp
                    </dt>
                    <dd className="font-semibold text-emerald-600 tabular-nums dark:text-emerald-400">
                      {data.byChannel.WHATSAPP.toLocaleString('en-IN')}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-stone-500 dark:text-stone-400">
                      Marketplaces
                    </dt>
                    <dd className="font-semibold text-sky-600 tabular-nums dark:text-sky-400">
                      {data.byChannel.MARKETPLACE.toLocaleString('en-IN')}
                    </dd>
                  </div>
                </dl>
              </div>
              {/* The counts above carry the numbers; the bar only shows the split. */}
              <div
                aria-hidden
                className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"
              >
                <div
                  className="bg-emerald-500"
                  style={{ flexGrow: data.byChannel.WHATSAPP }}
                />
                <div
                  className="bg-sky-500"
                  style={{ flexGrow: data.byChannel.MARKETPLACE }}
                />
              </div>
              {data.byPlatform.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {data.byPlatform.map(({ platform, clicks }) => (
                    <Badge key={platform} variant="secondary">
                      {PLATFORM_LABELS[platform] ?? platform}
                      <span className="tabular-nums opacity-70">{clicks}</span>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-1">
              <p className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase dark:text-stone-500">
                Most clicked
              </p>
              <ul className="-mx-2 flex flex-col">
                {toTopRows(data).map((row) => (
                  <li key={row.key}>
                    <RouterLink
                      to={row.to}
                      className="group flex items-center gap-3 rounded-lg px-2 py-2 transition-colors hover:bg-stone-50 dark:hover:bg-stone-800/40"
                    >
                      <ImageThumb
                        src={row.image}
                        alt={row.name}
                        className="size-9"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <p className="truncate text-sm font-medium text-stone-900 group-hover:text-accent-600 dark:text-stone-50 dark:group-hover:text-accent-400">
                            {row.name}
                          </p>
                          {row.isCombo && (
                            <Badge variant="accent" className="shrink-0">
                              Combo
                            </Badge>
                          )}
                        </div>
                        <p className="mt-0.5 text-xs text-stone-400 tabular-nums dark:text-stone-500">
                          {row.whatsapp} WhatsApp · {row.marketplace}{' '}
                          marketplace
                        </p>
                      </div>
                      <span className="shrink-0 text-sm font-semibold text-stone-900 tabular-nums dark:text-stone-50">
                        {row.clicks}
                      </span>
                    </RouterLink>
                  </li>
                ))}
              </ul>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default BuyingInterestCard;
