import { Link, useNavigate, useSearchParams } from 'react-router';
import { Calculator, Search } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ImageThumb from '@/components/custom/ImageThumb';
import ListSkeleton from '@/components/custom/ListSkeleton';
import PageHeader from '@/components/custom/PageHeader';
import TablePagination from '@/components/custom/TablePagination';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { formatPrice } from '@/helpers/format';
import { useCostedListings, useCostingSettings } from '@/hooks/costing';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type {
  CostedListing,
  CostedListingSort,
  CostingStatus,
  SaleChannel,
} from '@/types/api';

import ProfitValue from '../components/ProfitValue';
import StatusBadge from '../components/StatusBadge';
import {
  CHANNEL_LABELS,
  COSTING_LIST_LIMIT,
  COSTING_STATUSES,
  LISTING_SORTS,
  SALE_CHANNELS,
} from '../constants';

const PARAMS = {
  STATUS: 'status',
  KIND: 'kind',
  CHANNEL: 'channel',
  SEARCH: 'search',
  SORT: 'sort',
  PAGE: 'page',
} as const;

const KINDS = [
  { value: 'ALL', label: 'Everything' },
  { value: 'PRODUCT', label: 'Products' },
  { value: 'VARIANT', label: 'Variants' },
  { value: 'COMBO', label: 'Combos' },
] as const;

const isStatus = (value: string | null): value is CostingStatus =>
  COSTING_STATUSES.some((status) => status.value === value);

const linkOf = (listing: CostedListing) =>
  listing.comboId
    ? ROUTES.PRIVATE.COSTING.COMBO(listing.comboId)
    : ROUTES.PRIVATE.COSTING.PRODUCT(listing.productId!);

/**
 * Every product, variant and combo priced against what it costs to make —
 * lowest margin first, so what's underpriced comes up top.
 */
