import { useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronRight,
  Loader2,
  Plus,
  Search,
} from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatPrice } from '@/helpers/format';
import { useProducts } from '@/hooks/products';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import type { Product, ProductVariant } from '@/types/api';

import {
  AVAILABILITY_LABELS,
  availabilityVariant,
} from '../../products/helpers';
import { PRODUCT_PICKER_LIMIT } from '../constants';
import { comboItemKey } from '../helpers';

type TProductPickerProps = {
  /** What's in the combo already, as `comboItemKey`s — shown as added. */
  selectedKeys: string[];
  /** `variant` is set exactly when the product comes in variants. */
  onSelect: (product: Product, variant: ProductVariant | null) => void;
  disabled?: boolean;
};

const optionClass = cn(
  'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm',
  'hover:bg-stone-100 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent dark:hover:bg-stone-800',
);

const AddedMark = () => (
  <Check
    className="size-4 shrink-0 text-accent-600 dark:text-accent-400"
    aria-label="Already added"
  />
);

/**
 * Which variant goes in: the one under the pointer (or keyboard focus) shown
 * large above a grid of them all, so similar designs can be told apart
 * before one is added.
 */
const VariantStep = ({
  product,
  isAdded,
  onBack,
  onSelect,
}: {
  product: Product;
  isAdded: (variant: ProductVariant) => boolean;
  onBack: () => void;
  onSelect: (variant: ProductVariant) => void;
}) => {
  const [lookingAt, setLookingAt] = useState(product.variants[0]?.id);
  const [photo, setPhoto] = useState(0);
  const shown =
    product.variants.find((variant) => variant.id === lookingAt) ??
    product.variants[0];
  const photos =
    shown && shown.images.length > 0 ? shown.images : product.images;
  const look = (variant: ProductVariant) => {
    if (variant.id === lookingAt) return;
    setLookingAt(variant.id);
    setPhoto(0);
  };

  return (
    <>
      <div className="flex items-center gap-2 border-b border-stone-200 p-2 dark:border-stone-700">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={onBack}
          aria-label="Back to products"
        >
          <ArrowLeft />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-50">
            {product.name}
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Which {product.variantOptions[0]?.name.toLowerCase() ?? 'variant'}{' '}
            goes in the combo?
          </p>
        </div>
      </div>

      {shown && (
        <div className="flex gap-3 border-b border-stone-200 p-3 dark:border-stone-700">
          <div className="flex shrink-0 flex-col gap-1.5">
            <ImageThumb
              key={photos[photo]}
              src={photos[photo] ?? photos[0]}
              alt={`${product.name} — ${shown.title}`}
              rounded="lg"
              className="size-36 animate-in duration-200 fade-in-0 sm:size-40"
            />
            {photos.length > 1 && (
              <div className="flex max-w-40 gap-1 overflow-x-auto">
                {photos.map((url, index) => (
                  <button
                    key={`${url}-${index}`}
                    type="button"
                    onClick={() => setPhoto(index)}
                    aria-label={`Photo ${index + 1} of ${shown.title}`}
                    aria-pressed={index === photo}
                    className={cn(
                      'shrink-0 cursor-pointer rounded-md outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40',
                      index === photo
                        ? 'ring-2 ring-accent-500'
                        : 'opacity-70 hover:opacity-100',
                    )}
                  >
                    <ImageThumb src={url} alt="" className="size-8" />
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="flex min-w-0 flex-col gap-1.5">
            <p className="text-sm font-medium text-stone-900 dark:text-stone-50">
              {shown.title}
            </p>
            <ul className="flex flex-col gap-0.5 text-xs text-stone-500 dark:text-stone-400">
              {product.variantOptions.map((option) => (
                <li key={option.name}>
                  {option.name}:{' '}
                  <span className="text-stone-700 dark:text-stone-200">
                    {shown.options[option.name]}
                  </span>
                </li>
              ))}
            </ul>
            <p className="text-sm font-semibold tabular-nums text-stone-900 dark:text-stone-50">
              {formatPrice(shown.price)}
            </p>
            <div className="flex flex-wrap gap-1">
              <Badge variant={availabilityVariant(shown.availability)}>
                {AVAILABILITY_LABELS[shown.availability]}
              </Badge>
              {!shown.isActive && <Badge variant="secondary">Hidden</Badge>}
            </div>
            {shown.sku && (
              <p className="font-mono text-[11px] text-stone-400">
                {shown.sku}
              </p>
            )}
            {shown.images.length === 0 && (
              <p className="text-[11px] text-stone-400 dark:text-stone-500">
                No photos of its own — shoppers see the product's.
              </p>
            )}
          </div>
        </div>
      )}

      <div className="max-h-64 overflow-y-auto p-2">
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {product.variants.map((variant) => {
            const added = isAdded(variant);
            return (
              <li key={variant.id}>
                <button
                  type="button"
                  disabled={added}
                  onClick={() => onSelect(variant)}
                  onMouseEnter={() => look(variant)}
                  onFocus={() => look(variant)}
                  aria-label={`Add ${variant.title}${added ? ' (already added)' : ''}`}
                  className={cn(
                    'flex w-full cursor-pointer flex-col gap-1 rounded-lg p-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-accent-500/40 disabled:cursor-default',
                    variant.id === shown?.id
                      ? 'bg-stone-100 dark:bg-stone-800'
                      : 'hover:bg-stone-100 dark:hover:bg-stone-800',
                  )}
                >
                  <span className="relative">
                    <ImageThumb
                      src={variant.images[0] ?? product.images[0]}
                      alt=""
                      rounded="lg"
                      className={cn(
                        'aspect-square w-full',
                        (!variant.isActive || added) && 'opacity-50',
                      )}
                    />
                    {added && (
                      <span className="absolute inset-0 flex items-center justify-center">
                        <AddedMark />
                      </span>
                    )}
                  </span>
                  <span className="truncate text-xs font-medium text-stone-800 dark:text-stone-200">
                    {variant.title}
                  </span>
                  <span className="text-[11px] tabular-nums text-stone-500 dark:text-stone-400">
                    {formatPrice(variant.price)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </>
  );
};

/**
 * Searchable product dropdown for adding combo items. Queries the API only
 * while open (debounced), and includes inactive products — a combo may hold
 * them, it just stays hidden until they're active. A product that comes in
 * variants opens a second step to pick which one goes in; two variants of
 * one product can both go in.
 */
const ProductPicker = ({
  selectedKeys,
  onSelect,
  disabled,
}: TProductPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [picking, setPicking] = useState<Product | null>(null);
  const debouncedSearch = useDebouncedValue(search.trim(), 300);

  const products = useProducts(
    {
      search: debouncedSearch || undefined,
      limit: PRODUCT_PICKER_LIMIT,
      includeInactive: true,
    },
    { enabled: open },
  );
  const items = products.data?.items ?? [];
  const isSearching = search.trim() !== debouncedSearch || products.isFetching;

  const isAdded = (product: Product, variant: ProductVariant | null) =>
    selectedKeys.includes(comboItemKey(product.id, variant?.id ?? null));

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (!next) {
      setSearch('');
      setPicking(null);
    }
  };

  const handleSelect = (product: Product, variant: ProductVariant | null) => {
    onSelect(product, variant);
    handleOpenChange(false);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          disabled={disabled}
          startAdornment={<Plus />}
          className="w-fit"
        >
          Add product
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className={cn(
          'p-0',
          picking
            ? 'w-[min(34rem,calc(100vw-2rem))]'
            : 'w-[min(26rem,calc(100vw-2rem))]',
        )}
      >
        {picking ? (
          <VariantStep
            product={picking}
            isAdded={(variant) => isAdded(picking, variant)}
            onBack={() => setPicking(null)}
            onSelect={(variant) => handleSelect(picking, variant)}
          />
        ) : (
          <>
            <div className="border-b border-stone-200 p-2 dark:border-stone-700">
              <Input
                autoFocus
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search products by name, SKU or tag…"
                startAdornment={<Search className="size-4 text-stone-400" />}
                endAdornment={
                  isSearching ? (
                    <Loader2 className="size-4 animate-spin text-stone-400" />
                  ) : undefined
                }
              />
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {products.isPending ? (
                <p className="px-2 py-6 text-center text-xs text-stone-400">
                  Loading products…
                </p>
              ) : items.length === 0 ? (
                <p className="px-2 py-6 text-center text-xs text-stone-400">
                  No products found
                </p>
              ) : (
                items.map((product) => {
                  const hasVariants = product.variants.length > 0;
                  const added = hasVariants
                    ? product.variants.every((variant) =>
                        isAdded(product, variant),
                      )
                    : isAdded(product, null);
                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={added}
                      onClick={() =>
                        hasVariants
                          ? setPicking(product)
                          : handleSelect(product, null)
                      }
                      className={optionClass}
                    >
                      <ImageThumb
                        src={product.images[0]}
                        alt=""
                        className="size-10"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium text-stone-900 dark:text-stone-50">
                          {product.name}
                        </span>
                        <span className="block truncate font-mono text-xs text-stone-400 dark:text-stone-500">
                          {hasVariants ? (
                            <span className="font-sans">
                              {product.variants.length} variants —{' '}
                              {product.variantOptions
                                .map((option) => option.name)
                                .join(' × ')}
                            </span>
                          ) : (
                            (product.sku ?? product.slug)
                          )}
                        </span>
                      </span>
                      {!product.isActive && (
                        <Badge variant="secondary" className="shrink-0">
                          Inactive
                        </Badge>
                      )}
                      <span className="shrink-0 text-xs tabular-nums text-stone-500 dark:text-stone-400">
                        {hasVariants && 'from '}
                        {formatPrice(product.price)}
                      </span>
                      {added ? (
                        <AddedMark />
                      ) : (
                        hasVariants && (
                          <ChevronRight className="size-4 shrink-0 text-stone-400" />
                        )
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
};

export default ProductPicker;
