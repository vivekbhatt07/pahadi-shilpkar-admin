import { useState } from 'react';
import {
  Boxes,
  ChevronDown,
  ImagePlus,
  Layers,
  Plus,
  Power,
  PowerOff,
  Trash2,
} from 'lucide-react';
import {
  Controller,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';

import ImagesInput from '@/components/custom/ImagesInput';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { formatPrice } from '@/helpers/format';
import { cn } from '@/lib/utils';
import type { ProductAvailability } from '@/types/api';

import {
  AVAILABILITY_OPTIONS,
  PRODUCT_FORM_FIELD_NAMES,
  PRODUCT_LIMITS,
} from '../constants';
import type { TProductFormData, TVariantFormValue } from '../types';
import {
  addOption,
  addOptionValue,
  removeOption,
  removeOptionValue,
  renameOption,
  renameOptionValue,
  summarizeVariantRows,
  variantRowKey,
  variantRowTitle,
  type TVariantsState,
} from '../variants';
import OptionValuesInput from './OptionValuesInput';

const { VARIANT_OPTIONS, VARIANTS } = PRODUCT_FORM_FIELD_NAMES;

/** Names admins reach for — suggestions, not a fixed list. */
const OPTION_NAME_SUGGESTIONS = [
  'Design',
  'Size',
  'Colour',
  'Finish',
  'Pattern',
  'Style',
  'Material',
];

/** Variant columns from `sm` up: photo, name, price, stock, availability, on, more. */
const ROW_GRID =
  'sm:grid sm:grid-cols-[2.75rem_minmax(0,1fr)_7rem_4.5rem_8.75rem_2.5rem_2rem] sm:items-center sm:gap-2';

/** `valueAsNumber` semantics for a controlled input: NaN while empty. */
const toNumber = (event: React.ChangeEvent<HTMLInputElement>) =>
  event.target.value === '' ? Number.NaN : event.target.valueAsNumber;

const toNullableNumber = (event: React.ChangeEvent<HTMLInputElement>) =>
  event.target.value === '' ? null : event.target.valueAsNumber;

const RupeePrefix = () => (
  <span className="text-sm text-stone-400 dark:text-stone-500">₹</span>
);

type TVariantRowProps = {
  index: number;
  row: TVariantFormValue;
  disabled?: boolean;
  onPhotos: () => void;
  onRemove: () => void;
};

const VariantRow = ({
  index,
  row,
  disabled,
  onPhotos,
  onRemove,
}: TVariantRowProps) => {
  const { control } = useFormContext<TProductFormData>();
  const [expanded, setExpanded] = useState(false);
  // useFormState (not formState from context) so the React Compiler sees
  // fresh errors after a submit.
  const errors = useFormState({ control, name: `${VARIANTS}.${index}` }).errors
    .variants?.[index];
  const title = variantRowTitle(row);
  // A problem in a field that's tucked away opens the row
  const open =
    expanded ||
    Boolean(errors?.compareAtPrice || errors?.sku || errors?.images);
  const messages = [
    errors?.price?.message,
    errors?.stock?.message,
    errors?.compareAtPrice?.message,
    errors?.sku?.message,
    errors?.images?.message,
  ].filter(Boolean);

  return (
    <li
      className={cn(
        'flex flex-col gap-3 px-3 py-3',
        !row.isActive && 'bg-stone-50/80 dark:bg-stone-900/40',
      )}
    >
      <div className={cn('flex flex-wrap items-center gap-2', ROW_GRID)}>
        <SimpleTooltip
          label={
            row.images.length > 0
              ? `${row.images.length} photo${row.images.length === 1 ? '' : 's'}`
              : 'Add photos'
          }
        >
          <button
            type="button"
            onClick={onPhotos}
            disabled={disabled}
            aria-label={`Photos of ${title}`}
            className="relative flex size-11 shrink-0 cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-stone-300 text-stone-400 transition-colors outline-none hover:border-stone-400 hover:text-stone-600 focus-visible:ring-4 focus-visible:ring-accent-500/15 dark:border-stone-700"
          >
            {row.images[0] ? (
              <img
                src={row.images[0]}
                alt=""
                className="size-full object-cover"
              />
            ) : (
              <ImagePlus className="size-4" />
            )}
            {row.images.length > 1 && (
              <span className="absolute right-0.5 bottom-0.5 rounded bg-stone-950/70 px-1 text-[10px] leading-4 font-medium text-white tabular-nums">
                {row.images.length}
              </span>
            )}
          </button>
        </SimpleTooltip>

        <div className="flex min-w-0 flex-1 items-center gap-2 sm:flex-none">
          <p
            title={title}
            className={cn(
              'truncate text-sm font-medium text-stone-900 dark:text-stone-50',
              !row.isActive && 'text-stone-500 dark:text-stone-400',
            )}
          >
            {title}
          </p>
          {!row.id && (
            <SimpleTooltip label="New — saved with the product">
              <span
                aria-label="New"
                className="size-1.5 shrink-0 rounded-full bg-accent-500"
              />
            </SimpleTooltip>
          )}
        </div>

        <Controller
          control={control}
          name={`${VARIANTS}.${index}.price`}
          render={({ field }) => (
            <Input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              placeholder="Price"
              aria-label={`Price of ${title}`}
              aria-invalid={Boolean(errors?.price)}
              disabled={disabled}
              startAdornment={<RupeePrefix />}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={Number.isNaN(field.value) ? '' : field.value}
              onChange={(event) => field.onChange(toNumber(event))}
              className="w-28 sm:w-full"
            />
          )}
        />

        <Controller
          control={control}
          name={`${VARIANTS}.${index}.stock`}
          render={({ field }) => (
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              placeholder="0"
              aria-label={`Stock of ${title}`}
              aria-invalid={Boolean(errors?.stock)}
              disabled={disabled}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={Number.isNaN(field.value) ? '' : field.value}
              onChange={(event) => field.onChange(toNumber(event))}
              className="w-20 sm:w-full"
            />
          )}
        />

        <Controller
          control={control}
          name={`${VARIANTS}.${index}.availability`}
          render={({ field }) => (
            <Select
              value={field.value}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger
                aria-label={`Availability of ${title}`}
                className="w-40 sm:w-full"
              >
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
          )}
        />

        <Controller
          control={control}
          name={`${VARIANTS}.${index}.isActive`}
          render={({ field }) => (
            <SimpleTooltip
              label={field.value ? 'On sale — switch off to hide' : 'Hidden'}
            >
              <span className="flex justify-center">
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={disabled}
                  aria-label={`Sell ${title}`}
                />
              </span>
            </SimpleTooltip>
          )}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setExpanded(!open)}
          aria-expanded={open}
          aria-label={`More about ${title}`}
          className="ml-auto sm:ml-0"
        >
          <ChevronDown
            className={cn('transition-transform', open && 'rotate-180')}
          />
        </Button>
      </div>

      {open && (
        <div className="grid animate-in grid-cols-1 gap-3 duration-150 fade-in-0 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end sm:pl-[3.25rem]">
          <Controller
            control={control}
            name={`${VARIANTS}.${index}.compareAtPrice`}
            render={({ field }) => (
              <label className="flex flex-col gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400">
                Compare-at price
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step="0.01"
                  placeholder="MRP / strike-through"
                  aria-invalid={Boolean(errors?.compareAtPrice)}
                  disabled={disabled}
                  startAdornment={<RupeePrefix />}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(toNullableNumber(event))}
                />
              </label>
            )}
          />
          <Controller
            control={control}
            name={`${VARIANTS}.${index}.sku`}
            render={({ field }) => (
              <label className="flex flex-col gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400">
                SKU
                <Input
                  placeholder="Optional"
                  maxLength={PRODUCT_LIMITS.SKU_MAX}
                  aria-invalid={Boolean(errors?.sku)}
                  disabled={disabled}
                  {...field}
                />
              </label>
            )}
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            className="text-red-600 hover:text-red-700 dark:text-red-400"
          >
            <Trash2 />
            Remove variant
          </Button>
        </div>
      )}

      {messages.length > 0 && (
        <ul className="flex flex-col gap-0.5 sm:pl-[3.25rem]">
          {messages.map((message) => (
            <li
              key={message}
              className="text-xs font-medium text-red-600 dark:text-red-400"
            >
              {message}
            </li>
          ))}
        </ul>
      )}
    </li>
  );
};

