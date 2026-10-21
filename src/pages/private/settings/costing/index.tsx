import { useState } from 'react';
import { Loader2, Percent, Store, Target } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/helpers/format';
import { useCostingSettings, useUpdateCostingSettings } from '@/hooks/costing';
import { useUnsavedChangesWarning } from '@/hooks/useUnsavedChangesWarning';
import type { CostingSettings, SaleChannel } from '@/types/api';

import { SALE_CHANNELS } from '../../costing/constants';
import SettingsSection from '../components/SettingsSection';

type TFeeDraft = { percent: string; fixed: string };

type TDraft = {
  fees: Record<SaleChannel, TFeeDraft>;
  targetMarginPercent: string;
  taxPercent: string;
};

const toDraft = (settings: CostingSettings): TDraft => ({
  fees: Object.fromEntries(
    SALE_CHANNELS.map(({ value }) => {
      const fee = settings.channelFees.find((entry) => entry.channel === value);
      return [
        value,
        {
          percent: fee?.percent ? String(fee.percent) : '',
          fixed: fee?.fixed ? String(fee.fixed) : '',
        },
      ];
    }),
  ) as Record<SaleChannel, TFeeDraft>,
  targetMarginPercent:
    settings.targetMarginPercent === null
      ? ''
      : String(settings.targetMarginPercent),
  taxPercent: settings.taxPercent === null ? '' : String(settings.taxPercent),
});

const DECIMAL = /^\d+(?:\.\d{1,2})?$/;
const isPercent = (value: string, max = 100) =>
  value === '' || (DECIMAL.test(value) && Number(value) <= max);
const isMoney = (value: string) => value === '' || DECIMAL.test(value);

/** The channels whose cut is worth setting — the rest keep nothing. */
const FEE_HINTS: Partial<Record<SaleChannel, string>> = {
  AMAZON: 'Referral fee and closing fee',
  FLIPKART: 'Commission, fixed and collection fees',
  MEESHO: 'Usually no commission — maybe a shipping share',
  ETSY: 'Transaction, payment and listing fees',
  WHATSAPP: 'A payment gateway or UPI charge, if any',
  WEBSITE: 'A payment gateway’s cut',
};

