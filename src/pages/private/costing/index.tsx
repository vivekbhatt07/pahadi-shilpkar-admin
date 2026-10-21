import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import dayjs from 'dayjs';
import {
  Calculator,
  ChevronRight,
  PackageOpen,
  Plus,
  ReceiptIndianRupee,
} from 'lucide-react';

import PageHeader from '@/components/custom/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/constants/routes';
import { formatPrice } from '@/helpers/format';
import {
  useCostedListings,
  useCostingSettings,
  useMaterials,
  useProfitReport,
} from '@/hooks/costing';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { ProfitReport } from '@/types/api';

import DateRangeFilter from './components/DateRangeFilter';
import ProfitChart from './components/ProfitChart';
import ProfitValue from './components/ProfitValue';
import SaleDialog from './components/SaleDialog';
import { CHANNEL_LABELS, UNIT_SHORT } from './constants';
import { formatPercent } from './helpers';

const PARAMS = { FROM: 'from', TO: 'to' } as const;

/** Where what buyers paid went, as parts of one bar. */
const MONEY_PARTS: {
  key: 'tax' | 'costOfGoods' | 'deliveryCost' | 'channelFee' | 'otherCost';
  label: string;
  swatch: string;
}[] = [
  { key: 'costOfGoods', label: 'Making', swatch: 'bg-amber-500' },
  { key: 'tax', label: 'Tax', swatch: 'bg-stone-400' },
  { key: 'channelFee', label: 'Channel cuts', swatch: 'bg-violet-500' },
  { key: 'deliveryCost', label: 'Sending', swatch: 'bg-teal-500' },
  { key: 'otherCost', label: 'Other', swatch: 'bg-rose-400' },
];

