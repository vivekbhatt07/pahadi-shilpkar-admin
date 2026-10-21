import { Fragment, useState } from 'react';
import {
  ArrowDown,
  ArrowUp,
  Boxes,
  ChevronDown,
  Copy,
  Eye,
  Gift,
  ImagePlus,
  Images,
  Layers,
  ListChecks,
  ListPlus,
  Palette,
  Plus,
  Ruler,
  Tag,
  Trash2,
  WandSparkles,
} from 'lucide-react';
import {
  Controller,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';
import { Link } from 'react-router';
import { toast } from 'sonner';

import Callout from '@/components/custom/Callout';
import ImagesInput from '@/components/custom/ImagesInput';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
  DropdownMenuLabel,
  DropdownMenuSeparator,
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
import { Textarea } from '@/components/ui/textarea';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { formatPrice } from '@/helpers/format';
import { cn } from '@/lib/utils';
import type { ProductAvailability } from '@/types/api';

import {
  AVAILABILITY_OPTIONS,
  PRODUCT_FORM_FIELD_NAMES,
  PRODUCT_LIMITS,
  PRODUCT_SIZES,
} from '../constants';
import { describeMeasurements, toMeasurementsPayload } from '../helpers';
import type { TProductFormData, TVariantFormValue } from '../types';
import {
  addCombinations,
  addOption,
  addOptionValue,
  changePrice,
  changeStock,
  copyDetailsToSiblings,
  copyPhotosToSiblings,
  copySizeToSiblings,
  generateSkus,
  inScope,
  missingCombinations,
  moveOption,
  moveOptionValue,
  ownDetails,
  removeOption,
  removeOptionValue,
  renameOption,
  renameOptionValue,
  setSwatch,
  setSwatchesOn,
  siblingIndexes,
  skuPrefixFrom,
  summarizeVariantRows,
  variantRowKey,
  variantRowTitle,
  type TComboRef,
  type TComboUsage,
  type TPriceChange,
  type TStockChange,
  type TVariantScope,
  type TVariantsState,
} from '../variants';
import OptionValuesInput from './OptionValuesInput';
import VariantDetailsDialog from './VariantDetailsDialog';
import VariantLinksField from './VariantLinksField';
import VariantMeasurementsField from './VariantMeasurementsField';

const { NAME, SKU, VARIANT_OPTIONS, VARIANTS } = PRODUCT_FORM_FIELD_NAMES;

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

const fieldLabelClass =
  'flex flex-col gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400';

/** `valueAsNumber` semantics for a controlled input: NaN while empty. */
const toNumber = (event: React.ChangeEvent<HTMLInputElement>) =>
  event.target.value === '' ? Number.NaN : event.target.valueAsNumber;

const toNullableNumber = (event: React.ChangeEvent<HTMLInputElement>) =>
  event.target.value === '' ? null : event.target.valueAsNumber;

const RupeePrefix = () => (
  <span className="text-sm text-stone-400 dark:text-stone-500">₹</span>
);

/** "Length 200 cm × Width 70 cm · 450 g" — a row's own size, if it has one. */
const ownSize = (row: TVariantFormValue) => {
  const measurements = toMeasurementsPayload(row.measurements);
  const dimensions =
    measurements && PRODUCT_SIZES.some((size) => measurements[size] != null)
      ? describeMeasurements(measurements).split('\n')[0]
      : null;
  return [dimensions, row.weight.trim()].filter(Boolean).join(' · ') || null;
};

/** The other variants a row's size can be copied to — "every Large one". */
type TCopyTarget = { optionIndex: number; value: string; count: number };

type TVariantRowProps = {
  index: number;
  row: TVariantFormValue;
  /** The combos selling it, when it's saved and in any. */
  combos?: TComboRef[];
  copyTargets: TCopyTarget[];
  disabled?: boolean;
  onPhotos: () => void;
  onDetails: () => void;
  onRemove: () => void;
  onCopySize: (optionIndex: number) => void;
};

const VariantRow = ({
  index,
  row,
  combos = [],
  copyTargets,
  disabled,
  onPhotos,
  onDetails,
  onRemove,
  onCopySize,
}: TVariantRowProps) => {
  const { control } = useFormContext<TProductFormData>();
  const [expanded, setExpanded] = useState(false);
  // useFormState (not formState from context) so the React Compiler sees
  // fresh errors after a submit.
  const errors = useFormState({ control, name: `${VARIANTS}.${index}` }).errors
    .variants?.[index];
  const title = variantRowTitle(row);
  const size = ownSize(row);
  const own = ownDetails(row);
  const measurementErrors = errors?.measurements;
  const linkErrors = row.purchaseLinks.map(
    (_, i) =>
      errors?.purchaseLinks?.[i]?.url?.message ??
      errors?.purchaseLinks?.[i]?.label?.message,
  );
  // A problem in a field that's tucked away opens the row
  const open =
    expanded ||
    Boolean(
      errors?.compareAtPrice ||
      errors?.sku ||
      errors?.images ||
      errors?.weight ||
      errors?.description ||
      errors?.purchaseLinks ||
      measurementErrors,
    );
  const messages = [
    ...new Set(
      [
        errors?.price?.message,
        errors?.stock?.message,
        errors?.compareAtPrice?.message,
        errors?.sku?.message,
        errors?.images?.message,
        errors?.weight?.message,
        measurementErrors?.message,
        ...PRODUCT_SIZES.map((key) => measurementErrors?.[key]?.message),
        measurementErrors?.note?.message,
        errors?.description?.message,
        errors?.purchaseLinks?.message,
        // Its details are edited in their own dialog — named here so a
        // problem in one isn't missed
        ...[
          errors?.leadTimeDays?.message,
          errors?.leadTimeMaxDays?.message,
          errors?.lowStockThreshold?.message,
          errors?.deliveryFee?.message,
          errors?.material?.message,
          errors?.careInstructions?.message,
          errors?.videoUrl?.message,
          errors?.highlights?.message,
          errors?.colors?.message,
          errors?.specifications?.message,
        ].map((message) => message && `Details: ${message}`),
      ].filter((message): message is string => Boolean(message)),
    ),
  ];

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
          {own.length > 0 && (
            <SimpleTooltip label={`Its own: ${own.join(', ')}`}>
              <ListChecks
                aria-label={`Its own details: ${own.join(', ')}`}
                className="size-3.5 shrink-0 text-stone-400"
              />
            </SimpleTooltip>
          )}
          {size && (
            <SimpleTooltip label={`Own size: ${size}`}>
              <Ruler
                aria-label={`Own size: ${size}`}
                className="size-3.5 shrink-0 text-stone-400"
              />
            </SimpleTooltip>
          )}
          {combos.length > 0 && (
            <SimpleTooltip
              label={`Sold in ${combos.map((combo) => combo.name).join(', ')}`}
            >
              <span
                aria-label={`In ${combos.length} ${combos.length === 1 ? 'combo' : 'combos'}`}
                className="inline-flex shrink-0 items-center gap-0.5 text-[11px] text-stone-500 tabular-nums dark:text-stone-400"
              >
                <Gift className="size-3" />
                {combos.length}
              </span>
            </SimpleTooltip>
          )}
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
        <div className="flex animate-in flex-col gap-4 duration-150 fade-in-0 sm:pl-[3.25rem]">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
            <Controller
              control={control}
              name={`${VARIANTS}.${index}.compareAtPrice`}
              render={({ field }) => (
                <label className={fieldLabelClass}>
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
                    onChange={(event) =>
                      field.onChange(toNullableNumber(event))
                    }
                  />
                </label>
              )}
            />
            <Controller
              control={control}
              name={`${VARIANTS}.${index}.sku`}
              render={({ field }) => (
                <label className={fieldLabelClass}>
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

          <div className="flex flex-col gap-3 border-t border-dashed border-stone-200 pt-3 dark:border-stone-800">
            <p className="text-xs text-stone-400 dark:text-stone-500">
              <span className="font-medium text-stone-600 dark:text-stone-300">
                Size & weight
              </span>{' '}
              — only for a variant that measures or weighs differently from the
              product. Shoppers see these while it's picked.
            </p>
            <VariantMeasurementsField
              index={index}
              title={title}
              disabled={disabled}
            />
            <Controller
              control={control}
              name={`${VARIANTS}.${index}.weight`}
              render={({ field }) => (
                <label className={cn(fieldLabelClass, 'sm:max-w-56')}>
                  Weight
                  <Input
                    placeholder="Same as the product"
                    maxLength={PRODUCT_LIMITS.WEIGHT_MAX}
                    aria-invalid={Boolean(errors?.weight)}
                    disabled={disabled}
                    {...field}
                  />
                </label>
              )}
            />
            {size && copyTargets.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {copyTargets.map((target) => (
                  <Button
                    key={target.optionIndex}
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={disabled}
                    onClick={() => onCopySize(target.optionIndex)}
                  >
                    <Copy />
                    Use for every {target.value} variant ({target.count} more)
                  </Button>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-dashed border-stone-200 pt-3 dark:border-stone-800">
            <p className="text-xs text-stone-400 dark:text-stone-500">
              <span className="font-medium text-stone-600 dark:text-stone-300">
                Details
              </span>{' '}
              —{' '}
              {own.length > 0
                ? `its own ${own.join(', ').toLowerCase()}; the rest as the product.`
                : 'highlights, material, colours, care, specifications, video, delivery, making time and low-stock level, all as the product.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onDetails}
              disabled={disabled}
            >
              <ListChecks />
              Edit details
            </Button>
          </div>

          <div className="flex flex-col gap-3 border-t border-dashed border-stone-200 pt-3 dark:border-stone-800">
            <Controller
              control={control}
              name={`${VARIANTS}.${index}.description`}
              render={({ field }) => (
                <label className={fieldLabelClass}>
                  <span className="flex items-center justify-between">
                    Description
                    <span className="font-normal text-stone-400 tabular-nums dark:text-stone-500">
                      {field.value.length}/
                      {PRODUCT_LIMITS.VARIANT_DESCRIPTION_MAX}
                    </span>
                  </span>
                  <Textarea
                    rows={2}
                    maxLength={PRODUCT_LIMITS.VARIANT_DESCRIPTION_MAX}
                    placeholder="Optional — what sets it apart: “Holds six diyas”, “Each peacock painted by hand”"
                    aria-invalid={Boolean(errors?.description)}
                    disabled={disabled}
                    {...field}
                  />
                </label>
              )}
            />
            <div className="flex flex-col gap-2">
              <p className="text-xs text-stone-400 dark:text-stone-500">
                <span className="font-medium text-stone-600 dark:text-stone-300">
                  Where to buy {title}
                </span>{' '}
                — only when it's listed on its own, say on Amazon. Shoppers who
                pick it see these buttons instead of the product's.
              </p>
              <Controller
                control={control}
                name={`${VARIANTS}.${index}.purchaseLinks`}
                render={({ field }) => (
                  <VariantLinksField
                    value={field.value}
                    onChange={field.onChange}
                    errors={linkErrors}
                    title={title}
                    disabled={disabled}
                  />
                )}
              />
            </div>
          </div>
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

type TBulkField =
  | 'price'
  | 'compareAtPrice'
  | 'stock'
  | 'lowStockThreshold'
  | 'availability'
  | 'isActive';

/**
 * `change` is how a figure moves — a TPriceChange for prices, a
 * TStockChange for stock, 'set' for the rest; `round` rounds new prices to
 * the rupee.
 */
type TBulkState = {
  field: TBulkField;
  value: string;
  scope: string;
  change: string;
  round: boolean;
};

const BULK_FIELDS: Record<
  TBulkField,
  { menu: string; title: string; description: string; start: string }
> = {
  price: {
    menu: 'Change prices…',
    title: 'Change the price',
    description:
      'Set one price, or move each by a percentage or an amount — say when wood or paint costs more.',
    start: '',
  },
  compareAtPrice: {
    menu: 'Change compare-at prices…',
    title: 'Change the compare-at price',
    description:
      'The strike-through price — it must be above each price. Set it empty to remove it.',
    start: '',
  },
  stock: {
    menu: 'Change stock…',
    title: 'Change the stock',
    description:
      'Add a delivery to what each one has, or set the count after a stock-take.',
    start: '',
  },
  lowStockThreshold: {
    menu: 'Set low-stock level…',
    title: 'Set the low-stock level',
    description:
      'Flagged — and shown to shoppers as “Only 3 left” — from this many down. Leave it empty to use the store’s level.',
    start: '',
  },
  availability: {
    menu: 'Set availability…',
    title: 'Set availability',
    description:
      'In stock or Made to order emails anyone waiting on these variants when you save.',
    start: 'IN_STOCK',
  },
  isActive: {
    menu: 'Show or hide…',
    title: 'Show or hide',
    description:
      'A hidden variant can’t be picked on the storefront, and hides the combos that sell it.',
    start: 'on',
  },
};

const PRICE_CHANGES: { value: TPriceChange; label: string }[] = [
  { value: 'set', label: 'Set to' },
  { value: 'raise_percent', label: 'Raise by %' },
  { value: 'lower_percent', label: 'Lower by %' },
  { value: 'raise_amount', label: 'Raise by ₹' },
  { value: 'lower_amount', label: 'Lower by ₹' },
];

const STOCK_CHANGES: { value: TStockChange; label: string }[] = [
  { value: 'add', label: 'Add to stock' },
  { value: 'set', label: 'Set to' },
];

const isPriceField = (field: TBulkField) =>
  field === 'price' || field === 'compareAtPrice';

const ALL_VARIANTS = 'all';

/** What a row's price (or compare-at price) becomes, or null to remove it. */
const bulkPrice = (
  current: number | null,
  { change, value, round }: TBulkState,
): number | null => {
  if (value === '') return null;
  if (current === null && change !== 'set') return null;
  return changePrice(
    current ?? 0,
    change as TPriceChange,
    Number(value),
    round,
  );
};

/**
 * Why the bulk value can't be applied to these rows yet, or null — a price
 * change that would take one to ₹0 or below is refused here, not on save.
 */
const bulkProblem = (
  bulk: TBulkState,
  rows: TVariantFormValue[],
): string | null => {
  const { field, value, change } = bulk;
  const number = Number(value);
  switch (field) {
    case 'price':
    case 'compareAtPrice': {
      if (field === 'compareAtPrice' && value === '' && change === 'set') {
        return null;
      }
      if (value === '' || !(number > 0)) return 'Enter an amount above 0';
      if (change === 'lower_percent' && number >= 100) {
        return 'Lower by less than 100%';
      }
      const below = rows.filter((row) => {
        const current = field === 'price' ? row.price : row.compareAtPrice;
        const next = bulkPrice(Number.isNaN(current) ? null : current, bulk);
        return next !== null && next <= 0;
      }).length;
      return below > 0
        ? `That takes ${below} ${below === 1 ? 'price' : 'prices'} to ₹0 or below`
        : null;
    }
    case 'stock':
      return value !== '' &&
        Number.isInteger(number) &&
        (change === 'add' ? number > 0 : number >= 0)
        ? null
        : change === 'add'
          ? 'Enter how many arrived — a whole number above 0'
          : 'Enter a whole number, 0 or more';
    case 'lowStockThreshold':
      return value === '' ||
        (Number.isInteger(number) &&
          number >= 0 &&
          number <= PRODUCT_LIMITS.LOW_STOCK_THRESHOLD_MAX)
        ? null
        : 'Enter a whole number from 0 to 1,000, or leave it empty';
    default:
      return value ? null : 'Pick one';
  }
};

const applyBulkChange = (
  row: TVariantFormValue,
  bulk: TBulkState,
): TVariantFormValue => {
  const { field, value, change } = bulk;
  switch (field) {
    case 'price':
      return {
        ...row,
        price:
          bulkPrice(Number.isNaN(row.price) ? null : row.price, bulk) ??
          row.price,
      };
    case 'compareAtPrice':
      return { ...row, compareAtPrice: bulkPrice(row.compareAtPrice, bulk) };
    case 'stock':
      return {
        ...row,
        stock: changeStock(row.stock, change as TStockChange, Number(value)),
      };
    case 'lowStockThreshold':
      return {
        ...row,
        lowStockThreshold: value === '' ? null : Number(value),
      };
    case 'availability':
      return { ...row, availability: value as ProductAvailability };
    case 'isActive':
      return { ...row, isActive: value === 'on' };
  }
};

/**
 * Options the product comes in — "Design: Peacock, Lotus" — and a variant
 * for each combination, with its own price, stock, availability, photos and
 * (when it differs) size. Every edit to the options regenerates the
 * combinations while keeping the variants that stay (and their ids). Shown
 * in the product form's Variants card; the form sends both lists whole
 * whenever either changed.
 */
type TVariantsFieldProps = {
  disabled?: boolean;
  /**
   * The saved variants combos sell — on the edit form. Removing one is
   * refused on save, so the field warns first.
   */
  comboUsage?: TComboUsage;
};

const VariantsField = ({ disabled, comboUsage }: TVariantsFieldProps) => {
  const { control, getValues, setValue } = useFormContext<TProductFormData>();
  const options = useWatch({ control, name: VARIANT_OPTIONS });
  const rows = useWatch({ control, name: VARIANTS });
  const productName = useWatch({ control, name: NAME });
  const productSku = useWatch({ control, name: SKU });
  const { errors, isSubmitted } = useFormState({
    control,
    name: [VARIANT_OPTIONS, VARIANTS],
  });
  const [photosIndex, setPhotosIndex] = useState<number | null>(null);
  const [detailsIndex, setDetailsIndex] = useState<number | null>(null);
  const [bulk, setBulk] = useState<TBulkState | null>(null);
  const [skus, setSkus] = useState<{
    prefix: string;
    keepExisting: boolean;
  } | null>(null);

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

  // "Every Large one" — the values of options that tell variants apart
  const scopeChoices = options.flatMap((option, optionIndex) =>
    option.values.length < 2
      ? []
      : option.values.map((value, valueIndex) => ({
          key: `${optionIndex}:${valueIndex}`,
          label: `${option.name.trim() || `Option ${optionIndex + 1}`}: ${value}`,
          scope: { optionIndex, value } satisfies TVariantScope,
          count: rows.filter((row) => row.values[optionIndex] === value).length,
        })),
  );
  const scopeOf = (key: string): TVariantScope =>
    scopeChoices.find((choice) => choice.key === key)?.scope ?? null;

  const openBulk = (field: TBulkField) =>
    setBulk({
      field,
      value: BULK_FIELDS[field].start,
      scope: ALL_VARIANTS,
      change: field === 'stock' ? 'add' : 'set',
      round: true,
    });

  const bulkRows = bulk
    ? rows.filter((row) => inScope(row, scopeOf(bulk.scope)))
    : [];
  const bulkCount = bulkRows.length;
  const bulkError = bulk ? bulkProblem(bulk, bulkRows) : null;
  // "Peacock / Small: ₹499 → ₹549" — what the change does to one of them
  const bulkPreview = (() => {
    if (!bulk || bulkError || !isPriceField(bulk.field) || !bulkRows[0]) {
      return null;
    }
    const sample = bulkRows[0];
    const current =
      bulk.field === 'price' ? sample.price : sample.compareAtPrice;
    if (current === null || Number.isNaN(current)) return null;
    const next = bulkPrice(current, bulk);
    return `${variantRowTitle(sample)}: ${formatPrice(current)} → ${
      next === null ? 'none' : formatPrice(next)
    }`;
  })();

  const applyBulk = () => {
    if (!bulk || bulkError) return;
    const scope = scopeOf(bulk.scope);
    updateRows((row) =>
      inScope(row, scope) ? applyBulkChange(row, bulk) : row,
    );
    setBulk(null);
  };

  const openSkus = () =>
    setSkus({
      prefix: skuPrefixFrom(productSku.trim() || productName),
      keepExisting: true,
    });
  const generated = skus
    ? generateSkus(rows, skus.prefix, {
        keepExisting: skus.keepExisting,
        productSku,
      })
    : [];
  const changedSkus = generated.filter(
    (row, index) => row.sku !== rows[index].sku,
  ).length;

  // The other variants each row's size can be copied to
  const copyTargetsFor = (index: number): TCopyTarget[] =>
    options.flatMap((_, optionIndex) => {
      const value = rows[index].values[optionIndex];
      const count = siblingIndexes(rows, index, optionIndex).length;
      return value && count > 0 ? [{ optionIndex, value, count }] : [];
    });

  // Saved variants a combo sells that are no longer in the table
  const removedInCombos = comboUsage
    ? [...comboUsage.entries()].filter(
        ([id]) => !rows.some((row) => row.id === id),
      )
    : [];
  const comboWarning = removedInCombos.length > 0 && (
    <Callout variant="warning">
      {removedInCombos.map(([id, usage]) => (
        <span key={id} className="block">
          <span className="font-medium">{usage.title}</span> is sold in{' '}
          {usage.combos.map((combo, i) => (
            <Fragment key={combo.slug}>
              {i > 0 && ', '}
              <Link
                to={ROUTES.PRIVATE.COMBOS.DETAIL(combo.slug)}
                target="_blank"
                className="underline underline-offset-2"
              >
                {combo.name}
              </Link>
            </Fragment>
          ))}
          .
        </span>
      ))}
      <span className="mt-1 block">
        Saving will be refused while a combo sells a variant you removed — take
        it out of the combo first, or switch the variant off instead to hide it.
      </span>
    </Callout>
  );

  const summary = summarizeVariantRows(rows);
  const missing = missingCombinations({ options, rows });
  const room = PRODUCT_LIMITS.VARIANTS_MAX - rows.length;
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
            Sold in several designs, sizes or colours? Add an option like Design
            or Size — each combination becomes a variant with its own price,
            stock, photos and size, and shoppers pick one on the product page.
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
        {comboWarning && <div className="text-left">{comboWarning}</div>}
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
          // Swatches are a record, so its errors type reads `message` as a
          // value's key — the refine puts a plain error on the record itself
          const swatchesError = optionError?.swatches as
            | { message?: string }
            | undefined;
          const optionMessage =
            optionError?.name?.message ??
            optionError?.values?.message ??
            swatchesError?.message;
          const label = option.name.trim() || `option ${index + 1}`;
          return (
            <div
              key={index}
              className="flex flex-col gap-3 rounded-lg border border-stone-200 p-3 dark:border-stone-800"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Input
                  list="variant-option-names"
                  value={option.name}
                  onChange={(event) =>
                    update(renameOption(current(), index, event.target.value))
                  }
                  placeholder={index === 0 ? 'Design' : 'Size'}
                  maxLength={PRODUCT_LIMITS.VARIANT_OPTION_NAME_MAX}
                  aria-label={`Option ${index + 1} name`}
                  aria-invalid={Boolean(optionError?.name)}
                  disabled={disabled}
                  className="max-w-56"
                />
                <span className="text-xs whitespace-nowrap text-stone-400 tabular-nums dark:text-stone-500">
                  {option.values.length}{' '}
                  {option.values.length === 1 ? 'value' : 'values'}
                </span>
                <div className="ml-auto flex items-center gap-1">
                  <SimpleTooltip label="Shoppers pick colours from swatches">
                    <label className="mr-1 flex cursor-pointer items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400">
                      <Switch
                        checked={option.swatches !== null}
                        onCheckedChange={(on) =>
                          update(setSwatchesOn(current(), index, on))
                        }
                        disabled={disabled}
                        aria-label={`Show ${label} as colour swatches`}
                      />
                      <Palette className="size-3.5" />
                      <span className="hidden sm:inline">Swatches</span>
                    </label>
                  </SimpleTooltip>
                  {options.length > 1 && (
                    <>
                      <SimpleTooltip label="Move up">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            update(moveOption(current(), index, index - 1))
                          }
                          disabled={disabled || index === 0}
                          aria-label={`Move ${label} up`}
                          className="text-stone-400"
                        >
                          <ArrowUp />
                        </Button>
                      </SimpleTooltip>
                      <SimpleTooltip label="Move down">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() =>
                            update(moveOption(current(), index, index + 1))
                          }
                          disabled={disabled || index === options.length - 1}
                          aria-label={`Move ${label} down`}
                          className="text-stone-400"
                        >
                          <ArrowDown />
                        </Button>
                      </SimpleTooltip>
                    </>
                  )}
                  <SimpleTooltip label="Remove option">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => update(removeOption(current(), index))}
                      disabled={disabled}
                      aria-label={`Remove ${label}`}
                      className="text-stone-400 hover:text-red-600"
                    >
                      <Trash2 />
                    </Button>
                  </SimpleTooltip>
                </div>
              </div>
              <OptionValuesInput
                optionName={option.name}
                values={option.values}
                swatches={option.swatches}
                onAdd={(value) =>
                  update(addOptionValue(current(), index, value))
                }
                onRename={(from, to) =>
                  update(renameOptionValue(current(), index, from, to))
                }
                onRemove={(value) =>
                  update(removeOptionValue(current(), index, value))
                }
                onMove={(from, to) =>
                  update(moveOptionValue(current(), index, from, to))
                }
                onSwatch={(value, hex) =>
                  update(setSwatch(current(), index, value, hex))
                }
                disabled={disabled}
              />
              {optionMessage && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {optionMessage}
                </p>
              )}
            </div>
          );
        })}

        <div className="flex flex-wrap items-center justify-between gap-2">
          {options.length < PRODUCT_LIMITS.VARIANT_OPTIONS_MAX ? (
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
          ) : (
            <span />
          )}
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Shoppers see options and values in this order — drag a value by its
            handle to move it.
          </p>
        </div>
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
            <div className="flex items-center gap-1">
              {missing.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      disabled={disabled}
                    >
                      <ListPlus />
                      {missing.length} not offered
                      <ChevronDown />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-64">
                    <DropdownMenuLabel className="text-xs font-normal text-stone-500 dark:text-stone-400">
                      Combinations without a variant — add one back to sell it
                    </DropdownMenuLabel>
                    {missing.slice(0, 12).map((values) => (
                      <DropdownMenuItem
                        key={values.join('\u0000')}
                        disabled={room <= 0}
                        onSelect={() =>
                          update(addCombinations(current(), [values]))
                        }
                      >
                        <Plus />
                        {values.join(' / ')}
                      </DropdownMenuItem>
                    ))}
                    {missing.length > 1 && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={room <= 0}
                          onSelect={() =>
                            update(
                              addCombinations(
                                current(),
                                missingCombinations(current()).slice(0, room),
                              ),
                            )
                          }
                        >
                          <ListPlus />
                          Add {Math.min(missing.length, room)}{' '}
                          {Math.min(missing.length, room) === 1
                            ? 'variant'
                            : 'variants'}
                        </DropdownMenuItem>
                      </>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
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
                  {(
                    [
                      'price',
                      'compareAtPrice',
                      'stock',
                      'lowStockThreshold',
                    ] as const
                  ).map((field) => (
                    <DropdownMenuItem
                      key={field}
                      onSelect={() => openBulk(field)}
                    >
                      {BULK_FIELDS[field].menu}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onSelect={() => openBulk('availability')}>
                    <Boxes />
                    {BULK_FIELDS.availability.menu}
                  </DropdownMenuItem>
                  <DropdownMenuItem onSelect={() => openBulk('isActive')}>
                    <Eye />
                    {BULK_FIELDS.isActive.menu}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={openSkus}>
                    <WandSparkles />
                    Generate SKUs…
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                  combos={row.id ? comboUsage?.get(row.id)?.combos : undefined}
                  copyTargets={copyTargetsFor(index)}
                  disabled={disabled}
                  onPhotos={() => setPhotosIndex(index)}
                  onDetails={() => setDetailsIndex(index)}
                  onCopySize={(optionIndex) => {
                    const target = copyTargetsFor(index).find(
                      (candidate) => candidate.optionIndex === optionIndex,
                    );
                    update(copySizeToSiblings(current(), index, optionIndex));
                    if (target) {
                      toast.success(
                        `Size copied to ${target.count} more ${target.value} ${target.count === 1 ? 'variant' : 'variants'}`,
                      );
                    }
                  }}
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
            Shoppers see the lowest price (“From …”) until they pick a variant,
            then its own photos, price and size. A hidden variant can't be
            picked; removing one deletes it on save. Saving a variant as In
            stock or Made to order emails anyone waiting on it.
          </p>
        </div>
      )}

      {comboWarning}

      {rowsError && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {rowsError}
        </p>
      )}

      <Dialog
        open={photosRow !== undefined}
        onOpenChange={(open) => !open && setPhotosIndex(null)}
      >
        <DialogContent className="sm:max-w-2xl md:max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              Photos — {photosRow ? variantRowTitle(photosRow) : ''}
            </DialogTitle>
            <DialogDescription>
              Shown instead of the product's own photos while shoppers have this
              variant picked — leave it empty to show the product's. Up to{' '}
              {PRODUCT_LIMITS.VARIANT_IMAGES_MAX}.
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
          {photosIndex !== null &&
            photosRow &&
            photosRow.images.length > 0 &&
            options.length > 1 && (
              <div className="flex flex-wrap gap-2">
                {options.map((_, optionIndex) => {
                  const count = siblingIndexes(
                    rows,
                    photosIndex,
                    optionIndex,
                  ).length;
                  const value = photosRow.values[optionIndex];
                  if (count === 0 || !value) return null;
                  return (
                    <Button
                      key={optionIndex}
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={disabled}
                      onClick={() => {
                        update(
                          copyPhotosToSiblings(
                            current(),
                            photosIndex,
                            optionIndex,
                          ),
                        );
                        toast.success(
                          `Photos copied to ${count} more ${value} ${count === 1 ? 'variant' : 'variants'}`,
                        );
                      }}
                    >
                      <Images />
                      Use for every {value} variant ({count} more)
                    </Button>
                  );
                })}
              </div>
            )}
          <DialogFooter>
            <Button type="button" onClick={() => setPhotosIndex(null)}>
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Mounted while open — it reads the store's settings for its hints */}
      {detailsIndex !== null && (
        <VariantDetailsDialog
          index={detailsIndex}
          copyTargets={copyTargetsFor(detailsIndex)}
          onCopy={(optionIndex) =>
            update(copyDetailsToSiblings(current(), detailsIndex, optionIndex))
          }
          onClose={() => setDetailsIndex(null)}
          disabled={disabled}
        />
      )}

      <Dialog
        open={bulk !== null}
        onOpenChange={(open) => !open && setBulk(null)}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {bulk ? BULK_FIELDS[bulk.field].title : ''}
            </DialogTitle>
            <DialogDescription>
              {bulk ? BULK_FIELDS[bulk.field].description : ''} You can still
              change any of them afterwards.
            </DialogDescription>
          </DialogHeader>
          {bulk && (
            <form
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                // Not the product form — this dialog only edits its rows
                event.preventDefault();
                event.stopPropagation();
                applyBulk();
              }}
            >
              <label className={fieldLabelClass}>
                For
                <Select
                  value={bulk.scope}
                  onValueChange={(scope) => setBulk({ ...bulk, scope })}
                >
                  <SelectTrigger aria-label="Which variants">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL_VARIANTS}>
                      All {rows.length}{' '}
                      {rows.length === 1 ? 'variant' : 'variants'}
                    </SelectItem>
                    {scopeChoices.map((choice) => (
                      <SelectItem key={choice.key} value={choice.key}>
                        Every {choice.label} ({choice.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>

              {(isPriceField(bulk.field) || bulk.field === 'stock') && (
                <label className={fieldLabelClass}>
                  Change
                  <Select
                    value={bulk.change}
                    onValueChange={(change) => setBulk({ ...bulk, change })}
                  >
                    <SelectTrigger aria-label="How to change it">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(bulk.field === 'stock'
                        ? STOCK_CHANGES
                        : PRICE_CHANGES
                      ).map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              )}

              <label className={fieldLabelClass}>
                {bulk.field === 'availability'
                  ? 'Availability'
                  : bulk.field === 'isActive'
                    ? 'On the storefront'
                    : bulk.field === 'stock'
                      ? bulk.change === 'add'
                        ? 'Units that arrived'
                        : 'Stock'
                      : bulk.field === 'lowStockThreshold'
                        ? 'Low stock at'
                        : bulk.change.endsWith('_percent')
                          ? 'Percentage'
                          : bulk.field === 'price'
                            ? 'Price'
                            : 'Compare-at price'}
                {bulk.field === 'availability' ? (
                  <Select
                    value={bulk.value}
                    onValueChange={(value) => setBulk({ ...bulk, value })}
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
                ) : bulk.field === 'isActive' ? (
                  <Select
                    value={bulk.value}
                    onValueChange={(value) => setBulk({ ...bulk, value })}
                  >
                    <SelectTrigger aria-label="On the storefront">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="on">On sale</SelectItem>
                      <SelectItem value="off">Hidden</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    autoFocus
                    type="number"
                    inputMode={isPriceField(bulk.field) ? 'decimal' : 'numeric'}
                    min={0}
                    step={isPriceField(bulk.field) ? '0.01' : 1}
                    placeholder={
                      bulk.field === 'compareAtPrice' && bulk.change === 'set'
                        ? 'Empty removes it'
                        : bulk.field === 'lowStockThreshold'
                          ? 'Empty — the store’s level'
                          : ''
                    }
                    startAdornment={
                      isPriceField(bulk.field) &&
                      !bulk.change.endsWith('_percent') ? (
                        <RupeePrefix />
                      ) : undefined
                    }
                    endAdornment={
                      bulk.change.endsWith('_percent') ? (
                        <span className="text-sm text-stone-400">%</span>
                      ) : undefined
                    }
                    value={bulk.value}
                    onChange={(event) =>
                      setBulk({ ...bulk, value: event.target.value })
                    }
                  />
                )}
              </label>

              {isPriceField(bulk.field) && bulk.change !== 'set' && (
                <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                  <Checkbox
                    checked={bulk.round}
                    onCheckedChange={(checked) =>
                      setBulk({ ...bulk, round: checked === true })
                    }
                  />
                  Round to the rupee
                </label>
              )}

              {(bulkPreview || (bulk.value !== '' && bulkError)) && (
                <p
                  className={cn(
                    'text-xs',
                    bulkError
                      ? 'font-medium text-red-600 dark:text-red-400'
                      : 'text-stone-500 tabular-nums dark:text-stone-400',
                  )}
                >
                  {bulkError ?? `For example ${bulkPreview}`}
                </p>
              )}

              <DialogFooter>
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setBulk(null)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={bulkError !== null}>
                  Apply to {bulkCount}{' '}
                  {bulkCount === 1 ? 'variant' : 'variants'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={skus !== null}
        onOpenChange={(open) => !open && setSkus(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Generate SKUs</DialogTitle>
            <DialogDescription>
              Each variant gets the prefix and its values. You can still edit
              any of them — saving checks them against every other product.
            </DialogDescription>
          </DialogHeader>
          {skus && (
            <div className="flex flex-col gap-4">
              <label className={fieldLabelClass}>
                Prefix
                <Input
                  autoFocus
                  value={skus.prefix}
                  maxLength={24}
                  startAdornment={<Tag className="size-3.5 text-stone-400" />}
                  onChange={(event) =>
                    setSkus({ ...skus, prefix: event.target.value })
                  }
                  className="font-mono uppercase"
                />
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-sm text-stone-700 dark:text-stone-300">
                <Checkbox
                  checked={skus.keepExisting}
                  onCheckedChange={(checked) =>
                    setSkus({ ...skus, keepExisting: checked === true })
                  }
                />
                Keep SKUs already set
              </label>
              <ul className="flex flex-col divide-y divide-stone-100 rounded-lg border border-stone-200 text-sm dark:divide-stone-800 dark:border-stone-800">
                {generated.slice(0, 5).map((row, index) => (
                  <li
                    key={variantRowKey(row)}
                    className="flex items-center justify-between gap-3 px-3 py-1.5"
                  >
                    <span className="truncate text-stone-600 dark:text-stone-400">
                      {variantRowTitle(row)}
                    </span>
                    <span
                      className={cn(
                        'shrink-0 font-mono text-xs',
                        row.sku === rows[index].sku
                          ? 'text-stone-400'
                          : 'font-medium text-stone-900 dark:text-stone-50',
                      )}
                    >
                      {row.sku || '—'}
                    </span>
                  </li>
                ))}
                {generated.length > 5 && (
                  <li className="px-3 py-1.5 text-xs text-stone-400">
                    and {generated.length - 5} more
                  </li>
                )}
              </ul>
            </div>
          )}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setSkus(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              disabled={changedSkus === 0}
              onClick={() => {
                update({ ...current(), rows: generated });
                setSkus(null);
              }}
            >
              {changedSkus === 0
                ? 'Nothing to change'
                : `Set ${changedSkus} ${changedSkus === 1 ? 'SKU' : 'SKUs'}`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default VariantsField;
