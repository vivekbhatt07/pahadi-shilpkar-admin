import type {
  Combo,
  Product,
  ProductAvailability,
  ProductVariantPayload,
  VariantOption,
} from '@/types/api';

import { PRODUCT_LIMITS } from './constants';
import {
  EMPTY_MEASUREMENTS,
  toMeasurementsFormValue,
  toMeasurementsPayload,
} from './helpers';
import type { TVariantFormValue, TVariantOptionFormValue } from './types';

/**
 * The variants editor's state: the options, and one row per variant. A row's
 * `values` line up with the options by index — '' for an option that has no
 * values yet — so renaming an option or a value never loses a row (or the id
 * that combos, stock alerts and buy clicks point at).
 */
export type TVariantsState = {
  options: TVariantOptionFormValue[];
  rows: TVariantFormValue[];
};

const keyOf = (values: string[]) =>
  values.map((value) => value.trim().toLowerCase()).join('\u0000');

/** A stable React key for a row — no two rows share a combination. */
export const variantRowKey = (row: TVariantFormValue) => keyOf(row.values);

/** "Peacock / Large" — blanks (options without values yet) left out. */
export const variantRowTitle = (row: TVariantFormValue) =>
  row.values.filter(Boolean).join(' / ') || 'Untitled';

/** True when the two spell the same thing, ignoring case and stray spaces. */
export const sameText = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/** `list` with the item at `from` moved to `to`. */
const moveItem = <T>(list: T[], from: number, to: number): T[] => {
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
};

/** The details a variant can have of its own — each one the product's while empty. */
export type TVariantDetails = Pick<
  TVariantFormValue,
  | 'highlights'
  | 'material'
  | 'colors'
  | 'careInstructions'
  | 'specifications'
  | 'videoUrl'
  | 'deliveryCharge'
  | 'deliveryFee'
  | 'leadTimeDays'
  | 'leadTimeMaxDays'
  | 'lowStockThreshold'
>;

/** None of its own — shown as the product has them. */
export const NO_OWN_DETAILS: TVariantDetails = {
  highlights: [],
  material: '',
  colors: [],
  careInstructions: '',
  specifications: [],
  videoUrl: '',
  deliveryCharge: null,
  deliveryFee: null,
  leadTimeDays: null,
  leadTimeMaxDays: null,
  lowStockThreshold: null,
};

/**
 * The details a row has of its own, by name — "Material", "2 highlights" —
 * for the row's summary. Empty when it shows the product's on every one.
 */
export const ownDetails = (row: TVariantFormValue): string[] => {
  const count = (n: number, one: string, many: string) =>
    `${n} ${n === 1 ? one : many}`;
  return [
    row.highlights.length > 0 &&
      count(row.highlights.length, 'highlight', 'highlights'),
    row.material.trim() && 'Material',
    row.colors.length > 0 && count(row.colors.length, 'colour', 'colours'),
    row.careInstructions.trim() && 'Care',
    row.specifications.length > 0 &&
      count(row.specifications.length, 'specification', 'specifications'),
    row.videoUrl.trim() && 'Video',
    row.deliveryCharge && 'Delivery',
    row.leadTimeDays !== null && 'Making time',
    row.lowStockThreshold !== null && 'Low-stock level',
  ].filter((detail): detail is string => Boolean(detail));
};

/**
 * A row for a new combination. It starts with the price and availability of
 * `like` — an existing variant — so a new design isn't blank; never its SKU,
 * stock, photos, size or details, which belong to one variant only.
 */
const newRow = (
  values: string[],
  like?: TVariantFormValue,
): TVariantFormValue => ({
  id: null,
  values,
  price: like?.price ?? Number.NaN,
  compareAtPrice: like?.compareAtPrice ?? null,
  sku: '',
  stock: 0,
  availability: like?.availability ?? 'IN_STOCK',
  images: [],
  measurements: EMPTY_MEASUREMENTS,
  weight: '',
  description: '',
  purchaseLinks: [],
  ...NO_OWN_DETAILS,
  isActive: true,
});

const withValueAt = (row: TVariantFormValue, index: number, value: string) => ({
  ...row,
  values: row.values.map((v, i) => (i === index ? value : v)),
});

/** Every combination of the options' values, in their order. */
const combinations = (valueLists: string[][]): string[][] =>
  valueLists.reduce<string[][]>(
    (combos, values) =>
      combos.flatMap((combo) => values.map((value) => [...combo, value])),
    [[]],
  );

