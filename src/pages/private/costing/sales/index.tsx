import { useState } from 'react';
import { useSearchParams } from 'react-router';
import dayjs from 'dayjs';
import {
  Download,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  ReceiptIndianRupee,
  Search,
  Trash2,
} from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import PageHeader from '@/components/custom/PageHeader';
import TablePagination from '@/components/custom/TablePagination';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { formatDate, formatPrice } from '@/helpers/format';
import {
  useCostingSettings,
  useDeleteSale,
  useExportSales,
  useSales,
} from '@/hooks/costing';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { Sale, SaleChannel } from '@/types/api';

import DateRangeFilter from '../components/DateRangeFilter';
import ProfitValue from '../components/ProfitValue';
import SaleDialog from '../components/SaleDialog';
import {
  CHANNEL_LABELS,
  COSTING_LIST_LIMIT,
  SALE_CHANNELS,
} from '../constants';
import { formatPercent } from '../helpers';

const PARAMS = {
  FROM: 'from',
  TO: 'to',
  CHANNEL: 'channel',
  SEARCH: 'search',
  PAGE: 'page',
} as const;

const ALL = 'ALL';

const itemsSummary = (sale: Sale) => {
  const [first, ...rest] = sale.items;
  const head = `${first.name}${first.quantity > 1 ? ` × ${first.quantity}` : ''}`;
  return rest.length > 0 ? `${head} and ${rest.length} more` : head;
};

/**
 * Orders taken off the storefront — WhatsApp, a mela, a marketplace — with
 * what each earned after costs, delivery, fees and tax. The totals above
 * cover every sale the filters match.
 */
