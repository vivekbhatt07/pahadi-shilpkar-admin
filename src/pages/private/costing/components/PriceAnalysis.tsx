import { Link } from 'react-router';
import { Info } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ROUTES } from '@/constants/routes';
import { formatDelivery, formatPrice } from '@/helpers/format';
import type {
  CostBreakdown,
  CostingSettings,
  CostingStatus,
  Delivery,
} from '@/types/api';

import { SALE_CHANNELS } from '../constants';
import {
  channelProfit,
  deliveryChargedFor,
  formatPercent,
  priceForMargin,
} from '../helpers';
import BreakdownBar from './BreakdownBar';
import ChannelProfitTable from './ChannelProfitTable';
import ProfitValue from './ProfitValue';
import StatusBadge from './StatusBadge';

type TPriceAnalysisProps = {
  title?: string;
  price: number;
  delivery: Delivery | null;
  /** One piece's costs; null — no cost to go on. */
  cost: CostBreakdown | null;
  settings: CostingSettings;
  /** "Costed from the product's sheet" — where the cost comes from. */
  note?: React.ReactNode;
};

const statusOf = (
  profit: number,
  marginPercent: number | null,
  target: number | null,
): CostingStatus =>
  profit < 0
    ? 'LOSS'
    : target !== null && (marginPercent ?? 0) < target
      ? 'BELOW_TARGET'
      : 'HEALTHY';

/**
 * What one piece earns at its price: on WhatsApp (most orders), and on every
 * channel that takes a cut — with the price that would reach the target
 * margin and the one that only covers the costs. Worked out live from the
 * sheet being edited.
 */
const PriceAnalysis = ({
  title = 'Profit at today’s price',
  price,
  delivery,
  cost,
  settings,
  note,
}: TPriceAnalysisProps) => {
  if (!cost || cost.total <= 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Add what a batch uses and costs, and its profit on every channel
            shows here — with the price to ask for your target margin.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatusBadge status="NO_COST" />
        </CardContent>
      </Card>
    );
  }

  const deliveryCharged = deliveryChargedFor(delivery, cost.DELIVERY);
  const pricing = { deliveryCharged, cost: cost.total, settings };
  const rows = SALE_CHANNELS.map(({ value }) =>
    channelProfit({ ...pricing, price, channel: value }),
  );
  const whatsapp = rows.find((row) => row.channel === 'WHATSAPP')!;
  const suggested =
    settings.targetMarginPercent === null
      ? null
      : priceForMargin({
          ...pricing,
          channel: 'WHATSAPP',
          marginPercent: settings.targetMarginPercent,
        });
  const breakEven = priceForMargin({
    ...pricing,
    channel: 'WHATSAPP',
    marginPercent: 0,
  });
  const status = statusOf(
    whatsapp.profit,
    whatsapp.marginPercent,
    settings.targetMarginPercent,
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Selling at {formatPrice(price)}
              {delivery && ` · ${formatDelivery(delivery).toLowerCase()}`}
            </CardDescription>
          </div>
          <StatusBadge status={status} />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-stone-50 p-3 dark:bg-stone-900/60">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Profit a piece on WhatsApp
            </p>
            <ProfitValue
              profit={whatsapp.profit}
              target={settings.targetMarginPercent}
              marginPercent={whatsapp.marginPercent}
              className="text-lg"
            />
          </div>
          <div className="rounded-lg bg-stone-50 p-3 dark:bg-stone-900/60">
            <p className="text-xs text-stone-500 dark:text-stone-400">
              Costs to make & send
            </p>
            <p className="text-lg font-medium text-stone-900 tabular-nums dark:text-stone-50">
              {formatPrice(whatsapp.cost)}
            </p>
          </div>
        </div>

        <BreakdownBar breakdown={cost} profit={whatsapp.profit} />

        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs text-stone-500 dark:text-stone-400">
              Breaks even at
            </dt>
            <dd className="font-medium tabular-nums">
              {breakEven === null ? '—' : formatPrice(breakEven)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500 dark:text-stone-400">
              {settings.targetMarginPercent === null
                ? 'Target margin'
                : `For a ${formatPercent(settings.targetMarginPercent)} margin`}
            </dt>
            <dd className="font-medium tabular-nums">
              {settings.targetMarginPercent === null ? (
                <Link
                  to={ROUTES.PRIVATE.SETTINGS.COSTING}
                  className="text-xs font-normal text-accent-700 underline underline-offset-2 dark:text-accent-400"
                >
                  Set one
                </Link>
              ) : suggested === null ? (
                'Out of reach'
              ) : (
                <>
                  {formatPrice(suggested)}
                  {suggested > price && (
                    <span className="ml-1 text-xs font-normal text-amber-700 dark:text-amber-400">
                      +{formatPrice(suggested - price)}
                    </span>
                  )}
                </>
              )}
            </dd>
          </div>
        </dl>

        <ChannelProfitTable rows={rows} settings={settings} />

        {note && (
          <p className="flex items-start gap-1.5 text-xs text-stone-500 dark:text-stone-400">
            <Info className="mt-0.5 size-3.5 shrink-0" />
            <span>{note}</span>
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default PriceAnalysis;
