import { formatBytes } from '@/helpers/format';
import type { UsageMeter } from '@/types/api';

/** From here the dashboard warns and the bar turns amber; red near the end. */
export const USAGE_WARNING_PERCENT = 80;
export const USAGE_DANGER_PERCENT = 95;

export type TUsageTone = 'normal' | 'warning' | 'danger';

export const usageTone = (percent: number | null): TUsageTone =>
  percent === null || percent < USAGE_WARNING_PERCENT
    ? 'normal'
    : percent < USAGE_DANGER_PERCENT
      ? 'warning'
      : 'danger';

export const formatCredits = (credits: number) =>
  credits.toLocaleString('en-IN', { maximumFractionDigits: 2 });

/**
 * One meter in words — "4,200 · 4.2 credits" on a plan of credits, "2.5 GB
 * of 10 GB" on one that caps each meter.
 */
export const describeMeter = (meter: UsageMeter, unit: 'count' | 'bytes') => {
  const amount = (value: number) =>
    unit === 'bytes' ? formatBytes(value) : value.toLocaleString('en-IN');

  if (meter.limit !== null) {
    return `${amount(meter.used)} of ${amount(meter.limit)}`;
  }
  if (meter.credits !== null) {
    return `${amount(meter.used)} · ${formatCredits(meter.credits)} ${meter.credits === 1 ? 'credit' : 'credits'}`;
  }
  return amount(meter.used);
};
