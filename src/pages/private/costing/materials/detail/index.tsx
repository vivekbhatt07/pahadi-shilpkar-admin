import { useState } from 'react';
import { Link, useParams } from 'react-router';
import dayjs from 'dayjs';
import {
  ArrowLeft,
  PackageOpen,
  Pencil,
  ReceiptText,
  Trash2,
} from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import PageHeader from '@/components/custom/PageHeader';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Badge } from '@/components/ui/badge';
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
import { formatDate, formatPrice } from '@/helpers/format';
import { useDeletePurchase, useMaterial } from '@/hooks/costing';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type {
  MaterialPurchase,
  MaterialUnit,
  MaterialUsage,
} from '@/types/api';

import MaterialDialog from '../../components/MaterialDialog';
import PurchaseDialog from '../../components/PurchaseDialog';
import { UNIT_LABELS } from '../../constants';
import { formatQuantity, formatUnitCost } from '../../helpers';
import PriceTrend from '../PriceTrend';

const usageLink = ({ target }: MaterialUsage) =>
  target.comboId
    ? ROUTES.PRIVATE.COSTING.COMBO(target.comboId)
    : ROUTES.PRIVATE.COSTING.PRODUCT(target.productId!);

/** What one unit cost at each purchase, oldest first — a line over the dates. */
const PriceHistory = ({
  purchases,
  unit,
}: {
  purchases: MaterialPurchase[];
  unit: MaterialUnit;
}) => {
  const points = [...purchases].reverse();
  if (points.length < 2) {
    return (
      <p className="text-sm text-stone-500 dark:text-stone-400">
        Record a couple of purchases to see how the price moves.
      </p>
    );
  }
  const costs = points.map((point) => point.unitCost);
  const low = Math.min(...costs);
  const high = Math.max(...costs);
  const span = high - low || high || 1;
  const x = (index: number) => (index / (points.length - 1)) * 100;
  const y = (cost: number) => 90 - ((cost - low) / span) * 80;

  return (
    <figure className="flex flex-col gap-2">
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        role="img"
        aria-label={`Price per ${UNIT_LABELS[unit].toLowerCase()} from ${formatUnitCost(costs[0], unit)} to ${formatUnitCost(costs[costs.length - 1], unit)}`}
        className="h-32 w-full overflow-visible"
      >
        <line
          x1="0"
          x2="100"
          y1="90"
          y2="90"
          className="stroke-stone-200 dark:stroke-stone-700"
          strokeWidth="0.5"
          vectorEffect="non-scaling-stroke"
        />
        <polyline
          fill="none"
          className="stroke-accent-600 dark:stroke-accent-400"
          strokeWidth="2"
          strokeLinejoin="round"
          vectorEffect="non-scaling-stroke"
          points={points
            .map((point, index) => `${x(index)},${y(point.unitCost)}`)
            .join(' ')}
        />
        {points.map((point, index) => (
          <circle
            key={point.id}
            cx={x(index)}
            cy={y(point.unitCost)}
            r="1.6"
            className="fill-accent-600 dark:fill-accent-400"
            vectorEffect="non-scaling-stroke"
          >
            <title>
              {formatDate(point.purchasedAt)} ·{' '}
              {formatUnitCost(point.unitCost, unit)}
            </title>
          </circle>
        ))}
      </svg>
      <figcaption className="flex justify-between text-[11px] text-stone-500 tabular-nums dark:text-stone-400">
        <span>
          {dayjs(points[0].purchasedAt).format('D MMM YYYY')} ·{' '}
          {formatUnitCost(costs[0], unit)}
        </span>
        <span>
          {dayjs(points[points.length - 1].purchasedAt).format('D MMM YYYY')} ·{' '}
          {formatUnitCost(costs[costs.length - 1], unit)}
        </span>
      </figcaption>
    </figure>
  );
};

const MaterialDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const material = useMaterial(id);
  const data = material.data;
  const deletePurchase = useDeletePurchase();
  const [isEditing, setIsEditing] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [deleting, setDeleting] = useState<MaterialPurchase | null>(null);
  useDocumentTitle(data ? data.name : 'Raw material');

  if (material.isPending) {
    return (
      <div
        className="flex w-full flex-col gap-6"
        role="status"
        aria-label="Loading"
      >
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={<PackageOpen className="size-5" />}
        title="Material not found"
        description="It may have been deleted."
        action={
          <Button variant="outline" asChild>
            <Link to={ROUTES.PRIVATE.COSTING.MATERIALS}>Back to materials</Link>
          </Button>
        }
      />
    );
  }

  const spent = data.purchases.reduce(
    (sum, purchase) => sum + purchase.totalCost,
    0,
  );
  const bought = data.purchases.reduce(
    (sum, purchase) => sum + purchase.quantity,
    0,
  );

  return (
    <div className="flex w-full flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="group -ml-2 w-fit text-stone-500"
      >
        <Link to={ROUTES.PRIVATE.COSTING.MATERIALS}>
          <ArrowLeft className="transition-transform group-hover:-translate-x-0.5" />
          Back to materials
        </Link>
      </Button>

      <PageHeader
        title={data.name}
        description={
          <span className="flex flex-wrap items-center gap-1.5">
            {data.category && <Badge variant="outline">{data.category}</Badge>}
            Counted in {UNIT_LABELS[data.unit].toLowerCase()}s
            {data.supplier && ` · from ${data.supplier}`}
            {!data.isActive && <Badge variant="secondary">Switched off</Badge>}
          </span>
        }
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
              startAdornment={<Pencil />}
            >
              Edit
            </Button>
            <Button
              size="sm"
              onClick={() => setIsBuying(true)}
              startAdornment={<ReceiptText />}
            >
              Record a purchase
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          {
            label: 'Costs now',
            value: formatUnitCost(data.unitCost, data.unit),
            extra: <PriceTrend change={data.priceChangePercent} />,
          },
          {
            label: 'Last bought',
            value: data.lastPurchase
              ? formatDate(data.lastPurchase.purchasedAt)
              : 'Never recorded',
          },
          {
            label: 'Bought in all',
            value:
              data.purchases.length > 0
                ? `${formatQuantity(bought, data.unit)} · ${formatPrice(spent)}`
                : '—',
          },
          {
            label: 'Used in',
            value: `${data.usageCount} cost ${data.usageCount === 1 ? 'sheet' : 'sheets'}`,
          },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col gap-1 pt-5">
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {stat.label}
              </p>
              <p className="text-base font-semibold text-stone-900 tabular-nums dark:text-stone-50">
                {stat.value}
              </p>
              {stat.extra}
            </CardContent>
          </Card>
        ))}
      </div>

      {data.notes && (
        <p className="rounded-lg border border-stone-200 bg-stone-50 px-4 py-3 text-sm whitespace-pre-line text-stone-700 dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-300">
          {data.notes}
        </p>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Price history</CardTitle>
            <CardDescription>
              What one {UNIT_LABELS[data.unit].toLowerCase()} cost at each
              purchase.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PriceHistory purchases={data.purchases} unit={data.unit} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Where it's used</CardTitle>
            <CardDescription>
              What it adds to one piece — a new price reaches all of these.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {data.usage.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">
                No cost sheet uses it yet.
              </p>
            ) : (
              <ul className="flex flex-col divide-y divide-stone-100 dark:divide-stone-800">
                {data.usage.map((usage, index) => (
                  <li
                    key={`${usage.sheetId}-${index}`}
                    className="flex items-center justify-between gap-3 py-2 text-sm"
                  >
                    <Link
                      to={usageLink(usage)}
                      className="min-w-0 truncate font-medium hover:text-accent-600 hover:underline"
                    >
                      {usage.target.name}
                    </Link>
                    <span className="shrink-0 text-right text-xs text-stone-500 tabular-nums">
                      {formatQuantity(usage.quantity, data.unit)} for{' '}
                      {usage.batchSize}
                      <span className="block font-medium text-stone-800 dark:text-stone-200">
                        {formatPrice(usage.costPerPiece)} a piece
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Purchases</CardTitle>
          <CardDescription>Newest first.</CardDescription>
        </CardHeader>
        <CardContent>
          {data.purchases.length === 0 ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              None recorded yet — its cost was set by hand.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
              <Table>
                <TableHeader className="bg-stone-50 dark:bg-stone-800/50">
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Bought</TableHead>
                    <TableHead className="text-right">Paid</TableHead>
                    <TableHead className="text-right">Per unit</TableHead>
                    <TableHead className="hidden md:table-cell">From</TableHead>
                    <TableHead className="w-12">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.purchases.map((purchase) => (
                    <TableRow key={purchase.id}>
                      <TableCell className="text-sm">
                        {formatDate(purchase.purchasedAt)}
                        {purchase.note && (
                          <span className="block text-xs text-stone-400">
                            {purchase.note}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatQuantity(purchase.quantity, data.unit)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPrice(purchase.totalCost)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatUnitCost(purchase.unitCost, data.unit)}
                      </TableCell>
                      <TableCell className="hidden text-sm text-stone-500 md:table-cell">
                        {purchase.supplier ?? '—'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleting(purchase)}
                          aria-label="Delete purchase"
                          className="text-stone-400 hover:text-red-600"
                        >
                          <Trash2 />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <MaterialDialog
        open={isEditing}
        onOpenChange={setIsEditing}
        material={data}
      />
      <PurchaseDialog
        material={isBuying ? data : null}
        onClose={() => setIsBuying(false)}
      />
      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete this purchase?"
        description="For one recorded by mistake. The material's cost stays as it is — change it on the material if it should go back."
        confirmLabel="Delete purchase"
        variant="destructive"
        isPending={deletePurchase.isPending}
        onConfirm={() =>
          deleting &&
          deletePurchase.mutate(
            { materialId: data.id, purchaseId: deleting.id },
            { onSettled: () => setDeleting(null) },
          )
        }
      />
    </div>
  );
};

export default MaterialDetailPage;
