import { useRef } from 'react';
import { RadioGroup } from 'radix-ui';
import { Eraser } from 'lucide-react';
import { useFormContext, useFormState, useWatch } from 'react-hook-form';

import Callout from '@/components/custom/Callout';
import { Button } from '@/components/ui/button';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type {
  ProductMeasurements,
  ProductShape,
  ProductSize,
} from '@/types/api';

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
  toMeasurementsFormValue,
  toMeasurementsPayload,
} from '../helpers';
import type { TProductFormData } from '../types';

const { MEASUREMENTS, LEGACY_DIMENSIONS } = PRODUCT_FORM_FIELD_NAMES;

const ShapeIcon = ({ shape }: { shape: ProductShape }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    strokeLinejoin="round"
    aria-hidden
    className="size-5 shrink-0"
  >
    {shape === 'RECTANGULAR' && (
      <rect x="4" y="6.5" width="16" height="11" rx="1.5" />
    )}
    {shape === 'ROUND' && <circle cx="12" cy="12" r="7.5" />}
    {shape === 'OVAL' && <ellipse cx="12" cy="12" rx="8.5" ry="5.5" />}
    {shape === 'IRREGULAR' && (
      <path d="M8.2 4.8c2-.9 3.6.7 5.3.3 1.9-.4 4.3-.5 5.1 1.5.8 1.9-.8 3.4-.5 5.3.3 2.1 1.8 3.8.5 5.7-1.3 1.9-3.9 1.2-5.8 1.8-2 .6-4.1 1.7-5.7.2-1.5-1.4-.5-3.7-.9-5.6-.5-1.9-2.4-3.5-1.5-5.5.7-1.5 2-2.9 3.5-3.7Z" />
    )}
  </svg>
);

/** null while empty or not yet a number. */
const toSize = (event: React.ChangeEvent<HTMLInputElement>) =>
  event.target.value === '' || Number.isNaN(event.target.valueAsNumber)
    ? null
    : event.target.valueAsNumber;

type TMeasurementsFieldProps = {
  disabled?: boolean;
  /** The product's saved measurements — to say a removal only sticks on save. */
  saved: ProductMeasurements | null;
  /** An unmeasured product's old free-text dimensions, shown read-only. */
  legacyDimensions: string | null;
};

/**
 * How big the piece is, measured the way its shape calls for — a round thali
 * gets a diameter instead of a "30 × 30 cm" that reads as a square. Only the
 * sizes the shape uses are shown and sent.
 */
