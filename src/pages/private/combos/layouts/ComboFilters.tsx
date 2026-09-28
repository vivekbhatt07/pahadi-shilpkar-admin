import { Package, Search, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { ProductSort } from '@/types/api';

import { FILTER_ALL, SORT_OPTIONS } from '../../products/constants';

type TComboFiltersProps = {
  isFeatured: boolean | undefined;
  isActive: boolean | undefined;
  sort: ProductSort;
  search: string;
  /** Set when the list is scoped to combos containing one product. */
  productFilterLabel: string | null;
  onFeaturedChange: (isFeatured: boolean | undefined) => void;
  onActiveChange: (isActive: boolean | undefined) => void;
  onSortChange: (sort: ProductSort) => void;
  onSearchChange: (search: string) => void;
  onClearProduct: () => void;
  onClear: () => void;
};

const YES_NO_OPTIONS = [
  { value: FILTER_ALL, label: 'Any' },
  { value: 'true', label: 'Yes' },
  { value: 'false', label: 'No' },
] as const;

const STATUS_OPTIONS = [
  { value: FILTER_ALL, label: 'Any' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
] as const;

/** Muted prefix inside a filter trigger: "Featured: Any". */
const FilterLabel = ({ children }: { children: React.ReactNode }) => (
  <span className="shrink-0 text-stone-400 dark:text-stone-500">
    {children}:
  </span>
);

/** Accent outline marking a select whose filter is currently applied. */
const activeFilterClass =
  'border-accent-300 bg-accent-50/60 text-accent-800 dark:border-accent-800 dark:bg-accent-950/30 dark:text-accent-200';

const toBooleanValue = (value: string) =>
  value === FILTER_ALL ? undefined : value === 'true';

/** Every filter here (incl. search) is a server-side query param. */
const ComboFilters = ({
  isFeatured,
  isActive,
  sort,
  search,
  productFilterLabel,
  onFeaturedChange,
  onActiveChange,
  onSortChange,
  onSearchChange,
  onClearProduct,
  onClear,
}: TComboFiltersProps) => {
  const activeFilterCount = [
    isFeatured !== undefined,
    isActive !== undefined,
    search.length > 0,
    productFilterLabel !== null,
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-3 md:flex-row md:items-center">
        <div className="flex-1">
          <Input
            type="search"
            placeholder="Search by combo or product name…"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            onClear={() => onSearchChange('')}
            startAdornment={
              <Search className="pointer-events-none size-4 text-stone-400" />
            }
          />
        </div>

        <Select
          value={sort}
          onValueChange={(value) => onSortChange(value as ProductSort)}
        >
          <SelectTrigger className="sm:w-44" aria-label="Sort by">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Select
          value={isActive === undefined ? FILTER_ALL : String(isActive)}
          onValueChange={(value) => onActiveChange(toBooleanValue(value))}
        >
          <SelectTrigger
            className={cn(
              'w-auto min-w-36',
              isActive !== undefined && activeFilterClass,
            )}
            aria-label="Filter by status"
          >
            <FilterLabel>Status</FilterLabel>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={isFeatured === undefined ? FILTER_ALL : String(isFeatured)}
          onValueChange={(value) => onFeaturedChange(toBooleanValue(value))}
        >
          <SelectTrigger
            className={cn(
              'w-auto min-w-36',
              isFeatured !== undefined && activeFilterClass,
            )}
            aria-label="Filter by featured"
          >
            <FilterLabel>Featured</FilterLabel>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {YES_NO_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {productFilterLabel !== null && (
          <span
            className={cn(
              'inline-flex h-9 items-center gap-1.5 rounded-lg border pr-1 pl-3 text-sm',
              activeFilterClass,
            )}
          >
            <Package className="size-3.5 shrink-0" />
            <span className="max-w-56 truncate">
              Contains {productFilterLabel}
            </span>
            <button
              type="button"
              onClick={onClearProduct}
              aria-label="Show combos with any product"
              className="flex size-6 cursor-pointer items-center justify-center rounded-md hover:bg-accent-100 dark:hover:bg-accent-900/40"
            >
              <X className="size-3.5" />
            </button>
          </span>
        )}

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClear}
            startAdornment={<X />}
            className="animate-in text-stone-500 fade-in-0 slide-in-from-left-1"
          >
            Clear filters
            <span className="rounded-full bg-stone-200 px-1.5 text-[10px] font-semibold tabular-nums text-stone-700 dark:bg-stone-700 dark:text-stone-200">
              {activeFilterCount}
            </span>
          </Button>
        )}
      </div>
    </div>
  );
};

export default ComboFilters;
