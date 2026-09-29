import { Link } from 'react-router';
import { Copy, Eye, Pencil, Star, Trash2, TrendingUp } from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { formatDate, formatPrice } from '@/helpers/format';
import { cn } from '@/lib/utils';
import type { Product } from '@/types/api';

import { LOW_STOCK_THRESHOLD } from '../constants';
import { AVAILABILITY_LABELS, availabilityVariant } from '../helpers';

type TProductsTableProps = {
  products: Product[];
  isBusy?: boolean;
  /** Ids ticked for bulk actions (current page only). */
  selectedIds: ReadonlySet<string>;
  onToggleSelected: (product: Product, selected: boolean) => void;
  onToggleAll: (selected: boolean) => void;
  onToggleFeatured: (product: Product, isFeatured: boolean) => void;
  onActivate: (product: Product) => void;
  onDeactivate: (product: Product) => void;
  onDuplicate: (product: Product) => void;
  onDelete: (product: Product) => void;
};

const ProductsTable = ({
  products,
  isBusy,
  selectedIds,
  onToggleSelected,
  onToggleAll,
  onToggleFeatured,
  onActivate,
  onDeactivate,
  onDuplicate,
  onDelete,
}: TProductsTableProps) => {
  const selectedCount = products.filter((product) =>
    selectedIds.has(product.id),
  ).length;
  const allSelected = products.length > 0 && selectedCount === products.length;

  return (
    <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700/60 dark:bg-stone-900">
      <Table>
        <TableHeader className="bg-stone-50 dark:bg-stone-800/50">
          <TableRow>
            <TableHead className="w-10 pr-0">
              <Checkbox
                checked={
                  allSelected
                    ? true
                    : selectedCount > 0
                      ? 'indeterminate'
                      : false
                }
                onCheckedChange={(checked) => onToggleAll(checked === true)}
                aria-label={
                  allSelected
                    ? 'Deselect every product on this page'
                    : 'Select every product on this page'
                }
              />
            </TableHead>
            <TableHead className="min-w-56">Product</TableHead>
            <TableHead className="w-28 text-right">Price</TableHead>
            <TableHead className="hidden w-20 text-right sm:table-cell">
              Stock
            </TableHead>
            <TableHead className="hidden w-32 md:table-cell">
              Availability
            </TableHead>
            <TableHead className="hidden lg:table-cell">Category</TableHead>
            <TableHead className="w-20 text-center">Featured</TableHead>
            <TableHead className="w-20 text-center">Active</TableHead>
            <TableHead className="hidden w-32 2xl:table-cell">
              Updated
            </TableHead>
            <TableHead className="w-36 text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => (
            <TableRow
              key={product.id}
              data-state={selectedIds.has(product.id) ? 'selected' : undefined}
              className="group"
            >
              <TableCell className="pr-0">
                <Checkbox
                  checked={selectedIds.has(product.id)}
                  onCheckedChange={(checked) =>
                    onToggleSelected(product, checked === true)
                  }
                  aria-label={`Select ${product.name}`}
                />
              </TableCell>
              <TableCell>
                <div
                  className={cn(
                    'flex min-w-0 items-center gap-3 transition-opacity',
                    !product.isActive && 'opacity-60 group-hover:opacity-100',
                  )}
                >
                  <ImageThumb
                    src={product.images[0]}
                    alt={product.name}
                    className="size-10 transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={ROUTES.PRIVATE.PRODUCTS.DETAIL(product.slug)}
                        className="line-clamp-2 text-sm leading-snug font-medium text-stone-900 transition-colors hover:text-accent-600 dark:text-stone-50 dark:hover:text-accent-400"
                      >
                        {product.name}
                      </Link>
                      {product.isBestseller && (
                        <SimpleTooltip label="Bestseller">
                          <TrendingUp
                            className="size-3.5 shrink-0 text-amber-500"
                            aria-label="Bestseller"
                          />
                        </SimpleTooltip>
                      )}
                      {!product.isActive && (
                        <Badge variant="secondary" className="shrink-0">
                          Inactive
                        </Badge>
                      )}
                    </div>
                    <p className="mt-0.5 truncate font-mono text-xs text-stone-400 dark:text-stone-500">
                      {product.sku ?? product.slug}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-right text-sm whitespace-nowrap">
                <div className="flex flex-col items-end">
                  <span className="font-medium tabular-nums text-stone-900 dark:text-stone-50">
                    {formatPrice(product.price)}
                  </span>
                  {product.compareAtPrice !== null && (
                    <span className="text-xs tabular-nums text-stone-400 line-through dark:text-stone-500">
                      {formatPrice(product.compareAtPrice)}
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell className="hidden text-right tabular-nums sm:table-cell">
                {product.stock === 0 ? (
                  <Badge variant="destructive">0</Badge>
                ) : product.stock <= LOW_STOCK_THRESHOLD ? (
                  <SimpleTooltip label="Low stock">
                    <Badge variant="warning">{product.stock}</Badge>
                  </SimpleTooltip>
                ) : (
                  <span className="text-sm text-stone-700 dark:text-stone-300">
                    {product.stock}
                  </span>
                )}
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <Badge variant={availabilityVariant(product.availability)}>
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-current opacity-80"
                  />
                  {AVAILABILITY_LABELS[product.availability]}
                </Badge>
              </TableCell>

              <TableCell className="hidden lg:table-cell">
                <Link
                  to={`${ROUTES.PRIVATE.PRODUCTS.ROOT}?categoryId=${product.categoryId}`}
                  className="inline-flex"
                >
                  <Badge
                    variant="secondary"
                    className="transition-colors hover:bg-stone-200 dark:hover:bg-stone-700"
                  >
                    {product.category.name}
                  </Badge>
                </Link>
              </TableCell>

              <TableCell className="text-center">
                <SimpleTooltip
                  label={
                    product.isFeatured ? 'Remove from featured' : 'Feature'
                  }
                >
                  <button
                    type="button"
                    onClick={() =>
                      onToggleFeatured(product, !product.isFeatured)
                    }
                    disabled={isBusy}
                    aria-pressed={product.isFeatured}
                    aria-label={
                      product.isFeatured
                        ? `Remove ${product.name} from featured`
                        : `Feature ${product.name}`
                    }
                    className="group/star inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-all outline-none hover:bg-amber-50 focus-visible:ring-4 focus-visible:ring-amber-500/20 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-amber-950/30"
                  >
                    <Star
                      className={cn(
                        'size-4 transition-all duration-200 group-hover/star:scale-110',
                        product.isFeatured
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300 group-hover/star:text-amber-400 dark:text-stone-600',
                      )}
                    />
                  </button>
                </SimpleTooltip>
              </TableCell>

              <TableCell className="text-center">
                <Switch
                  checked={product.isActive}
                  onCheckedChange={(checked) =>
                    checked ? onActivate(product) : onDeactivate(product)
                  }
                  disabled={isBusy}
                  aria-label={
                    product.isActive
                      ? `Deactivate ${product.name}`
                      : `Activate ${product.name}`
                  }
                />
              </TableCell>

              <TableCell className="hidden text-xs whitespace-nowrap text-stone-500 2xl:table-cell dark:text-stone-400">
                {formatDate(product.updatedAt)}
              </TableCell>

              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-0.5">
                  <SimpleTooltip label="View">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link
                        to={ROUTES.PRIVATE.PRODUCTS.DETAIL(product.slug)}
                        aria-label={`View ${product.name}`}
                      >
                        <Eye className="text-stone-400" />
                      </Link>
                    </Button>
                  </SimpleTooltip>
                  <SimpleTooltip label="Edit">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link
                        to={ROUTES.PRIVATE.PRODUCTS.EDIT(product.slug)}
                        aria-label={`Edit ${product.name}`}
                      >
                        <Pencil className="text-stone-400" />
                      </Link>
                    </Button>
                  </SimpleTooltip>
                  <SimpleTooltip label="Duplicate">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDuplicate(product)}
                      disabled={isBusy}
                      aria-label={`Duplicate ${product.name}`}
                    >
                      <Copy className="text-stone-400" />
                    </Button>
                  </SimpleTooltip>
                  <SimpleTooltip label="Delete">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(product)}
                      aria-label={`Delete ${product.name}`}
                      className="text-stone-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                    >
                      <Trash2 />
                    </Button>
                  </SimpleTooltip>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ProductsTable;