const MoneySplit = ({ totals }: { totals: ProfitReport['totals'] }) => {
  const whole = totals.revenue;
  if (whole <= 0) {
    return <p className="text-sm text-stone-500">No sales in these dates.</p>;
  }
  const parts = MONEY_PARTS.filter((part) => totals[part.key] > 0);
  const profit = Math.max(totals.profit, 0);
  return (
    <div className="flex flex-col gap-3">
      <div
        aria-hidden
        className="flex h-3 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"
      >
        {parts.map((part) => (
          <div
            key={part.key}
            className={part.swatch}
            style={{ width: `${(totals[part.key] / whole) * 100}%` }}
          />
        ))}
        {profit > 0 && (
          <div
            className="bg-emerald-500"
            style={{ width: `${(profit / whole) * 100}%` }}
          />
        )}
      </div>
      <dl className="flex flex-col gap-2 text-sm">
        {parts.map((part) => (
          <div
            key={part.key}
            className="flex items-center justify-between gap-2"
          >
            <dt className="flex items-center gap-1.5 text-stone-600 dark:text-stone-400">
              <span className={cn('size-2 rounded-full', part.swatch)} />
              {part.label}
            </dt>
            <dd className="tabular-nums">{formatPrice(totals[part.key])}</dd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-2">
          <dt className="flex items-center gap-1.5 font-medium text-stone-800 dark:text-stone-200">
            <span className="size-2 rounded-full bg-emerald-500" />
            Profit
          </dt>
          <dd
            className={cn(
              'font-medium tabular-nums',
              totals.profit < 0
                ? 'text-red-600 dark:text-red-400'
                : 'text-emerald-700 dark:text-emerald-400',
            )}
          >
            {formatPrice(totals.profit)}
          </dd>
        </div>
      </dl>
    </div>
  );
};

/** The first steps, shown until there's something to report. */
const GettingStarted = ({ onRecordSale }: { onRecordSale: () => void }) => (
  <Card>
    <CardHeader>
      <CardTitle>Know what every piece earns</CardTitle>
      <CardDescription>
        Three steps, each a minute or two — then this page fills in.
      </CardDescription>
    </CardHeader>
    <CardContent className="grid grid-cols-1 gap-3 md:grid-cols-3">
      {[
        {
          icon: PackageOpen,
          title: '1. Add your raw materials',
          body: 'Plates, paint, lace, boxes — at what one unit costs.',
          to: ROUTES.PRIVATE.COSTING.MATERIALS,
          action: 'Raw materials',
        },
        {
          icon: Calculator,
          title: '2. Cost your products',
          body: 'What a batch uses, plus labour, packing and the courier.',
          to: ROUTES.PRIVATE.COSTING.LISTINGS,
          action: 'Product costs',
        },
        {
          icon: ReceiptIndianRupee,
          title: '3. Record your sales',
          body: 'Each WhatsApp or mela order — and see the real profit.',
          action: 'Record a sale',
        },
      ].map((step) => (
        <div
          key={step.title}
          className="flex flex-col gap-2 rounded-lg border border-stone-200 p-4 dark:border-stone-800"
        >
          <step.icon className="size-5 text-accent-600 dark:text-accent-400" />
          <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
            {step.title}
          </p>
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {step.body}
          </p>
          {step.to ? (
            <Button
              variant="outline"
              size="sm"
              asChild
              className="mt-auto w-fit"
            >
              <Link to={step.to}>{step.action}</Link>
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={onRecordSale}
              className="mt-auto w-fit"
            >
              {step.action}
            </Button>
          )}
        </div>
      ))}
    </CardContent>
  </Card>
);

/**
 * What the store earned over a range of days — from the sales recorded and
 * what each piece costs — and which listings are priced too low.
 */
const CostingOverviewPage = () => {
  useDocumentTitle('Costing & profit');
  const [searchParams, setSearchParams] = useSearchParams();
  const [isRecording, setIsRecording] = useState(false);
  const range = {
    from:
      searchParams.get(PARAMS.FROM) ??
      dayjs().subtract(29, 'day').format('YYYY-MM-DD'),
    to: searchParams.get(PARAMS.TO) ?? dayjs().format('YYYY-MM-DD'),
  };
  const report = useProfitReport(range);
  const settings = useCostingSettings();
  const pricing = useCostedListings({ limit: 1 });
  const materials = useMaterials({ limit: 1 });
  const data = report.data;
  const target = settings.data?.targetMarginPercent ?? null;
  const counts = pricing.data?.counts;
  const isNew =
    data?.totals.sales === 0 &&
    materials.data?.total === 0 &&
    counts !== undefined &&
    counts.NO_COST === counts.all;

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Costing & profit"
        description="What your pieces cost to make, and what the sales you record really earn."
        actions={
          <Button
            size="sm"
            onClick={() => setIsRecording(true)}
            startAdornment={<Plus />}
          >
            Record sale
          </Button>
        }
      />

      <DateRangeFilter
        value={range}
        onChange={(next) =>
          setSearchParams(
            {
              ...(next.from && { [PARAMS.FROM]: next.from }),
              ...(next.to && { [PARAMS.TO]: next.to }),
            },
            { replace: true },
          )
        }
      />

      {isNew && <GettingStarted onRecordSale={() => setIsRecording(true)} />}

      {report.isPending || !data ? (
        <div
          className="grid grid-cols-2 gap-4 lg:grid-cols-4"
          role="status"
          aria-label="Loading"
        >
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 rounded-xl" />
          ))}
          <Skeleton className="col-span-2 h-64 rounded-xl lg:col-span-4" />
        </div>
      ) : (
        <div
          className={cn(
            'flex flex-col gap-6 transition-opacity',
            report.isPlaceholderData && 'opacity-60',
          )}
        >
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              {
                label: 'Buyers paid',
                value: formatPrice(data.totals.revenue),
                hint: `${data.totals.units.toLocaleString('en-IN')} pieces`,
              },
              {
                label: 'Profit',
                value: (
                  <ProfitValue
                    profit={data.totals.profit}
                    marginPercent={data.totals.marginPercent}
                    target={target}
                  />
                ),
                hint:
                  data.totals.marginPercent === null
                    ? 'No sales yet'
                    : `${formatPercent(data.totals.marginPercent)} margin${target === null ? '' : ` · target ${target}%`}`,
              },
              {
                label: 'Sales',
                value: data.totals.sales.toLocaleString('en-IN'),
                hint:
                  data.totals.averageOrderValue === null
                    ? '—'
                    : `${formatPrice(data.totals.averageOrderValue)} an order`,
              },
              {
                label: 'Materials bought',
                value: formatPrice(data.totals.materialSpend),
                hint: 'Cash spent in these dates',
              },
            ].map((stat) => (
              <Card key={stat.label}>
                <CardContent className="flex flex-col gap-1 pt-5">
                  <p className="text-xs text-stone-500 dark:text-stone-400">
                    {stat.label}
                  </p>
                  <div className="text-xl font-semibold text-stone-900 tabular-nums dark:text-stone-50">
                    {stat.value}
                  </div>
                  <p className="text-xs text-stone-400 dark:text-stone-500">
                    {stat.hint}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>
                  {data.granularity === 'day' ? 'Day by day' : 'Month by month'}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ProfitChart
                  series={data.series}
                  granularity={data.granularity}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Where the money went</CardTitle>
                <CardDescription>Of every rupee buyers paid.</CardDescription>
              </CardHeader>
              <CardContent>
                <MoneySplit totals={data.totals} />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Best earners</CardTitle>
                <CardDescription>
                  By profit on the piece itself — its price less what it cost to
                  make, before the order's discount, delivery and fees.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {data.topItems.length === 0 ? (
                  <p className="text-sm text-stone-500">
                    No sales in these dates.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
                    <Table>
                      <TableHeader className="bg-stone-50 dark:bg-stone-800/50">
                        <TableRow>
                          <TableHead>Item</TableHead>
                          <TableHead className="text-right">Sold</TableHead>
                          <TableHead className="hidden text-right sm:table-cell">
                            Paid
                          </TableHead>
                          <TableHead className="text-right">Earned</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.topItems.map((item) => (
                          <TableRow
                            key={`${item.comboId ?? item.variantId ?? item.productId ?? item.name}`}
                          >
                            <TableCell className="max-w-64 truncate font-medium">
                              {item.productId || item.comboId ? (
                                <Link
                                  to={
                                    item.comboId
                                      ? ROUTES.PRIVATE.COSTING.COMBO(
                                          item.comboId,
                                        )
                                      : ROUTES.PRIVATE.COSTING.PRODUCT(
                                          item.productId!,
                                        )
                                  }
                                  className="hover:text-accent-600 hover:underline"
                                >
                                  {item.name}
                                </Link>
                              ) : (
                                item.name
                              )}
                            </TableCell>
                            <TableCell className="text-right tabular-nums">
                              {item.units}
                            </TableCell>
                            <TableCell className="hidden text-right tabular-nums sm:table-cell">
                              {formatPrice(item.revenue)}
                            </TableCell>
                            <TableCell className="text-right">
                              <ProfitValue
                                profit={item.grossProfit}
                                marginPercent={item.marginPercent}
                                target={target}
                              />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex flex-col gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>By channel</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.byChannel.length === 0 ? (
                    <p className="text-sm text-stone-500">
                      No sales in these dates.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {data.byChannel.map((entry) => (
                        <li key={entry.channel} className="flex flex-col gap-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">
                              {CHANNEL_LABELS[entry.channel]}
                              <span className="ml-1.5 text-xs font-normal text-stone-400">
                                {entry.sales}{' '}
                                {entry.sales === 1 ? 'sale' : 'sales'}
                              </span>
                            </span>
                            <ProfitValue
                              profit={entry.profit}
                              marginPercent={entry.marginPercent}
                              target={target}
                            />
                          </div>
                          <div className="h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
                            <div
                              className="h-full rounded-full bg-accent-500"
                              style={{
                                width: `${data.totals.revenue > 0 ? (entry.revenue / data.totals.revenue) * 100 : 0}%`,
                              }}
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pricing check</CardTitle>
                  <CardDescription>
                    At today's prices and costs.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-1">
                  {(
                    [
                      [
                        'LOSS',
                        'Selling at a loss',
                        'text-red-600 dark:text-red-400',
                      ],
                      [
                        'BELOW_TARGET',
                        'Below your target margin',
                        'text-amber-700 dark:text-amber-400',
                      ],
                      ['NO_COST', 'No cost sheet yet', 'text-stone-500'],
                    ] as const
                  ).map(([status, label, tone]) => (
                    <Link
                      key={status}
                      to={`${ROUTES.PRIVATE.COSTING.LISTINGS}?status=${status}`}
                      className="flex items-center justify-between rounded-md px-2 py-2 text-sm hover:bg-stone-50 dark:hover:bg-stone-800/60"
                    >
                      <span>{label}</span>
                      <span
                        className={cn(
                          'flex items-center gap-1 font-semibold tabular-nums',
                          tone,
                        )}
                      >
                        {counts?.[status] ?? '—'}
                        <ChevronRight className="size-4 text-stone-300" />
                      </span>
                    </Link>
                  ))}
                </CardContent>
              </Card>

              {data.materialSpend.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Materials bought</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="flex flex-col gap-2 text-sm">
                      {data.materialSpend.map((entry) => (
                        <li
                          key={entry.materialId}
                          className="flex items-center justify-between gap-2"
                        >
                          <Link
                            to={ROUTES.PRIVATE.COSTING.MATERIAL(
                              entry.materialId,
                            )}
                            className="min-w-0 truncate hover:text-accent-600 hover:underline"
                          >
                            {entry.name}
                            <span className="ml-1 text-xs text-stone-400">
                              {entry.quantity.toLocaleString('en-IN')}{' '}
                              {UNIT_SHORT[entry.unit]}
                            </span>
                          </Link>
                          <span className="tabular-nums">
                            {formatPrice(entry.spent)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      )}

      <SaleDialog open={isRecording} onOpenChange={setIsRecording} />
    </div>
  );
};

export default CostingOverviewPage;
