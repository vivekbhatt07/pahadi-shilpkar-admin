import type {
  CostedListingSort,
  CostingStatus,
  CostLineType,
  MaterialSort,
  MaterialUnit,
  SaleChannel,
} from '@/types/api';

/** As the backend allows. */
export const COSTING_LIMITS = {
  MATERIAL_NAME_MAX: 80,
  MATERIAL_CATEGORY_MAX: 40,
  MATERIAL_SUPPLIER_MAX: 80,
  MATERIAL_NOTES_MAX: 500,
  UNIT_COST_MAX: 10000000,
  QUANTITY_MAX: 10000000,
  PURCHASE_NOTE_MAX: 300,
  MONEY_MAX: 10000000,
  SHEET_LINES_MAX: 60,
  BATCH_SIZE_MAX: 100000,
  SHEET_NOTES_MAX: 1000,
  LINE_LABEL_MAX: 80,
  SALE_ITEMS_MAX: 50,
  SALE_ITEM_NAME_MAX: 150,
  SALE_ITEM_QUANTITY_MAX: 10000,
  CUSTOMER_NAME_MAX: 80,
  CUSTOMER_PHONE_MAX: 20,
  SALE_NOTE_MAX: 1000,
} as const;

export const MATERIAL_UNITS: {
  value: MaterialUnit;
  label: string;
  /** "₹0.45 / ml" */
  short: string;
}[] = [
  { value: 'PIECE', label: 'Piece', short: 'pc' },
  { value: 'PAIR', label: 'Pair', short: 'pair' },
  { value: 'SET', label: 'Set', short: 'set' },
  { value: 'PACKET', label: 'Packet', short: 'packet' },
  { value: 'SHEET', label: 'Sheet', short: 'sheet' },
  { value: 'ROLL', label: 'Roll', short: 'roll' },
  { value: 'METRE', label: 'Metre', short: 'm' },
  { value: 'CENTIMETRE', label: 'Centimetre', short: 'cm' },
  { value: 'GRAM', label: 'Gram', short: 'g' },
  { value: 'KILOGRAM', label: 'Kilogram', short: 'kg' },
  { value: 'MILLILITRE', label: 'Millilitre', short: 'ml' },
  { value: 'LITRE', label: 'Litre', short: 'L' },
];

export const UNIT_SHORT = Object.fromEntries(
  MATERIAL_UNITS.map((unit) => [unit.value, unit.short]),
) as Record<MaterialUnit, string>;

export const UNIT_LABELS = Object.fromEntries(
  MATERIAL_UNITS.map((unit) => [unit.value, unit.label]),
) as Record<MaterialUnit, string>;

/** Each type of cost: its name, a hint, and its colour in breakdowns. */
export const COST_LINE_TYPES: {
  value: CostLineType;
  label: string;
  hint: string;
  swatch: string;
}[] = [
  {
    value: 'MATERIAL',
    label: 'Materials',
    hint: 'Plates, paint, lace — priced from your raw materials',
    swatch: 'bg-amber-500',
  },
  {
    value: 'LABOUR',
    label: 'Labour',
    hint: 'What the artisans are paid for the batch',
    swatch: 'bg-sky-500',
  },
  {
    value: 'PACKAGING',
    label: 'Packaging',
    hint: 'Boxes, bubble wrap, tissue, tags',
    swatch: 'bg-violet-500',
  },
  {
    value: 'DELIVERY',
    label: 'Delivery',
    hint: 'What sending it costs you — the courier',
    swatch: 'bg-teal-500',
  },
  {
    value: 'OVERHEAD',
    label: 'Overheads',
    hint: 'A share of rent, power, tools wearing out',
    swatch: 'bg-stone-500',
  },
  {
    value: 'OTHER',
    label: 'Other',
    hint: 'Anything else the batch costs',
    swatch: 'bg-rose-400',
  },
];

export const COST_LINE_LABELS = Object.fromEntries(
  COST_LINE_TYPES.map((type) => [type.value, type.label]),
) as Record<CostLineType, string>;

export const SALE_CHANNELS: { value: SaleChannel; label: string }[] = [
  { value: 'WHATSAPP', label: 'WhatsApp' },
  { value: 'INSTAGRAM', label: 'Instagram' },
  { value: 'FACEBOOK', label: 'Facebook' },
  { value: 'AMAZON', label: 'Amazon' },
  { value: 'FLIPKART', label: 'Flipkart' },
  { value: 'MEESHO', label: 'Meesho' },
  { value: 'ETSY', label: 'Etsy' },
  { value: 'WEBSITE', label: 'Website' },
  { value: 'OFFLINE', label: 'In person' },
  { value: 'OTHER', label: 'Other' },
];

export const CHANNEL_LABELS = Object.fromEntries(
  SALE_CHANNELS.map((channel) => [channel.value, channel.label]),
) as Record<SaleChannel, string>;

export const COSTING_STATUSES: {
  value: CostingStatus;
  label: string;
  variant: 'secondary' | 'destructive' | 'warning' | 'success';
  description: string;
}[] = [
  {
    value: 'LOSS',
    label: 'Loss',
    variant: 'destructive',
    description: 'Costs more to make and sell than it earns',
  },
  {
    value: 'BELOW_TARGET',
    label: 'Below target',
    variant: 'warning',
    description: 'Earns less than your target margin',
  },
  {
    value: 'HEALTHY',
    label: 'Healthy',
    variant: 'success',
    description: 'At or above your target margin',
  },
  {
    value: 'NO_COST',
    label: 'No cost sheet',
    variant: 'secondary',
    description: 'Add what it costs to make to see its profit',
  },
];

export const COSTING_STATUS_BADGES = Object.fromEntries(
  COSTING_STATUSES.map((status) => [status.value, status]),
) as Record<CostingStatus, (typeof COSTING_STATUSES)[number]>;

export const LISTING_SORTS: { value: CostedListingSort; label: string }[] = [
  { value: 'margin_asc', label: 'Lowest margin first' },
  { value: 'margin_desc', label: 'Highest margin first' },
  { value: 'profit_desc', label: 'Most profit first' },
  { value: 'cost_desc', label: 'Costliest to make first' },
  { value: 'name_asc', label: 'Name' },
];

export const MATERIAL_SORTS: { value: MaterialSort; label: string }[] = [
  { value: 'name_asc', label: 'Name' },
  { value: 'cost_desc', label: 'Costliest first' },
  { value: 'updated_desc', label: 'Recently changed' },
];

/** Rows per page — the backend allows up to 100. */
export const COSTING_LIST_LIMIT = 25;
