import { useState } from 'react';
import dayjs from 'dayjs';
import { ChartColumn, Table2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DailyBuyClicks } from '@/types/api';

import { CHANNEL_SWATCHES } from '../constants';

/** Up to this many days, every column gets an axis label. */
const MAX_LABELLED_DAYS = 14;

const AXIS_TEXT =
  'text-[10px] leading-none whitespace-nowrap text-stone-500 dark:text-stone-400';

const formatCount = (value: number) => value.toLocaleString('en-IN');

/** 1, 2 or 5 × a power of ten, never below 1 — clicks are whole. */
const niceStep = (rough: number) => {
  if (rough <= 1) return 1;
  const power = 10 ** Math.floor(Math.log10(rough));
  const fraction = rough / power;
  const nice = fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;
  return nice * power;
};

/** A clean top value and the gridlines under it, about three steps apart. */
const buildScale = (max: number) => {
  const step = niceStep(max / 3);
  const top = Math.max(step, Math.ceil(max / step) * step);
  return {
    top,
    ticks: Array.from({ length: top / step + 1 }, (_, i) => i * step),
  };
};

const percentOf = (value: number, top: number) => `${(value / top) * 100}%`;

const dayName = (day: DailyBuyClicks, isToday: boolean) =>
  isToday
    ? `Today, ${dayjs(day.date).format('D MMM')}`
    : dayjs(day.date).format('ddd, D MMM');

const nextIndex = (key: string, current: number, last: number) => {
  switch (key) {
    case 'ArrowLeft':
      return Math.max(0, current - 1);
    case 'ArrowRight':
      return Math.min(last, current + 1);
    case 'Home':
      return 0;
    case 'End':
      return last;
    default:
      return null;
  }
};

const TooltipRow = ({
  swatch,
  value,
  label,
}: {
  swatch: string;
  value: number;
  label: string;
}) => (
  <p className="flex items-center gap-2">
    <span className={cn('h-0.5 w-3 shrink-0 rounded-full', swatch)} />
    <span className="font-semibold text-stone-900 tabular-nums dark:text-stone-50">
      {formatCount(value)}
    </span>
    <span className="text-stone-500 dark:text-stone-400">{label}</span>
  </p>
);

const XAxis = ({ daily }: { daily: DailyBuyClicks[] }) => {
  const last = daily.length - 1;

  if (daily.length <= MAX_LABELLED_DAYS) {
    return (
      <div aria-hidden className={cn('mt-1.5 flex gap-0.5', AXIS_TEXT)}>
        {daily.map((day, i) => (
          <span key={day.date} className="min-w-0 flex-1 truncate text-center">
            {i === last ? 'Today' : dayjs(day.date).format('ddd')}
          </span>
        ))}
      </div>
    );
  }

  // Too narrow for every date: the ends and the middle
  const middle = Math.floor(last / 2);
  return (
    <div aria-hidden className={cn('relative mt-1.5 h-2.5', AXIS_TEXT)}>
      <span className="absolute left-0">
        {dayjs(daily[0].date).format('D MMM')}
      </span>
      <span
        className="absolute -translate-x-1/2"
        style={{ left: percentOf(middle + 0.5, daily.length) }}
      >
        {dayjs(daily[middle].date).format('D MMM')}
      </span>
      <span className="absolute right-0">Today</span>
    </div>
  );
};

