import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Download, Layers, Loader2, Search } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import PageHeader from '@/components/custom/PageHeader';
import TablePagination from '@/components/custom/TablePagination';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ROUTES } from '@/constants/routes';
import { useExportVariants, useVariantList } from '@/hooks/products';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type {
  InventoryVariant,
  VariantListParams,
  VariantSort,
} from '@/types/api';

import VariantQuickEditDialog from '../products/detail/layouts/VariantQuickEditDialog';
import VariantPreviewDialog from '../products/layouts/VariantPreviewDialog';
import VariantStockTable from './layouts/VariantStockTable';

/** Rows per page — the backend allows up to 100. */
const VARIANT_LIST_LIMIT = 25;

const PARAMS = {
  VIEW: 'view',
  SEARCH: 'search',
  SORT: 'sort',
  PAGE: 'page',
} as const;

type TView = 'all' | 'low' | 'out' | 'hidden';

const VIEWS: {
  value: TView;
  label: string;
  count: 'all' | 'lowStock' | 'outOfStock' | 'hidden';
  params: Pick<VariantListParams, 'lowStock' | 'availability' | 'isActive'>;
}[] = [
  { value: 'all', label: 'All', count: 'all', params: {} },
  {
    value: 'low',
    label: 'Low stock',
    count: 'lowStock',
    params: { lowStock: true },
  },
  {
    value: 'out',
    label: 'Sold out',
    count: 'outOfStock',
    params: { availability: 'OUT_OF_STOCK' },
  },
  {
    value: 'hidden',
    label: 'Hidden',
    count: 'hidden',
    params: { isActive: false },
  },
];

const SORTS: { value: VariantSort; label: string }[] = [
  { value: 'stock_asc', label: 'Lowest stock first' },
  { value: 'stock_desc', label: 'Highest stock first' },
  { value: 'name_asc', label: 'Product name' },
  { value: 'updated_desc', label: 'Recently changed' },
];

/**
 * Every design, size and colour across the catalog in one list, lowest
 * stock first — what to restock, at a glance. A row's quick edit saves that
 * variant alone; its photo opens a preview of what shoppers see.
 */
const VariantsPage = () => {
  useDocumentTitle('Variants');
  const [searchParams, setSearchParams] = useSearchParams();
  const [previewing, setPreviewing] = useState<InventoryVariant | null>(null);
  const [editing, setEditing] = useState<InventoryVariant | null>(null);

  const view =
    VIEWS.find((option) => option.value === searchParams.get(PARAMS.VIEW)) ??
    VIEWS[0];
  const sort =
    SORTS.find((option) => option.value === searchParams.get(PARAMS.SORT))
      ?.value ?? 'stock_asc';
  const page = Math.max(1, Number(searchParams.get(PARAMS.PAGE)) || 1);
  const search = searchParams.get(PARAMS.SEARCH) ?? '';
  const debouncedSearch = useDebouncedValue(search.trim(), 400);

  const variants = useVariantList({
    ...view.params,
    search: debouncedSearch || undefined,
    sort,
    page,
    limit: VARIANT_LIST_LIMIT,
  });
  const data = variants.data;
  const exportVariants = useExportVariants();
  const items = data?.items ?? [];

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined || value === '') next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next, { replace: true });
  };
  // Any filter change starts again from the first page
  const setFilter = (key: string, value: string | undefined) =>
    updateParams({ [key]: value, [PARAMS.PAGE]: undefined });

  const isFiltered = view.value !== 'all' || search.trim() !== '';

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Variants"
        count={data?.counts.all}
        description="Every design, size and colour across your products — lowest stock first, so you know what to restock."
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              exportVariants.mutate({
                ...view.params,
                search: debouncedSearch || undefined,
                sort,
              })
            }
            disabled={exportVariants.isPending || !data?.counts.all}
            startAdornment={
              exportVariants.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )
            }
          >
            Export CSV
          </Button>
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="tablist"
          aria-label="Show"
          className="flex flex-wrap gap-1.5"
        >
          {VIEWS.map((option) => {
            const selected = option.value === view.value;
            const count = data?.counts[option.count];
            return (
              <button
                key={option.value}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() =>
                  setFilter(
                    PARAMS.VIEW,
                    option.value === 'all' ? undefined : option.value,
                  )
                }
                className={cn(
                  'inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-full border px-3 text-sm transition-colors outline-none focus-visible:ring-4 focus-visible:ring-accent-500/20',
                  selected
                    ? 'border-stone-900 bg-stone-900 text-white dark:border-stone-50 dark:bg-stone-50 dark:text-stone-900'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300',
                )}
              >
                {option.label}
                {count !== undefined && (
                  <span
                    className={cn(
                      'text-xs tabular-nums',
                      selected ? 'opacity-80' : 'text-stone-400',
                    )}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={search}
            onChange={(event) => setFilter(PARAMS.SEARCH, event.target.value)}
            onClear={() => setFilter(PARAMS.SEARCH, undefined)}
            placeholder="Search by product, variant or SKU…"
            aria-label="Search variants"
            startAdornment={<Search className="size-4 text-stone-400" />}
            className="sm:w-72"
          />
          <Select
            value={sort}
            onValueChange={(value) =>
              setFilter(PARAMS.SORT, value === 'stock_asc' ? undefined : value)
            }
          >
            <SelectTrigger aria-label="Sort" className="sm:w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORTS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {variants.isPending ? (
        <ListSkeleton rows={8} trailing={3} />
      ) : items.length > 0 ? (
        <div
          aria-busy={variants.isPlaceholderData}
          className={cn(
            'flex flex-col gap-4 transition-opacity duration-200',
            variants.isPlaceholderData && 'pointer-events-none opacity-60',
          )}
        >
          <VariantStockTable
            variants={items}
            onPreview={setPreviewing}
            onEdit={setEditing}
          />
          <TablePagination
            page={data?.page ?? page}
            limit={data?.limit ?? VARIANT_LIST_LIMIT}
            total={data?.total ?? 0}
            hasMore={data?.hasMore ?? false}
            isFetching={variants.isFetching}
            onPageChange={(next) =>
              updateParams({
                [PARAMS.PAGE]: next > 1 ? String(next) : undefined,
              })
            }
          />
        </div>
      ) : (
        <EmptyState
          icon={<Layers className="size-5" />}
          title={
            isFiltered
              ? 'No variants match'
              : variants.isError
                ? "Couldn't load the variants"
                : 'No variants yet'
          }
          description={
            isFiltered
              ? 'Try another search, or show all variants.'
              : 'Give a product options like Design or Size — each combination becomes a variant with its own price and stock.'
          }
          action={
            isFiltered ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  updateParams({
                    [PARAMS.VIEW]: undefined,
                    [PARAMS.SEARCH]: undefined,
                    [PARAMS.PAGE]: undefined,
                  })
                }
              >
                Show all variants
              </Button>
            ) : (
              <Button variant="outline" size="sm" asChild>
                <Link to={ROUTES.PRIVATE.PRODUCTS.ROOT}>Go to products</Link>
              </Button>
            )
          }
        />
      )}

      <VariantPreviewDialog
        target={
          previewing && {
            slug: previewing.product.slug,
            name: previewing.product.name,
            images:
              previewing.images.length > 0
                ? previewing.images
                : previewing.product.images,
            variantId: previewing.id,
          }
        }
        onClose={() => setPreviewing(null)}
      />
      <VariantQuickEditDialog
        productId={editing?.product.id ?? ''}
        variant={editing}
        waiting={editing?.waiting ?? 0}
        onClose={() => setEditing(null)}
      />
    </div>
  );
};

export default VariantsPage;
