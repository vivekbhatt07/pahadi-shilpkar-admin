import { Truck } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Link } from 'react-router';

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
import { ROUTES } from '@/constants/routes';
import { formatDelivery } from '@/helpers/format';
import { useSettings } from '@/hooks/settings';
import { cn } from '@/lib/utils';
import type { Delivery, DeliveryCharge } from '@/types/api';

import {
  DELIVERY_CHARGE_OPTIONS,
  PRODUCT_FORM_FIELD_NAMES,
  PRODUCT_LIMITS,
} from '../constants';
import type { TProductFormData } from '../types';

const { DELIVERY_CHARGE, DELIVERY_FEE } = PRODUCT_FORM_FIELD_NAMES;

/** Any form with the delivery pair — products, combos and Store settings. */
type TDeliveryForm = Pick<
  TProductFormData,
  typeof DELIVERY_CHARGE | typeof DELIVERY_FEE
>;

/** Radix Select cannot use an empty string as a value. */
const NOT_SET = 'NOT_SET';

const RupeePrefix = () => (
  <span className="text-sm text-stone-400 dark:text-stone-500">₹</span>
);

const toNullableNumber = (event: React.ChangeEvent<HTMLInputElement>) =>
  event.target.value === '' ? null : event.target.valueAsNumber;

type TDeliveryChargeFieldProps = {
  /**
   * `listing` — a product or combo, which follows the store default until it
   * sets its own. `store` — that default, where "not set" means prices say
   * nothing about delivery.
   */
  scope: 'listing' | 'store';
  disabled?: boolean;
};

/**
 * Whether the price covers delivery — free, or charged on top at an optional
 * fixed fee — with what shoppers will see next to the price.
 */
const DeliveryChargeField = ({
  scope,
  disabled,
}: TDeliveryChargeFieldProps) => {
  const { control, getValues, setValue, clearErrors } =
    useFormContext<TDeliveryForm>();
  const charge = useWatch({ control, name: DELIVERY_CHARGE });
  const fee = useWatch({ control, name: DELIVERY_FEE });
  const settings = useSettings();

  const storeDefault: Delivery | null = settings.data?.deliveryCharge
    ? {
        charge: settings.data.deliveryCharge,
        fee: settings.data.deliveryFee,
      }
    : null;
  // A fee still being typed (0, or not a number yet) isn't previewed
  const typedFee = fee !== null && Number.isFinite(fee) && fee > 0 ? fee : null;
  const own: Delivery | null = charge
    ? { charge, fee: charge === 'EXTRA' ? typedFee : null }
    : null;
  const shown = scope === 'listing' ? (own ?? storeDefault) : own;

  const changeCharge = (value: string) => {
    const next = value === NOT_SET ? null : (value as DeliveryCharge);
    setValue(DELIVERY_CHARGE, next, { shouldDirty: true });
    // A fee only goes with EXTRA — the API drops it otherwise, so the form
    // does too, and an error on the hidden input can't block the save.
    if (next !== 'EXTRA' && getValues(DELIVERY_FEE) !== null) {
      setValue(DELIVERY_FEE, null, { shouldDirty: true });
      clearErrors(DELIVERY_FEE);
    }
  };

  const selected = DELIVERY_CHARGE_OPTIONS.find(
    (option) => option.value === charge,
  );

  return (
    <div className="flex flex-col gap-4">
      <FormField
        control={control}
        name={DELIVERY_CHARGE}
        render={({ field }) => (
          <FormItem>
            <FormLabel>Delivery charges</FormLabel>
            <Select
              value={field.value ?? NOT_SET}
              onValueChange={changeCharge}
              disabled={disabled}
            >
              <FormControl>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                <SelectItem value={NOT_SET}>
                  {scope === 'listing' ? (
                    <>
                      Store default
                      {storeDefault && (
                        <span className="text-stone-400 dark:text-stone-500">
                          {formatDelivery(storeDefault)}
                        </span>
                      )}
                    </>
                  ) : (
                    "Don't mention delivery"
                  )}
                </SelectItem>
                {DELIVERY_CHARGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FormDescription>
              {selected ? (
                selected.description
              ) : scope === 'listing' ? (
                <>
                  Follows the default in{' '}
                  <Link
                    to={ROUTES.PRIVATE.SETTINGS.STORE}
                    className="underline underline-offset-2"
                  >
                    Store settings
                  </Link>
                  .
                </>
              ) : (
                'Prices say nothing about delivery, unless a product or combo sets its own.'
              )}
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {charge === 'EXTRA' && (
        <FormField
          control={control}
          name={DELIVERY_FEE}
          render={({ field }) => (
            <FormItem className="animate-in duration-200 fade-in-0 slide-in-from-top-1">
              <FormLabel optional>Delivery fee</FormLabel>
              <FormControl>
                <Input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={PRODUCT_LIMITS.DELIVERY_FEE_MAX}
                  step="0.01"
                  placeholder="Depends on the address"
                  disabled={disabled}
                  startAdornment={<RupeePrefix />}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  value={field.value ?? ''}
                  onChange={(event) => field.onChange(toNullableNumber(event))}
                />
              </FormControl>
              <FormDescription>
                Leave blank to quote it on WhatsApp, once you know where it's
                going.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      )}

      <p className="flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-stone-500 dark:text-stone-400">
        Shoppers see
        {shown ? (
          <span
            className={cn(
              'inline-flex items-center gap-1 font-medium',
              shown.charge === 'INCLUDED'
                ? 'text-emerald-700 dark:text-emerald-400'
                : 'text-stone-800 dark:text-stone-200',
            )}
          >
            <Truck className="size-3.5 shrink-0" aria-hidden />
            {formatDelivery(shown)}
          </span>
        ) : (
          <span className="italic">nothing about delivery</span>
        )}
      </p>
    </div>
  );
};

export default DeliveryChargeField;
