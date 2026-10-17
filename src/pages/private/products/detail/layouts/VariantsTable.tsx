import {
  BellRing,
  Ellipsis,
  ExternalLink,
  Images,
  MessageCircle,
  Pencil,
  Ruler,
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
import { SimpleTooltip } from '@/components/ui/tooltip';
import { formatPrice } from '@/helpers/format';
import { cn } from '@/lib/utils';
import type { Product, ProductDemand, ProductVariant } from '@/types/api';

import {
  AVAILABILITY_LABELS,
  availabilityVariant,
  stockFlag,
} from '../../helpers';

type TVariantsTableProps = {
  product: Product;
  /** Undefined while loading (or when it failed — the columns show a dash). */
  demand: ProductDemand | undefined;
  /** The variant whose photos the gallery shows. */
  previewId: string | null;
  onPreview: (variantId: string | null) => void;
  onEdit: (variant: ProductVariant) => void;
};

const headClass =
  'px-3 py-2 font-semibold text-[11px] tracking-wider uppercase';

const Stock = ({ variant }: { variant: ProductVariant }) => {
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
  return <>{variant.stock}</>;
};

/**
 * Each variant at a glance — what's on sale, at what price, how many left,
 * and how much shoppers want it (buy clicks over the demand window, and
 * shoppers waiting on a "Notify me"). A variant's photo shows its photos in
 * the gallery; its menu opens a quick edit for restocks and price changes.
 */
const VariantsTable = ({
  product,
  demand,
  previewId,
  onPreview,
  onEdit,
}: TVariantsTableProps) => {
  const demandOf = (variantId: string) =>
    demand?.variants.find((entry) => entry.variantId === variantId);

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[46rem] text-sm">
        <thead>
          <tr className="border-b border-stone-100 text-left text-stone-400 dark:border-stone-800 dark:text-stone-500">
            <th className={cn(headClass, 'pl-3 sm:pl-4 md:pl-6')}>Variant</th>
            <th className={headClass}>SKU</th>
            <th className={cn(headClass, 'text-right')}>Price</th>
            <th className={cn(headClass, 'text-right')}>Stock</th>
            <th className={headClass}>Availability</th>
            <th className={cn(headClass, 'text-right')}>
              <SimpleTooltip
                label={`Buy-button clicks, last ${demand?.days ?? 30} days`}
              >
                <span className="cursor-help">Clicks</span>
              </SimpleTooltip>
            </th>
            <th className={cn(headClass, 'text-right')}>
              <SimpleTooltip label="Shoppers waiting on a Notify me">
                <span className="cursor-help">Waiting</span>
              </SimpleTooltip>
            </th>
            <th className={cn(headClass, 'pr-3 sm:pr-4 md:pr-6')}>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
          {product.variants.map((variant) => {
            const stats = demandOf(variant.id);
            const isPreviewed = previewId === variant.id;
            const ownSize = [variant.dimensions?.split('\n')[0], variant.weight]
              .filter(Boolean)
              .join(' · ');
            return (
              <tr
                key={variant.id}
                className={cn(
                  isPreviewed && 'bg-accent-50/60 dark:bg-accent-950/20',
                )}
              >
                <td className="py-2.5 pr-3 pl-3 sm:pl-4 md:pl-6">
                  <div className="flex items-center gap-2.5">
                    <SimpleTooltip
                      label={
                        isPreviewed
                          ? 'Back to the product’s photos'
                          : variant.images.length > 0
                            ? 'Show its photos'
                            : 'No photos of its own — shows the product’s'
                      }
                    >
                      <button
                        type="button"
                        onClick={() =>
                          onPreview(isPreviewed ? null : variant.id)
                        }
                        aria-pressed={isPreviewed}
                        aria-label={`Show the photos of ${variant.title}`}
                        className={cn(
                          'shrink-0 cursor-pointer rounded-md ring-offset-2 ring-offset-white outline-none focus-visible:ring-2 focus-visible:ring-accent-500/50 dark:ring-offset-stone-900',
                          isPreviewed && 'ring-2 ring-accent-500',
                        )}
                      >
                        <ImageThumb
                          src={variant.images[0] ?? product.images[0]}
                          alt=""
                          className="size-8"
                        />
                      </button>
                    </SimpleTooltip>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={cn(
                            'font-medium',
                            variant.isActive
                              ? 'text-stone-900 dark:text-stone-50'
                              : 'text-stone-400 dark:text-stone-500',
                          )}
                        >
                          {variant.title}
                        </span>
                        {!variant.isActive && (
                          <Badge variant="secondary">Hidden</Badge>
                        )}
                      </div>
                      {ownSize && (
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-stone-400 dark:text-stone-500">
                          <Ruler className="size-3 shrink-0" />
                          {ownSize}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
                <td className="px-3 py-2.5 font-mono text-xs text-stone-500 dark:text-stone-400">
                  {variant.sku ?? '—'}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  <span className="font-medium text-stone-900 dark:text-stone-50">
                    {formatPrice(variant.price)}
                  </span>
                  {variant.compareAtPrice !== null && (
                    <span className="ml-1.5 text-xs text-stone-400 line-through">
                      {formatPrice(variant.compareAtPrice)}
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-stone-700 dark:text-stone-300">
                  <Stock variant={variant} />
                </td>
                <td className="px-3 py-2.5">
                  <Badge variant={availabilityVariant(variant.availability)}>
                    {AVAILABILITY_LABELS[variant.availability]}
                  </Badge>
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums text-stone-700 dark:text-stone-300">
                  {stats ? (
                    <SimpleTooltip
                      label={`${stats.whatsapp} WhatsApp · ${stats.marketplace} marketplace`}
                    >
                      <span className="cursor-help">{stats.clicks}</span>
                    </SimpleTooltip>
                  ) : (
                    <span className="text-stone-300 dark:text-stone-600">
                      —
                    </span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-right tabular-nums">
                  {stats && stats.waiting > 0 ? (
                    <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
                      <BellRing className="size-3.5" />
                      {stats.waiting}
                    </span>
                  ) : (
                    <span className="text-stone-300 dark:text-stone-600">
                      {stats ? 0 : '—'}
                    </span>
                  )}
                </td>
                <td className="py-2.5 pr-3 pl-1 text-right sm:pr-4 md:pr-6">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Actions for ${variant.title}`}
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
                      {variant.images.length > 0 && (
                        <DropdownMenuItem
                          onSelect={() => onPreview(variant.id)}
                        >
                          <Images />
                          Show its photos
                        </DropdownMenuItem>
                      )}
                      {variant.whatsappUrl && (
                        <DropdownMenuItem asChild>
                          <a
                            href={variant.whatsappUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            <MessageCircle />
                            Test WhatsApp link
                            <ExternalLink className="ml-auto size-3.5 opacity-60" />
                          </a>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default VariantsTable;
