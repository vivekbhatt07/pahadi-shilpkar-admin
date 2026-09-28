import { useState } from 'react';
import { Check, Loader2, Plus, Search } from 'lucide-react';

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
import type { Product } from '@/types/api';

import { PRODUCT_PICKER_LIMIT } from '../constants';

type TProductPickerProps = {
  /** Products already in the combo — shown as added and not selectable. */
  selectedIds: string[];
  onSelect: (product: Product) => void;
  disabled?: boolean;
};

/**
 * Searchable product dropdown for adding combo items. Queries the API only
 * while open (debounced), and includes inactive products — a combo may hold
 * them, it just stays hidden until they're active.
 */
const ProductPicker = ({
  selectedIds,
  onSelect,
  disabled,
}: TProductPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
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

  const handleSelect = (product: Product) => {
    onSelect(product);
    setOpen(false);
    setSearch('');
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
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
              const isAdded = selectedIds.includes(product.id);
              return (
                <button
                  key={product.id}
                  type="button"
                  disabled={isAdded}
                  onClick={() => handleSelect(product)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-md px-2 py-1.5 text-left text-sm',
                    'hover:bg-stone-100 disabled:cursor-default disabled:opacity-60 disabled:hover:bg-transparent dark:hover:bg-stone-800',
                  )}
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
                      {product.sku ?? product.slug}
                    </span>
                  </span>
                  {!product.isActive && (
                    <Badge variant="secondary" className="shrink-0">
                      Inactive
                    </Badge>
                  )}
                  <span className="shrink-0 text-xs tabular-nums text-stone-500 dark:text-stone-400">
                    {formatPrice(product.price)}
                  </span>
                  {isAdded && (
                    <Check
                      className="size-4 shrink-0 text-accent-600 dark:text-accent-400"
                      aria-label="Already added"
                    />
                  )}
                </button>
              );
            })
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ProductPicker;
