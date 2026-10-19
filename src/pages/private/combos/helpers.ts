import type {
  Combo,
  ComboItem,
  ComboProduct,
  ComboVariant,
  Product,
  ProductAvailability,
  ProductVariant,
} from '@/types/api';

import type { TVariantPreviewTarget } from '../products/layouts/VariantPreviewDialog';

/** The product fields a combo item carries — also used as the form snapshot. */
export const toComboProduct = (
  product: Product | ComboProduct,
): ComboProduct => ({
  id: product.id,
  name: product.name,
  slug: product.slug,
  price: product.price,
  images: product.images,
  availability: product.availability,
  isActive: product.isActive,
});

/** The variant fields a combo item carries — also used as the form snapshot. */
export const toComboVariant = (
  variant: ProductVariant | ComboVariant,
): ComboVariant => ({
  id: variant.id,
  title: variant.title,
  options: variant.options,
  price: variant.price,
  images: variant.images,
  availability: variant.availability,
  isActive: variant.isActive,
});

/** Identifies an item: a product, or one variant of it. */
export const comboItemKey = (productId: string, variantId: string | null) =>
  `${productId}/${variantId ?? ''}`;

type TComboItemView = Pick<ComboItem, 'product' | 'variant'>;

/** "Karwa Chauth Thali — Peacock" for a variant, else the product's name. */
export const comboItemName = (item: TComboItemView) =>
  item.variant
    ? `${item.product.name} — ${item.variant.title}`
    : item.product.name;

/** What one of the item costs — the variant picked, else the product. */
export const comboItemPrice = (item: TComboItemView) =>
  (item.variant ?? item.product).price;

/** The item's photo — the variant's own, else the product's. */
export const comboItemImage = (item: TComboItemView): string | undefined =>
  item.variant?.images[0] ?? item.product.images[0];

/** Every photo shoppers see for the item — the variant's own, else the product's. */
export const comboItemImages = (item: TComboItemView): string[] =>
  item.variant && item.variant.images.length > 0
    ? item.variant.images
    : item.product.images;

/** An item as the preview dialog opens it. */
export const toPreviewTarget = (
  item: Pick<ComboItem, 'product' | 'variant' | 'variantId'>,
): TVariantPreviewTarget => ({
  slug: item.product.slug,
  name: item.product.name,
  images: comboItemImages(item),
  variantId: item.variantId,
});

/** Can't be ordered, so it hides the combo: an inactive product or variant. */
export const isComboItemOff = (item: TComboItemView) =>
  !item.product.isActive || (item.variant !== null && !item.variant.isActive);

// Least available first — mirrors the backend's derivation.
const AVAILABILITY_PRECEDENCE: ProductAvailability[] = [
  'OUT_OF_STOCK',
  'COMING_SOON',
  'MADE_TO_ORDER',
  'IN_STOCK',
];

type TPricedItem = Pick<ComboItem, 'quantity' | 'product' | 'variant'>;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/**
 * Live preview of the values the backend derives, for the form while the
 * admin edits items and price. The saved combo's own fields win afterwards.
 */
export const summarizeCombo = (items: TPricedItem[], price: number) => {
  const validItems = items.filter((item) => Number.isInteger(item.quantity));
  const itemsTotal = roundMoney(
    validItems.reduce(
      (sum, item) => sum + comboItemPrice(item) * item.quantity,
      0,
    ),
  );
  const hasPrice = Number.isFinite(price) && price > 0;
  const savings =
    hasPrice && itemsTotal > price ? roundMoney(itemsTotal - price) : null;
  const availabilities = new Set(
    items.map((item) =>
      isComboItemOff(item)
        ? 'OUT_OF_STOCK'
        : (item.variant ?? item.product).availability,
    ),
  );

  return {
    itemsTotal,
    itemCount: validItems.reduce((sum, item) => sum + item.quantity, 0),
    savings,
    discountPercentage:
      savings === null ? null : Math.round((1 - price / itemsTotal) * 100),
    availability:
      AVAILABILITY_PRECEDENCE.find((value) => availabilities.has(value)) ??
      'IN_STOCK',
    /** Names of the inactive products and switched-off variants inside. */
    inactiveItems: items.filter(isComboItemOff).map(comboItemName),
  };
};

/** Holds an inactive product or a switched-off variant — that hides it. */
export const hasInactiveItem = (combo: Combo) =>
  combo.items.some(isComboItemOff);

/** Hidden from the storefront: inactive, or holding something inactive. */
export const isComboHidden = (combo: Combo) =>
  !combo.isActive || hasInactiveItem(combo);

/** The combo's own photos, else the first photo of each item. */
export const comboImages = (combo: Combo) =>
  combo.images.length > 0
    ? combo.images
    : combo.items
        .map(comboItemImage)
        .filter((url): url is string => Boolean(url));
