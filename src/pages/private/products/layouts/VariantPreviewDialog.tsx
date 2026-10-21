import { useState } from 'react';
import { Link } from 'react-router';
import { ExternalLink, Repeat, Ruler } from 'lucide-react';

import Callout from '@/components/custom/Callout';
import ColorSwatch from '@/components/custom/ColorSwatch';
import ImageThumb from '@/components/custom/ImageThumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { formatPrice } from '@/helpers/format';
import { useProduct } from '@/hooks/products';
import { cn } from '@/lib/utils';
import type { ProductDetail, ProductVariant } from '@/types/api';

import ProductGallery from '../detail/layouts/ProductGallery';
import {
  AVAILABILITY_LABELS,
  availabilityVariant,
  stockFlag,
} from '../helpers';

/** What to preview — enough to show something while the product loads. */
export type TVariantPreviewTarget = {
  /** The product's slug — the rest of it is fetched. */
  slug: string;
  name: string;
  /** The photos shoppers see for it, until the product loads. */
  images: string[];
  /** The variant to open on; null for a product without variants. */
  variantId: string | null;
};

type TVariantPreviewDialogProps = {
  /** null closes the dialog. */
  target: TVariantPreviewTarget | null;
  /** How many go in the combo, when previewing a combo item. */
  quantity?: number;
  /**
   * Offers to swap to the variant being looked at — a combo item whose
   * design was picked by mistake. Left out, the preview is read-only.
   */
  onUseVariant?: (variant: ProductVariant) => void;
  /** Variants already in the combo as other items — not offered for a swap. */
  takenVariantIds?: string[];
  onClose: () => void;
};

const Fact = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex flex-col gap-0.5">
    <dt className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase dark:text-stone-500">
      {label}
    </dt>
    <dd className="text-sm text-stone-800 dark:text-stone-200">{children}</dd>
  </div>
);

/** "Design: Peacock" chips — with the colour, for an option of swatches. */
const OptionChips = ({
  product,
  variant,
}: {
  product: ProductDetail;
  variant: ProductVariant;
}) => (
  <ul className="flex flex-wrap gap-1.5">
    {product.variantOptions.map((option) => {
      const value = variant.options[option.name];
      if (value === undefined) return null;
      const hex = option.swatches?.[value];
      return (
        <li
          key={option.name}
          className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 py-0.5 pr-2.5 pl-2 text-xs text-stone-600 dark:border-stone-700 dark:text-stone-300"
        >
          {hex && <ColorSwatch hex={hex} className="size-3" />}
          {option.name}:
          <span className="font-medium text-stone-900 dark:text-stone-50">
            {value}
          </span>
        </li>
      );
    })}
  </ul>
);

/** Why a combo with this in it won't sell as planned, if it won't. */
const Warnings = ({
  product,
  variant,
}: {
  product: ProductDetail;
  variant: ProductVariant | null;
}) => {
  const sold = variant ?? product;
  const hidden = !product.isActive || (variant !== null && !variant.isActive);
  const awaiting =
    sold.availability === 'OUT_OF_STOCK' || sold.availability === 'COMING_SOON';
  if (!hidden && !awaiting) return null;
  return (
    <Callout variant="warning">
      {hidden
        ? `${!product.isActive ? 'The product is inactive' : 'This variant is switched off'} — shoppers can't see it, and a combo holding it is hidden too.`
        : `It's ${AVAILABILITY_LABELS[sold.availability].toLowerCase()} — a combo holding it shows as ${AVAILABILITY_LABELS[sold.availability].toLowerCase()} until it's back.`}
    </Callout>
  );
};

