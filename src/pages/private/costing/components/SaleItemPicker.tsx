import { useState } from 'react';
import { ChevronsUpDown, PencilLine, Search } from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import { Loader } from '@/components/ui/loader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { formatPrice } from '@/helpers/format';
import { useCostedListings } from '@/hooks/costing';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { cn } from '@/lib/utils';
import type { CostedListing } from '@/types/api';

import { listingName } from '../helpers';

/** Mounted while open, so the list is only fetched when it's looked at. */
const Results = ({
  search,
  onPick,
}: {
  search: string;
  onPick: (listing: CostedListing) => void;
}) => {
  const debounced = useDebouncedValue(search.trim(), 300);
  const listings = useCostedListings({
    search: debounced || undefined,
    sort: 'name_asc',
    limit: 20,
  });
  const items = listings.data?.items ?? [];

  if (listings.isPending) {
    return (
      <div className="flex justify-center py-4">
        <Loader size="sm" label="Loading…" />
      </div>
    );
  }
  if (items.length === 0) {
    return (
      <p className="px-2 py-3 text-center text-xs text-stone-400">
        Nothing matches — add it as a custom piece.
      </p>
    );
  }
  return (
    <>
      {items.map((listing) => (
        <button
          key={`${listing.kind}-${listing.variantId ?? listing.productId ?? listing.comboId}`}
          type="button"
          role="option"
          aria-selected={false}
          onClick={() => onPick(listing)}
          className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm outline-none hover:bg-stone-100 focus-visible:bg-stone-100 dark:hover:bg-stone-800 dark:focus-visible:bg-stone-800"
        >
          <ImageThumb src={listing.image} alt="" className="size-7" />
          <span className="min-w-0 flex-1">
            <span className="block truncate">{listingName(listing)}</span>
            <span className="block text-[11px] text-stone-400">
              {listing.kind === 'COMBO' ? 'Combo · ' : ''}
              {listing.unitCost === null
                ? 'No cost sheet'
                : `Costs ${formatPrice(listing.unitCost)}`}
            </span>
          </span>
          <span className="shrink-0 text-xs font-medium tabular-nums">
            {formatPrice(listing.price)}
          </span>
        </button>
      ))}
    </>
  );
};

type TSaleItemPickerProps = {
  label: string;
  onPick: (listing: CostedListing) => void;
  onCustom: () => void;
  invalid?: boolean;
  disabled?: boolean;
};

/** A product, a variant or a combo from the catalog — or a custom piece. */
const SaleItemPicker = ({
  label,
  onPick,
  onCustom,
  invalid,
  disabled,
}: TSaleItemPickerProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch('');
      }}
    >
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          role="combobox"
          aria-expanded={open}
          aria-label="What was sold"
          aria-invalid={invalid}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !label && 'text-stone-400',
            invalid && 'border-red-400 dark:border-red-500',
          )}
        >
          <span className="truncate">{label || 'Pick what was sold'}</span>
          <ChevronsUpDown className="opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0">
        <div className="border-b border-stone-100 p-2 dark:border-stone-800">
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search products and combos…"
            aria-label="Search products and combos"
            startAdornment={<Search className="size-4 text-stone-400" />}
          />
        </div>
        <div role="listbox" className="max-h-72 overflow-y-auto p-1">
          <Results
            search={search}
            onPick={(listing) => {
              onPick(listing);
              setOpen(false);
              setSearch('');
            }}
          />
        </div>
        <div className="border-t border-stone-100 p-1 dark:border-stone-800">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onCustom();
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-sm text-accent-700 outline-none hover:bg-accent-50 dark:text-accent-400 dark:hover:bg-accent-950/40"
          >
            <PencilLine className="size-3.5" />A custom piece, not in the
            catalog
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default SaleItemPicker;