const CostingForm = ({ settings }: { settings: CostingSettings }) => {
  const update = useUpdateCostingSettings();
  const [saved, setSaved] = useState(() => toDraft(settings));
  const [draft, setDraft] = useState(saved);
  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);
  useUnsavedChangesWarning(isDirty && !update.isPending);

  const problem = !isPercent(draft.targetMarginPercent, 99)
    ? 'Target margin is a percentage from 0 to 99'
    : !isPercent(draft.taxPercent)
      ? 'Tax is a percentage from 0 to 100'
      : SALE_CHANNELS.some(
            ({ value }) =>
              !isPercent(draft.fees[value].percent) ||
              !isMoney(draft.fees[value].fixed),
          )
        ? 'A channel’s cut is a percentage, plus a rupee amount'
        : null;

  const setFee = (channel: SaleChannel, changes: Partial<TFeeDraft>) =>
    setDraft({
      ...draft,
      fees: {
        ...draft.fees,
        [channel]: { ...draft.fees[channel], ...changes },
      },
    });

  const save = () => {
    if (problem) return;
    update.mutate(
      {
        channelFees: SALE_CHANNELS.map(({ value }) => ({
          channel: value,
          percent: Number(draft.fees[value].percent || 0),
          fixed: Number(draft.fees[value].fixed || 0),
        })).filter((fee) => fee.percent > 0 || fee.fixed > 0),
        targetMarginPercent:
          draft.targetMarginPercent === ''
            ? null
            : Number(draft.targetMarginPercent),
        taxPercent: draft.taxPercent === '' ? null : Number(draft.taxPercent),
      },
      {
        onSuccess: (response) => {
          if (!response.data) return;
          const next = toDraft(response.data);
          setSaved(next);
          setDraft(next);
        },
      },
    );
  };

  // An example: what a ₹1,000 sale leaves on Amazon
  const amazon = draft.fees.AMAZON;
  const example =
    isPercent(amazon.percent) &&
    isMoney(amazon.fixed) &&
    (amazon.percent || amazon.fixed)
      ? (1000 * Number(amazon.percent || 0)) / 100 + Number(amazon.fixed || 0)
      : null;

  return (
    <form
      className="flex flex-col gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        save();
      }}
    >
      <SettingsSection
        icon={<Target />}
        title="Target margin"
        description="The share of each sale — after tax — you aim to keep as profit. Listings below it are flagged, and their suggested price reaches it."
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:max-w-48">
          Aim for
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={99}
            step="0.5"
            placeholder="Not set"
            value={draft.targetMarginPercent}
            onChange={(event) =>
              setDraft({ ...draft, targetMarginPercent: event.target.value })
            }
            endAdornment={<span className="text-sm text-stone-400">%</span>}
            disabled={update.isPending}
          />
        </label>
      </SettingsSection>

      <SettingsSection
        icon={<Percent />}
        title="Tax in your prices"
        description="If your prices include GST, the rate — it's taken out before profit. Leave it empty if you don't charge tax."
      >
        <label className="flex flex-col gap-1.5 text-sm font-medium sm:max-w-48">
          GST included
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            max={100}
            step="0.5"
            placeholder="None"
            value={draft.taxPercent}
            onChange={(event) =>
              setDraft({ ...draft, taxPercent: event.target.value })
            }
            endAdornment={<span className="text-sm text-stone-400">%</span>}
            disabled={update.isPending}
          />
        </label>
      </SettingsSection>

      <SettingsSection
        icon={<Store />}
        title="What each channel keeps"
        description="A marketplace's commission, a payment gateway's cut — a percentage of what the buyer pays, plus a fixed amount per order. Channels left empty keep nothing."
      >
        <div className="flex flex-col divide-y divide-stone-100 dark:divide-stone-800">
          {SALE_CHANNELS.map(({ value, label }) => (
            <div
              key={value}
              className="grid grid-cols-[minmax(0,1fr)_6.5rem_6.5rem] items-center gap-3 py-2.5"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-stone-800 dark:text-stone-200">
                  {label}
                </p>
                {FEE_HINTS[value] && (
                  <p className="truncate text-xs text-stone-400 dark:text-stone-500">
                    {FEE_HINTS[value]}
                  </p>
                )}
              </div>
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                max={100}
                step="0.1"
                placeholder="0"
                aria-label={`${label} cut, percent`}
                value={draft.fees[value].percent}
                onChange={(event) =>
                  setFee(value, { percent: event.target.value })
                }
                endAdornment={<span className="text-xs text-stone-400">%</span>}
                disabled={update.isPending}
              />
              <Input
                type="number"
                inputMode="decimal"
                min={0}
                step="0.01"
                placeholder="0"
                aria-label={`${label} fixed fee per order`}
                value={draft.fees[value].fixed}
                onChange={(event) =>
                  setFee(value, { fixed: event.target.value })
                }
                startAdornment={
                  <span className="text-xs text-stone-400">+₹</span>
                }
                disabled={update.isPending}
              />
            </div>
          ))}
        </div>
        {example !== null && (
          <p className="text-xs text-stone-500 dark:text-stone-400">
            On a {formatPrice(1000)} Amazon order, Amazon keeps{' '}
            <span className="font-medium tabular-nums">
              {formatPrice(example)}
            </span>
            .
          </p>
        )}
      </SettingsSection>

      {problem && (
        <p className="text-sm font-medium text-red-600 dark:text-red-400">
          {problem}
        </p>
      )}

      <div className="flex justify-end gap-2">
        {isDirty && (
          <Button
            type="button"
            variant="ghost"
            onClick={() => setDraft(saved)}
            disabled={update.isPending}
          >
            Discard changes
          </Button>
        )}
        <Button
          type="submit"
          disabled={!isDirty || problem !== null || update.isPending}
          startAdornment={
            update.isPending ? <Loader2 className="animate-spin" /> : undefined
          }
        >
          Save
        </Button>
      </div>
    </form>
  );
};

/** What the costing pages assume about every sale — fees, tax, target. */
const CostingSettingsPage = () => {
  const settings = useCostingSettings();

  if (settings.isPending || !settings.data) {
    return (
      <div className="flex flex-col gap-6" role="status" aria-label="Loading">
        <Skeleton className="h-40 w-full rounded-xl" />
        <Skeleton className="h-72 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <CostingForm
      key={settings.data.updatedAt ?? 'never'}
      settings={settings.data}
    />
  );
};

export default CostingSettingsPage;
