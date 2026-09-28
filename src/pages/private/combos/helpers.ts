import type {
  Combo,
  ComboItem,
  ComboProduct,
  Product,
  ProductAvailability,
} from '@/types/api';

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

// Least available first — mirrors the backend's derivation.
const AVAILABILITY_PRECEDENCE: ProductAvailability[] = [
  'OUT_OF_STOCK',
  'COMING_SOON',
  'MADE_TO_ORDER',
  'IN_STOCK',
];

type TPricedItem = Pick<ComboItem, 'quantity' | 'product'>;

const roundMoney = (value: number) => Math.round(value * 100) / 100;

/**
 * Live preview of the values the backend derives, for the form while the
 * admin edits items and price. The saved combo's own fields win afterwards.
 */
export const summarizeCombo = (items: TPricedItem[], price: number) => {
  const validItems = items.filter((item) => Number.isInteger(item.quantity));
  const itemsTotal = roundMoney(
    validItems.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0,
    ),
  );
  const hasPrice = Number.isFinite(price) && price > 0;
  const savings =
    hasPrice && itemsTotal > price ? roundMoney(itemsTotal - price) : null;
  const availabilities = new Set(
    items.map((item) =>
      item.product.isActive ? item.product.availability : 'OUT_OF_STOCK',
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
    inactiveProducts: items
      .filter((item) => !item.product.isActive)
      .map((item) => item.product),
  };
};

/** Hidden from the storefront: inactive, or holding an inactive product. */
export const isComboHidden = (combo: Combo) =>
  !combo.isActive || combo.items.some((item) => !item.product.isActive);

export const hasInactiveProduct = (combo: Combo) =>
  combo.items.some((item) => !item.product.isActive);

/** The combo's own photos, else the first photo of each item. */
export const comboImages = (combo: Combo) =>
  combo.images.length > 0
    ? combo.images
    : combo.items
        .map((item) => item.product.images[0])
        .filter((url): url is string => Boolean(url));