/** Rows in the options' value order — the first option's, then the next's. */
const sortRows = (
  options: TVariantOptionFormValue[],
  rows: TVariantFormValue[],
) =>
  [...rows].sort((a, b) => {
    for (const [i, option] of options.entries()) {
      const diff =
        option.values.indexOf(a.values[i]) - option.values.indexOf(b.values[i]);
      if (diff !== 0) return diff;
    }
    return 0;
  });

/** Starts a new option, with no values yet. */
export const addOption = (state: TVariantsState): TVariantsState => ({
  options: [...state.options, { name: '', values: [], swatches: null }],
  rows: state.rows.map((row) => ({ ...row, values: [...row.values, ''] })),
});

export const renameOption = (
  state: TVariantsState,
  index: number,
  name: string,
): TVariantsState => ({
  ...state,
  options: state.options.map((option, i) =>
    i === index ? { ...option, name } : option,
  ),
});

/**
 * Moves an option up or down. Shoppers see the options in this order — and
 * the first one as photos, when every value has a variant with one — and
 * the variants are listed (and titled) in it.
 */
export const moveOption = (
  state: TVariantsState,
  from: number,
  to: number,
): TVariantsState => {
  if (to < 0 || to >= state.options.length || from === to) return state;
  const options = moveItem(state.options, from, to);
  const rows = state.rows.map((row) => ({
    ...row,
    values: moveItem(row.values, from, to),
  }));
  return { options, rows: sortRows(options, rows) };
};

/**
 * Drops an option. Variants that differed only by it become one — the first
 * of them is kept. Without options left there are no variants.
 */
