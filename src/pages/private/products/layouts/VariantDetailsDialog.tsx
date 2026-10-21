import { CalendarClock, Copy, PackageCheck, Truck } from 'lucide-react';
import {
  Controller,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';
import { toast } from 'sonner';

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
import { Textarea } from '@/components/ui/textarea';
import { formatDelivery } from '@/helpers/format';
import { useSettings } from '@/hooks/settings';
import { cn } from '@/lib/utils';
import type { DeliveryCharge } from '@/types/api';

import {
  DEFAULT_LOW_STOCK_THRESHOLD,
  DELIVERY_CHARGE_OPTIONS,
  PRODUCT_FORM_FIELD_NAMES,
  PRODUCT_LIMITS,
} from '../constants';
import { describeLeadTime } from '../helpers';
import type { TProductFormData } from '../types';
import { ownDetails, variantRowTitle } from '../variants';
import ColorsField from './ColorsField';
import HighlightsField from './HighlightsField';
import SpecificationsField from './SpecificationsField';

const {
  VARIANTS,
  MATERIAL,
  CARE_INSTRUCTIONS,
  VIDEO_URL,
  DELIVERY_CHARGE,
  DELIVERY_FEE,
  LEAD_TIME_DAYS,
  LEAD_TIME_MAX_DAYS,
} = PRODUCT_FORM_FIELD_NAMES;

/** Radix Select cannot use an empty string as a value. */
const PRODUCTS = 'PRODUCTS';

const fieldLabelClass =
  'flex flex-col gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400';

const toNullableNumber = (event: React.ChangeEvent<HTMLInputElement>) =>
  event.target.value === '' ? null : event.target.valueAsNumber;

const RupeePrefix = () => (
  <span className="text-sm text-stone-400 dark:text-stone-500">₹</span>
);

const Section = ({
  title,
  description,
  children,
}: {
  title: string;
  description?: React.ReactNode;
  children: React.ReactNode;
}) => (
  <section className="flex flex-col gap-3 border-t border-dashed border-stone-200 pt-4 first:border-0 first:pt-0 dark:border-stone-800">
    <div>
      <h3 className="text-sm font-medium text-stone-800 dark:text-stone-200">
        {title}
      </h3>
      {description && (
        <p className="mt-0.5 text-xs text-stone-400 dark:text-stone-500">
          {description}
        </p>
      )}
    </div>
    {children}
  </section>
);

/** The other variants this one's details can be copied to — "every Brass one". */
export type TDetailsCopyTarget = {
  optionIndex: number;
  value: string;
  count: number;
};

type TVariantDetailsDialogProps = {
  /** The row being edited; null closes the dialog. */
  index: number | null;
  copyTargets: TDetailsCopyTarget[];
  onCopy: (optionIndex: number) => void;
  onClose: () => void;
  disabled?: boolean;
};

/**
 * Everything a variant can have of its own besides its price, stock, photos
 * and size — highlights, material, colours, care, specifications, video,
 * delivery, how long it takes to make, and when its stock counts as low.
 * Each left empty shows the product's, which stands in as the placeholder.
 * Edits go straight into the product form, saved with it.
 */
const VariantDetailsDialog = ({
  index,
  copyTargets,
  onCopy,
  onClose,
  disabled,
}: TVariantDetailsDialogProps) => {
  const { control, setValue, clearErrors } = useFormContext<TProductFormData>();
  const rows = useWatch({ control, name: VARIANTS });
  const productMaterial = useWatch({ control, name: MATERIAL });
  const productCare = useWatch({ control, name: CARE_INSTRUCTIONS });
  const productVideo = useWatch({ control, name: VIDEO_URL });
  const productCharge = useWatch({ control, name: DELIVERY_CHARGE });
  const productFee = useWatch({ control, name: DELIVERY_FEE });
  const productLeadMin = useWatch({ control, name: LEAD_TIME_DAYS });
  const productLeadMax = useWatch({ control, name: LEAD_TIME_MAX_DAYS });
  const { errors } = useFormState({ control, name: VARIANTS });
  const settings = useSettings();

  const row = index === null ? undefined : rows[index];
  const rowErrors = index === null ? undefined : errors.variants?.[index];
  const path = `${VARIANTS}.${index ?? 0}` as const;
  const storeThreshold =
    settings.data?.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD;
  const productDelivery = productCharge
    ? {
        charge: productCharge,
        fee: productCharge === 'EXTRA' ? productFee : null,
      }
    : settings.data?.deliveryCharge
      ? { charge: settings.data.deliveryCharge, fee: settings.data.deliveryFee }
      : null;
  const productLeadTime = describeLeadTime(productLeadMin, productLeadMax);
  const own = row ? ownDetails(row) : [];

  const changeCharge = (value: string) => {
    const next = value === PRODUCTS ? null : (value as DeliveryCharge);
    setValue(`${path}.deliveryCharge`, next, { shouldDirty: true });
    // A fee only goes with EXTRA — cleared, so a stale one can't block a save
    if (next !== 'EXTRA') {
      setValue(`${path}.deliveryFee`, null, { shouldDirty: true });
      clearErrors(`${path}.deliveryFee`);
    }
  };

  const highlightErrors = Array.isArray(rowErrors?.highlights)
    ? rowErrors.highlights.map((error) => error?.message)
    : undefined;

  return (
    <Dialog
      open={row !== undefined}
      onOpenChange={(open) => !open && onClose()}
    >
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-2xl md:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Details — {row ? variantRowTitle(row) : ''}</DialogTitle>
          <DialogDescription>
            Only what's different about this variant. Anything left empty shows
            the product's — shown greyed out as the placeholder.
            {own.length > 0 && (
              <span className="mt-1 block text-stone-600 dark:text-stone-300">
                Its own: {own.join(', ')}.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        {row && index !== null && (
          <div className="flex flex-col gap-5">
            <Section
              title="Stock & making time"
              description="When made to order, shoppers see how long it takes. The low-stock level decides when it's flagged here and shown as “Only 3 left”."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Controller
                  control={control}
                  name={`${path}.leadTimeDays`}
                  render={({ field }) => (
                    <label className={fieldLabelClass}>
                      <span className="flex items-center gap-1">
                        <CalendarClock className="size-3.5" /> Ready in (days)
                      </span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={PRODUCT_LIMITS.LEAD_TIME_DAYS_MAX}
                        step={1}
                        placeholder={
                          productLeadMin === null
                            ? 'Not said'
                            : String(productLeadMin)
                        }
                        aria-invalid={Boolean(rowErrors?.leadTimeDays)}
                        disabled={disabled}
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
                  name={`${path}.leadTimeMaxDays`}
                  render={({ field }) => (
                    <label className={fieldLabelClass}>
                      Up to (days)
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={PRODUCT_LIMITS.LEAD_TIME_DAYS_MAX}
                        step={1}
                        placeholder={
                          productLeadMax === null
                            ? 'Optional'
                            : String(productLeadMax)
                        }
                        aria-invalid={Boolean(rowErrors?.leadTimeMaxDays)}
                        disabled={disabled}
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
                  name={`${path}.lowStockThreshold`}
                  render={({ field }) => (
                    <label className={fieldLabelClass}>
                      <span className="flex items-center gap-1">
                        <PackageCheck className="size-3.5" /> Low stock at
                      </span>
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={0}
                        max={PRODUCT_LIMITS.LOW_STOCK_THRESHOLD_MAX}
                        step={1}
                        placeholder={`Store's (${storeThreshold})`}
                        aria-invalid={Boolean(rowErrors?.lowStockThreshold)}
                        disabled={disabled}
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
              </div>
              <p className="text-xs text-stone-500 dark:text-stone-400">
                {describeLeadTime(row.leadTimeDays, row.leadTimeMaxDays) ??
                  (productLeadTime
                    ? `As the product: ${productLeadTime}`
                    : 'No making time shown.')}
                {row.availability !== 'MADE_TO_ORDER' &&
                  ' — shown only while it’s Made to order.'}
              </p>
              {(rowErrors?.leadTimeDays ||
                rowErrors?.leadTimeMaxDays ||
                rowErrors?.lowStockThreshold) && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {rowErrors.leadTimeDays?.message ??
                    rowErrors.leadTimeMaxDays?.message ??
                    rowErrors.lowStockThreshold?.message}
                </p>
              )}
            </Section>

            <Section
              title="Delivery"
              description="For a size or piece that costs more (or less) to send."
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <label className={fieldLabelClass}>
                  <span className="flex items-center gap-1">
                    <Truck className="size-3.5" /> Delivery charges
                  </span>
                  <Select
                    value={row.deliveryCharge ?? PRODUCTS}
                    onValueChange={changeCharge}
                    disabled={disabled}
                  >
                    <SelectTrigger aria-label="Delivery charges">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={PRODUCTS}>
                        Same as the product
                        {productDelivery && (
                          <span className="text-stone-400 dark:text-stone-500">
                            {formatDelivery(productDelivery)}
                          </span>
                        )}
                      </SelectItem>
                      {DELIVERY_CHARGE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
                {row.deliveryCharge === 'EXTRA' && (
                  <Controller
                    control={control}
                    name={`${path}.deliveryFee`}
                    render={({ field }) => (
                      <label className={fieldLabelClass}>
                        Delivery fee
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={PRODUCT_LIMITS.DELIVERY_FEE_MAX}
                          step="0.01"
                          placeholder="Depends on the address"
                          aria-invalid={Boolean(rowErrors?.deliveryFee)}
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
                )}
              </div>
              {rowErrors?.deliveryFee && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {rowErrors.deliveryFee.message}
                </p>
              )}
            </Section>

            <Section
              title="Highlights"
              description="Shown instead of the product's highlights while it's picked."
            >
              <Controller
                control={control}
                name={`${path}.highlights`}
                render={({ field }) => (
                  <HighlightsField
                    value={field.value}
                    onChange={field.onChange}
                    itemErrors={highlightErrors}
                    disabled={disabled}
                  />
                )}
              />
            </Section>

            <Section title="Craft details">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Controller
                  control={control}
                  name={`${path}.material`}
                  render={({ field }) => (
                    <label className={fieldLabelClass}>
                      Material
                      <Input
                        placeholder={productMaterial.trim() || 'Not said'}
                        maxLength={PRODUCT_LIMITS.MATERIAL_MAX}
                        aria-invalid={Boolean(rowErrors?.material)}
                        disabled={disabled}
                        {...field}
                      />
                    </label>
                  )}
                />
                <Controller
                  control={control}
                  name={`${path}.videoUrl`}
                  render={({ field }) => (
                    <label className={fieldLabelClass}>
                      Video link
                      <Input
                        type="url"
                        inputMode="url"
                        placeholder={productVideo.trim() || 'https://…'}
                        aria-invalid={Boolean(rowErrors?.videoUrl)}
                        disabled={disabled}
                        {...field}
                      />
                    </label>
                  )}
                />
              </div>
              <Controller
                control={control}
                name={`${path}.careInstructions`}
                render={({ field }) => (
                  <label className={fieldLabelClass}>
                    Care instructions
                    <Textarea
                      rows={2}
                      maxLength={PRODUCT_LIMITS.CARE_INSTRUCTIONS_MAX}
                      placeholder={productCare.trim() || 'Not said'}
                      aria-invalid={Boolean(rowErrors?.careInstructions)}
                      disabled={disabled}
                      {...field}
                    />
                  </label>
                )}
              />
              {(rowErrors?.material ||
                rowErrors?.videoUrl ||
                rowErrors?.careInstructions) && (
                <p className="text-xs font-medium text-red-600 dark:text-red-400">
                  {rowErrors.material?.message ??
                    rowErrors.videoUrl?.message ??
                    rowErrors.careInstructions?.message}
                </p>
              )}
            </Section>

            <Section
              title="Colours"
              description="The colours this variant is made in, if they differ from the product's."
            >
              <ColorsField name={`${path}.colors`} disabled={disabled} />
            </Section>

            <Section
              title="Specifications"
              description="Shown over the product's: one with the same label replaces the product's value, any other is added."
            >
              <SpecificationsField
                name={`${path}.specifications`}
                disabled={disabled}
              />
            </Section>
          </div>
        )}

        <DialogFooter className="flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div
            className={cn('flex flex-wrap gap-2', own.length === 0 && 'hidden')}
          >
            {copyTargets.map((target) => (
              <Button
                key={target.optionIndex}
                type="button"
                variant="outline"
                size="sm"
                disabled={disabled}
                onClick={() => {
                  onCopy(target.optionIndex);
                  toast.success(
                    `Details copied to ${target.count} more ${target.value} ${target.count === 1 ? 'variant' : 'variants'}`,
                  );
                }}
              >
                <Copy />
                Use for every {target.value} variant ({target.count} more)
              </Button>
            ))}
          </div>
          <Button type="button" onClick={onClose}>
            Done
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default VariantDetailsDialog;