type TBulkField = 'price' | 'stock';

const BULK_FIELD_LABELS: Record<TBulkField, string> = {
  price: 'Price',
  stock: 'Stock',
};

/**
 * Options the product comes in — "Design: Peacock, Lotus" — and a variant
 * for each combination, with its own price, stock, availability and photos.
 * Every edit to the options regenerates the combinations while keeping the
 * variants that stay (and their ids). Shown in the product form's Variants
 * card; the form sends both lists whole whenever either changed.
 */
const VariantsField = ({ disabled }: { disabled?: boolean }) => {
  const { control, getValues, setValue } = useFormContext<TProductFormData>();
  const options = useWatch({ control, name: VARIANT_OPTIONS });
  const rows = useWatch({ control, name: VARIANTS });
  const { errors, isSubmitted } = useFormState({
    control,
    name: [VARIANT_OPTIONS, VARIANTS],
  });
  const [photosIndex, setPhotosIndex] = useState<number | null>(null);
  const [bulk, setBulk] = useState<{ field: TBulkField; value: string } | null>(
    null,
  );

  // Read fresh — several values can be added in one go, each building on the last
  const current = (): TVariantsState => ({
    options: getValues(VARIANT_OPTIONS),
    rows: getValues(VARIANTS),
  });

  const update = (next: TVariantsState) => {
    const flags = { shouldDirty: true, shouldValidate: isSubmitted };
    setValue(VARIANT_OPTIONS, next.options, flags);
    setValue(VARIANTS, next.rows, flags);
  };

  const updateRows = (change: (row: TVariantFormValue) => TVariantFormValue) =>
    update({ ...current(), rows: current().rows.map(change) });

  const applyBulk = () => {
    if (!bulk) return;
    const value = Number(bulk.value);
    if (bulk.value === '' || Number.isNaN(value) || value < 0) return;
    updateRows((row) => ({ ...row, [bulk.field]: value }));
    setBulk(null);
  };

  const summary = summarizeVariantRows(rows);
  const photosRow = photosIndex === null ? undefined : rows[photosIndex];
  const optionErrors = errors.variantOptions;
  const rowsError = errors.variants?.message ?? errors.variants?.root?.message;

  if (options.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed border-stone-200 px-4 py-8 text-center dark:border-stone-700">
        <div className="flex size-10 items-center justify-center rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800">
          <Layers className="size-5" />
        </div>
        <div className="flex max-w-md flex-col gap-1">
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            This product comes one way only
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Sold in several designs or sizes? Add an option like Design or Size
            — each combination becomes a variant with its own price, stock and
            photos, and shoppers pick one on the product page.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => update(addOption(current()))}
          disabled={disabled}
        >
          <Plus />
          Add an option
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <datalist id="variant-option-names">
        {OPTION_NAME_SUGGESTIONS.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>

      <div className="flex flex-col gap-3">
        {options.map((option, index) => {
          const optionError = optionErrors?.[index];
          const nameError = optionError?.name?.message;
          const valuesError = optionError?.values?.message;
          return (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-lg border border-stone-200 p-3 dark:border-stone-800"
            >
              <div className="flex items-center gap-2">
                <Input
                  list="variant-option-names"
                  value={option.name}
                  onChange={(event) =>
                    update(renameOption(current(), index, event.target.value))
                  }
                  placeholder={index === 0 ? 'Design' : 'Size'}
                  maxLength={PRODUCT_LIMITS.VARIANT_OPTION_NAME_MAX}
                  aria-label={`Option ${index + 1} name`}
                  aria-invalid={Boolean(nameError)}
                  disabled={disabled}
                  className="max-w-56"
                />
                <span className="text-xs whitespace-nowrap text-stone-400 tabular-nums dark:text-stone-500">
                  {option.values.length}{' '}
                  {option.values.length === 1 ? 'value' : 'values'}
                </span>
                <SimpleTooltip label="Remove option">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => update(removeOption(current(), index))}
                    disabled={disabled}
                    aria-label={`Remove option ${option.name || index + 1}`}
                    className="ml-auto text-stone-400 hover:text-red-600"
                  >
                    <Trash2 />
                  </Button>
                </SimpleTooltip>
              </div>
              <OptionValuesInput
                optionName={option.name}
                values={option.values}
                onAdd={(value) =>
                  update(addOptionValue(current(), index, value))
                }
                onRename={(from, to) =>
                  update(renameOptionValue(current(), index, from, to))
                }
                onRemove={(value) =>
                  update(removeOptionValue(current(), index, value))
                }
                disabled={disabled}
              />
              {(nameError || valuesError) && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {nameError ?? valuesError}
                </p>
              )}
            </div>
          );
        })}

        {options.length < PRODUCT_LIMITS.VARIANT_OPTIONS_MAX && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => update(addOption(current()))}
            disabled={disabled}
            className="w-fit"
          >
            <Plus />
            Add another option
          </Button>
        )}
      </div>

      {rows.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-stone-600 dark:text-stone-400">
              <span className="font-medium text-stone-900 dark:text-stone-50">
                {summary.count} {summary.count === 1 ? 'variant' : 'variants'}
              </span>
              {summary.minPrice !== null && (
                <>
                  {' · '}
                  {summary.minPrice === summary.maxPrice
                    ? formatPrice(summary.minPrice)
                    : `${formatPrice(summary.minPrice)} – ${formatPrice(summary.maxPrice!)}`}
                </>
              )}
              {' · '}
              {summary.stock} in stock
              {summary.activeCount < summary.count &&
                ` · ${summary.count - summary.activeCount} hidden`}
            </p>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                >
                  Edit all
                  <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem
                  onSelect={() => setBulk({ field: 'price', value: '' })}
                >
                  Set every price…
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() => setBulk({ field: 'stock', value: '' })}
                >
                  Set every stock…
                </DropdownMenuItem>
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger>
                    <Boxes />
                    Set availability
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent className="w-48">
                    {AVAILABILITY_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.value}
                        onSelect={() =>
                          updateRows((row) => ({
                            ...row,
                            availability: option.value as ProductAvailability,
                          }))
                        }
                      >
                        {option.label}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onSelect={() =>
                    updateRows((row) => ({ ...row, isActive: true }))
                  }
                >
                  <Power />
                  Switch all on
                </DropdownMenuItem>
                <DropdownMenuItem
                  onSelect={() =>
                    updateRows((row) => ({ ...row, isActive: false }))
                  }
                >
                  <PowerOff />
                  Switch all off
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="overflow-hidden rounded-lg border border-stone-200 dark:border-stone-800">
            <div
              aria-hidden
              className={cn(
                'hidden border-b border-stone-200 bg-stone-50 px-3 py-2 text-xs font-medium text-stone-500 sm:grid dark:border-stone-800 dark:bg-stone-900/60 dark:text-stone-400',
                ROW_GRID,
              )}
            >
              <span>Photo</span>
              <span>Variant</span>
              <span>Price</span>
              <span>Stock</span>
              <span>Availability</span>
              <span className="text-center">On</span>
              <span />
            </div>
            <ul className="divide-y divide-stone-200 dark:divide-stone-800">
              {rows.map((row, index) => (
                <VariantRow
                  key={variantRowKey(row)}
                  index={index}
                  row={row}
                  disabled={disabled}
                  onPhotos={() => setPhotosIndex(index)}
                  onRemove={() =>
                    update({
                      ...current(),
                      rows: current().rows.filter((_, i) => i !== index),
                    })
                  }
                />
              ))}
            </ul>
          </div>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Shoppers see the lowest price (“From …”) until they pick a variant.
            A hidden variant can't be picked; removing one deletes it on save.
            Saving a variant as In stock or Made to order emails anyone waiting
            on it.
          </p>
        </div>
      )}

      {rowsError && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {rowsError}
        </p>
      )}

      <Dialog
        open={photosRow !== undefined}
        onOpenChange={(open) => !open && setPhotosIndex(null)}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Photos — {photosRow ? variantRowTitle(photosRow) : ''}
            </DialogTitle>
            <DialogDescription>
              Shown first when shoppers pick this variant, before the product's
              own photos. Up to {PRODUCT_LIMITS.VARIANT_IMAGES_MAX}.
            </DialogDescription>
          </DialogHeader>
          {photosIndex !== null && photosRow && (
            <Controller
              control={control}
              name={`${VARIANTS}.${photosIndex}.images`}
              render={({ field }) => (
                <ImagesInput
                  value={field.value}
                  onChange={field.onChange}
                  disabled={disabled}
                />
              )}
            />
          )}
          <DialogFooter>
            <Button type="button" onClick={() => setPhotosIndex(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={bulk !== null}
        onOpenChange={(open) => !open && setBulk(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {bulk ? `${BULK_FIELD_LABELS[bulk.field]} for every variant` : ''}
            </DialogTitle>
            <DialogDescription>
              Replaces what each variant has now. You can still change any of
              them afterwards.
            </DialogDescription>
          </DialogHeader>
          <Input
            autoFocus
            type="number"
            inputMode={bulk?.field === 'price' ? 'decimal' : 'numeric'}
            min={0}
            step={bulk?.field === 'price' ? '0.01' : 1}
            startAdornment={
              bulk?.field === 'price' ? <RupeePrefix /> : undefined
            }
            value={bulk?.value ?? ''}
            onChange={(event) =>
              bulk && setBulk({ ...bulk, value: event.target.value })
            }
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                applyBulk();
              }
            }}
            aria-label={bulk ? BULK_FIELD_LABELS[bulk.field] : undefined}
          />
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setBulk(null)}>
              Cancel
            </Button>
            <Button type="button" onClick={applyBulk} disabled={!bulk?.value}>
              Apply to {rows.length}{' '}
              {rows.length === 1 ? 'variant' : 'variants'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VariantsField;
