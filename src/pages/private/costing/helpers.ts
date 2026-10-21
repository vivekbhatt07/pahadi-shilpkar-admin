import type {
  ChannelProfit,
  CostBreakdown,
  CostedListing,
  CostingSettings,
  CostLineType,
  Delivery,
  MaterialUnit,
  SaleChannel,
} from '@/types/api';

import { UNIT_SHORT } from './constants';

// The backend's costing maths, mirrored so editors can show what a change
// does before it's saved (see utils/costing.utils in the backend). The
// backend's figures are the ones kept.

const LINE_TYPES: CostLineType[] = [
  'MATERIAL',
  'LABOUR',
  'PACKAGING',
  'DELIVERY',
  'OVERHEAD',
  'OTHER',
];

export const roundMoney = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const roundPercent = (value: number) => Math.round(value * 10) / 10;

export const emptyBreakdown = (): CostBreakdown => ({
  MATERIAL: 0,
  LABOUR: 0,
  PACKAGING: 0,
  DELIVERY: 0,
  OVERHEAD: 0,
  OTHER: 0,
  total: 0,
});

type TLine = {
  type: CostLineType;
  quantity: number | null;
  wastagePercent: number | null;
  amount: number | null;
};

/** A material line costs quantity × price, plus wastage; any other its amount. */
export const lineCost = (line: TLine, materialUnitCost: number | null) => {
  const number = (value: number | null) =>
    value === null || Number.isNaN(value) ? 0 : value;
  return line.type === 'MATERIAL'
    ? number(line.quantity) *
        number(materialUnitCost) *
        (1 + number(line.wastagePercent) / 100)
    : number(line.amount);
};

/** A batch's costs by type, and one piece's: the batch over its size. */
export const sheetTotals = (
  lines: { type: CostLineType; cost: number }[],
  batchSize: number,
) => {
  const batch = emptyBreakdown();
  for (const line of lines) {
    batch[line.type] += line.cost;
    batch.total += line.cost;
  }
  const size = Number.isFinite(batchSize) && batchSize >= 1 ? batchSize : 1;
  const unit = emptyBreakdown();
  for (const type of [...LINE_TYPES, 'total'] as const) {
    unit[type] = batch[type] / size;
  }
  return { batch, unit };
};

const feeOf = (settings: CostingSettings, channel: SaleChannel) =>
  settings.channelFees.find((fee) => fee.channel === channel) ?? {
    channel,
    percent: 0,
    fixed: 0,
  };

/** The tax inside a price that includes it — 18% GST in ₹118 is ₹18. */
export const includedTax = (amount: number, taxPercent: number | null) =>
  taxPercent ? (amount * taxPercent) / (100 + taxPercent) : 0;

/** What a channel's cut comes to on a sale of `amount`. */
export const channelFeeOn = (
  amount: number,
  settings: CostingSettings,
  channel: SaleChannel,
) => {
  const fee = feeOf(settings, channel);
  return amount > 0 ? (amount * fee.percent) / 100 + fee.fixed : 0;
};

/**
 * What the buyer pays for delivery on top: a fixed fee, or — quoted with the
 * order — what sending it costs; nothing with free delivery.
 */
export const deliveryChargedFor = (
  delivery: Delivery | null,
  unitDeliveryCost: number,
) => (delivery?.charge === 'EXTRA' ? (delivery.fee ?? unitDeliveryCost) : 0);

type TPricing = {
  price: number;
  deliveryCharged: number;
  cost: number;
  settings: CostingSettings;
  channel: SaleChannel;
};

export const channelProfit = ({
  price,
  deliveryCharged,
  cost,
  settings,
  channel,
}: TPricing): ChannelProfit => {
  const gross = price + deliveryCharged;
  const tax = includedTax(gross, settings.taxPercent);
  const fee = channelFeeOn(gross, settings, channel);
  const profit = gross - tax - fee - cost;
  const net = gross - tax;
  return {
    channel,
    price,
    deliveryCharged: roundMoney(deliveryCharged),
    tax: roundMoney(tax),
    channelFee: roundMoney(fee),
    cost: roundMoney(cost),
    profit: roundMoney(profit),
    marginPercent: net > 0 ? roundPercent((profit / net) * 100) : null,
  };
};

/** The price reaching `marginPercent` on a channel, rounded up to the rupee. */
export const priceForMargin = ({
  cost,
  deliveryCharged,
  settings,
  channel,
  marginPercent,
}: Omit<TPricing, 'price'> & { marginPercent: number }) => {
  const fee = feeOf(settings, channel);
  const keptAfterTax = 100 / (100 + (settings.taxPercent ?? 0));
  const share = keptAfterTax * (1 - marginPercent / 100) - fee.percent / 100;
  if (share <= 0) return null;
  const gross = (cost + fee.fixed) / share;
  return Math.max(Math.ceil(roundMoney(gross - deliveryCharged)), 0);
};

const percentFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 1,
});

/** "32.5%", or "—" without one. */
export const formatPercent = (value: number | null) =>
  value === null ? '—' : `${percentFormatter.format(value)}%`;

const unitCostFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 4,
});

/** "₹0.45 / ml" — up to 4 decimals, as small unit costs need. */
export const formatUnitCost = (unitCost: number, unit: MaterialUnit) =>
  `${unitCostFormatter.format(unitCost)} / ${UNIT_SHORT[unit]}`;

const quantityFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 3,
});

/** "2.5 m", "500 ml" */
export const formatQuantity = (quantity: number, unit: MaterialUnit) =>
  `${quantityFormatter.format(quantity)} ${UNIT_SHORT[unit]}`;

/** What a margin reads as against the target — for colouring it. */
export const marginTone = (
  marginPercent: number | null,
  target: number | null,
): 'loss' | 'low' | 'good' | 'none' => {
  if (marginPercent === null) return 'none';
  if (marginPercent < 0) return 'loss';
  if (target !== null && marginPercent < target) return 'low';
  return 'good';
};

/** "Karwa Chauth Thali — Peacock" */
export const listingName = (
  listing: Pick<CostedListing, 'name' | 'variantTitle'>,
) =>
  listing.variantTitle
    ? `${listing.name} — ${listing.variantTitle}`
    : listing.name;
