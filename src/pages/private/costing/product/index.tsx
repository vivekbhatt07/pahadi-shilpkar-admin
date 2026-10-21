import { useState } from 'react';
import { Link, useParams } from 'react-router';
import { ArrowLeft, ExternalLink, PackageX } from 'lucide-react';

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
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ROUTES } from '@/constants/routes';
import { formatPrice } from '@/helpers/format';
import { useProductCosting } from '@/hooks/costing';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { CostBreakdown, ProductCosting } from '@/types/api';

import CostSheetEditor from '../components/CostSheetEditor';
import PriceAnalysis from '../components/PriceAnalysis';
import ProfitValue from '../components/ProfitValue';
import { channelProfit, deliveryChargedFor } from '../helpers';

/** The product's own sheet — shared by every variant without one. */
const SHARED = 'shared';

type TVariantEntry = ProductCosting['variants'][number];

/**
 * Every variant costed from the shared sheet as it's being edited — what a
 * change to it does to each one's profit.
 */
const SharedSheetVariants = ({
  costing,
  unit,
}: {
  costing: ProductCosting;
  unit: CostBreakdown;
}) => {
  const sharing = costing.variants.filter((entry) => !entry.sheet);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Variants costed from it</CardTitle>
        <CardDescription>
          {sharing.length === costing.variants.length
            ? 'Every variant — none has a sheet of its own.'
            : `${sharing.length} of ${costing.variants.length} — the rest have their own.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {sharing.length === 0 ? (
          <p className="text-sm text-stone-500">
            Each variant has its own sheet, so this one isn't used.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
            <Table>
              <TableHeader className="bg-stone-50 dark:bg-stone-800/50">
                <TableRow>
                  <TableHead>Variant</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">
                    Profit on WhatsApp
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sharing.map(({ variant }) => {
                  const profit =
                    unit.total > 0
                      ? channelProfit({
                          price: variant.price,
                          deliveryCharged: deliveryChargedFor(
                            variant.delivery,
                            unit.DELIVERY,
                          ),
                          cost: unit.total,
                          settings: costing.settings,
                          channel: 'WHATSAPP',
                        })
                      : null;
                  return (
                    <TableRow key={variant.id}>
                      <TableCell className="font-medium">
                        {variant.title}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">
                        {formatPrice(variant.price)}
                      </TableCell>
                      <TableCell className="text-right">
                        <ProfitValue
                          profit={profit?.profit ?? null}
                          marginPercent={profit?.marginPercent ?? null}
                          target={costing.settings.targetMarginPercent}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const ProductCostingPage = () => {
  const { productId } = useParams<{ productId: string }>();
  const costing = useProductCosting(productId);
  const data = costing.data;
  const [picked, setPicked] = useState<string | null>(null);
  useDocumentTitle(data ? `Costing · ${data.product.name}` : 'Costing');

  if (costing.isPending) {
    return (
      <div
        className="flex w-full flex-col gap-6"
        role="status"
        aria-label="Loading"
      >
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-10 w-80 max-w-full" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  if (!data) {
    return (
      <EmptyState
        icon={<PackageX className="size-5" />}
        title="Product not found"
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

  const { product } = data;
  // A product with variants opens on the first one — that's what's sold
  const selected =
    picked ??
    (product.hasVariants ? (data.variants[0]?.variant.id ?? SHARED) : SHARED);
  const entry: TVariantEntry | undefined = data.variants.find(
    (candidate) => candidate.variant.id === selected,
  );

  const sharedTemplate = data.sheet
    ? { label: 'the product’s shared sheet', sheet: data.sheet }
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
            <ImageThumb src={product.images[0]} alt="" className="size-10" />
            {product.name}
          </span>
        }
        description={
          product.hasVariants
            ? 'One sheet the variants share, and a sheet of its own for any variant made differently.'
            : 'What it takes to make one, and what it earns at its price.'
        }
        actions={
          <Button variant="outline" size="sm" asChild>
            <Link to={ROUTES.PRIVATE.PRODUCTS.DETAIL(product.slug)}>
              <ExternalLink />
              Product page
            </Link>
          </Button>
        }
      />

      {product.hasVariants && (
        <div
          role="tablist"
          aria-label="Cost sheet for"
          className="flex flex-wrap gap-1.5"
        >
          {[
            { id: SHARED, label: 'Shared sheet', status: null, own: true },
            ...data.variants.map((candidate) => ({
              id: candidate.variant.id,
              label: candidate.variant.title,
              status: candidate.analysis.status,
              own: Boolean(candidate.sheet),
            })),
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={tab.id === selected}
              onClick={() => setPicked(tab.id)}
              className={cn(
                'inline-flex h-9 cursor-pointer items-center gap-2 rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-4 focus-visible:ring-accent-500/20',
                tab.id === selected
                  ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-50 dark:bg-stone-50 dark:text-stone-900'
                  : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300',
              )}
            >
              {tab.label}
              {tab.id !== SHARED && !tab.own && (
                <span className="text-[11px] opacity-70">shared</span>
              )}
              {tab.status && tab.status !== 'HEALTHY' && (
                <span
                  className={cn(
                    'size-1.5 rounded-full',
                    tab.status === 'LOSS'
                      ? 'bg-red-500'
                      : tab.status === 'BELOW_TARGET'
                        ? 'bg-amber-500'
                        : 'bg-stone-400',
                  )}
                />
              )}
            </button>
          ))}
        </div>
      )}

      {selected === SHARED || !entry ? (
        <CostSheetEditor
          // A fresh editor once the server's copy changes
          key={`${SHARED}-${data.sheet?.updatedAt ?? 'none'}`}
          target={{ productId: product.id }}
          sheet={data.sheet}
          title={product.hasVariants ? 'Shared cost sheet' : 'Cost sheet'}
          description={
            product.hasVariants
              ? 'What a variant costs to make unless it has a sheet of its own.'
              : undefined
          }
        >
          {(unit) =>
            product.hasVariants ? (
              <SharedSheetVariants costing={data} unit={unit} />
            ) : (
              <PriceAnalysis
                price={product.price}
                delivery={product.delivery}
                cost={unit}
                settings={data.settings}
              />
            )
          }
        </CostSheetEditor>
      ) : (
        <CostSheetEditor
          key={`${entry.variant.id}-${entry.sheet?.updatedAt ?? 'none'}`}
          target={{ variantId: entry.variant.id }}
          sheet={entry.sheet}
          title={`${entry.variant.title} — its own sheet`}
          description={
            entry.sheet
              ? 'Used instead of the shared sheet for this variant.'
              : 'It has none — it costs what the shared sheet says.'
          }
          template={sharedTemplate}
        >
          {(unit, isDirty) => {
            // Without lines of its own, it's still costed from the shared sheet
            const usesShared = !entry.sheet && !isDirty && unit.total === 0;
            return (
              <PriceAnalysis
                price={entry.variant.price}
                delivery={entry.variant.delivery}
                cost={usesShared ? entry.analysis.breakdown : unit}
                settings={data.settings}
                note={
                  usesShared &&
                  (entry.analysis.breakdown
                    ? 'Costed from the shared sheet.'
                    : 'Neither it nor the product has a cost sheet yet.')
                }
              />
            );
          }}
        </CostSheetEditor>
      )}
    </div>
  );
};

export default ProductCostingPage;
