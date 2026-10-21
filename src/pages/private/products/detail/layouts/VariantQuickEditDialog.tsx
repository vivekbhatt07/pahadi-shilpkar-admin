import { useState } from 'react';
import { BellRing, Loader2 } from 'lucide-react';

import Callout from '@/components/custom/Callout';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useUpdateVariant } from '@/hooks/products';
import type {
  ProductAvailability,
  ProductVariant,
  UpdateVariantPayload,
} from '@/types/api';

import { AVAILABILITY_OPTIONS, PRODUCT_LIMITS } from '../../constants';

type TQuickEditDialogProps = {
  productId: string;
  /** The variant being edited — null closes the dialog. */
  variant: ProductVariant | null;
  /** Shoppers waiting on it — they're emailed once it can be ordered. */
  waiting: number;
  onClose: () => void;
};

type TDraft = {
  price: string;
  compareAtPrice: string;
  stock: string;
  /** Units that just arrived — added to the stock as it is when saved. */
  arrived: string;
  /** '' = the store's level. */
  lowStockThreshold: string;
  availability: ProductAvailability;
  isActive: boolean;
};

const labelClass =
  'flex flex-col gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400';

const RupeePrefix = () => (
  <span className="text-sm text-stone-400 dark:text-stone-500">₹</span>
);

const isOrderable = (availability: ProductAvailability) =>
  availability === 'IN_STOCK' || availability === 'MADE_TO_ORDER';

const toDraft = (variant: ProductVariant): TDraft => ({
  price: String(variant.price),
  compareAtPrice:
    variant.compareAtPrice === null ? '' : String(variant.compareAtPrice),
  stock: String(variant.stock),
  arrived: '',
  lowStockThreshold:
    variant.lowStockThreshold === null ? '' : String(variant.lowStockThreshold),
  availability: variant.availability,
  isActive: variant.isActive,
});

/** Why the draft can't be saved, or null. */
const problemWith = (draft: TDraft): string | null => {
  const price = Number(draft.price);
  if (draft.price === '' || !(price > 0)) return 'Enter a price above 0';
  if (draft.compareAtPrice !== '') {
    const compareAt = Number(draft.compareAtPrice);
    if (!(compareAt > price)) {
      return 'The compare-at price must be above the price — or leave it empty';
    }
  }
  const stock = Number(draft.stock);
  if (draft.stock === '' || !Number.isInteger(stock) || stock < 0) {
    return 'Stock must be a whole number, 0 or more';
  }
  if (draft.arrived !== '') {
    const arrived = Number(draft.arrived);
    if (
      !Number.isInteger(arrived) ||
      arrived < 1 ||
      arrived > PRODUCT_LIMITS.RESTOCK_MAX
    ) {
      return 'Units that arrived must be a whole number above 0';
    }
  }
  if (draft.lowStockThreshold !== '') {
    const threshold = Number(draft.lowStockThreshold);
    if (
      !Number.isInteger(threshold) ||
      threshold < 0 ||
      threshold > PRODUCT_LIMITS.LOW_STOCK_THRESHOLD_MAX
    ) {
      return 'Low stock at must be a whole number from 0 to 1,000 — or empty';
    }
  }
  return null;
};

/**
 * Only what changed — an untouched field keeps its stored value. Units that
 * arrived are added on the server, to whatever the stock is by then, so a
 * sale recorded meanwhile isn't written over.
 */
const toPayload = (
  variant: ProductVariant,
  draft: TDraft,
): UpdateVariantPayload => {
  const compareAtPrice =
    draft.compareAtPrice === '' ? null : Number(draft.compareAtPrice);
  const lowStockThreshold =
    draft.lowStockThreshold === '' ? null : Number(draft.lowStockThreshold);
  return {
    ...(Number(draft.price) !== variant.price && {
      price: Number(draft.price),
    }),
    ...(compareAtPrice !== variant.compareAtPrice && { compareAtPrice }),
    ...(draft.arrived !== ''
      ? { addStock: Number(draft.arrived) }
      : Number(draft.stock) !== variant.stock && {
          stock: Number(draft.stock),
        }),
    ...(lowStockThreshold !== variant.lowStockThreshold && {
      lowStockThreshold,
    }),
    ...(draft.availability !== variant.availability && {
      availability: draft.availability,
    }),
    ...(draft.isActive !== variant.isActive && { isActive: draft.isActive }),
  };
};