const CostedListingsPage = () => {
  useDocumentTitle('Product costs');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const settings = useCostingSettings();

  const statusParam = searchParams.get(PARAMS.STATUS);
  const status = isStatus(statusParam) ? statusParam : undefined;
  const kindParam = searchParams.get(PARAMS.KIND);
  const kind = KINDS.some((option) => option.value === kindParam)
    ? (kindParam as (typeof KINDS)[number]['value'])
    : 'ALL';
  const channelParam = searchParams.get(PARAMS.CHANNEL);
  const channel: SaleChannel =
    SALE_CHANNELS.find((option) => option.value === channelParam)?.value ??
    'WHATSAPP';
  const sort: CostedListingSort =
    LISTING_SORTS.find(
      (option) => option.value === searchParams.get(PARAMS.SORT),
    )?.value ?? 'margin_asc';
  const page = Math.max(1, Number(searchParams.get(PARAMS.PAGE)) || 1);
  const search = searchParams.get(PARAMS.SEARCH) ?? '';
  const debouncedSearch = useDebouncedValue(search.trim(), 400);

  const listings = useCostedListings({
    status,
    kind: kind === 'ALL' ? undefined : kind,
    channel,
    sort,
    search: debouncedSearch || undefined,
    page,
    limit: COSTING_LIST_LIMIT,
  });
  const data = listings.data;
  const items = data?.items ?? [];
  const target = settings.data?.targetMarginPercent ?? null;

  const setFilter = (key: string, value: string | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (value === undefined || value === '') next.delete(key);
    else next.set(key, value);
    next.delete(PARAMS.PAGE);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Product costs"
        count={data?.counts.all}
        description={`What each piece costs to make, and what it earns sold on ${CHANNEL_LABELS[channel]}${target === null ? '' : ` — against your ${target}% target margin`}.`}
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Show"
          className="flex flex-wrap gap-1.5"
        >
          {[undefined, ...COSTING_STATUSES.map((option) => option.value)].map(
            (value) => {
              const selected = value === status;
              const count = data?.counts[value ?? 'all'];
              return (
                <button
                  key={value ?? 'all'}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setFilter(PARAMS.STATUS, value)}
                  className={cn(
                    'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-4 focus-visible:ring-accent-500/20',
                    selected
                      ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-50 dark:bg-stone-50 dark:text-stone-900'
                      : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300',
                  )}
                >
                  {value
                    ? COSTING_STATUSES.find((option) => option.value === value)!
                        .label
                    : 'All'}
                  {count !== undefined && (
                    <span
                      className={cn(
                        'text-xs tabular-nums',
                        selected ? 'opacity-80' : 'text-stone-400',
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            },
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(event) => setFilter(PARAMS.SEARCH, event.target.value)}
            onClear={() => setFilter(PARAMS.SEARCH, undefined)}
            placeholder="Search by name or SKU…"
            aria-label="Search listings"
            startAdornment={<Search className="size-4 text-stone-400" />}
            className="sm:w-60"
          />
          <Select
            value={kind}
            onValueChange={(value) =>
              setFilter(PARAMS.KIND, value === 'ALL' ? undefined : value)
            }
          >
            <SelectTrigger aria-label="Kind" className="sm:w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={channel}
            onValueChange={(value) =>
              setFilter(
                PARAMS.CHANNEL,
                value === 'WHATSAPP' ? undefined : value,
              )
            }
          >
            <SelectTrigger aria-label="Sold on" className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SALE_CHANNELS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  Sold on {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={sort}
            onValueChange={(value) =>
              setFilter(PARAMS.SORT, value === 'margin_asc' ? undefined : value)
            }
          >
            <SelectTrigger aria-label="Sort" className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LISTING_SORTS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {listings.isPending ? (
        <ListSkeleton rows={8} trailing={3} />
      ) : items.length > 0 ? (
        <div
          aria-busy={listings.isPlaceholderData}
          className={cn(
            'flex flex-col gap-4 transition-opacity duration-200',
            listings.isPlaceholderData && 'pointer-events-none opacity-60',
          )}
        >
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700/60 dark:bg-stone-900">
            <Table>
              <TableHeader className="bg-stone-50 dark:bg-stone-800/50">
                <TableRow>
                  <TableHead className="min-w-56">Listing</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="hidden text-right sm:table-cell">
                    Cost
                  </TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="hidden text-right lg:table-cell">
                    {target === null ? 'Suggested' : `For ${target}%`}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((listing) => (
                  <TableRow
                    key={`${listing.kind}-${listing.variantId ?? listing.productId ?? listing.comboId}`}
                    onClick={() => navigate(linkOf(listing))}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <Link
                        to={linkOf(listing)}
                        onClick={(event) => event.stopPropagation()}
                        className="flex min-w-0 items-center gap-2.5"
                      >
                        <ImageThumb
                          src={listing.image}
                          alt=""
                          className="size-9"
                        />
                        <span className="min-w-0">
                          <span className="block truncate text-sm font-medium text-stone-900 dark:text-stone-50">
                            {listing.name}
                          </span>
                          <span className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                            {listing.kind === 'COMBO' && (
                              <Badge variant="accent">Combo</Badge>
                            )}
                            {listing.variantTitle}
                            {listing.costSource === 'PRODUCT' && (
                              <span className="text-stone-400">
                                · shared sheet
                              </span>
                            )}
                            {!listing.isActive && (
                              <span className="text-stone-400">· hidden</span>
                            )}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPrice(listing.price)}
                    </TableCell>
                    <TableCell className="hidden text-right text-stone-600 tabular-nums sm:table-cell dark:text-stone-300">
                      {listing.unitCost === null
                        ? '—'
                        : formatPrice(listing.unitCost)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ProfitValue
                        profit={listing.profit}
                        marginPercent={listing.marginPercent}
                        target={target}
                      />
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <StatusBadge status={listing.status} />
                    </TableCell>
                    <TableCell className="hidden text-right tabular-nums lg:table-cell">
                      {listing.suggestedPrice === null ? (
                        <span className="text-stone-400">—</span>
                      ) : listing.suggestedPrice > listing.price ? (
                        <SimpleTooltip
                          label={`${formatPrice(listing.suggestedPrice - listing.price)} more reaches your target`}
                        >
                          <span className="font-medium text-amber-700 dark:text-amber-400">
                            {formatPrice(listing.suggestedPrice)}
                          </span>
                        </SimpleTooltip>
                      ) : (
                        <span className="text-stone-500">
                          {formatPrice(listing.suggestedPrice)}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <TablePagination
            page={data?.page ?? page}
            limit={data?.limit ?? COSTING_LIST_LIMIT}
            total={data?.total ?? 0}
            hasMore={data?.hasMore ?? false}
            isFetching={listings.isFetching}
            onPageChange={(next) =>
              setFilter(PARAMS.PAGE, next > 1 ? String(next) : undefined)
            }
          />
        </div>
      ) : (
        <EmptyState
          icon={<Calculator className="size-5" />}
          title={
            status || search || kind !== 'ALL'
              ? 'Nothing matches'
              : 'No products to cost yet'
          }
          description={
            status || search || kind !== 'ALL'
              ? 'Try another filter.'
              : 'Add products first — then give each a cost sheet to see what it earns.'
          }
          action={
            status || search || kind !== 'ALL' ? (
              <Button
                variant="outline"
                onClick={() => setSearchParams({}, { replace: true })}
              >
                Show everything
              </Button>
            ) : undefined
          }
        />
      )}
    </div>
  );
};

export default CostedListingsPage;
