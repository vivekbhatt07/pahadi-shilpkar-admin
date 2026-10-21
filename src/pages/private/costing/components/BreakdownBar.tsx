import { formatPrice } from '@/helpers/format';
import { cn } from '@/lib/utils';
import type { CostBreakdown } from '@/types/api';

import { COST_LINE_TYPES } from '../constants';

type TBreakdownBarProps = {
  breakdown: CostBreakdown;
  /** Shown beside the costs as the rest of the bar — what's left of the price. */
  profit?: number | null;
  className?: string;
};

/**
 * Where one piece's cost goes — materials, labour, packing… — as a stacked
 * bar with a legend; with `profit`, the bar is the whole price and the
 * profit fills the rest.
 */
const BreakdownBar = ({ breakdown, profit, className }: TBreakdownBarProps) => {
  const parts = COST_LINE_TYPES.filter((type) => breakdown[type.value] > 0);
  const shownProfit = profit !== undefined && profit !== null && profit > 0;
  const whole = breakdown.total + (shownProfit ? profit : 0);

  if (whole <= 0) {
    return (
      <p className={cn('text-xs text-stone-400', className)}>No costs yet.</p>
    );
  }

  return (
    <div className={cn('flex flex-col gap-2.5', className)}>
      <div
        aria-hidden
        className="flex h-2.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800"
      >
        {parts.map((type) => (
          <div
            key={type.value}
            className={type.swatch}
            style={{ width: `${(breakdown[type.value] / whole) * 100}%` }}
          />
        ))}
        {shownProfit && (
          <div
            className="bg-emerald-500"
            style={{ width: `${(profit / whole) * 100}%` }}
          />
        )}
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-stone-600 dark:text-stone-400">
        {parts.map((type) => (
          <li key={type.value} className="flex items-center gap-1.5">
            <span className={cn('size-2 rounded-full', type.swatch)} />
            {type.label}
            <span className="font-medium text-stone-900 tabular-nums dark:text-stone-100">
              {formatPrice(breakdown[type.value])}
            </span>
          </li>
        ))}
        {shownProfit && (
          <li className="flex items-center gap-1.5">
            <span className="size-2 rounded-full bg-emerald-500" />
            Profit
            <span className="font-medium text-emerald-700 tabular-nums dark:text-emerald-400">
              {formatPrice(profit)}
            </span>
          </li>
        )}
      </ul>
    </div>
  );
};

export default BreakdownBar;