const QuickEditForm = ({
  productId,
  variant,
  waiting,
  onClose,
}: TQuickEditDialogProps & { variant: ProductVariant }) => {
  const updateVariant = useUpdateVariant();
  const [draft, setDraft] = useState(() => toDraft(variant));
  const problem = problemWith(draft);
  const payload = problem ? {} : toPayload(variant, draft);
  const hasChanges = Object.keys(payload).length > 0;
  // Saving it orderable (and on sale) emails whoever's waiting
  const notifies =
    waiting > 0 &&
    draft.isActive &&
    isOrderable(draft.availability) &&
    (!isOrderable(variant.availability) || !variant.isActive);

  const set = (changes: Partial<TDraft>) => setDraft({ ...draft, ...changes });

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        if (problem || !hasChanges) return;
        updateVariant.mutate(
          { productId, variantId: variant.id, payload },
          { onSuccess: onClose },
        );
      }}
    >
      <div className="grid grid-cols-2 gap-3">
        <label className={labelClass}>
          Price
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            startAdornment={<RupeePrefix />}
            value={draft.price}
            onChange={(event) => set({ price: event.target.value })}
            disabled={updateVariant.isPending}
          />
        </label>
        <label className={labelClass}>
          Compare-at price
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step="0.01"
            placeholder="None"
            startAdornment={<RupeePrefix />}
            value={draft.compareAtPrice}
            onChange={(event) => set({ compareAtPrice: event.target.value })}
            disabled={updateVariant.isPending}
          />
        </label>
        <label className={labelClass}>
          Stock
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={draft.stock}
            onChange={(event) => set({ stock: event.target.value })}
            disabled={updateVariant.isPending || draft.arrived !== ''}
          />
        </label>
        <label className={labelClass}>
          Arrived
          <Input
            autoFocus
            type="number"
            inputMode="numeric"
            min={1}
            step={1}
            placeholder="Add to stock"
            startAdornment={
              <span className="text-sm text-stone-400 dark:text-stone-500">
                +
              </span>
            }
            value={draft.arrived}
            onChange={(event) => set({ arrived: event.target.value })}
            disabled={updateVariant.isPending}
          />
        </label>
        <label className={labelClass}>
          Availability
          <Select
            value={draft.availability}
            onValueChange={(value) =>
              set({ availability: value as ProductAvailability })
            }
            disabled={updateVariant.isPending}
          >
            <SelectTrigger aria-label="Availability">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AVAILABILITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        <label className={labelClass}>
          Low stock at
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            placeholder="Store's level"
            value={draft.lowStockThreshold}
            onChange={(event) => set({ lowStockThreshold: event.target.value })}
            disabled={updateVariant.isPending}
          />
        </label>
      </div>

      {draft.arrived !== '' && !problem && (
        <p className="-mt-1 text-xs text-stone-500 tabular-nums dark:text-stone-400">
          Stock goes from {variant.stock} to{' '}
          {variant.stock + Number(draft.arrived)} — plus or minus anything sold
          meanwhile.
        </p>
      )}

      <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-stone-200 px-3 py-2.5 dark:border-stone-800">
        <span className="flex flex-col gap-0.5">
          <span className="text-sm font-medium text-stone-800 dark:text-stone-200">
            On sale
          </span>
          <span className="text-xs text-stone-400 dark:text-stone-500">
            Hidden, it can't be picked — and combos selling it are hidden too
          </span>
        </span>
        <Switch
          checked={draft.isActive}
          onCheckedChange={(isActive) => set({ isActive })}
          disabled={updateVariant.isPending}
        />
      </label>

      {notifies && (
        <Callout variant="info">
          <span className="inline-flex items-center gap-1.5">
            <BellRing className="size-3.5" />
            {waiting} {waiting === 1 ? 'shopper is' : 'shoppers are'} waiting —
            saving emails them that it's available.
          </span>
        </Callout>
      )}
      {problem && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {problem}
        </p>
      )}

      <DialogFooter>
        <Button type="button" variant="ghost" onClick={onClose}>
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={!hasChanges || updateVariant.isPending}
          startAdornment={
            updateVariant.isPending ? (
              <Loader2 className="animate-spin" />
            ) : undefined
          }
        >
          Save
        </Button>
      </DialogFooter>
    </form>
  );
};

/**
 * A restock, a new price or switching one variant off — straight from the
 * product page, without opening (and re-saving) the whole form.
 */
const VariantQuickEditDialog = (props: TQuickEditDialogProps) => (
  <Dialog
    open={props.variant !== null}
    onOpenChange={(open) => !open && props.onClose()}
  >
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{props.variant?.title}</DialogTitle>
        <DialogDescription>
          Saves this variant alone — the product's price, stock and availability
          follow it.
        </DialogDescription>
      </DialogHeader>
      {props.variant && (
        <QuickEditForm
          key={props.variant.id}
          {...props}
          variant={props.variant}
        />
      )}
    </DialogContent>
  </Dialog>
);

export default VariantQuickEditDialog;
