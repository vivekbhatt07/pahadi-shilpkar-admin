import { Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useFormContext } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

import { PROCESS_LIMITS, PROCESS_PAGE_FORM_FIELD_NAMES } from '../constants';
import type { TProcessPageFormData } from '../types';

const { STATS } = PROCESS_PAGE_FORM_FIELD_NAMES;

/** Up to 4 headline figures under the page's intro — "120+ artisans". */
const StatsField = ({ disabled }: { disabled?: boolean }) => {
  const { control, register, formState } =
    useFormContext<TProcessPageFormData>();
  const { fields, append, remove } = useFieldArray({ control, name: STATS });
  const errors = formState.errors.stats;

  return (
    <div className="flex flex-col gap-2">
      {fields.length === 0 && (
        <p className="text-xs text-stone-400 dark:text-stone-500">
          No figures yet — the row is hidden until you add one.
        </p>
      )}
      {fields.map((field, index) => {
        const rowError =
          errors?.[index]?.value?.message ?? errors?.[index]?.label?.message;
        return (
          <div
            key={field.id}
            className="flex animate-in flex-col gap-1 duration-200 fade-in-0 slide-in-from-top-1"
          >
            <div className="flex items-start gap-2">
              <Input
                placeholder="120+"
                aria-label={`Figure ${index + 1}`}
                maxLength={PROCESS_LIMITS.STAT_VALUE_MAX}
                disabled={disabled}
                className="w-28 shrink-0"
                {...register(`${STATS}.${index}.value` as const)}
              />
              <Input
                placeholder="artisans in 15 villages"
                aria-label={`What figure ${index + 1} counts`}
                maxLength={PROCESS_LIMITS.STAT_LABEL_MAX}
                disabled={disabled}
                {...register(`${STATS}.${index}.label` as const)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => remove(index)}
                disabled={disabled}
                aria-label={`Remove figure ${index + 1}`}
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
      {errors?.root?.message && (
        <p className="text-xs font-medium text-red-600 dark:text-red-400">
          {errors.root.message}
        </p>
      )}
      {fields.length < PROCESS_LIMITS.STATS_MAX && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => append({ value: '', label: '' })}
          disabled={disabled}
          startAdornment={<Plus />}
          className="w-fit"
        >
          Add a figure
        </Button>
      )}
    </div>
  );
};

export default StatsField;
