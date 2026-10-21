import dayjs from 'dayjs';

import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

/** "2026-10-05" — whole days, read by the API as India-time days. */
export type TDateRange = { from?: string; to?: string };

const DAY = 'YYYY-MM-DD';

const PRESETS: { value: string; label: string; range: () => TDateRange }[] = [
  {
    value: '7d',
    label: 'Last 7 days',
    range: () => ({
      from: dayjs().subtract(6, 'day').format(DAY),
      to: dayjs().format(DAY),
    }),
  },
  {
    value: '30d',
    label: 'Last 30 days',
    range: () => ({
      from: dayjs().subtract(29, 'day').format(DAY),
      to: dayjs().format(DAY),
    }),
  },
  {
    value: 'month',
    label: 'This month',
    range: () => ({
      from: dayjs().startOf('month').format(DAY),
      to: dayjs().format(DAY),
    }),
  },
  {
    value: 'last-month',
    label: 'Last month',
    range: () => ({
      from: dayjs().subtract(1, 'month').startOf('month').format(DAY),
      to: dayjs().subtract(1, 'month').endOf('month').format(DAY),
    }),
  },
  {
    value: '3m',
    label: 'Last 3 months',
    range: () => ({
      from: dayjs().subtract(2, 'month').startOf('month').format(DAY),
      to: dayjs().format(DAY),
    }),
  },
  {
    value: 'year',
    label: 'This year',
    range: () => ({
      from: dayjs().startOf('year').format(DAY),
      to: dayjs().format(DAY),
    }),
  },
];

const ALL_TIME = 'all';
const CUSTOM = 'custom';

/** Which preset a range is, if any. */
const presetOf = (range: TDateRange, allowAllTime: boolean) => {
  if (allowAllTime && !range.from && !range.to) return ALL_TIME;
  return (
    PRESETS.find((preset) => {
      const candidate = preset.range();
      return candidate.from === range.from && candidate.to === range.to;
    })?.value ?? CUSTOM
  );
};

type TDateRangeFilterProps = {
  value: TDateRange;
  onChange: (range: TDateRange) => void;
  /** Offer "All time" — an empty range. */
  allowAllTime?: boolean;
};

/** A preset — this month, the last 30 days — or two dates of your own. */
const DateRangeFilter = ({
  value,
  onChange,
  allowAllTime = false,
}: TDateRangeFilterProps) => {
  const preset = presetOf(value, allowAllTime);

  return (
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
      <Select
        value={preset}
        onValueChange={(next) => {
          if (next === ALL_TIME) return onChange({});
          if (next === CUSTOM) {
            return onChange({
              from: value.from ?? dayjs().subtract(29, 'day').format(DAY),
              to: value.to ?? dayjs().format(DAY),
            });
          }
          onChange(PRESETS.find((option) => option.value === next)!.range());
        }}
      >
        <SelectTrigger aria-label="Dates" className="sm:w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {allowAllTime && <SelectItem value={ALL_TIME}>All time</SelectItem>}
          {PRESETS.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
          <SelectItem value={CUSTOM}>Pick dates…</SelectItem>
        </SelectContent>
      </Select>
      {preset === CUSTOM && (
        <div className="flex items-center gap-2">
          <Input
            type="date"
            aria-label="From"
            value={value.from ?? ''}
            max={value.to}
            onChange={(event) =>
              onChange({ ...value, from: event.target.value || undefined })
            }
            className="w-40"
          />
          <span className="text-sm text-stone-400">to</span>
          <Input
            type="date"
            aria-label="To"
            value={value.to ?? ''}
            min={value.from}
            onChange={(event) =>
              onChange({ ...value, to: event.target.value || undefined })
            }
            className="w-40"
          />
        </div>
      )}
    </div>
  );
};

export default DateRangeFilter;