export const removeOption = (
  state: TVariantsState,
  index: number,
): TVariantsState => {
  const options = state.options.filter((_, i) => i !== index);
  if (options.length === 0) return { options, rows: [] };

  const seen = new Set<string>();
  const rows = state.rows
    .map((row) => ({
      ...row,
      values: row.values.filter((_, i) => i !== index),
    }))
    .filter((row) => {
      const key = keyOf(row.values);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  return { options, rows };
};

/**
 * Adds a value to an option: a variant for each combination of it with the
 * other options' values that isn't there yet. An option's first value goes
 * onto every existing variant instead — they all come that way so far.
 */
export const addOptionValue = (
  state: TVariantsState,
  index: number,
  value: string,
): TVariantsState => {
  const options = state.options.map((option, i) =>
    i === index ? { ...option, values: [...option.values, value] } : option,
  );

  if (state.options[index].values.length === 0 && state.rows.length > 0) {
    return {
      options,
      rows: state.rows.map((row) => withValueAt(row, index, value)),
    };
  }

  const existing = new Set(state.rows.map((row) => keyOf(row.values)));
  const added = combinations(
    options.map((option, i) =>
      i === index ? [value] : option.values.length > 0 ? option.values : [''],
    ),
  )
    .filter((values) => !existing.has(keyOf(values)))
    .map((values) => newRow(values, state.rows[0]));

  return { options, rows: sortRows(options, [...state.rows, ...added]) };
};

/**
 * Renames a value everywhere it's used — the variants keep their ids, so a
 * typo fixed doesn't break a combo selling the variant. Its swatch goes with it.
 */
export const renameOptionValue = (
  state: TVariantsState,
  index: number,
  from: string,
  to: string,
): TVariantsState => ({
  options: state.options.map((option, i) =>
    i === index
      ? {
          ...option,
          values: option.values.map((value) => (value === from ? to : value)),
          swatches:
            option.swatches &&
            Object.fromEntries(
              Object.entries(option.swatches).map(([value, hex]) => [
                value === from ? to : value,
                hex,
              ]),
            ),
        }
      : option,
  ),
  rows: state.rows.map((row) =>
    row.values[index] === from ? withValueAt(row, index, to) : row,
  ),
});

/** Moves a value within its option — the picker's order, and the variants'. */
export const moveOptionValue = (
  state: TVariantsState,
  index: number,
  from: number,
  to: number,
): TVariantsState => {
  const options = state.options.map((option, i) =>
    i === index
      ? { ...option, values: moveItem(option.values, from, to) }
      : option,
  );
  return { options, rows: sortRows(options, state.rows) };
};

/**
 * Removes a value and the variants that have it. The last value of an option
 * is only blanked, so its variants survive while another is typed in.
 */
export const removeOptionValue = (
  state: TVariantsState,
  index: number,
  value: string,
): TVariantsState => {
  const options = state.options.map((option, i) =>
    i === index
      ? {
          ...option,
          values: option.values.filter((v) => v !== value),
          swatches:
            option.swatches &&
            Object.fromEntries(
              Object.entries(option.swatches).filter(([v]) => v !== value),
            ),
        }
      : option,
  );

  if (options[index].values.length === 0) {
    return {
      options,
      rows: state.rows.map((row) => withValueAt(row, index, '')),
    };
  }
  return {
    options,
    rows: state.rows.filter((row) => row.values[index] !== value),
  };
};

/**
 * Shows an option's values as colour swatches — or stops. Turned on, it
 * starts without colours; each value then needs one before the form saves.
 */
export const setSwatchesOn = (
  state: TVariantsState,
  index: number,
  on: boolean,
): TVariantsState => ({
  ...state,
  options: state.options.map((option, i) =>
    i === index
      ? { ...option, swatches: on ? (option.swatches ?? {}) : null }
      : option,
  ),
});

export const setSwatch = (
  state: TVariantsState,
  index: number,
  value: string,
  hex: string,
): TVariantsState => ({
  ...state,
  options: state.options.map((option, i) =>
    i === index
      ? { ...option, swatches: { ...(option.swatches ?? {}), [value]: hex } }
      : option,
  ),
});

/**
 * The combinations of the options' values that no variant has — removed
 * from the table, or never made. Empty while an option has no values yet.
 */
export const missingCombinations = ({
  options,
  rows,
}: TVariantsState): string[][] => {
  if (
    options.length === 0 ||
    options.some((option) => option.values.length === 0)
  ) {
    return [];
  }
  const existing = new Set(rows.map((row) => keyOf(row.values)));
  return combinations(options.map((option) => option.values)).filter(
    (values) => !existing.has(keyOf(values)),
  );
};

/** Brings combinations back as new variants, priced like the first one. */
export const addCombinations = (
  state: TVariantsState,
  combos: string[][],
): TVariantsState => ({
  ...state,
  rows: sortRows(state.options, [
    ...state.rows,
    ...combos.map((values) => newRow(values, state.rows[0])),
  ]),
});

/**
 * Which variants a bulk edit changes: every one (`null`), or those with one
 * value of an option — "every Large one".
 */
export type TVariantScope = { optionIndex: number; value: string } | null;

export const inScope = (row: TVariantFormValue, scope: TVariantScope) =>
  scope === null || row.values[scope.optionIndex] === scope.value;

/**
 * The other variants that share the row's value of an option — the ones
 * "use these photos for every Peacock" would change.
 */
export const siblingIndexes = (
  rows: TVariantFormValue[],
  rowIndex: number,
  optionIndex: number,
) =>
  rows.flatMap((row, i) =>
    i !== rowIndex &&
    row.values[optionIndex] === rows[rowIndex].values[optionIndex]
      ? [i]
      : [],
  );

/** Gives the row's photos to every variant that shares its value of an option. */
export const copyPhotosToSiblings = (
  state: TVariantsState,
  rowIndex: number,
  optionIndex: number,
): TVariantsState => {
  const siblings = new Set(siblingIndexes(state.rows, rowIndex, optionIndex));
  const images = state.rows[rowIndex].images;
  return {
    ...state,
    rows: state.rows.map((row, i) =>
      siblings.has(i) ? { ...row, images: [...images] } : row,
    ),
  };
};

/**
 * Gives the row's size and weight to every variant that shares its value of
 * an option — "every Large one measures the same".
 */
export const copySizeToSiblings = (
  state: TVariantsState,
  rowIndex: number,
  optionIndex: number,
): TVariantsState => {
  const siblings = new Set(siblingIndexes(state.rows, rowIndex, optionIndex));
  const { measurements, weight } = state.rows[rowIndex];
  return {
    ...state,
    rows: state.rows.map((row, i) =>
      siblings.has(i)
        ? { ...row, measurements: { ...measurements }, weight }
        : row,
    ),
  };
};

/**
 * Gives the row's own details — highlights, material, colours, care,
 * specifications, video, delivery, making time, low-stock level — to every
 * variant that shares its value of an option: "every Brass one is the same".
 */
export const copyDetailsToSiblings = (
  state: TVariantsState,
  rowIndex: number,
  optionIndex: number,
): TVariantsState => {
  const siblings = new Set(siblingIndexes(state.rows, rowIndex, optionIndex));
  const source = state.rows[rowIndex];
  const details: TVariantDetails = {
    highlights: [...source.highlights],
    material: source.material,
    colors: source.colors.map((color) => ({ ...color })),
    careInstructions: source.careInstructions,
    specifications: source.specifications.map((spec) => ({ ...spec })),
    videoUrl: source.videoUrl,
    deliveryCharge: source.deliveryCharge,
    deliveryFee: source.deliveryFee,
    leadTimeDays: source.leadTimeDays,
    leadTimeMaxDays: source.leadTimeMaxDays,
    lowStockThreshold: source.lowStockThreshold,
  };
  return {
    ...state,
    rows: state.rows.map((row, i) =>
      siblings.has(i) ? { ...row, ...details } : row,
    ),
  };
};

/** "Peacock blue" → "PEACOCK-BLUE": letters and digits, joined by hyphens. */
const skuPart = (text: string) =>
  text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const trimSku = (sku: string, max: number) =>
  sku.slice(0, max).replace(/-+$/, '');

/** A SKU prefix from the product's SKU or name — "Karwa Chauth Thali" → "KARWA-CHAUTH-THALI". */
export const skuPrefixFrom = (text: string) => trimSku(skuPart(text), 24);

/**
 * SKUs for the variants: the prefix and each value — "THALI-PEACOCK-LARGE".
 * Kept within the SKU limit and unique among the variants and the product;
 * a clash gets "-2", "-3". With `keepExisting`, a variant that has a SKU
 * keeps it. The server still checks them against every other product.
 */
export const generateSkus = (
  rows: TVariantFormValue[],
  prefix: string,
  {
    keepExisting,
    productSku = '',
  }: { keepExisting: boolean; productSku?: string },
): TVariantFormValue[] => {
  const max = PRODUCT_LIMITS.SKU_MAX;
  const head = skuPart(prefix);
  const taken = new Set<string>();
  if (productSku.trim()) taken.add(productSku.trim().toUpperCase());
  if (keepExisting) {
    rows.forEach((row) => {
      if (row.sku.trim()) taken.add(row.sku.trim().toUpperCase());
    });
  }

  return rows.map((row, index) => {
    if (keepExisting && row.sku.trim()) return row;
    const parts = [head, ...row.values.map(skuPart)].filter(Boolean);
    const base = trimSku(parts.join('-') || `V${index + 1}`, max);
    let sku = base;
    for (let n = 2; taken.has(sku); n++) {
      const suffix = `-${n}`;
      sku = `${trimSku(base, max - suffix.length)}${suffix}`;
    }
    taken.add(sku);
    return { ...row, sku };
  });
};

/** A stored product's variants as the editor holds them. */
export const toVariantsFormValue = (
  product: Pick<Product, 'variantOptions' | 'variants'>,
): TVariantsState => ({
  options: product.variantOptions.map((option) => ({
    name: option.name,
    values: [...option.values],
    swatches: option.swatches ? { ...option.swatches } : null,
  })),
  rows: product.variants.map((variant) => ({
    id: variant.id,
    values: product.variantOptions.map(
      (option) => variant.options[option.name] ?? '',
    ),
    price: variant.price,
    compareAtPrice: variant.compareAtPrice,
    sku: variant.sku ?? '',
    stock: variant.stock,
    availability: variant.availability,
    images: [...variant.images],
    // A backend from before variant sizes leaves both out
    measurements: toMeasurementsFormValue(variant.measurements ?? null),
    weight: variant.weight ?? '',
    description: variant.description ?? '',
    purchaseLinks: (variant.purchaseLinks ?? []).map((link) => ({
      ...link,
      label: link.label ?? '',
    })),
    // A backend from before variant details leaves these out
    highlights: [...(variant.highlights ?? [])],
    material: variant.material ?? '',
    colors: (variant.colors ?? []).map((color) => ({ ...color })),
    careInstructions: variant.careInstructions ?? '',
    specifications: (variant.specifications ?? []).map((spec) => ({ ...spec })),
    videoUrl: variant.videoUrl ?? '',
    deliveryCharge: variant.deliveryCharge ?? null,
    deliveryFee: variant.deliveryFee ?? null,
    leadTimeDays: variant.leadTimeDays ?? null,
    leadTimeMaxDays: variant.leadTimeMaxDays ?? null,
    lowStockThreshold: variant.lowStockThreshold ?? null,
    isActive: variant.isActive,
  })),
});

/** The request body: both lists, whole — a stored variant left out is deleted. */
export const toVariantsPayload = ({
  options,
  rows,
}: TVariantsState): {
  variantOptions: VariantOption[];
  variants: ProductVariantPayload[];
} => ({
  variantOptions: options.map((option) => {
    const { swatches } = option;
    return {
      name: option.name.trim(),
      values: option.values,
      // The form only saves with a colour for every value
      ...(swatches &&
        option.values.length > 0 && {
          swatches: Object.fromEntries(
            option.values.map((value) => [value, swatches[value]]),
          ),
        }),
    };
  }),
  variants: rows.map((row) => ({
    ...(row.id && { id: row.id }),
    options: Object.fromEntries(
      options.map((option, i) => [option.name.trim(), row.values[i]]),
    ),
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    sku: row.sku.trim() || null,
    stock: row.stock,
    availability: row.availability,
    images: row.images,
    measurements: toMeasurementsPayload(row.measurements),
    weight: row.weight.trim() || null,
    description: row.description.trim() || null,
    purchaseLinks: row.purchaseLinks.map((link) => ({
      ...link,
      label: link.label.trim() || null,
    })),
    highlights: row.highlights,
    material: row.material.trim() || null,
    colors: row.colors,
    careInstructions: row.careInstructions.trim() || null,
    specifications: row.specifications,
    videoUrl: row.videoUrl.trim() || null,
    deliveryCharge: row.deliveryCharge,
    // A fee only goes with EXTRA; the editor clears it otherwise
    deliveryFee: row.deliveryCharge === 'EXTRA' ? row.deliveryFee : null,
    leadTimeDays: row.leadTimeDays,
    leadTimeMaxDays: row.leadTimeMaxDays,
    lowStockThreshold: row.lowStockThreshold,
    isActive: row.isActive,
  })),
});

/** A combo, enough to name and link to it. */
export type TComboRef = { name: string; slug: string };

/** The saved variants that combos sell — by id, with the combos. */
export type TComboUsage = Map<string, { title: string; combos: TComboRef[] }>;

/**
 * Which of a product's variants its combos sell. Removing one of them is
 * refused on save, so the editor warns before that happens.
 */
export const variantComboUsage = (
  combos: Combo[],
  productId: string,
): TComboUsage => {
  const usage: TComboUsage = new Map();
  for (const combo of combos) {
    for (const item of combo.items) {
      if (item.productId !== productId || !item.variantId || !item.variant) {
        continue;
      }
      const entry = usage.get(item.variantId) ?? {
        title: item.variant.title,
        combos: [],
      };
      if (!entry.combos.some((ref) => ref.slug === combo.slug)) {
        entry.combos.push({ name: combo.name, slug: combo.slug });
      }
      usage.set(item.variantId, entry);
    }
  }
  return usage;
};

/** Most available first, as the backend ranks them. */
const AVAILABILITY_RANK: ProductAvailability[] = [
  'IN_STOCK',
  'MADE_TO_ORDER',
  'COMING_SOON',
  'OUT_OF_STOCK',
];

/**
 * What the product will show of itself, worked out live as the backend will
 * on save: the active variants' price range, total stock and best
 * availability.
 */
export const summarizeVariantRows = (rows: TVariantFormValue[]) => {
  const active = rows.filter((row) => row.isActive);
  const prices = active
    .map((row) => row.price)
    .filter((price) => !Number.isNaN(price) && price > 0);

  return {
    count: rows.length,
    activeCount: active.length,
    minPrice: prices.length > 0 ? Math.min(...prices) : null,
    maxPrice: prices.length > 0 ? Math.max(...prices) : null,
    stock: active.reduce(
      (sum, row) => sum + (Number.isNaN(row.stock) ? 0 : row.stock),
      0,
    ),
    availability:
      AVAILABILITY_RANK.find((availability) =>
        active.some((row) => row.availability === availability),
      ) ?? ('OUT_OF_STOCK' as ProductAvailability),
  };
};

/**
 * How "Edit all" changes prices — to one figure, or each by a percentage or
 * an amount: "raise every Large one by 10%".
 */
export type TPriceChange =
  | 'set'
  | 'raise_percent'
  | 'lower_percent'
  | 'raise_amount'
  | 'lower_amount';

/**
 * A price after a bulk change, to the paisa — or to the rupee when asked,
 * as handmade prices usually are.
 */
export const changePrice = (
  price: number,
  change: TPriceChange,
  by: number,
  roundToRupee: boolean,
): number => {
  const next = {
    set: by,
    raise_percent: price * (1 + by / 100),
    lower_percent: price * (1 - by / 100),
    raise_amount: price + by,
    lower_amount: price - by,
  }[change];
  return roundToRupee ? Math.round(next) : Math.round(next * 100) / 100;
};

/** How "Edit all" changes stock — to one figure, or by adding a delivery. */
export type TStockChange = 'set' | 'add';

export const changeStock = (stock: number, change: TStockChange, by: number) =>
  change === 'set' ? by : (Number.isNaN(stock) ? 0 : stock) + by;
