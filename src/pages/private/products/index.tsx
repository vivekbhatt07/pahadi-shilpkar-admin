import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { Package, Plus, X } from 'lucide-react';

import EmptyState from '@/components/custom/EmptyState';
import ListSkeleton from '@/components/custom/ListSkeleton';
import PageHeader from '@/components/custom/PageHeader';
import TablePagination from '@/components/custom/TablePagination';
import ConfirmDialog from '@/components/dialogs/confirm-dialog';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/constants/routes';
import { useDebouncedValue } from '@/hooks/useDebouncedValue';
import { useDocumentTitle } from '@/hooks/useDocumentTitle';
import { cn } from '@/lib/utils';
import {
  isProductInCombosError,
  useDeleteProduct,
  useProducts,
  useToggleProductFeatured,
  useUpdateProduct,
} from '@/hooks/products';
import type { Product, ProductAvailability, ProductSort } from '@/types/api';

import {
  DEACTIVATE_WARNING,
  PRODUCT_DELETE_CONFIRMATION,
  PRODUCT_LIST_LIMIT,
  PRODUCT_LIST_SEARCH_PARAMS,
} from './constants';
import ProductFilters from './layouts/ProductFilters';
import ProductsTable from './layouts/ProductsTable';

type TDialogState =
  | { type: 'closed' }
  | { type: 'deactivate'; product: Product }
  | { type: 'delete'; product: Product };

const {
  PAGE,
  CATEGORY_ID,
  IS_FEATURED,
  IS_BESTSELLER,
  AVAILABILITY,
  IS_ACTIVE,
  SORT,
  SEARCH,
} = PRODUCT_LIST_SEARCH_PARAMS;

const parseBoolean = (value: string | null) =>
  value === 'true' ? true : value === 'false' ? false : undefined;

