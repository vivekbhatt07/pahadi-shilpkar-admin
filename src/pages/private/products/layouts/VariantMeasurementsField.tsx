import {
  Controller,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { ProductShape } from '@/types/api';

import {
  PRODUCT_FORM_FIELD_NAMES,
  PRODUCT_LIMITS,
  PRODUCT_SIZES,
  SHAPE_OPTIONS,
  SHAPE_SIZES,
  SIZE_LABELS,
  UNIT_OPTIONS,
} from '../constants';
import {
  EMPTY_MEASUREMENTS,
  UNIT_LABELS,
  describeMeasurements,
  toMeasurementsPayload,
} from '../helpers';
import type { TProductFormData } from '../types';

const { VARIANTS } = PRODUCT_FORM_FIELD_NAMES;

/** Radix Select can't use '' as a value. */
const SAME_AS_PRODUCT = 'product';

const labelClass =
  'flex flex-col gap-1.5 text-xs font-medium text-stone-600 dark:text-stone-400';

/** null while empty or not yet a number. */
const toSize = (event: React.ChangeEvent<HTMLInputElement>) =>
  event.target.value === '' || Number.isNaN(event.target.valueAsNumber)
    ? null
    : event.target.valueAsNumber;

type TVariantMeasurementsFieldProps = {
  index: number;
  /** "Large" — for labels. */
  title: string;
  disabled?: boolean;
};

/**
 * A variant's own size — for a "Large" that measures differently from the
 * product. "Same as the product" (the default) keeps showing the product's
 * measurements; picking a shape opens the sizes it's measured by, the same
 * way the product's are entered. Switching shapes drops sizes the new one
 * doesn't use.
 */
const VariantMeasurementsField = ({
  index,
  title,
  disabled,
}: TVariantMeasurementsFieldProps) => {
  const { control, getValues, setValue } = useFormContext<TProductFormData>();
  const name = `${VARIANTS}.${index}.measurements` as const;
  const measurements = useWatch({ control, name });
  // After a failed save, a new shape settles (or raises) its errors at once
  const { isSubmitted } = useFormState({ control, name });
  const flags = { shouldDirty: true, shouldValidate: isSubmitted };
  const { shape } = measurements;
  const payload = toMeasurementsPayload(measurements);
  const hasSize =
    payload !== null &&
    SHAPE_SIZES[payload.shape].sizes.some((size) => payload[size] != null);
  const preview = payload && hasSize ? describeMeasurements(payload) : null;

  const changeShape = (next: string) => {
    if (next === SAME_AS_PRODUCT) {
      setValue(name, EMPTY_MEASUREMENTS, flags);
      return;
    }
    const nextShape = next as ProductShape;
    const current = getValues(name);
    const updated = { ...current, shape: nextShape };
    PRODUCT_SIZES.forEach((size) => {
      if (!SHAPE_SIZES[nextShape].sizes.includes(size)) updated[size] = null;
    });
    setValue(name, updated, flags);
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_6rem]">
        <label className={labelClass}>
          Size
          <Select
            value={shape ?? SAME_AS_PRODUCT}
            onValueChange={changeShape}
            disabled={disabled}
          >
            <SelectTrigger aria-label={`Size of ${title}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SAME_AS_PRODUCT}>
                Same as the product
              </SelectItem>
              {SHAPE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
        {shape !== null && (
          <Controller
            control={control}
            name={`${name}.unit`}
            render={({ field }) => (
              <label className={labelClass}>
                Unit
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={disabled}
                >
                  <SelectTrigger aria-label={`Unit of ${title}'s size`}>
                    <SelectValue>{UNIT_LABELS[field.value]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                        <span className="text-stone-400 dark:text-stone-500">
                          {option.name}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
            )}
          />
        )}
      </div>

      {shape !== null && (
        <div className="flex animate-in flex-col gap-3 duration-150 fade-in-0">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {SHAPE_SIZES[shape].sizes.map((size) => (
              <Controller
                key={`${shape}-${size}`}
                control={control}
                name={`${name}.${size}`}
                render={({ field, fieldState }) => (
                  <label className={labelClass}>
                    {SIZE_LABELS[size]}
                    {SHAPE_SIZES[shape].required.includes(size) && ' *'}
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      max={PRODUCT_LIMITS.MEASUREMENT_MAX}
                      step="0.01"
                      placeholder="0"
                      disabled={disabled}
                      aria-invalid={Boolean(fieldState.error)}
                      endAdornment={
                        <span className="text-xs text-stone-400 dark:text-stone-500">
                          {UNIT_LABELS[measurements.unit]}
                        </span>
                      }
                      name={field.name}
                      ref={field.ref}
                      onBlur={field.onBlur}
                      value={field.value ?? ''}
                      onChange={(event) => field.onChange(toSize(event))}
                    />
                  </label>
                )}
              />
            ))}
          </div>
          <Controller
            control={control}
            name={`${name}.note`}
            render={({ field }) => (
              <label className={labelClass}>
                Note
                <Input
                  placeholder="Optional — sizes vary slightly by hand"
                  maxLength={PRODUCT_LIMITS.MEASUREMENT_NOTE_MAX}
                  disabled={disabled}
                  {...field}
                />
              </label>
            )}
          />
          <p className="text-xs text-stone-500 dark:text-stone-400">
            {preview ? (
              <>
                Shoppers see{' '}
                <span className="font-medium text-stone-700 dark:text-stone-200">
                  {preview.split('\n')[0]}
                </span>{' '}
                while {title} is picked.
              </>
            ) : (
              'Enter a size to preview it.'
            )}
          </p>
        </div>
      )}
    </div>
  );
};

export default VariantMeasurementsField;
