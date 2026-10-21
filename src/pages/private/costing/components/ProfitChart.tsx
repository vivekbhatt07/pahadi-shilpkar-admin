import { useState } from 'react';
import dayjs from 'dayjs';

import { formatPrice } from '@/helpers/format';
import { cn } from '@/lib/utils';
import type { ProfitReport } from '@/types/api';

type TProfitChartProps = {
  series: ProfitReport['series'];
  granularity: ProfitReport['granularity'];
};

const periodLabel = (
  period: string,
  granularity: ProfitReport['granularity'],
  long = false,
) =>
  granularity === 'day'
    ? dayjs(period).format(long ? 'ddd, D MMM' : 'D MMM')
    : dayjs(`${period}-01`).format(long ? 'MMMM YYYY' : 'MMM');

/**
 * What buyers paid in each day or month, with the profit inside it — a
 * loss hangs below the line. Hover or arrow-key through for the figures.
 */
const ProfitChart = ({ series, granularity }: TProfitChartProps) => {
  const [active, setActive] = useState<number | null>(null);
  const top = Math.max(1, ...series.map((point) => point.revenue));
  const bottom = Math.max(0, ...series.map((point) => -point.profit));
  const span = top + bottom;
  const zero = (bottom / span) * 100;
  const shown = active === null ? null : series[active];
  const last = series.length - 1;
  const labelEvery = Math.max(1, Math.ceil(series.length / 8));

  return (
    <div className="flex flex-col gap-3">
      <div className="flex min-h-10 flex-wrap items-baseline justify-between gap-2 text-sm">
        {shown ? (
          <>
            <span className="font-medium text-stone-900 dark:text-stone-50">
              {periodLabel(shown.period, granularity, true)}
            </span>
            <span className="text-stone-600 tabular-nums dark:text-stone-300">
              {shown.sales} {shown.sales === 1 ? 'sale' : 'sales'} ·{' '}
              {formatPrice(shown.revenue)} paid ·{' '}
              <span
                className={cn(
                  'font-medium',
                  shown.profit < 0
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-emerald-700 dark:text-emerald-400',
                )}
              >
                {formatPrice(shown.profit)} profit
              </span>
            </span>
          </>
        ) : (
          <span className="flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-stone-300 dark:bg-stone-600" />
              Buyers paid
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-2 rounded-sm bg-emerald-500" />
              Profit
            </span>
          </span>
        )}
      </div>

      <div
        role="group"
        tabIndex={0}
        aria-label="Revenue and profit over time. Use the left and right arrow keys to read each one."
        onKeyDown={(event) => {
          if (event.key === 'ArrowLeft')
            setActive(Math.max(0, (active ?? last + 1) - 1));
          else if (event.key === 'ArrowRight')
            setActive(Math.min(last, (active ?? -1) + 1));
          else if (event.key === 'Escape') setActive(null);
          else return;
          event.preventDefault();
        }}
        onBlur={() => setActive(null)}
        onPointerLeave={() => setActive(null)}
        className="relative h-44 rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30"
      >
        <div
          aria-hidden
          className="absolute inset-x-0 h-px bg-stone-200 dark:bg-stone-700"
          style={{ bottom: `${zero}%` }}
        />
        <div aria-hidden className="absolute inset-0 flex gap-0.5">
          {series.map((point, index) => (
            <div
              key={point.period}
              onPointerEnter={() => setActive(index)}
              className={cn(
                'relative h-full flex-1 rounded-sm',
                index === active && 'bg-stone-100 dark:bg-stone-800/70',
              )}
            >
              {point.revenue > 0 && (
                <div
                  className="absolute inset-x-0 mx-auto max-w-8 rounded-t-[3px] bg-stone-300 dark:bg-stone-600"
                  style={{
                    bottom: `${zero}%`,
                    height: `${(point.revenue / span) * 100}%`,
                  }}
                />
              )}
              {point.profit !== 0 && (
                <div
                  className={cn(
                    'absolute inset-x-0 mx-auto max-w-8',
                    point.profit > 0
                      ? 'rounded-t-[3px] bg-emerald-500'
                      : 'rounded-b-[3px] bg-red-500',
                  )}
                  style={
                    point.profit > 0
                      ? {
                          bottom: `${zero}%`,
                          height: `${(point.profit / span) * 100}%`,
                        }
                      : {
                          top: `${100 - zero}%`,
                          height: `${(-point.profit / span) * 100}%`,
                        }
                  }
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div
        aria-hidden
        className="flex gap-0.5 text-[10px] leading-none text-stone-500 dark:text-stone-400"
      >
        {series.map((point, index) => (
          <span
            key={point.period}
            className="min-w-0 flex-1 overflow-visible text-center whitespace-nowrap"
          >
            {index % labelEvery === 0
              ? periodLabel(point.period, granularity)
              : ''}
          </span>
        ))}
      </div>

      <table className="sr-only">
        <caption>Revenue and profit</caption>
        <thead>
          <tr>
            <th>Period</th>
            <th>Sales</th>
            <th>Buyers paid</th>
            <th>Profit</th>
          </tr>
        </thead>
        <tbody>
          {series.map((point) => (
            <tr key={point.period}>
              <td>{periodLabel(point.period, granularity, true)}</td>
              <td>{point.sales}</td>
              <td>{formatPrice(point.revenue)}</td>
              <td>{formatPrice(point.profit)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ProfitChart;
