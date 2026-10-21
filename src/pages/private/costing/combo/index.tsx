import { Link, useParams } from 'react-router';
import { AlertTriangle, ArrowLeft, ExternalLink, PackageX } from 'lucide-react';

import Callout from '@/components/custom/Callout';
import EmptyState from '@/components/custom/EmptyState';
import ImageThumb from '@/components/custom/ImageThumb';
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
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/constants/routes';
import { formatPrice } from '@/helpers/format';
import { useComboCosting } from '@/hooks/costing';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import type { CostBreakdown } from '@/types/api';

import CostSheetEditor from '../components/CostSheetEditor';
import PriceAnalysis from '../components/PriceAnalysis';
import { emptyBreakdown } from '../helpers';

const LINE_TYPES = [
  'MATERIAL',
  'LABOUR',
  'PACKAGING',
  'DELIVERY',
  'OVERHEAD',
  'OTHER',
  'total',
] as const;

const minus = (a: CostBreakdown, b: CostBreakdown) => {
  const result = emptyBreakdown();
  for (const type of LINE_TYPES) result[type] = a[type] - b[type];
  return result;
};

const plus = (a: CostBreakdown, b: CostBreakdown) => {
  const result = emptyBreakdown();
  for (const type of LINE_TYPES) result[type] = a[type] + b[type];
  return result;
};

const ComboCostingPage = () => {
  const { comboId } = useParams<{ comboId: string }>();
  const costing = useComboCosting(comboId);
  const data = costing.data;
  useDocumentTitle(data ? `Costing · ${data.combo.name}` : 'Costing');

  if (costing.isPending) {
    return (
      <div
        className="flex w-full flex-col gap-6"
        role="status"
        aria-label="Loading"
      >
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={<PackageX className="size-5" />}
        title="Combo not found"
        description="It may have been deleted."
        action={
          <Button variant="outline" asChild>
            <Link to={ROUTES.PRIVATE.COSTING.LISTINGS}>
              Back to product costs
            </Link>
          </Button>
        }
      />
    );
  }

  const { combo } = data;
  const missing = data.items.filter((item) => item.unitCost === null);
  // The items' share of the saved total — the editor adds its live extras
  const itemsBreakdown =
    data.analysis.breakdown && data.itemsCost !== null
      ? minus(data.analysis.breakdown, data.sheet?.unitCost ?? emptyBreakdown())
      : null;

  return (
    <div className="flex w-full flex-col gap-6">
      <Button
        variant="ghost"
        size="sm"
        asChild
        className="group -ml-2 w-fit text-stone-500"
      >
        <Link to={ROUTES.PRIVATE.COSTING.LISTINGS}>
          <ArrowLeft className="transition-transform group-hover:-translate-x-0.5" />
          Back to product costs
        </Link>
      </Button>

      <PageHeader
        title={
          <span className="flex items-center gap-3">
            <ImageThumb src={combo.images[0]} alt="" className="size-10" />
            {combo.name}
          </span>
        }
        description="A combo costs its items, each from its own cost sheet, plus what only the set needs — the gift box, the ribbon."
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.PRIVATE.COMBOS.DETAIL(combo.slug)}>
              <ExternalLink />
              Combo page
            </Link>
          </Button>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>What's in it</CardTitle>
          <CardDescription>
            Change an item's cost on its own product's sheet.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {missing.length > 0 && (
            <Callout
              variant="warning"
              title={`${missing.length} ${missing.length === 1 ? 'item has' : 'items have'} no cost yet`}
            >
              The combo's profit can't be worked out until every item has a cost
              sheet — a total missing a part would look like profit that isn't
              there.
            </Callout>
          )}
          <div className="overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
            <Table>
              <TableHeader className="bg-stone-50 dark:bg-stone-800/50">
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Cost each</TableHead>
                  <TableHead className="text-right">Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.items.map((item) => (
                  <TableRow key={`${item.productId}-${item.variantId}`}>
                    <TableCell>
                      <Link
                        to={ROUTES.PRIVATE.COSTING.PRODUCT(item.productId)}
                        className="font-medium hover:text-accent-600 hover:underline"
                      >
                        {item.name}
                      </Link>
                      {item.costSource === 'PRODUCT' && (
                        <span className="ml-1.5 text-xs text-stone-400">
                          shared sheet
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.quantity}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.unitCost === null ? (
                        <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400">
                          <AlertTriangle className="size-3.5" />
                          No cost
                        </span>
                      ) : (
                        formatPrice(item.unitCost)
                      )}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">
                      {item.unitCost === null
                        ? '—'
                        : formatPrice(item.unitCost * item.quantity)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell colSpan={3}>Items</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {data.itemsCost === null
                      ? '—'
                      : formatPrice(data.itemsCost)}
                  </TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </CardContent>
      </Card>

      <CostSheetEditor
        key={data.sheet?.updatedAt ?? 'none'}
        target={{ comboId: combo.id }}
        sheet={data.sheet}
        title="Extras for the set"
        description="Per combo — usually the box and its packing. Leave it empty if the set needs nothing more than its items."
      >
        {(unit) => (
          <PriceAnalysis
            price={combo.price}
            delivery={combo.delivery}
            cost={itemsBreakdown ? plus(itemsBreakdown, unit) : null}
            settings={data.settings}
            note={
              itemsBreakdown
                ? 'Its items’ costs and its own extras together.'
                : 'Shown once every item has a cost.'
            }
          />
        )}
      </CostSheetEditor>
    </div>
  );
};

export default ComboCostingPage;
