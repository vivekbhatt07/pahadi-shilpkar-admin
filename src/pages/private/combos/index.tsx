import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Gift, Plus, X } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import PageHeader from '@/components/custom/PageHeader';
import TablePagination from '@/components/custom/TablePagination';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useDeleteCombo, useCombos, useUpdateCombo } from '@/hooks/combos';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import type { Combo, ProductSort } from '@/types/api';

import { COMBO_LIST_LIMIT, COMBO_LIST_SEARCH_PARAMS } from './constants';
import ComboFilters from './layouts/ComboFilters';
import CombosTable from './layouts/CombosTable';

const { PAGE, PRODUCT_ID, IS_FEATURED, IS_ACTIVE, SORT, SEARCH } =
  COMBO_LIST_SEARCH_PARAMS;

const parseBoolean = (value: string | null) =>
  value === 'true' ? true : value === 'false' ? false : undefined;

const CombosPage = () => {
  useDocumentTitle('Combos');
  const [searchParams, setSearchParams] = useSearchParams();
  const [deleting, setDeleting] = useState<Combo | null>(null);

  // Server-side filters live in the URL so a product's 409 toast can deep-link.
  const page = Math.max(1, Number(searchParams.get(PAGE)) || 1);
  const productId = searchParams.get(PRODUCT_ID) ?? undefined;
  const isFeatured = parseBoolean(searchParams.get(IS_FEATURED));
  const isActive = parseBoolean(searchParams.get(IS_ACTIVE));
  const sort = (searchParams.get(SORT) as ProductSort | null) ?? 'newest';
  const search = searchParams.get(SEARCH) ?? '';
  const debouncedSearch = useDebouncedValue(search, 400);

  const combos = useCombos({
    page,
    limit: COMBO_LIST_LIMIT,
    productId,
    isFeatured,
    isActive,
    sort,
    search: debouncedSearch || undefined,
    includeInactive: true,
  });
  const updateCombo = useUpdateCombo();
  const deleteCombo = useDeleteCombo();

  const updateParams = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams(searchParams);
    Object.entries(patch).forEach(([key, value]) => {
      if (value === undefined) next.delete(key);
      else next.set(key, value);
    });
    setSearchParams(next);
  };

  const setFilter = (key: string, value: string | undefined) =>
    // Any filter change resets to the first page.
    updateParams({ [key]: value, [PAGE]: undefined });

  const items = combos.data?.items ?? [];
  // Every result contains the filtered product, so its name is on hand.
  const productFilterLabel = productId
    ? (items
        .flatMap((combo) => combo.items)
        .find((item) => item.productId === productId)?.product.name ??
      'the selected product')
    : null;
  const hasActiveFilters =
    Boolean(productId) ||
    isFeatured !== undefined ||
    isActive !== undefined ||
    search.length > 0;
  const clearFilters = () => setSearchParams(new URLSearchParams());

  const handleDelete = () => {
    if (!deleting) return;
    deleteCombo.mutate(deleting.id, { onSuccess: () => setDeleting(null) });
  };

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Combos"
        count={combos.data?.total}
        description="Bundles of existing products sold at one price. Includes inactive and hidden combos."
        actions={
          <Button asChild>
            <Link to={ROUTES.PRIVATE.COMBOS.CREATE}>
              <Plus />
              New combo
            </Link>
          </Button>
        }
      />

      <ComboFilters
        isFeatured={isFeatured}
        isActive={isActive}
        sort={sort}
        search={search}
        productFilterLabel={productFilterLabel}
        onFeaturedChange={(value) =>
          setFilter(
            IS_FEATURED,
            value === undefined ? undefined : String(value),
          )
        }
        onActiveChange={(value) =>
          setFilter(IS_ACTIVE, value === undefined ? undefined : String(value))
        }
        onSortChange={(value) =>
          setFilter(SORT, value === 'newest' ? undefined : value)
        }
        onSearchChange={(value) => setFilter(SEARCH, value || undefined)}
        onClearProduct={() => setFilter(PRODUCT_ID, undefined)}
        onClear={clearFilters}
      />

      {combos.isPending ? (
        <ListSkeleton rows={6} trailing={3} />
      ) : items.length > 0 ? (
        <div
          aria-busy={combos.isPlaceholderData}
          className={cn(
            'flex flex-col gap-4 transition-opacity duration-200',
            combos.isPlaceholderData && 'pointer-events-none opacity-60',
          )}
        >
          <CombosTable
            combos={items}
            isBusy={updateCombo.isPending || deleteCombo.isPending}
            onToggleFeatured={(combo, value) =>
              updateCombo.mutate({
                id: combo.id,
                payload: { isFeatured: value },
              })
            }
            onToggleActive={(combo, value) =>
              updateCombo.mutate({ id: combo.id, payload: { isActive: value } })
            }
            onDelete={setDeleting}
          />
          <TablePagination
            page={combos.data?.page ?? page}
            limit={combos.data?.limit ?? COMBO_LIST_LIMIT}
            total={combos.data?.total ?? 0}
            hasMore={combos.data?.hasMore ?? false}
            isFetching={combos.isFetching}
            onPageChange={(next) =>
              updateParams({ [PAGE]: next > 1 ? String(next) : undefined })
            }
          />
        </div>
      ) : (
        <EmptyState
          icon={<Gift className="size-5" />}
          title={hasActiveFilters ? 'No combos match' : 'No combos yet'}
          description={
            hasActiveFilters
              ? 'Try different filters or clear them.'
              : 'Bundle products into gift sets and packs — e.g. a Diwali pooja set or a pack of 3 diyas.'
          }
          action={
            hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X />
                Clear filters
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link to={ROUTES.PRIVATE.COMBOS.CREATE}>
                  <Plus />
                  New combo
                </Link>
              </Button>
            )
          }
        />
      )}

      <ConfirmDialog
        open={deleting !== null}
        onOpenChange={(open) => !open && setDeleting(null)}
        title="Delete combo"
        variant="destructive"
        confirmLabel="Delete combo"
        isPending={deleteCombo.isPending}
        onConfirm={handleDelete}
        description={
          <p>
            This deletes{' '}
            <span className="font-medium text-stone-900 dark:text-stone-50">
              {deleting?.name}
            </span>
            . Its products are not affected. To hide it temporarily, turn it
            inactive instead.
          </p>
        }
      />
    </div>
  );
};

export default CombosPage;