const PreviewBody = ({
  target,
  quantity,
  onUseVariant,
  takenVariantIds = [],
  onClose,
}: TVariantPreviewDialogProps & { target: TVariantPreviewTarget }) => {
  const product = useProduct(target.slug);
  const [previewId, setPreviewId] = useState(target.variantId);
  const data = product.data;
  const variant =
    data?.variants.find((candidate) => candidate.id === previewId) ?? null;
  // What shoppers see: the variant's own photos, else the product's
  const images = data
    ? variant && variant.images.length > 0
      ? variant.images
      : data.images
    : target.images;
  const sold = variant ?? data;
  const flag = sold && stockFlag(sold);
  const isSwap =
    onUseVariant !== undefined &&
    variant !== null &&
    variant.id !== target.variantId;
  const isTaken = variant !== null && takenVariantIds.includes(variant.id);
  const ownSize = variant
    ? [variant.dimensions?.split('\n')[0], variant.weight]
        .filter(Boolean)
        .join(' · ')
    : '';

  return (
    <>
      <DialogHeader>
        <DialogTitle>
          {target.name}
          {variant && (
            <span className="font-normal text-stone-500 dark:text-stone-400">
              {' '}
              — {variant.title}
            </span>
          )}
        </DialogTitle>
        <DialogDescription>
          The photos and details shoppers see
          {quantity !== undefined && ` · ${quantity} in this combo`}.
        </DialogDescription>
      </DialogHeader>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <ProductGallery
          key={images.join('|')}
          images={images}
          name={variant ? `${target.name} — ${variant.title}` : target.name}
        />

        <div className="flex min-w-0 flex-col gap-4">
          {product.isPending ? (
            <div
              className="flex flex-col gap-3"
              role="status"
              aria-label="Loading"
            >
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="h-16 w-full" />
            </div>
          ) : !data || !sold ? (
            <p className="text-sm text-stone-500 dark:text-stone-400">
              Couldn't load the product — it may have been deleted.
            </p>
          ) : (
            <>
              {variant && <OptionChips product={data} variant={variant} />}
              <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Fact label="Price">
                  <span className="font-semibold tabular-nums">
                    {formatPrice(sold.price)}
                  </span>
                  {sold.compareAtPrice !== null && (
                    <span className="ml-1.5 text-xs text-stone-400 tabular-nums line-through">
                      {formatPrice(sold.compareAtPrice)}
                    </span>
                  )}
                </Fact>
                <Fact label="Availability">
                  <Badge variant={availabilityVariant(sold.availability)}>
                    {AVAILABILITY_LABELS[sold.availability]}
                  </Badge>
                </Fact>
                <Fact label="Stock">
                  <span
                    className={cn(
                      'tabular-nums',
                      flag === 'empty' &&
                        'font-medium text-red-600 dark:text-red-400',
                      flag === 'low' &&
                        'font-medium text-amber-700 dark:text-amber-400',
                    )}
                  >
                    {sold.stock}
                    {flag === 'empty' && ' — none left'}
                    {flag === 'low' && ' — running low'}
                  </span>
                </Fact>
                <Fact label="SKU">
                  <span className="font-mono text-xs">
                    {(variant ? variant.sku : data.sku) ?? '—'}
                  </span>
                </Fact>
              </dl>
              {ownSize && (
                <p className="flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                  <Ruler className="size-3.5 shrink-0" />
                  {ownSize}
                </p>
              )}
              {variant?.description && (
                <p className="text-sm text-stone-600 italic dark:text-stone-300">
                  {variant.description}
                </p>
              )}
              <Warnings product={data} variant={variant} />

              {data.variants.length > 1 && (
                <div className="flex flex-col gap-2">
                  <p className="text-xs font-medium text-stone-500 dark:text-stone-400">
                    {onUseVariant
                      ? 'Its other variants — pick one to compare, or swap to it'
                      : 'Its variants'}
                  </p>
                  <ul className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                    {data.variants.map((option) => {
                      const isCurrent = option.id === target.variantId;
                      const isViewed = option.id === previewId;
                      return (
                        <li key={option.id}>
                          <button
                            type="button"
                            onClick={() => setPreviewId(option.id)}
                            aria-pressed={isViewed}
                            aria-label={`Preview ${option.title}`}
                            className={cn(
                              'flex w-full cursor-pointer flex-col items-center gap-1 rounded-lg p-1 text-center outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40',
                              isViewed
                                ? 'bg-accent-50 dark:bg-accent-950/40'
                                : 'hover:bg-stone-100 dark:hover:bg-stone-800',
                            )}
                          >
                            <span className="relative">
                              <ImageThumb
                                src={option.images[0] ?? data.images[0]}
                                alt=""
                                className={cn(
                                  'size-12',
                                  isViewed && 'ring-2 ring-accent-500',
                                  !option.isActive && 'opacity-50',
                                )}
                              />
                              {isCurrent && (
                                <span
                                  aria-hidden
                                  className="absolute -top-1 -right-1 size-2.5 rounded-full bg-accent-500 ring-2 ring-white dark:ring-stone-900"
                                />
                              )}
                            </span>
                            <span className="line-clamp-2 text-[11px] leading-tight text-stone-700 dark:text-stone-300">
                              {option.title}
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                  {onUseVariant && (
                    <p className="flex items-center gap-1.5 text-[11px] text-stone-400 dark:text-stone-500">
                      <span className="size-2 rounded-full bg-accent-500" />
                      In this combo
                    </p>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <DialogFooter className="sm:justify-between">
        <Button variant="ghost" size="sm" asChild className="w-fit">
          <Link
            to={ROUTES.PRIVATE.PRODUCTS.DETAIL(target.slug)}
            target="_blank"
          >
            Open product
            <ExternalLink className="size-3.5" />
          </Link>
        </Button>
        <div className="flex flex-col-reverse gap-2 sm:flex-row">
          {isSwap && variant && (
            <SimpleTooltip
              label={isTaken ? 'Already in this combo' : 'Keeps the quantity'}
            >
              <span>
                <Button
                  type="button"
                  variant="outline"
                  disabled={isTaken}
                  onClick={() => {
                    onUseVariant?.(variant);
                    onClose();
                  }}
                  className="w-full"
                >
                  <Repeat />
                  Use {variant.title} instead
                </Button>
              </span>
            </SimpleTooltip>
          )}
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </div>
      </DialogFooter>
    </>
  );
};

/**
 * A closer look at a product — or one variant of it — as shoppers will see
 * it: its photos large, its options, price, stock and anything that would
 * stop it selling. In a combo, it can swap the item to another variant.
 */
const VariantPreviewDialog = (props: TVariantPreviewDialogProps) => (
  <Dialog
    open={props.target !== null}
    onOpenChange={(open) => !open && props.onClose()}
  >
    <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-3xl md:max-w-3xl">
      {props.target && (
        <PreviewBody
          key={`${props.target.slug}/${props.target.variantId ?? ''}`}
          {...props}
          target={props.target}
        />
      )}
    </DialogContent>
  </Dialog>
);

export default VariantPreviewDialog;
