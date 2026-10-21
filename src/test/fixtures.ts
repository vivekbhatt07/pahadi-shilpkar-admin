import type { Product, ProductVariant } from '@/types/api';

/**
 * A variant's details as the API returns them when it has none of its own —
 * every one the product's — so a test's fixture only spells out what it's
 * about.
 */
export const NO_VARIANT_DETAILS: Pick<
  ProductVariant,
  | 'highlights'
  | 'material'
  | 'colors'
  | 'careInstructions'
  | 'specifications'
  | 'videoUrl'
  | 'deliveryCharge'
  | 'deliveryFee'
  | 'delivery'
  | 'leadTimeDays'
  | 'leadTimeMaxDays'
  | 'lowStockThreshold'
  | 'isLowStock'
  | 'stockLeft'
> = {
  highlights: [],
  material: null,
  colors: [],
  careInstructions: null,
  specifications: [],
  videoUrl: null,
  deliveryCharge: null,
  deliveryFee: null,
  delivery: null,
  leadTimeDays: null,
  leadTimeMaxDays: null,
  lowStockThreshold: null,
  isLowStock: false,
  stockLeft: null,
};

/** A product's stock and making-time fields with nothing set. */
export const NO_PRODUCT_STOCK_DETAILS: Pick<
  Product,
  | 'lowStockThreshold'
  | 'isLowStock'
  | 'stockLeft'
  | 'leadTimeDays'
  | 'leadTimeMaxDays'
> = {
  lowStockThreshold: null,
  isLowStock: false,
  stockLeft: null,
  leadTimeDays: null,
  leadTimeMaxDays: null,
};
