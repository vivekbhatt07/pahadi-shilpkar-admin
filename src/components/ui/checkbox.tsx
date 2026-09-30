import * as React from 'react';
import { Checkbox as CheckboxPrimitive } from 'radix-ui';
import { CheckIcon, MinusIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/** `checked="indeterminate"` renders a dash — for "some rows selected". */
const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, checked, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    data-slot="checkbox"
    checked={checked}
    className={cn(
      'peer flex size-4 shrink-0 cursor-pointer items-center justify-center rounded-[4px] border border-stone-300 bg-white shadow-xs outline-none',
      'transition-colors duration-150',
      'focus-visible:ring-4 focus-visible:ring-accent-500/25 dark:focus-visible:ring-accent-400/30',
      'disabled:cursor-not-allowed disabled:opacity-50',
      'data-[state=checked]:border-accent-600 data-[state=checked]:bg-accent-600 data-[state=checked]:text-white',
      'data-[state=indeterminate]:border-accent-600 data-[state=indeterminate]:bg-accent-600 data-[state=indeterminate]:text-white',
      'dark:border-stone-600 dark:bg-stone-900',
      'dark:data-[state=checked]:border-accent-500 dark:data-[state=checked]:bg-accent-500',
      'dark:data-[state=indeterminate]:border-accent-500 dark:data-[state=indeterminate]:bg-accent-500',
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator data-slot="checkbox-indicator">
      {checked === 'indeterminate' ? (
        <MinusIcon className="size-3" strokeWidth={3} />
      ) : (
        <CheckIcon className="size-3" strokeWidth={3} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = 'Checkbox';

export { Checkbox };
