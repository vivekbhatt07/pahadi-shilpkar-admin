import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { SimpleTooltip } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

import { formatPercent } from '../helpers';

/** ▲ 12.5% — the latest purchase's price against the one before. */
const PriceTrend = ({ change }: { change: number | null }) => {
  if (change === null || change === 0) return null;
  const up = change > 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <SimpleTooltip
      label={`${up ? 'Up' : 'Down'} ${formatPercent(Math.abs(change))} on the purchase before`}
    >
      <span
        className={cn(
          'inline-flex items-center gap-0.5 text-xs font-medium tabular-nums',
          up
            ? 'text-red-600 dark:text-red-400'
            : 'text-emerald-700 dark:text-emerald-400',
        )}
      >
        <Icon className="size-3.5" />
        {formatPercent(Math.abs(change))}
      </span>
    </SimpleTooltip>
  );
};

export default PriceTrend;
