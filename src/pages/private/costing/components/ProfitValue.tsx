import { formatPrice } from '@/helpers/format';
import { cn } from '@/lib/utils';

import { formatPercent, marginTone } from '../helpers';

const TONE_CLASSES = {
  loss: 'text-red-600 dark:text-red-400',
  low: 'text-amber-700 dark:text-amber-400',
  good: 'text-emerald-700 dark:text-emerald-400',
  none: 'text-stone-400 dark:text-stone-500',
};

type TProfitValueProps = {
  profit: number | null;
  marginPercent?: number | null;
  /** The target margin — below it reads amber, below 0 red. */
  target?: number | null;
  className?: string;
};

/** "₹352 · 70.5%", coloured by how it stands against the target. */
const ProfitValue = ({
  profit,
  marginPercent = null,
  target = null,
  className,
}: TProfitValueProps) => {
  if (profit === null) {
    return <span className={cn(TONE_CLASSES.none, className)}>—</span>;
  }
  const tone = marginTone(marginPercent ?? (profit < 0 ? -1 : 0), target);
  return (
    <span
      className={cn('font-medium tabular-nums', TONE_CLASSES[tone], className)}
    >
      {formatPrice(profit)}
      {marginPercent !== null && (
        <span className="ml-1 text-xs font-normal opacity-80">
          {formatPercent(marginPercent)}
        </span>
      )}
    </span>
  );
};

export default ProfitValue;
