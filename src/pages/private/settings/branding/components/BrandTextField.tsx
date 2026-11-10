import { useFormContext } from 'react-hook-form';

import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

import type { TBrandingFormData } from '../types';

type TBrandTextFieldProps = {
  name: keyof TBrandingFormData;
  label: string;
  max: number;
  /** What the storefront says while this is blank. */
  placeholder: string;
  description?: React.ReactNode;
  multiline?: boolean;
  disabled?: boolean;
};

/** One line or paragraph of the storefront's wording, with a counter. */
const BrandTextField = ({
  name,
  label,
  max,
  placeholder,
  description,
  multiline = false,
  disabled,
}: TBrandTextFieldProps) => {
  const { control } = useFormContext<TBrandingFormData>();

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>{label}</FormLabel>
            <span className="text-xs text-stone-400 dark:text-stone-500">
              {field.value.length}/{max}
            </span>
          </div>
          <FormControl>
            {multiline ? (
              <Textarea
                rows={3}
                placeholder={placeholder}
                disabled={disabled}
                {...field}
              />
            ) : (
              <Input placeholder={placeholder} disabled={disabled} {...field} />
            )}
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
};

export default BrandTextField;
