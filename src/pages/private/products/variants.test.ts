import { describe, expect, it } from 'vitest';

import { EMPTY_MEASUREMENTS } from './helpers';
import type { TVariantFormValue } from './types';
import {
  addCombinations,
  addOption,
  addOptionValue,
  copyPhotosToSiblings,
  generateSkus,
  inScope,
  missingCombinations,
  moveOption,
  moveOptionValue,
  removeOption,
  removeOptionValue,
  renameOptionValue,
  setSwatch,
  setSwatchesOn,
  siblingIndexes,
  skuPrefixFrom,
  summarizeVariantRows,
  toVariantsFormValue,
  toVariantsPayload,
  variantRowTitle,
  type TVariantsState,
} from './variants';

const EMPTY: TVariantsState = { options: [], rows: [] };

const titles = (state: TVariantsState) => state.rows.map(variantRowTitle);

const option = (name: string, values: string[] = []) => ({
  name,
  values,
  swatches: null,
});

/** Design: Peacock, Lotus × Size: Small, Large — built the way the editor does. */
const designBySize = () => {
  let state = addOption(EMPTY);
  state = { ...state, options: [option('Design')] };
  state = addOptionValue(state, 0, 'Peacock');
  state = addOptionValue(state, 0, 'Lotus');
  state = addOption(state);
  state = { ...state, options: [state.options[0], option('Size')] };
  state = addOptionValue(state, 1, 'Small');
  state = addOptionValue(state, 1, 'Large');
  return state;
};

const row = (overrides: Partial<TVariantFormValue>): TVariantFormValue => ({
  id: null,
  values: ['x'],
  price: 100,
  compareAtPrice: null,
  sku: '',
  stock: 1,
  availability: 'IN_STOCK',
  images: [],
  measurements: EMPTY_MEASUREMENTS,
  weight: '',
  isActive: true,
  ...overrides,
});

describe('the variants editor', () => {
  it('makes a variant for every combination, in the values’ order', () => {
    expect(titles(designBySize())).toEqual([
      'Peacock / Small',
      'Peacock / Large',
      'Lotus / Small',
      'Lotus / Large',
    ]);
  });

  it('puts the first value of a new option on every existing variant', () => {
    let state = addOptionValue(
      { options: [option('Design')], rows: [] },
      0,
      'Peacock',
    );
    state = { ...state, rows: [{ ...state.rows[0], price: 499, stock: 3 }] };
    state = addOption(state);
    state = addOptionValue(state, 1, 'Small');

    expect(state.rows).toHaveLength(1);
    expect(state.rows[0]).toMatchObject({
      values: ['Peacock', 'Small'],
      price: 499,
      stock: 3,
    });
  });

  it('starts a new combination at an existing price, never with its stock, SKU or size', () => {
    let state = addOptionValue(
      { options: [option('Design')], rows: [] },
      0,
      'Peacock',
    );
    state = {
      ...state,
      rows: [
        {
          ...state.rows[0],
          price: 499,
          stock: 3,
          sku: 'TH-P',
          weight: '300 g',
        },
      ],
    };
    state = addOptionValue(state, 0, 'Lotus');

    expect(state.rows[1]).toMatchObject({
      id: null,
      values: ['Lotus'],
      price: 499,
      stock: 0,
      sku: '',
      weight: '',
      measurements: EMPTY_MEASUREMENTS,
    });
  });

  it('keeps the variant (and its id) through a renamed value', () => {
    const state = designBySize();
    state.rows[0] = { ...state.rows[0], id: 'stored-1' };

    const renamed = renameOptionValue(state, 0, 'Peacock', 'Peacock blue');
    expect(renamed.options[0].values).toEqual(['Peacock blue', 'Lotus']);
    expect(renamed.rows[0]).toMatchObject({
      id: 'stored-1',
      values: ['Peacock blue', 'Small'],
    });
  });

  it('removes the variants with a removed value, but blanks a last one', () => {
    const state = designBySize();
    expect(titles(removeOptionValue(state, 0, 'Lotus'))).toEqual([
      'Peacock / Small',
      'Peacock / Large',
    ]);

    const single = removeOptionValue(
      removeOptionValue(state, 1, 'Large'),
      1,
      'Small',
    );
    expect(titles(single)).toEqual(['Peacock', 'Lotus']);
    expect(single.options[1].values).toEqual([]);
  });

  it('merges the variants a removed option told apart', () => {
    const state = designBySize();
    const merged = removeOption(state, 1);
    expect(titles(merged)).toEqual(['Peacock', 'Lotus']);
    expect(removeOption(merged, 0)).toEqual({ options: [], rows: [] });
  });
});

