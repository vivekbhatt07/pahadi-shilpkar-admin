import * as React from 'react';
import { Select as SelectPrimitive } from 'radix-ui';
import { Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Radix's Root, without one of its quirks: when `value` is changed from
 * outside — a form reset as soon as its data loads, say — in the same render
 * that first draws the options, Radix's hidden native <select> doesn't have
 * an option for it yet, reads back "", and Radix passes that on as if it
 * were picked. No item can have "" as its value, so that's never a real
 * choice; it's dropped here.
 */
const Select = ({
  onValueChange,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Root>) => (
  <SelectPrimitive.Root
    {...props}
    onValueChange={
      onValueChange &&
      ((value: string) => {
        if (value !== '') onValueChange(value);
      })
    }
  />
);
const SelectGroup = SelectPrimitive.Group;
const SelectValue = SelectPrimitive.Value;

const SelectTrigger = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Trigger>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Trigger
    ref={ref}
    data-slot="select-trigger"
    className={cn(
      'flex h-9 md:h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-stone-200 bg-white px-3 text-sm outline-none',
      'transition-[border-color,box-shadow] duration-150',
      'hover:border-stone-300 dark:hover:border-stone-600',
      'placeholder:text-stone-400 dark:placeholder:text-stone-500',
      'focus-visible:border-accent-500 focus-visible:ring-4 focus-visible:ring-accent-500/15',
      'dark:focus-visible:border-accent-400 dark:focus-visible:ring-accent-400/15',
      'data-[state=open]:border-accent-500 dark:data-[state=open]:border-accent-400',
      'dark:border-stone-700 dark:bg-stone-900/60',
      '[&[data-state=open]>svg]:rotate-180',
      'disabled:cursor-not-allowed disabled:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="flex items-center gap-2 flex-1 min-w-0 truncate">
      {children}
    </span>
    <SelectPrimitive.Icon asChild>
      <ChevronDown className="size-4 text-stone-400 shrink-0 transition-transform duration-200 data-[state=open]:rotate-180" />
    </SelectPrimitive.Icon>
  </SelectPrimitive.Trigger>
));
SelectTrigger.displayName = 'SelectTrigger';

const SelectContent = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Content> & {
    position?: 'popper' | 'item-aligned';
  }
>(({ className, children, position = 'popper', ...props }, ref) => (
  <SelectPrimitive.Portal>
    <SelectPrimitive.Content
      ref={ref}
      data-slot="select-content"
      position={position}
      className={cn(
        'relative z-50 min-w-[8rem] overflow-hidden rounded-lg border border-stone-200 bg-white text-stone-900 shadow-md',
        'dark:border-stone-700 dark:bg-stone-900 dark:text-stone-50',
        'data-[state=open]:animate-in data-[state=closed]:animate-out',
        'data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
        'data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        'data-[side=bottom]:slide-in-from-top-2 data-[side=top]:slide-in-from-bottom-2',
        position === 'popper' && [
          'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1',
          'w-[var(--radix-select-trigger-width)]',
          'max-h-[var(--radix-select-content-available-height)]',
        ],
        className,
      )}
      {...props}
    >
      <SelectPrimitive.Viewport
        className={cn(
          'p-1',
          position === 'popper' && 'min-w-[var(--radix-select-trigger-width)]',
        )}
      >
        {children}
      </SelectPrimitive.Viewport>
    </SelectPrimitive.Content>
  </SelectPrimitive.Portal>
));
SelectContent.displayName = 'SelectContent';

const SelectItem = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <SelectPrimitive.Item
    ref={ref}
    data-slot="select-item"
    className={cn(
      'relative flex w-full cursor-default select-none items-center rounded-md py-1.5 pl-8 pr-3 text-sm outline-none',
      'transition-colors duration-100',
      'focus:bg-stone-100 focus:text-stone-900 dark:focus:bg-stone-800 dark:focus:text-stone-50',
      'data-[state=checked]:font-medium data-[state=checked]:text-accent-700 dark:data-[state=checked]:text-accent-300',
      'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
      className,
    )}
    {...props}
  >
    <span className="absolute left-2 flex size-3.5 items-center justify-center">
      <SelectPrimitive.ItemIndicator>
        <Check className="size-3.5" />
      </SelectPrimitive.ItemIndicator>
    </span>
    <SelectPrimitive.ItemText asChild>
      <span className="flex items-center gap-2">{children}</span>
    </SelectPrimitive.ItemText>
  </SelectPrimitive.Item>
));
SelectItem.displayName = 'SelectItem';

const SelectSeparator = React.forwardRef<
  React.ElementRef<typeof SelectPrimitive.Separator>,
  React.ComponentPropsWithoutRef<typeof SelectPrimitive.Separator>
>(({ className, ...props }, ref) => (
  <SelectPrimitive.Separator
    ref={ref}
    data-slot="select-separator"
    className={cn('-mx-1 my-1 h-px bg-stone-200 dark:bg-stone-700', className)}
    {...props}
  />
));
SelectSeparator.displayName = 'SelectSeparator';

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectSeparator,
};