const ProductsPage = () => {
  useDocumentTitle('Products');
  const [searchParams, setSearchParams] = useSearchParams();
  const [dialog, setDialog] = useState<TDialogState>({ type: 'closed' });

  // Server-side filters live in the URL so category 409 links can deep-link.
  const page = Math.max(1, Number(searchParams.get(PAGE)) || 1);
  const categoryId = searchParams.get(CATEGORY_ID) ?? undefined;
  const isFeatured = parseBoolean(searchParams.get(IS_FEATURED));
  const isBestseller = parseBoolean(searchParams.get(IS_BESTSELLER));
  const availability =
    (searchParams.get(AVAILABILITY) as ProductAvailability | null) ?? undefined;
  const isActive = parseBoolean(searchParams.get(IS_ACTIVE));
  const sort = (searchParams.get(SORT) as ProductSort | null) ?? 'newest';
  const search = searchParams.get(SEARCH) ?? '';
  const debouncedSearch = useDebouncedValue(search, 400);

  const products = useProducts({
    page,
    limit: PRODUCT_LIST_LIMIT,
    categoryId,
    isFeatured,
    isBestseller,
    availability,
    isActive,
    sort,
    search: debouncedSearch || undefined,
    includeInactive: true,
  });
  const toggleFeatured = useToggleProductFeatured();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();

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

  const items = products.data?.items ?? [];
  const hasActiveFilters =
    Boolean(categoryId) ||
    isFeatured !== undefined ||
    isBestseller !== undefined ||
    Boolean(availability) ||
    isActive !== undefined ||
    search.length > 0;

  const closeDialog = () => setDialog({ type: 'closed' });
  const isMutating = updateProduct.isPending || deleteProduct.isPending;

  const handleActivate = (product: Product) => {
    updateProduct.mutate({ id: product.id, payload: { isActive: true } });
  };

  const handleDeactivate = () => {
    if (dialog.type !== 'deactivate') return;
    updateProduct.mutate(
      { id: dialog.product.id, payload: { isActive: false } },
      { onSuccess: closeDialog },
    );
  };

  const handleDelete = () => {
    if (dialog.type !== 'delete') return;
    deleteProduct.mutate(dialog.product.id, {
      onSuccess: closeDialog,
      // Retrying can't help; close so the toast's "View combos" is clickable.
      onError: (error) => isProductInCombosError(error) && closeDialog(),
    });
  };

  const dialogProduct = dialog.type === 'closed' ? null : dialog.product;

  return (
    <div className="flex w-full flex-col gap-6">
      <PageHeader
        title="Products"
        count={products.data?.total}
        description="Includes inactive products. Deactivated ones show an Inactive badge."
        actions={
          <Button asChild>
            <Link to={ROUTES.PRIVATE.PRODUCTS.CREATE}>
              <Plus />
              New product
            </Link>
          </Button>
        }
      />

      <ProductFilters
        categoryId={categoryId}
        isFeatured={isFeatured}
        isBestseller={isBestseller}
        availability={availability}
        isActive={isActive}
        sort={sort}
        search={search}
        onCategoryChange={(value) => setFilter(CATEGORY_ID, value)}
        onFeaturedChange={(value) =>
          setFilter(
            IS_FEATURED,
            value === undefined ? undefined : String(value),
          )
        }
        onBestsellerChange={(value) =>
          setFilter(
            IS_BESTSELLER,
            value === undefined ? undefined : String(value),
          )
        }
        onAvailabilityChange={(value) => setFilter(AVAILABILITY, value)}
        onActiveChange={(value) =>
          setFilter(IS_ACTIVE, value === undefined ? undefined : String(value))
        }
        onSortChange={(value) =>
          setFilter(SORT, value === 'newest' ? undefined : value)
        }
        onSearchChange={(value) => setFilter(SEARCH, value || undefined)}
        onClear={() => setSearchParams(new URLSearchParams())}
      />

      {products.isPending ? (
        <ListSkeleton rows={8} trailing={3} />
      ) : items.length > 0 ? (
        <div
          aria-busy={products.isPlaceholderData}
          className={cn(
            'flex flex-col gap-4 transition-opacity duration-200',
            products.isPlaceholderData && 'pointer-events-none opacity-60',
          )}
        >
          <ProductsTable
            products={items}
            isBusy={isMutating}
            onToggleFeatured={(product, value) =>
              toggleFeatured.mutate({ id: product.id, isFeatured: value })
            }
            onActivate={handleActivate}
            onDeactivate={(product) =>
              setDialog({ type: 'deactivate', product })
            }
            onDelete={(product) => setDialog({ type: 'delete', product })}
          />
          <TablePagination
            page={products.data?.page ?? page}
            limit={products.data?.limit ?? PRODUCT_LIST_LIMIT}
            total={products.data?.total ?? 0}
            hasMore={products.data?.hasMore ?? false}
            isFetching={products.isFetching}
            onPageChange={(next) =>
              updateParams({ [PAGE]: next > 1 ? String(next) : undefined })
            }
          />
        </div>
      ) : (
        <EmptyState
          icon={<Package className="size-5" />}
          title={hasActiveFilters ? 'No products match' : 'No products yet'}
          description={
            hasActiveFilters
              ? 'Try different filters or clear them.'
              : 'Create your first product to get started.'
          }
          action={
            hasActiveFilters ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSearchParams(new URLSearchParams())}
              >
                <X />
                Clear filters
              </Button>
            ) : (
              <Button size="sm" asChild>
                <Link to={ROUTES.PRIVATE.PRODUCTS.CREATE}>
                  <Plus />
                  New product
                </Link>
              </Button>
            )
          }
        />
      )}

      <ConfirmDialog
        open={dialog.type === 'deactivate'}
        onOpenChange={(open) => !open && closeDialog()}
        title="Deactivate this product?"
        variant="destructive"
        confirmLabel="Deactivate"
        isPending={updateProduct.isPending}
        onConfirm={handleDeactivate}
        description={
          <div className="flex flex-col gap-2">
            <p>
              <span className="font-medium text-stone-900 dark:text-stone-50">
                {dialogProduct?.name}
              </span>{' '}
              will disappear from the storefront.
            </p>
            <p className="text-stone-600 dark:text-stone-400">
              {DEACTIVATE_WARNING}
            </p>
          </div>
        }
      />

      <ConfirmDialog
        open={dialog.type === 'delete'}
        onOpenChange={(open) => !open && closeDialog()}
        title="Delete product"
        variant="destructive"
        confirmLabel="Delete permanently"
        confirmText={PRODUCT_DELETE_CONFIRMATION}
        isPending={deleteProduct.isPending}
        onConfirm={handleDelete}
        description={
          <p>
            This permanently deletes{' '}
            <span className="font-medium text-stone-900 dark:text-stone-50">
              {dialogProduct?.name}
            </span>{' '}
            and all of its testimonials. This cannot be undone.
          </p>
        }
      />
    </div>
  );
};

export default ProductsPage;
