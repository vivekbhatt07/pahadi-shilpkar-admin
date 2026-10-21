import { Plus, Trash2 } from 'lucide-react';
import {
  get,
  useFieldArray,
  useFormContext,
  useFormState,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PRODUCT_FORM_FIELD_NAMES, PRODUCT_LIMITS } from '../constants';
import type { TProductFormData } from '../types';

const { SPECIFICATIONS } = PRODUCT_FORM_FIELD_NAMES;

/** The product's own list, or one variant's. */
export type TSpecificationsPath =
  | typeof SPECIFICATIONS
  | `${typeof PRODUCT_FORM_FIELD_NAMES.VARIANTS}.${number}.specifications`;

type TSpecificationsFieldProps = {
  name?: TSpecificationsPath;
  disabled?: boolean;
};

const SpecificationsField = ({
  name = SPECIFICATIONS,
  disabled,
}: TSpecificationsFieldProps) => {
  const { control, register } = useFormContext<TProductFormData>();
  const { fields, append, remove } = useFieldArray({ control, name });
  // useFormState (not formState from context) so the React Compiler sees
  // fresh errors after a submit
  const errors = get(useFormState({ control, name }).errors, name);

  return (
    <div className="flex flex-col gap-2">
      {fields.length === 0 && (
        <p className="text-xs text-stone-400 dark:text-stone-500">
          No specifications yet.
        </p>
      )}
      {fields.map((field, index) => {
        const rowError =
          errors?.[index]?.label?.message ?? errors?.[index]?.value?.message;
        return (
          <div
            key={field.id}
            className="flex animate-in flex-col gap-1 duration-200 fade-in-0 slide-in-from-top-1"
          >
            <div className="flex items-start gap-2">
              <Input
                placeholder="Label (e.g. Material)"
                maxLength={PRODUCT_LIMITS.SPEC_LABEL_MAX}
                disabled={disabled}
                {...register(`${name}.${index}.label` as const)}
              />
              <Input
                placeholder="Value (e.g. Deodar wood)"
                maxLength={PRODUCT_LIMITS.SPEC_VALUE_MAX}
                disabled={disabled}
                {...register(`${name}.${index}.value` as const)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(index)}
                disabled={disabled}
                aria-label="Remove specification"
              >
                <Trash2 className="text-stone-400" />
              </Button>
            </div>
            {rowError && (
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {rowError}
              </p>
            )}
          </div>
        );
      })}
      {fields.length < PRODUCT_LIMITS.SPECIFICATIONS_MAX && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append({ label: '', value: '' })}
          disabled={disabled}
          startAdornment={<Plus />}
          className="w-fit"
        >
          Add specification
        </Button>
      )}
    </div>
  );
};

export default SpecificationsField;
