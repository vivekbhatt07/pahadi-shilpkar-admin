import { cn } from '@/lib/utils';

type TColorSwatchProps = {
  /** Null = no swatch: a dashed ring with a slash. */
  hex: string | null;
  className?: string;
};

/** A round colour chip; decorative — pair it with the colour's name. */
const ColorSwatch = ({ hex, className }: TColorSwatchProps) =>
  hex ? (
    <span
      aria-hidden
      className={cn(
        'inline-block size-4 shrink-0 rounded-full shadow-[inset_0_0_0_1px_rgb(0_0_0/0.12)] dark:shadow-[inset_0_0_0_1px_rgb(255_255_255/0.18)]',
        className,
      )}
      style={{ backgroundColor: hex }}
    />
  ) : (
    <span
      aria-hidden
      className={cn(
        'relative inline-block size-4 shrink-0 overflow-hidden rounded-full border border-dashed border-stone-300 dark:border-stone-600',
        'after:absolute after:top-1/2 after:left-1/2 after:h-px after:w-[140%] after:-translate-x-1/2 after:-translate-y-1/2 after:-rotate-45 after:bg-stone-300 dark:after:bg-stone-600',
        className,
      )}
    />
  );

export default ColorSwatch;