describe('reordering', () => {
  it('moves a value, and the variants with it', () => {
    const state = designBySize();
    state.rows[2] = { ...state.rows[2], id: 'lotus-small' };

    const moved = moveOptionValue(state, 0, 1, 0);
    expect(moved.options[0].values).toEqual(['Lotus', 'Peacock']);
    expect(titles(moved)).toEqual([
      'Lotus / Small',
      'Lotus / Large',
      'Peacock / Small',
      'Peacock / Large',
    ]);
    expect(moved.rows[0].id).toBe('lotus-small');
  });

  it('moves an option, retitling and re-sorting the variants', () => {
    const moved = moveOption(designBySize(), 1, 0);
    expect(moved.options.map((o) => o.name)).toEqual(['Size', 'Design']);
    expect(titles(moved)).toEqual([
      'Small / Peacock',
      'Small / Lotus',
      'Large / Peacock',
      'Large / Lotus',
    ]);
    // Out of range — nothing moves
    expect(moveOption(moved, 0, -1)).toBe(moved);
  });
});

describe('swatches', () => {
  const colours = () =>
    addOptionValue(
      addOptionValue({ options: [option('Colour')], rows: [] }, 0, 'Red'),
      0,
      'Indigo',
    );

  it('turns on without colours, and follows renamed and removed values', () => {
    let state = setSwatchesOn(colours(), 0, true);
    expect(state.options[0].swatches).toEqual({});

    state = setSwatch(state, 0, 'Red', '#b7410e');
    state = setSwatch(state, 0, 'Indigo', '#3344aa');
    state = renameOptionValue(state, 0, 'Red', 'Geru red');
    expect(state.options[0].swatches).toEqual({
      'Geru red': '#b7410e',
      Indigo: '#3344aa',
    });

    state = removeOptionValue(state, 0, 'Indigo');
    expect(state.options[0].swatches).toEqual({ 'Geru red': '#b7410e' });

    expect(setSwatchesOn(state, 0, false).options[0].swatches).toBeNull();
  });

  it('sends a colour for every value — and none once turned off', () => {
    let state = setSwatchesOn(colours(), 0, true);
    state = setSwatch(state, 0, 'Red', '#b7410e');
    state = setSwatch(state, 0, 'Indigo', '#3344aa');

    expect(toVariantsPayload(state).variantOptions).toEqual([
      {
        name: 'Colour',
        values: ['Red', 'Indigo'],
        swatches: { Red: '#b7410e', Indigo: '#3344aa' },
      },
    ]);
    expect(
      toVariantsPayload(setSwatchesOn(state, 0, false)).variantOptions[0],
    ).not.toHaveProperty('swatches');
  });
});

describe('missing combinations', () => {
  it('lists the combinations no variant has, and adds them back', () => {
    const state = designBySize();
    const trimmed = {
      ...state,
      rows: state.rows.filter((r) => variantRowTitle(r) !== 'Lotus / Small'),
    };
    expect(missingCombinations(trimmed)).toEqual([['Lotus', 'Small']]);

    const restored = addCombinations(trimmed, [['Lotus', 'Small']]);
    expect(titles(restored)).toEqual(titles(state));
    expect(restored.rows[2]).toMatchObject({ id: null, stock: 0 });
    expect(missingCombinations(restored)).toEqual([]);
  });

  it('has none while an option has no values yet', () => {
    expect(missingCombinations(addOption(designBySize()))).toEqual([]);
  });
});

describe('scoped edits and shared photos', () => {
  it('scopes to every variant, or those with one value', () => {
    const peacockLarge = row({ values: ['Peacock', 'Large'] });
    expect(inScope(peacockLarge, null)).toBe(true);
    expect(inScope(peacockLarge, { optionIndex: 1, value: 'Large' })).toBe(
      true,
    );
    expect(inScope(peacockLarge, { optionIndex: 0, value: 'Lotus' })).toBe(
      false,
    );
  });

  it('copies a variant’s photos to the others with the same value', () => {
    const state = designBySize();
    state.rows[0] = { ...state.rows[0], images: ['peacock.jpg'] };

    expect(siblingIndexes(state.rows, 0, 0)).toEqual([1]);
    const copied = copyPhotosToSiblings(state, 0, 0);
    expect(copied.rows.map((r) => r.images)).toEqual([
      ['peacock.jpg'],
      ['peacock.jpg'],
      [],
      [],
    ]);
  });
});

