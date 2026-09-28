import { Plus, Trash2 } from 'lucide-react';
import {
  Controller,
  useFieldArray,
  useFormContext,
  useFormState,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  PRODUCT_FORM_FIELD_NAMES,
  PRODUCT_LIMITS,
  PURCHASE_LINK_PLATFORM_OPTIONS,
} from '../constants';
import type { TProductFormData } from '../types';

const { PURCHASE_LINKS } = PRODUCT_FORM_FIELD_NAMES;

/** Any form with a `purchaseLinks` array — the product and combo forms. */
type TPurchaseLinksForm = Pick<TProductFormData, typeof PURCHASE_LINKS>;

type TPurchaseLinksFieldProps = { disabled?: boolean };

const PurchaseLinksField = ({ disabled }: TPurchaseLinksFieldProps) => {
  const { control, register } = useFormContext<TPurchaseLinksForm>();
  const { fields, append, remove } = useFieldArray({
    control,
    name: PURCHASE_LINKS,
  });
  // useFormState (not formState from context) so the React Compiler sees
  // fresh errors after a submit.
  const errors = useFormState({ control, name: PURCHASE_LINKS }).errors
    .purchaseLinks;

  return (
    <div className="flex flex-col gap-3">
      {fields.length === 0 && (
        <p className="text-xs text-stone-400 dark:text-stone-500">
          No purchase links yet.
        </p>
      )}
      {fields.map((field, index) => {
        const rowError =
          errors?.[index]?.url?.message ?? errors?.[index]?.label?.message;
        return (
          <div
            key={field.id}
            className="flex flex-col gap-2 rounded-lg border border-stone-200 p-2 dark:border-stone-700"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <Controller
                control={control}
                name={`${PURCHASE_LINKS}.${index}.platform` as const}
                render={({ field: platformField }) => (
                  <Select
                    value={platformField.value}
                    onValueChange={platformField.onChange}
                    disabled={disabled}
                  >
                    <SelectTrigger className="sm:w-36">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PURCHASE_LINK_PLATFORM_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Input
                placeholder="Label (optional)"
                maxLength={PRODUCT_LIMITS.PURCHASE_LINK_LABEL_MAX}
                disabled={disabled}
                {...register(`${PURCHASE_LINKS}.${index}.label` as const)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(index)}
                disabled={disabled}
                aria-label="Remove link"
              >
                <Trash2 className="text-stone-400" />
              </Button>
            </div>
            <Input
              type="url"
              placeholder="https://www.amazon.in/dp/…"
              disabled={disabled}
              {...register(`${PURCHASE_LINKS}.${index}.url` as const)}
            />
            {rowError && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {rowError}
              </p>
            )}
          </div>
        );
      })}
      {fields.length < PRODUCT_LIMITS.PURCHASE_LINKS_MAX && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append({ platform: 'WEBSITE', label: '', url: '' })}
          disabled={disabled}
          startAdornment={<Plus />}
          className="w-fit"
        >
          Add purchase link
        </Button>
      )}
    </div>
  );
};

export default PurchaseLinksField;
