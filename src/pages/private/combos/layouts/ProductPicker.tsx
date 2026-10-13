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

import { AVAILABILITY_LABELS } from '../../products/helpers';
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
      <PopoverContent className="w-[min(26rem,calc(100vw-2rem))] p-0">
        {picking ? (
          <>
            <div className="flex items-center gap-2 border-b border-stone-200 p-2 dark:border-stone-700">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => setPicking(null)}
                aria-label="Back to products"
              >
                <ArrowLeft />
              </Button>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-stone-900 dark:text-stone-50">
                  {picking.name}
                </p>
                <p className="text-xs text-stone-400 dark:text-stone-500">
                  Which{' '}
                  {picking.variantOptions[0]?.name.toLowerCase() ?? 'variant'}{' '}
                  goes in the combo?
                </p>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto p-1">
              {picking.variants.map((variant) => {
                const added = isAdded(picking, variant);
                return (
                  <button
                    key={variant.id}
                    type="button"
                    disabled={added}
                    onClick={() => handleSelect(picking, variant)}
                    className={optionClass}
                  >
                    <ImageThumb
                      src={variant.images[0] ?? picking.images[0]}
                      alt=""
                      className="size-8"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium text-stone-900 dark:text-stone-50">
                        {variant.title}
                      </span>
                      <span className="block truncate text-xs text-stone-400 dark:text-stone-500">
                        {AVAILABILITY_LABELS[variant.availability]}
                        {variant.sku && ` · ${variant.sku}`}
                      </span>
                    </span>
                    {!variant.isActive && (
                      <Badge variant="secondary" className="shrink-0">
                        Hidden
                      </Badge>
                    )}
                    <span className="shrink-0 text-xs tabular-nums text-stone-500 dark:text-stone-400">
                      {formatPrice(variant.price)}
                    </span>
                    {added && <AddedMark />}
                  </button>
                );
              })}
            </div>
          </>
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
                        className="size-8"
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
