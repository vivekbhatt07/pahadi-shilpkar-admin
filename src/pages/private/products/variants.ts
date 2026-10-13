import type {
  Product,
  ProductAvailability,
  ProductVariantPayload,
  VariantOption,
} from '@/types/api';

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

/**
 * A row for a new combination. It starts with the price and availability of
 * `like` — an existing variant — so a new design isn't blank; never its SKU,
 * stock or photos, which belong to one variant only.
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
  options: [...state.options, { name: '', values: [] }],
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
 * typo fixed doesn't break a combo selling the variant.
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
        }
      : option,
  ),
  rows: state.rows.map((row) =>
    row.values[index] === from ? withValueAt(row, index, to) : row,
  ),
});

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
      ? { ...option, values: option.values.filter((v) => v !== value) }
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

/** A stored product's variants as the editor holds them. */
export const toVariantsFormValue = (
  product: Pick<Product, 'variantOptions' | 'variants'>,
): TVariantsState => ({
  options: product.variantOptions.map((option) => ({
    name: option.name,
    values: [...option.values],
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
  variantOptions: options.map((option) => ({
    name: option.name.trim(),
    values: option.values,
  })),
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
    isActive: row.isActive,
  })),
});

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