const Plot = ({ daily }: { daily: DailyBuyClicks[] }) => {
  const [active, setActive] = useState<number | null>(null);

  const count = daily.length;
  const last = count - 1;
  const max = Math.max(1, ...daily.map((d) => d.whatsapp + d.marketplace));
  const { top, ticks } = buildScale(max);
  const activeDay = active === null ? null : daily[active];

  // The whole slot is the hit target, gaps included
  const indexAt = (clientX: number, element: HTMLElement) => {
    const { left, width } = element.getBoundingClientRect();
    const index = Math.floor(((clientX - left) / width) * count);
    return Math.min(last, Math.max(0, index));
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') return setActive(null);
    const next = nextIndex(event.key, active ?? last, last);
    if (next === null) return;
    event.preventDefault();
    setActive(next);
  };

  // Beside the column, never over it — flipped left past the middle
  const center = active === null ? 0 : ((active + 0.5) / count) * 100;
  const tooltipPosition =
    center > 50
      ? { right: `calc(${100 - center}% + 16px)` }
      : { left: `calc(${center}% + 16px)` };

  return (
    <>
      <div className="flex gap-2">
        {/* Y-axis ticks — the invisible top label sizes the gutter */}
        <div
          aria-hidden
          className={cn('relative h-28 shrink-0 text-right', AXIS_TEXT)}
        >
          <span className="invisible tabular-nums">{formatCount(top)}</span>
          {ticks.map((tick) => (
            <span
              key={tick}
              className="absolute right-0 translate-y-1/2 tabular-nums"
              style={{ bottom: percentOf(tick, top) }}
            >
              {formatCount(tick)}
            </span>
          ))}
        </div>

        <div className="min-w-0 flex-1">
          <div
            role="group"
            tabIndex={0}
            aria-label="Buy clicks per day. Use the left and right arrow keys to read each day."
            onPointerDown={(e) =>
              setActive(indexAt(e.clientX, e.currentTarget))
            }
            onPointerMove={(e) =>
              setActive(indexAt(e.clientX, e.currentTarget))
            }
            onPointerLeave={(e) => {
              // A tap keeps its tooltip until the chart loses focus
              if (e.pointerType === 'mouse') setActive(null);
            }}
            onPointerCancel={() => setActive(null)}
            onFocus={() => setActive((current) => current ?? last)}
            onBlur={() => setActive(null)}
            onKeyDown={onKeyDown}
            className="relative h-28 touch-pan-y rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30"
          >
            {ticks.map((tick) => (
              <div
                key={tick}
                aria-hidden
                className={cn(
                  'absolute inset-x-0 h-px translate-y-1/2',
                  tick === 0
                    ? 'bg-stone-200 dark:bg-stone-700'
                    : 'bg-stone-100 dark:bg-stone-800',
                )}
                style={{ bottom: percentOf(tick, top) }}
              />
            ))}

            <div aria-hidden className="absolute inset-0 flex gap-0.5">
              {daily.map((day, i) => {
                const total = day.whatsapp + day.marketplace;
                return (
                  <div
                    key={day.date}
                    className={cn(
                      'relative h-full flex-1 rounded-sm',
                      i === active && 'bg-stone-100 dark:bg-stone-800/70',
                    )}
                  >
                    {total > 0 && (
                      // Segments split the column's height, so the 2px gap
                      // between them never adds to it
                      <div
                        className="absolute inset-x-0 bottom-0 mx-auto flex max-w-6 flex-col gap-0.5"
                        style={{ height: percentOf(total, top), minHeight: 2 }}
                      >
                        {day.marketplace > 0 && (
                          <div
                            className={cn(
                              'rounded-t-[4px]',
                              CHANNEL_SWATCHES.MARKETPLACE,
                            )}
                            style={{ flexGrow: day.marketplace }}
                          />
                        )}
                        {day.whatsapp > 0 && (
                          <div
                            className={cn(
                              CHANNEL_SWATCHES.WHATSAPP,
                              day.marketplace === 0 && 'rounded-t-[4px]',
                            )}
                            style={{ flexGrow: day.whatsapp }}
                          />
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {activeDay && active !== null && (
              <div
                aria-hidden
                className="pointer-events-none absolute top-0 z-10 flex w-max flex-col gap-1.5 rounded-lg border border-stone-200 bg-white px-2.5 py-2 text-xs shadow-md dark:border-stone-700 dark:bg-stone-800"
                style={tooltipPosition}
              >
                <p className="text-stone-500 dark:text-stone-400">
                  {dayName(activeDay, active === last)}
                </p>
                <TooltipRow
                  swatch={CHANNEL_SWATCHES.WHATSAPP}
                  value={activeDay.whatsapp}
                  label="WhatsApp"
                />
                <TooltipRow
                  swatch={CHANNEL_SWATCHES.MARKETPLACE}
                  value={activeDay.marketplace}
                  label="Marketplace"
                />
              </div>
            )}
          </div>

          <XAxis daily={daily} />
        </div>
      </div>

      <p className="sr-only" aria-live="polite">
        {activeDay && active !== null
          ? `${dayName(activeDay, active === last)}: ${activeDay.whatsapp} WhatsApp, ${activeDay.marketplace} marketplace`
          : ''}
      </p>
    </>
  );
};

/** The same numbers as the chart, newest day first. */
const DailyClicksTable = ({ daily }: { daily: DailyBuyClicks[] }) => {
  const last = daily.length - 1;
  const rows = daily.map((day, i) => ({ day, isToday: i === last })).reverse();

  return (
    <div
      role="region"
      tabIndex={0}
      aria-label="Buy clicks per day"
      className="max-h-56 overflow-y-auto rounded-lg border border-stone-100 outline-none focus-visible:ring-2 focus-visible:ring-accent-500/30 dark:border-stone-800"
    >
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-stone-50 text-stone-500 dark:bg-stone-800 dark:text-stone-400">
          <tr>
            <th scope="col" className="px-3 py-2 text-left font-medium">
              Day
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              WhatsApp
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Marketplace
            </th>
            <th scope="col" className="px-3 py-2 text-right font-medium">
              Total
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100 tabular-nums dark:divide-stone-800">
          {rows.map(({ day, isToday }) => (
            <tr key={day.date}>
              <th
                scope="row"
                className="px-3 py-1.5 text-left font-normal text-stone-600 dark:text-stone-300"
              >
                {dayName(day, isToday)}
              </th>
              <td className="px-3 py-1.5 text-right text-stone-900 dark:text-stone-50">
                {formatCount(day.whatsapp)}
              </td>
              <td className="px-3 py-1.5 text-right text-stone-900 dark:text-stone-50">
                {formatCount(day.marketplace)}
              </td>
              <td className="px-3 py-1.5 text-right font-medium text-stone-900 dark:text-stone-50">
                {formatCount(day.whatsapp + day.marketplace)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Buy clicks per day, stacked by channel, with a table view of the same
 * numbers. Hover, tap or arrow keys read a single day.
 */
const DailyClicksChart = ({ daily }: { daily: DailyBuyClicks[] }) => {
  const [view, setView] = useState<'chart' | 'table'>('chart');

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold tracking-wider text-stone-400 uppercase dark:text-stone-500">
          Per day
        </p>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setView(view === 'chart' ? 'table' : 'chart')}
          className="-mr-2 h-7 gap-1.5 px-2 text-xs text-stone-500 md:h-7 dark:text-stone-400 [&_svg]:size-3.5"
        >
          {view === 'chart' ? <Table2 /> : <ChartColumn />}
          {view === 'chart' ? 'Show table' : 'Show chart'}
        </Button>
      </div>

      {view === 'chart' ? (
        <Plot daily={daily} />
      ) : (
        <DailyClicksTable daily={daily} />
      )}
    </div>
  );
};

export default DailyClicksChart;
