import { Link } from 'react-router';

import { ROUTES } from '@/constants/routes';
import { formatPrice } from '@/helpers/format';
import { cn } from '@/lib/utils';
import type { ChannelProfit, CostingSettings, SaleChannel } from '@/types/api';

import { CHANNEL_LABELS } from '../constants';
import ProfitValue from './ProfitValue';

type TChannelProfitTableProps = {
  rows: ChannelProfit[];
  settings: CostingSettings;
  /** Highlighted — the channel most orders come through. */
  highlight?: SaleChannel;
};

/**
 * One piece's profit on each channel worth showing: WhatsApp and in person,
 * and every channel that takes a fee — the rest keep nothing, so they'd only
 * repeat the WhatsApp row. What the buyer pays, the tax and the cost are the
 * same on every channel, so they're said once, above; only each channel's
 * cut and what's left differ.
 */
const ChannelProfitTable = ({
  rows,
  settings,
  highlight = 'WHATSAPP',
}: TChannelProfitTableProps) => {
  const withFees = new Set(settings.channelFees.map((fee) => fee.channel));
  const shown = rows.filter(
    (row) =>
      row.channel === 'WHATSAPP' ||
      row.channel === 'OFFLINE' ||
      withFees.has(row.channel),
  );
  const [first] = shown;
  if (!first) return null;

  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs text-stone-500 dark:text-stone-400">
        Buyer pays{' '}
        <span className="font-medium text-stone-800 tabular-nums dark:text-stone-200">
          {formatPrice(first.price + first.deliveryCharged)}
        </span>
        {first.tax > 0 && (
          <>
            {' · '}tax{' '}
            <span className="tabular-nums">{formatPrice(first.tax)}</span>
          </>
        )}
        {' · '}costs{' '}
        <span className="tabular-nums">{formatPrice(first.cost)}</span>
      </p>
      <ul className="flex flex-col divide-y divide-stone-100 rounded-lg border border-stone-200 dark:divide-stone-800 dark:border-stone-800">
        {shown.map((row) => (
          <li
            key={row.channel}
            className={cn(
              'flex items-center justify-between gap-3 px-3 py-2 text-sm',
              row.channel === highlight &&
                'bg-accent-50/50 dark:bg-accent-950/20',
            )}
          >
            <span className="font-medium text-stone-800 dark:text-stone-200">
              {CHANNEL_LABELS[row.channel]}
              {row.channelFee > 0 && (
                <span className="ml-1.5 text-xs font-normal text-stone-400 tabular-nums">
                  keeps {formatPrice(row.channelFee)}
                </span>
              )}
            </span>
            <ProfitValue
              profit={row.profit}
              marginPercent={row.marginPercent}
              target={settings.targetMarginPercent}
            />
          </li>
        ))}
      </ul>
      <p className="text-xs text-stone-400 dark:text-stone-500">
        Margins are of what's left after tax. Set each marketplace's commission,
        your tax and your target margin in{' '}
        <Link
          to={ROUTES.PRIVATE.SETTINGS.COSTING}
          className="underline underline-offset-2"
        >
          Costing settings
        </Link>
        .
      </p>
    </div>
  );
};

export default ChannelProfitTable;
