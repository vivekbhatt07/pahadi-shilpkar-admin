import { cn } from '@/lib/utils';

const WINDOWS = [7, 30, 90] as const;
export type TWindow = (typeof WINDOWS)[number];

/** The days a dashboard card counts over — the last 7, 30 or 90. */
const WindowPicker = ({
  value,
  onChange,
}: {
  value: TWindow;
  onChange: (value: TWindow) => void;
}) => (
  <div
    role="group"
    aria-label="Time window"
    className="flex rounded-lg bg-stone-100 p-0.5 dark:bg-stone-800"
  >
    {WINDOWS.map((option) => (
      <button
        key={option}
        type="button"
        aria-pressed={value === option}
        onClick={() => onChange(option)}
        className={cn(
          'cursor-pointer rounded-md px-2 py-1 text-xs font-medium tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30',
          value === option
            ? 'bg-white text-stone-900 shadow-xs dark:bg-stone-900 dark:text-stone-50'
            : 'text-stone-500 hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-50',
        )}
      >
        {option}d
      </button>
    ))}
  </div>
);

export default WindowPicker;
