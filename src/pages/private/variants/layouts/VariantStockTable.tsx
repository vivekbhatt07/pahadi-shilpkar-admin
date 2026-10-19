import { Link } from 'react-router';
import {
  BellRing,
  Ellipsis,
  Eye,
  ExternalLink,
  Gift,
  Pencil,
  SquarePen,
} from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { formatPrice } from '@/helpers/format';
import { cn } from '@/lib/utils';
import type { InventoryVariant } from '@/types/api';

import {
  AVAILABILITY_LABELS,
  availabilityVariant,
  stockFlag,
} from '../../products/helpers';

type TVariantStockTableProps = {
  variants: InventoryVariant[];
  onPreview: (variant: InventoryVariant) => void;
  onEdit: (variant: InventoryVariant) => void;
};

const Stock = ({ variant }: { variant: InventoryVariant }) => {
  const flag = stockFlag(variant.availability, variant.stock);
  if (flag === 'empty') {
    return (
      <SimpleTooltip label="Shown as in stock, but none are left">
        <Badge variant="destructive">0</Badge>
      </SimpleTooltip>
    );
  }
  if (flag === 'low') {
    return (
      <SimpleTooltip label="Low stock">
        <Badge variant="warning">{variant.stock}</Badge>
      </SimpleTooltip>
    );
  }
  return (
    <span className="text-sm text-stone-700 dark:text-stone-300">
      {variant.stock}
    </span>
  );
};

/**
 * Every variant across products, one row each: what it is, its stock and
 * availability, and the shoppers and combos that depend on it.
 */
const VariantStockTable = ({
  variants,
  onPreview,
  onEdit,
}: TVariantStockTableProps) => (
  <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700/60 dark:bg-stone-900">
    <Table>
      <TableHeader className="bg-stone-50 dark:bg-stone-800/50">
        <TableRow>
          <TableHead className="min-w-64">Variant</TableHead>
          <TableHead className="hidden lg:table-cell">SKU</TableHead>
          <TableHead className="w-28 text-right">Price</TableHead>
          <TableHead className="w-20 text-right">Stock</TableHead>
          <TableHead className="hidden w-32 md:table-cell">
            Availability
          </TableHead>
          <TableHead className="hidden w-24 text-right sm:table-cell">
            Waiting
          </TableHead>
          <TableHead className="hidden w-24 text-right xl:table-cell">
            Combos
          </TableHead>
          <TableHead className="w-12">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {variants.map((variant) => {
          const isOff = !variant.isActive || !variant.product.isActive;
          return (
            <TableRow key={variant.id} className="group">
              <TableCell>
                <div
                  className={cn(
                    'flex min-w-0 items-center gap-3 transition-opacity',
                    isOff && 'opacity-60 group-hover:opacity-100',
                  )}
                >
                  <button
                    type="button"
                    onClick={() => onPreview(variant)}
                    aria-label={`Preview ${variant.product.name} — ${variant.title}`}
                    className="group/thumb relative shrink-0 cursor-pointer rounded-lg outline-none focus-visible:ring-4 focus-visible:ring-accent-500/25"
                  >
                    <ImageThumb
                      src={variant.images[0] ?? variant.product.images[0]}
                      alt=""
                      className="size-10"
                    />
                    <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-stone-950/40 text-white opacity-0 transition-opacity group-hover/thumb:opacity-100 group-focus-visible/thumb:opacity-100">
                      <Eye className="size-3.5" />
                    </span>
                  </button>
                  <div className="min-w-0">
                    <Link
                      to={ROUTES.PRIVATE.PRODUCTS.DETAIL(variant.product.slug)}
                      className="line-clamp-1 text-sm font-medium text-stone-900 transition-colors hover:text-accent-600 dark:text-stone-50 dark:hover:text-accent-400"
                    >
                      {variant.title}
                    </Link>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                      <span className="truncate text-xs text-stone-400 dark:text-stone-500">
                        {variant.product.name}
                      </span>
                      {!variant.isActive && (
                        <Badge variant="secondary">Hidden</Badge>
                      )}
                      {!variant.product.isActive && (
                        <Badge variant="secondary">Product inactive</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden font-mono text-xs text-stone-500 lg:table-cell dark:text-stone-400">
                {variant.sku ?? '—'}
              </TableCell>
              <TableCell className="text-right text-sm whitespace-nowrap">
                <span className="font-medium tabular-nums text-stone-900 dark:text-stone-50">
                  {formatPrice(variant.price)}
                </span>
                {variant.compareAtPrice !== null && (
                  <span className="block text-xs tabular-nums text-stone-400 line-through dark:text-stone-500">
                    {formatPrice(variant.compareAtPrice)}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right tabular-nums">
                <Stock variant={variant} />
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Badge variant={availabilityVariant(variant.availability)}>
                  {AVAILABILITY_LABELS[variant.availability]}
                </Badge>
              </TableCell>
              <TableCell className="hidden text-right tabular-nums sm:table-cell">
                {variant.waiting > 0 ? (
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-amber-700 dark:text-amber-400">
                    <BellRing className="size-3.5" />
                    {variant.waiting}
                  </span>
                ) : (
                  <span className="text-sm text-stone-300 dark:text-stone-600">
                    0
                  </span>
                )}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums xl:table-cell">
                {variant.comboCount > 0 ? (
                  <Link
                    to={`${ROUTES.PRIVATE.COMBOS.ROOT}?productId=${variant.product.id}`}
                    className="inline-flex items-center gap-1 text-sm text-stone-700 hover:text-accent-600 dark:text-stone-300 dark:hover:text-accent-400"
                  >
                    <Gift className="size-3.5 text-stone-400" />
                    {variant.comboCount}
                  </Link>
                ) : (
                  <span className="text-sm text-stone-300 dark:text-stone-600">
                    0
                  </span>
                )}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Actions for ${variant.product.name} — ${variant.title}`}
                      className="text-stone-400"
                    >
                      <Ellipsis />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52">
                    <DropdownMenuItem onSelect={() => onEdit(variant)}>
                      <Pencil />
                      Quick edit…
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => onPreview(variant)}>
                      <Eye />
                      Preview
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link
                        to={ROUTES.PRIVATE.PRODUCTS.EDIT(variant.product.slug)}
                      >
                        <SquarePen />
                        Edit the product
                      </Link>
                    </DropdownMenuItem>
                    {variant.whatsappUrl && (
                      <DropdownMenuItem asChild>
                        <a
                          href={variant.whatsappUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          <ExternalLink />
                          Test WhatsApp link
                        </a>
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

export default VariantStockTable;