const SalesPage = () => {
  useDocumentTitle('Sales');
  const [searchParams, setSearchParams] = useSearchParams();
  const [editing, setEditing] = useState<Sale | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState<Sale | null>(null);
  const [restock, setRestock] = useState(true);
  const settings = useCostingSettings();
  const deleteSale = useDeleteSale();
  const exportSales = useExportSales();

  // The month so far, until another range is picked
  const hasRange = searchParams.has(PARAMS.FROM) || searchParams.has(PARAMS.TO);
  const from = hasRange
    ? searchParams.get(PARAMS.FROM) || undefined
    : dayjs().startOf('month').format('YYYY-MM-DD');
  const to = hasRange
    ? searchParams.get(PARAMS.TO) || undefined
    : dayjs().format('YYYY-MM-DD');
  const channelParam = searchParams.get(PARAMS.CHANNEL);
  const channel = SALE_CHANNELS.find((option) => option.value === channelParam)
    ?.value as SaleChannel | undefined;
  const page = Math.max(1, Number(searchParams.get(PARAMS.PAGE)) || 1);
  const search = searchParams.get(PARAMS.SEARCH) ?? '';
  const debouncedSearch = useDebouncedValue(search.trim(), 400);

  const filters = {
    from,
    to,
    channel,
    search: debouncedSearch || undefined,
  };
  const sales = useSales({ ...filters, page, limit: COSTING_LIST_LIMIT });
  const data = sales.data;
  const items = data?.items ?? [];
  const summary = data?.summary;
  const target = settings.data?.targetMarginPercent ?? null;

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    });
    next.delete(PARAMS.PAGE);
    setSearchParams(next, { replace: true });
  };

  const openSale = (sale: Sale | null) => {
    setEditing(sale);
    setIsDialogOpen(true);
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Sales"
        count={data?.total}
        description="Every order taken on WhatsApp, in person or on a marketplace — and what it really earned."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => exportSales.mutate(filters)}
              disabled={exportSales.isPending || !data?.total}
              startAdornment={
                exportSales.isPending ? (
                  <Loader2 className="animate-spin" />
                ) : (
                  <Download />
                )
              }
            >
              Export CSV
            </Button>
            <Button
              size="sm"
              onClick={() => openSale(null)}
              startAdornment={<Plus />}
            >
              Record sale
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <DateRangeFilter
          value={{ from, to }}
          allowAllTime
          onChange={(range) => {
            // Kept even when empty — "all time" — or the month comes back
            const next = new URLSearchParams(searchParams);
            next.set(PARAMS.FROM, range.from ?? '');
            next.set(PARAMS.TO, range.to ?? '');
            next.delete(PARAMS.PAGE);
            setSearchParams(next, { replace: true });
          }}
        />
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(event) =>
              updateParams({ [PARAMS.SEARCH]: event.target.value })
            }
            onClear={() => updateParams({ [PARAMS.SEARCH]: undefined })}
            placeholder="Search customer, item or note…"
            aria-label="Search sales"
            startAdornment={<Search className="size-4 text-stone-400" />}
            className="sm:w-64"
          />
          <Select
            value={channel ?? ALL}
            onValueChange={(value) =>
              updateParams({
                [PARAMS.CHANNEL]: value === ALL ? undefined : value,
              })
            }
          >
            <SelectTrigger aria-label="Channel" className="sm:w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Every channel</SelectItem>
              {SALE_CHANNELS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {summary && summary.sales > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[
            {
              label: 'Sales',
              value: summary.sales.toLocaleString('en-IN'),
              hint: `${summary.units.toLocaleString('en-IN')} pieces`,
            },
            {
              label: 'Buyers paid',
              value: formatPrice(summary.revenue),
              hint:
                summary.tax > 0
                  ? `${formatPrice(summary.tax)} of it tax`
                  : 'Delivery charged included',
            },
            {
              label: 'Cost to make',
              value: formatPrice(summary.costOfGoods),
              hint: `${formatPrice(summary.channelFee + summary.deliveryCost + summary.otherCost)} more in fees & sending`,
            },
            {
              label: 'Profit',
              value: (
                <ProfitValue
                  profit={summary.profit}
                  marginPercent={summary.marginPercent}
                  target={target}
                />
              ),
              hint: `${formatPercent(summary.marginPercent)} margin`,
            },
          ].map((stat) => (
            <Card key={stat.label}>
              <CardContent className="flex flex-col gap-1 pt-5">
                <p className="text-xs text-stone-500 dark:text-stone-400">
                  {stat.label}
                </p>
                <div className="text-lg font-semibold text-stone-900 tabular-nums dark:text-stone-50">
                  {stat.value}
                </div>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  {stat.hint}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {sales.isPending ? (
        <ListSkeleton rows={6} media="none" trailing={2} />
      ) : items.length > 0 ? (
        <div
          aria-busy={sales.isPlaceholderData}
          className={cn(
            'flex flex-col gap-4 transition-opacity duration-200',
            sales.isPlaceholderData && 'pointer-events-none opacity-60',
          )}
        >
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700/60 dark:bg-stone-900">
            <Table>
              <TableHeader className="bg-stone-50 dark:bg-stone-800/50">
                <TableRow>
                  <TableHead className="w-28">Date</TableHead>
                  <TableHead className="min-w-56">Sale</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Channel
                  </TableHead>
                  <TableHead className="text-right">Paid</TableHead>
                  <TableHead className="text-right">Profit</TableHead>
                  <TableHead className="w-12">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((sale) => (
                  <TableRow
                    key={sale.id}
                    onClick={() => openSale(sale)}
                    className="cursor-pointer"
                  >
                    <TableCell className="text-sm text-stone-600 dark:text-stone-300">
                      {formatDate(sale.soldAt)}
                    </TableCell>
                    <TableCell>
                      <span className="block truncate text-sm font-medium text-stone-900 dark:text-stone-50">
                        {itemsSummary(sale)}
                      </span>
                      <span className="block truncate text-xs text-stone-500 dark:text-stone-400">
                        {sale.customerName ?? 'No name'}
                        {sale.customerPhone && ` · ${sale.customerPhone}`}
                        <span className="md:hidden">
                          {' · '}
                          {CHANNEL_LABELS[sale.channel]}
                        </span>
                      </span>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">
                        {CHANNEL_LABELS[sale.channel]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {formatPrice(sale.totals.revenue)}
                    </TableCell>
                    <TableCell className="text-right">
                      <ProfitValue
                        profit={sale.totals.profit}
                        marginPercent={sale.totals.marginPercent}
                        target={target}
                      />
                    </TableCell>
                    <TableCell onClick={(event) => event.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label="Actions for this sale"
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onSelect={() => openSale(sale)}>
                            <Pencil />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onSelect={() => {
                              setRestock(true);
                              setDeleting(sale);
                            }}
                            className="text-red-600 focus:text-red-700 dark:text-red-400"
                          >
                            <Trash2 />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
            isFetching={sales.isFetching}
            onPageChange={(next) => {
              const params = new URLSearchParams(searchParams);
              if (next > 1) params.set(PARAMS.PAGE, String(next));
              else params.delete(PARAMS.PAGE);
              setSearchParams(params, { replace: true });
            }}
          />
        </div>
      ) : (
        <EmptyState
          icon={<ReceiptIndianRupee className="size-5" />}
          title={
            search || channel ? 'No sales match' : 'No sales in these dates'
          }
          description="Record each order you take — on WhatsApp, at an exhibition, on a marketplace — to see what you really earn after costs, fees and delivery."
          action={
            <Button onClick={() => openSale(null)} startAdornment={<Plus />}>
              Record a sale
            </Button>
          }
        />
      )}

      <SaleDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        sale={editing}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this sale?"
        description="It comes out of every report. This can't be undone."
        confirmLabel="Delete sale"
        variant="destructive"
        isPending={deleteSale.isPending}
        onConfirm={() =>
          deleting &&
          deleteSale.mutate(
            { id: deleting.id, restock: deleting.stockDeducted && restock },
            { onSettled: () => setDeleting(null) },
          )
        }
      >
        {deleting?.stockDeducted && (
          <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
            <Checkbox
              checked={restock}
              onCheckedChange={(checked) => setRestock(checked === true)}
              className="mt-0.5"
            />
            <span>
              Put the stock back
              <span className="block text-xs text-stone-400">
                For a sale recorded by mistake, or one that was returned.
              </span>
            </span>
          </label>
        )}
      </ConfirmDialog>
    </div>
  );
};

export default SalesPage;
