import {
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';
import { Link } from 'react-router';
import {
  ArrowDown,
  ArrowUp,
  Minus,
  PackageOpen,
  Plus,
  Trash2,
} from 'lucide-react';

import ImageThumb from '@/components/custom/ImageThumb';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SimpleTooltip } from '@/components/ui/tooltip';
import { ROUTES } from '@/constants/routes';
import { formatPrice } from '@/helpers/format';
import { cn } from '@/lib/utils';

import { COMBO_FORM_FIELD_NAMES, COMBO_LIMITS } from '../constants';
import { toComboProduct } from '../helpers';
import type { TComboFormData } from '../types';
import ProductPicker from './ProductPicker';

const { ITEMS } = COMBO_FORM_FIELD_NAMES;

type TComboItemsFieldProps = { disabled?: boolean };

const stepperButtonClass =
  'flex size-7 cursor-pointer items-center justify-center rounded-md text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-900 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-stone-800 dark:hover:text-stone-50';

/**
 * The products inside a combo, in display order. Each product can appear
 * once — "pack of 3" is quantity 3. The whole list is sent on every save
 * (PATCH replaces it wholesale).
 */
const ComboItemsField = ({ disabled }: TComboItemsFieldProps) => {
  const { control, setValue, trigger } = useFormContext<TComboFormData>();
  // useFormState (not formState from context) so the React Compiler sees
  // fresh errors after a submit.
  const { errors: formErrors, isSubmitted } = useFormState({
    control,
    name: ITEMS,
  });
  const { fields, append, remove, move } = useFieldArray({
    control,
    name: ITEMS,
  });
  const items = useWatch({ control, name: ITEMS });
  const errors = formErrors.items;
  const rootError = errors?.root?.message ?? errors?.message;

  // Re-validate the whole list, not just this row: the "at least 2 items"
  // rule lives on the array and must clear once a quantity fixes it.
  const setQuantity = (index: number, quantity: number) => {
    setValue(`${ITEMS}.${index}.quantity`, quantity, { shouldDirty: true });
    if (isSubmitted) void trigger(ITEMS);
  };

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-xl border-2 border-dashed border-stone-200 px-4 py-8 text-center dark:border-stone-700">
          <div className="flex size-10 items-center justify-center rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800">
            <PackageOpen className="size-5" />
          </div>
          <p className="text-sm font-medium text-stone-700 dark:text-stone-300">
            No products yet
          </p>
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Add at least two items — two products, or one product with quantity
            2 or more.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-stone-100 overflow-hidden rounded-xl border border-stone-200 dark:divide-stone-800 dark:border-stone-700">
          {fields.map((field, index) => {
            const item = items[index] ?? field;
            const quantity = item.quantity;
            const lineTotal = Number.isInteger(quantity)
              ? item.product.price * quantity
              : null;
            const quantityError = errors?.[index]?.quantity?.message;

            return (
              <li
                key={field.id}
                className="flex animate-in flex-col gap-1.5 px-3 py-2.5 duration-200 fade-in-0"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <ImageThumb
                      src={item.product.images[0]}
                      alt=""
                      className="size-10"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Link
                          to={ROUTES.PRIVATE.PRODUCTS.DETAIL(item.product.slug)}
                          target="_blank"
                          className="truncate text-sm font-medium text-stone-900 hover:text-accent-600 dark:text-stone-50 dark:hover:text-accent-400"
                        >
                          {item.product.name}
                        </Link>
                        {!item.product.isActive && (
                          <Badge variant="secondary" className="shrink-0">
                            Inactive
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 text-xs tabular-nums text-stone-400 dark:text-stone-500">
                        {formatPrice(item.product.price)} each
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 sm:justify-end">
                    <div
                      className={cn(
                        'flex items-center gap-0.5 rounded-lg border p-0.5',
                        quantityError
                          ? 'border-red-400 dark:border-red-500/70'
                          : 'border-stone-200 dark:border-stone-700',
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setQuantity(index, quantity - 1)}
                        disabled={disabled || !(quantity > 1)}
                        aria-label={`Decrease quantity of ${item.product.name}`}
                        className={stepperButtonClass}
                      >
                        <Minus className="size-3.5" />
                      </button>
                      <input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        max={COMBO_LIMITS.QUANTITY_MAX}
                        step={1}
                        value={Number.isNaN(quantity) ? '' : quantity}
                        onChange={(event) =>
                          setQuantity(
                            index,
                            event.target.value === ''
                              ? Number.NaN
                              : event.target.valueAsNumber,
                          )
                        }
                        disabled={disabled}
                        aria-label={`Quantity of ${item.product.name}`}
                        aria-invalid={Boolean(quantityError)}
                        className="w-10 bg-transparent text-center text-sm font-medium tabular-nums outline-none [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => setQuantity(index, quantity + 1)}
                        disabled={
                          disabled || !(quantity < COMBO_LIMITS.QUANTITY_MAX)
                        }
                        aria-label={`Increase quantity of ${item.product.name}`}
                        className={stepperButtonClass}
                      >
                        <Plus className="size-3.5" />
                      </button>
                    </div>

                    <span className="w-20 text-right text-sm font-medium tabular-nums text-stone-900 dark:text-stone-50">
                      {lineTotal === null ? '—' : formatPrice(lineTotal)}
                    </span>

                    <div className="flex items-center">
                      <SimpleTooltip label="Move up">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => move(index, index - 1)}
                          disabled={disabled || index === 0}
                          aria-label={`Move ${item.product.name} up`}
                        >
                          <ArrowUp className="text-stone-400" />
                        </Button>
                      </SimpleTooltip>
                      <SimpleTooltip label="Move down">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => move(index, index + 1)}
                          disabled={disabled || index === fields.length - 1}
                          aria-label={`Move ${item.product.name} down`}
                        >
                          <ArrowDown className="text-stone-400" />
                        </Button>
                      </SimpleTooltip>
                      <SimpleTooltip label="Remove">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => remove(index)}
                          disabled={disabled}
                          aria-label={`Remove ${item.product.name}`}
                          className="text-stone-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30"
                        >
                          <Trash2 />
                        </Button>
                      </SimpleTooltip>
                    </div>
                  </div>
                </div>

                {quantityError && (
                  <p className="text-xs font-medium text-red-600 dark:text-red-400">
                    {quantityError}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {rootError && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {rootError}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-3">
        {fields.length < COMBO_LIMITS.ITEMS_MAX ? (
          <ProductPicker
            selectedIds={items.map((item) => item.productId)}
            onSelect={(product) =>
              append({
                productId: product.id,
                quantity: 1,
                product: toComboProduct(product),
              })
            }
            disabled={disabled}
          />
        ) : (
          <p className="text-xs text-stone-400 dark:text-stone-500">
            A combo can hold up to {COMBO_LIMITS.ITEMS_MAX} products.
          </p>
        )}
        {fields.length > 0 && (
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Order here is the order on the storefront.
          </p>
        )}
      </div>
    </div>
  );
};

export default ComboItemsField;