const MeasurementsField = ({
  disabled,
  saved,
  legacyDimensions,
}: TMeasurementsFieldProps) => {
  const { control, setValue, getValues, clearErrors, trigger } =
    useFormContext<TProductFormData>();
  const measurements = useWatch({ control, name: MEASUREMENTS });
  // Sizes the chosen shape doesn't use wait here, not in the form, so the
  // form only holds what would be sent: a size left over from switching
  // shapes can't block a save or count as a change. Switching back restores it.
  const setAsideSizes = useRef<Partial<Record<ProductSize, number>>>({});
  const keepsLegacy = useWatch({ control, name: LEGACY_DIMENSIONS }) !== null;
  // useFormState (not formState from context) so the React Compiler sees
  // fresh errors after a submit.
  const { errors: formErrors, isSubmitted } = useFormState({
    control,
    name: MEASUREMENTS,
  });
  // "Enter at least one size…" belongs to the whole group, not one input.
  const groupError = formErrors.measurements?.message;

  const { shape } = measurements;
  const sizes = shape ? SHAPE_SIZES[shape] : null;
  const payload = toMeasurementsPayload(measurements);
  const hasSize =
    payload !== null &&
    SHAPE_SIZES[payload.shape].sizes.some((size) => payload[size] != null);
  const preview = payload && hasSize ? describeMeasurements(payload) : null;
  const [previewLine, ...previewNote] = preview?.split('\n') ?? [];
  const shapeExamples = SHAPE_OPTIONS.find(
    (option) => option.value === shape,
  )?.examples;

  // A size can settle the group's "at least one" rule, so re-check it all.
  const revalidate = () => {
    if (isSubmitted) void trigger(MEASUREMENTS);
  };

  const changeShape = (nextShape: ProductShape) => {
    const next = { ...getValues(MEASUREMENTS), shape: nextShape };
    const setAside = setAsideSizes.current;
    PRODUCT_SIZES.forEach((size) => {
      if (SHAPE_SIZES[nextShape].sizes.includes(size)) {
        if (next[size] === null) next[size] = setAside[size] ?? null;
        delete setAside[size];
      } else {
        if (next[size] !== null) setAside[size] = next[size];
        next[size] = null;
      }
    });
    setValue(MEASUREMENTS, next, { shouldDirty: true });
    revalidate();
  };

  const removeMeasurements = () => {
    setAsideSizes.current = {};
    setValue(MEASUREMENTS, EMPTY_MEASUREMENTS, { shouldDirty: true });
    clearErrors(MEASUREMENTS);
  };

  const setLegacy = (value: string | null) =>
    setValue(LEGACY_DIMENSIONS, value, { shouldDirty: true });

  return (
    <div className="flex flex-col gap-4">
      {legacyDimensions &&
        (shape !== null ? (
          <Callout variant="info">
            Old dimensions:{' '}
            <span className="font-medium">{legacyDimensions}</span> — the
            measurements below replace them when you save.
          </Callout>
        ) : keepsLegacy ? (
          <Callout
            variant="warning"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLegacy(null)}
                disabled={disabled}
              >
                Remove
              </Button>
            }
          >
            Old dimensions:{' '}
            <span className="font-medium">{legacyDimensions}</span> — re-enter
            them with a shape so shoppers can tell round from square.
          </Callout>
        ) : (
          <Callout
            variant="danger"
            action={
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLegacy(legacyDimensions)}
                disabled={disabled}
              >
                Undo
              </Button>
            }
          >
            The old dimensions ({legacyDimensions}) will be removed when you
            save — shoppers won't see a size.
          </Callout>
        ))}

      {saved && shape === null && (
        <Callout
          variant="danger"
          action={
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                setValue(MEASUREMENTS, toMeasurementsFormValue(saved), {
                  shouldDirty: true,
                })
              }
              disabled={disabled}
            >
              Undo
            </Button>
          }
        >
          Measurements will be removed when you save — shoppers won't see a
          size.
        </Callout>
      )}

      <FormField
        control={control}
        name={`${MEASUREMENTS}.shape`}
        render={({ field }) => (
          <FormItem>
            <div className="flex items-center justify-between gap-2">
              <FormLabel optional={shape === null}>Shape</FormLabel>
              {shape !== null && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={removeMeasurements}
                  disabled={disabled}
                  startAdornment={<Eraser />}
                  className="-my-1.5 h-7 px-2 text-stone-500 md:h-7"
                >
                  Remove measurements
                </Button>
              )}
            </div>
            <FormControl>
              <RadioGroup.Root
                value={field.value ?? ''}
                onValueChange={(value) => changeShape(value as ProductShape)}
                disabled={disabled}
                aria-label="Shape"
                className="grid grid-cols-2 gap-2 sm:grid-cols-4"
              >
                {SHAPE_OPTIONS.map((option) => (
                  <RadioGroup.Item
                    key={option.value}
                    value={option.value}
                    className={cn(
                      'flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs leading-tight font-medium outline-none sm:flex-col sm:justify-center sm:gap-1.5 sm:text-center',
                      'transition-[border-color,background-color,color,box-shadow] duration-150',
                      'focus-visible:ring-4 focus-visible:ring-accent-500/15 disabled:cursor-not-allowed disabled:opacity-50',
                      'border-stone-200 text-stone-600 hover:border-stone-300 hover:text-stone-900 dark:border-stone-700 dark:text-stone-300 dark:hover:border-stone-600 dark:hover:text-stone-50',
                      'data-[state=checked]:border-accent-500 data-[state=checked]:bg-accent-50 data-[state=checked]:text-accent-800 dark:data-[state=checked]:border-accent-400 dark:data-[state=checked]:bg-accent-950/40 dark:data-[state=checked]:text-accent-100',
                    )}
                  >
                    <ShapeIcon shape={option.value} />
                    {option.label}
                  </RadioGroup.Item>
                ))}
              </RadioGroup.Root>
            </FormControl>
            <FormDescription>
              {shapeExamples ??
                'Pick a shape first — it decides which sizes to enter.'}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {shape !== null && sizes && (
        <div className="flex animate-in flex-col gap-4 duration-200 fade-in-0 slide-in-from-top-1">
          <div className="flex flex-col gap-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {sizes.sizes.map((size) => (
                <FormField
                  key={`${shape}-${size}`}
                  control={control}
                  name={`${MEASUREMENTS}.${size}`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel
                        required={sizes.required.includes(size)}
                        optional={
                          shape !== 'IRREGULAR' &&
                          !sizes.required.includes(size)
                        }
                      >
                        {SIZE_LABELS[size]}
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          inputMode="decimal"
                          min={0}
                          max={PRODUCT_LIMITS.MEASUREMENT_MAX}
                          step="0.01"
                          placeholder="0"
                          disabled={disabled}
                          endAdornment={
                            <span className="text-xs text-stone-400 dark:text-stone-500">
                              {UNIT_LABELS[measurements.unit]}
                            </span>
                          }
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          value={field.value ?? ''}
                          onChange={(event) => {
                            field.onChange(toSize(event));
                            revalidate();
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}

              <FormField
                control={control}
                name={`${MEASUREMENTS}.unit`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Unit</FormLabel>
                    <Select
                      value={field.value}
                      onValueChange={field.onChange}
                      disabled={disabled}
                    >
                      <FormControl>
                        <SelectTrigger>
                          {/* Just "cm" — the full names are for the list. */}
                          <SelectValue>{UNIT_LABELS[field.value]}</SelectValue>
                        </SelectTrigger>
                      </FormControl>
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
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {shape === 'IRREGULAR' && !groupError && (
              <p className="text-xs text-stone-400 dark:text-stone-500">
                Enter at least one size — the space the piece takes up.
              </p>
            )}
            {groupError && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {groupError}
              </p>
            )}
          </div>

          <FormField
            control={control}
            name={`${MEASUREMENTS}.note`}
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel optional>Note</FormLabel>
                  <span className="text-xs text-stone-400 dark:text-stone-500">
                    {field.value.length}/{PRODUCT_LIMITS.MEASUREMENT_NOTE_MAX}
                  </span>
                </div>
                <FormControl>
                  <Input
                    placeholder="Each piece is hand-carved, so sizes vary slightly"
                    maxLength={PRODUCT_LIMITS.MEASUREMENT_NOTE_MAX}
                    disabled={disabled}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="rounded-lg border border-dashed border-stone-200 px-3 py-2.5 dark:border-stone-700">
            <p className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase dark:text-stone-500">
              Shoppers see
            </p>
            {preview ? (
              <>
                <p className="mt-1 text-sm font-medium text-stone-800 dark:text-stone-200">
                  {previewLine}
                </p>
                {previewNote.length > 0 && (
                  <p className="mt-0.5 text-xs text-stone-500 dark:text-stone-400">
                    {previewNote.join('\n')}
                  </p>
                )}
              </>
            ) : (
              <p className="mt-1 text-sm text-stone-400 italic dark:text-stone-500">
                Enter a size to preview it.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MeasurementsField;