describe('generateSkus', () => {
  const rows = () => designBySize().rows;

  it('joins the prefix and the values', () => {
    expect(
      generateSkus(rows(), 'thali', { keepExisting: true }).map((r) => r.sku),
    ).toEqual([
      'THALI-PEACOCK-SMALL',
      'THALI-PEACOCK-LARGE',
      'THALI-LOTUS-SMALL',
      'THALI-LOTUS-LARGE',
    ]);
  });

  it('keeps SKUs already set unless asked, and never repeats one', () => {
    const withSku = rows();
    withSku[0] = { ...withSku[0], sku: 'THALI-LOTUS-SMALL' };

    const kept = generateSkus(withSku, 'Thali', { keepExisting: true });
    expect(kept[0].sku).toBe('THALI-LOTUS-SMALL');
    expect(kept[2].sku).toBe('THALI-LOTUS-SMALL-2');

    const replaced = generateSkus(withSku, 'Thali', { keepExisting: false });
    expect(replaced[0].sku).toBe('THALI-PEACOCK-SMALL');

    // The product's own SKU is taken too
    const clash = generateSkus([row({ values: [''] })], 'Diya', {
      keepExisting: false,
      productSku: 'diya',
    });
    expect(clash[0].sku).toBe('DIYA-2');
  });

  it('stays within the SKU format and length', () => {
    const [long] = generateSkus(
      [row({ values: ['Mōr pankh — hand-painted, gold leaf', 'Extra large'] })],
      'Karwa Chauth Thali',
      { keepExisting: false },
    );
    expect(long.sku.length).toBeLessThanOrEqual(50);
    expect(long.sku).toMatch(/^[A-Z0-9](?:[A-Z0-9-]*[A-Z0-9])?$/);
    expect(long.sku.startsWith('KARWA-CHAUTH-THALI-MOR-PANKH')).toBe(true);
  });

  it('makes a prefix from a name', () => {
    expect(skuPrefixFrom('Karwa Chauth Thali')).toBe('KARWA-CHAUTH-THALI');
    expect(skuPrefixFrom('  ps-wood_01 ')).toBe('PS-WOOD-01');
  });
});

describe('toVariantsFormValue / toVariantsPayload', () => {
  const product = {
    variantOptions: [
      { name: 'Design', values: ['Peacock', 'Lotus'] },
      { name: 'Size', values: ['Large'] },
    ],
    variants: [
      {
        id: 'v1',
        title: 'Lotus / Large',
        // Postgres keeps JSON keys in its own order
        options: { Size: 'Large', Design: 'Lotus' },
        sku: null,
        price: 799,
        compareAtPrice: 999,
        discountPercentage: 20,
        images: ['lotus.jpg'],
        measurements: {
          shape: 'ROUND' as const,
          unit: 'CM' as const,
          length: null,
          width: null,
          height: 2,
          diameter: 30,
          note: null,
        },
        dimensions: 'Round · Diameter 30 cm × Height 2 cm',
        weight: '450 g',
        stock: 2,
        availability: 'IN_STOCK' as const,
        isActive: true,
        sortOrder: 0,
        whatsappUrl: null,
      },
    ],
  };

  it('round-trips a stored product', () => {
    const state = toVariantsFormValue(product);
    expect(state.options[0].swatches).toBeNull();
    expect(state.rows[0]).toMatchObject({
      id: 'v1',
      values: ['Lotus', 'Large'],
      sku: '',
      weight: '450 g',
      measurements: { shape: 'ROUND', diameter: 30, note: '' },
    });

    expect(toVariantsPayload(state)).toEqual({
      variantOptions: product.variantOptions,
      variants: [
        {
          id: 'v1',
          options: { Design: 'Lotus', Size: 'Large' },
          price: 799,
          compareAtPrice: 999,
          sku: null,
          stock: 2,
          availability: 'IN_STOCK',
          images: ['lotus.jpg'],
          measurements: {
            shape: 'ROUND',
            unit: 'CM',
            height: 2,
            diameter: 30,
            note: null,
          },
          weight: '450 g',
          isActive: true,
        },
      ],
    });
  });

  it('sends a new variant without an id, measured and weighed as the product', () => {
    const state = addOptionValue(
      { options: [option(' Design ')], rows: [] },
      0,
      'Peacock',
    );
    const [variant] = toVariantsPayload(state).variants;
    expect(variant).not.toHaveProperty('id');
    expect(variant.options).toEqual({ Design: 'Peacock' });
    expect(variant.measurements).toBeNull();
    expect(variant.weight).toBeNull();
  });
});

describe('summarizeVariantRows', () => {
  it('works out what the product will show from its active variants', () => {
    expect(
      summarizeVariantRows([
        row({ price: 499, stock: 2, availability: 'OUT_OF_STOCK' }),
        row({ price: 799, stock: 3, availability: 'MADE_TO_ORDER' }),
        row({ price: 99, stock: 40, isActive: false }),
        row({ price: Number.NaN, stock: Number.NaN }),
      ]),
    ).toEqual({
      count: 4,
      activeCount: 3,
      minPrice: 499,
      maxPrice: 799,
      stock: 5,
      availability: 'IN_STOCK',
    });
  });
});
