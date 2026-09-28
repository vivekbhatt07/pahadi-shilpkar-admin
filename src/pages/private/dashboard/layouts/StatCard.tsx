import { Link } from 'react-router';
import { ArrowUpRight } from 'lucide-react';

import { Skeleton } from '@/components/ui/skeleton';
import { useCountUp } from '@/hooks/useCountUp';
import { cn } from '@/lib/utils';

export type TStatTone =
  | 'accent'
  | 'amber'
  | 'emerald'
  | 'violet'
  | 'sky'
  | 'rose';

const TONE_CLASSES: Record<TStatTone, string> = {
  accent:
    'bg-accent-50 text-accent-600 ring-accent-600/10 dark:bg-accent-950/50 dark:text-accent-400',
  amber:
    'bg-amber-50 text-amber-600 ring-amber-600/10 dark:bg-amber-950/40 dark:text-amber-400',
  emerald:
    'bg-emerald-50 text-emerald-600 ring-emerald-600/10 dark:bg-emerald-950/40 dark:text-emerald-400',
  violet:
    'bg-violet-50 text-violet-600 ring-violet-600/10 dark:bg-violet-950/40 dark:text-violet-400',
  sky: 'bg-sky-50 text-sky-600 ring-sky-600/10 dark:bg-sky-950/40 dark:text-sky-400',
  rose: 'bg-rose-50 text-rose-600 ring-rose-600/10 dark:bg-rose-950/40 dark:text-rose-400',
};

type TStatCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number | undefined;
  /** Secondary line under the label, e.g. "12 active". */
  hint?: string;
  tone?: TStatTone;
  isLoading?: boolean;
  to?: string;
};

const StatCard = ({
  icon,
  label,
  value,
  hint,
  tone = 'accent',
  isLoading,
  to,
}: TStatCardProps) => {
  const animatedValue = useCountUp(value);

  const body = (
    <>
      <div className="flex items-start justify-between">
        <div
          className={cn(
            'flex size-10 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-300 group-hover:scale-105 [&_svg]:size-5',
            TONE_CLASSES[tone],
          )}
        >
          {icon}
        </div>
        {to && (
          <ArrowUpRight className="size-4 -translate-x-1 translate-y-1 text-stone-300 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:translate-y-0 group-hover:text-stone-500 group-hover:opacity-100 dark:text-stone-600 dark:group-hover:text-stone-400" />
        )}
      </div>
      <div className="mt-4">
        {isLoading ? (
          <Skeleton className="h-8 w-14" />
        ) : (
          <p className="text-3xl leading-none font-semibold tracking-tight text-stone-900 tabular-nums dark:text-stone-50">
            {value === undefined
              ? '—'
              : (animatedValue ?? 0).toLocaleString('en-IN')}
          </p>
        )}
        <p className="mt-2 text-xs font-medium text-stone-500 dark:text-stone-400">
          {label}
        </p>
        {hint && !isLoading && (
          <p className="mt-0.5 truncate text-[11px] text-stone-400 dark:text-stone-500">
            {hint}
          </p>
        )}
      </div>
    </>
  );

  const surface =
    'group block rounded-xl border border-stone-200 bg-white p-4 shadow-sm sm:p-5 dark:border-stone-700/60 dark:bg-stone-900';

  if (!to) return <div className={surface}>{body}</div>;

  return (
    <Link
      to={to}
      aria-label={value === undefined ? label : `${label}: ${value}`}
      className={cn(
        surface,
        'outline-none transition-all duration-200 ease-out',
        'hover:-translate-y-0.5 hover:border-stone-300 hover:shadow-md',
        'focus-visible:ring-4 focus-visible:ring-accent-500/20',
        'dark:hover:border-stone-600 dark:hover:shadow-black/30',
      )}
    >
      {body}
    </Link>
  );
};

export default StatCard;
