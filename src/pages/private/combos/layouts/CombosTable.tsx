import { Link } from 'react-router';
import { Eye, EyeOff, Pencil, Star, Trash2 } from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import type { Combo } from '@/types/api';

import {
  AVAILABILITY_LABELS,
  availabilityVariant,
} from '../../products/helpers';
import { COMBO_HIDDEN_BY_PRODUCT_WARNING } from '../constants';
import { comboImages, hasInactiveProduct } from '../helpers';

type TCombosTableProps = {
  combos: Combo[];
  isBusy?: boolean;
  onToggleFeatured: (combo: Combo, isFeatured: boolean) => void;
  onToggleActive: (combo: Combo, isActive: boolean) => void;
  onDelete: (combo: Combo) => void;
};

const CombosTable = ({
  combos,
  isBusy,
  onToggleFeatured,
  onToggleActive,
  onDelete,
}: TCombosTableProps) => (
  <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm dark:border-stone-700/60 dark:bg-stone-900">
    <Table>
      <TableHeader className="bg-stone-50 dark:bg-stone-800/50">
        <TableRow>
          <TableHead className="min-w-56">Combo</TableHead>
          <TableHead className="w-28 text-right">Price</TableHead>
          <TableHead className="hidden w-28 text-right sm:table-cell">
            Savings
          </TableHead>
          <TableHead className="hidden w-32 md:table-cell">
            Availability
          </TableHead>
          <TableHead className="w-20 text-center">Featured</TableHead>
          <TableHead className="w-20 text-center">Active</TableHead>
          <TableHead className="hidden w-32 2xl:table-cell">Updated</TableHead>
          <TableHead className="w-28 text-right">
            <span className="sr-only">Actions</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {combos.map((combo) => {
          const blockedByProduct = hasInactiveProduct(combo);
          const isHidden = !combo.isActive || blockedByProduct;

          return (
            <TableRow key={combo.id} className="group">
              <TableCell>
                <div
                  className={cn(
                    'flex min-w-0 items-center gap-3 transition-opacity',
                    isHidden && 'opacity-60 group-hover:opacity-100',
                  )}
                >
                  <ImageThumb
                    src={comboImages(combo)[0]}
                    alt={combo.name}
                    className="size-10 transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <Link
                        to={ROUTES.PRIVATE.COMBOS.DETAIL(combo.slug)}
                        className="line-clamp-2 text-sm leading-snug font-medium text-stone-900 transition-colors hover:text-accent-600 dark:text-stone-50 dark:hover:text-accent-400"
                      >
                        {combo.name}
                      </Link>
                      {!combo.isActive && (
                        <Badge variant="secondary" className="shrink-0">
                          Inactive
                        </Badge>
                      )}
                      {combo.isActive && blockedByProduct && (
                        <SimpleTooltip label={COMBO_HIDDEN_BY_PRODUCT_WARNING}>
                          <Badge variant="warning" className="shrink-0">
                            <EyeOff />
                            Hidden
                          </Badge>
                        </SimpleTooltip>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-stone-400 dark:text-stone-500">
                      {combo.itemCount} items ·{' '}
                      {combo.items.map((item) => item.product.name).join(', ')}
                    </p>
                  </div>
                </div>
              </TableCell>

              <TableCell className="text-right text-sm whitespace-nowrap">
                <div className="flex flex-col items-end">
                  <span className="font-medium tabular-nums text-stone-900 dark:text-stone-50">
                    {formatPrice(combo.price)}
                  </span>
                  {combo.savings !== null && (
                    <span className="text-xs tabular-nums text-stone-400 line-through dark:text-stone-500">
                      {formatPrice(combo.itemsTotal)}
                    </span>
                  )}
                </div>
              </TableCell>

              <TableCell className="hidden text-right sm:table-cell">
                {combo.savings !== null ? (
                  <Badge variant="success">
                    {formatPrice(combo.savings)} · {combo.discountPercentage}%
                  </Badge>
                ) : (
                  <SimpleTooltip label="Costs as much as the items bought separately">
                    <span className="text-xs text-stone-400">None</span>
                  </SimpleTooltip>
                )}
              </TableCell>

              <TableCell className="hidden md:table-cell">
                <Badge variant={availabilityVariant(combo.availability)}>
                  <span
                    aria-hidden
                    className="size-1.5 rounded-full bg-current opacity-80"
                  />
                  {AVAILABILITY_LABELS[combo.availability]}
                </Badge>
              </TableCell>

              <TableCell className="text-center">
                <SimpleTooltip
                  label={combo.isFeatured ? 'Remove from featured' : 'Feature'}
                >
                  <button
                    type="button"
                    onClick={() => onToggleFeatured(combo, !combo.isFeatured)}
                    disabled={isBusy}
                    aria-pressed={combo.isFeatured}
                    aria-label={
                      combo.isFeatured
                        ? `Remove ${combo.name} from featured`
                        : `Feature ${combo.name}`
                    }
                    className="group/star inline-flex size-8 cursor-pointer items-center justify-center rounded-lg transition-all outline-none hover:bg-amber-50 focus-visible:ring-4 focus-visible:ring-amber-500/20 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-amber-950/30"
                  >
                    <Star
                      className={cn(
                        'size-4 transition-all duration-200 group-hover/star:scale-110',
                        combo.isFeatured
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-stone-300 group-hover/star:text-amber-400 dark:text-stone-600',
                      )}
                    />
                  </button>
                </SimpleTooltip>
              </TableCell>

              <TableCell className="text-center">
                <Switch
                  checked={combo.isActive}
                  onCheckedChange={(checked) => onToggleActive(combo, checked)}
                  disabled={isBusy}
                  aria-label={
                    combo.isActive
                      ? `Deactivate ${combo.name}`
                      : `Activate ${combo.name}`
                  }
                />
              </TableCell>

              <TableCell className="hidden text-xs whitespace-nowrap text-stone-500 2xl:table-cell dark:text-stone-400">
                {formatDate(combo.updatedAt)}
              </TableCell>

              <TableCell className="text-right">
                <div className="flex items-center justify-end gap-0.5">
                  <SimpleTooltip label="View">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link
                        to={ROUTES.PRIVATE.COMBOS.DETAIL(combo.slug)}
                        aria-label={`View ${combo.name}`}
                      >
                        <Eye className="text-stone-400" />
                      </Link>
                    </Button>
                  </SimpleTooltip>
                  <SimpleTooltip label="Edit">
                    <Button variant="ghost" size="icon-sm" asChild>
                      <Link
                        to={ROUTES.PRIVATE.COMBOS.EDIT(combo.slug)}
                        aria-label={`Edit ${combo.name}`}
                      >
                        <Pencil className="text-stone-400" />
                      </Link>
                    </Button>
                  </SimpleTooltip>
                  <SimpleTooltip label="Delete">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => onDelete(combo)}
                      aria-label={`Delete ${combo.name}`}
                      className="text-stone-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                    >
                      <Trash2 />
                    </Button>
                  </SimpleTooltip>
                </div>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </div>
);

export default CombosTable;
