import { describe, expect, it } from 'vitest';

import { EMPTY_MEASUREMENTS } from './helpers';
import type { TVariantFormValue } from './types';
import {
  addCombinations,
  addOption,
  addOptionValue,
  changePrice,
  changeStock,
  copyDetailsToSiblings,
  copyPhotosToSiblings,
  copySizeToSiblings,
  generateSkus,
  inScope,
  missingCombinations,
  moveOption,
  NO_OWN_DETAILS,
  ownDetails,
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
  variantComboUsage,
  variantRowTitle,
  type TVariantsState,
} from './variants';
import { NO_VARIANT_DETAILS } from '@/test/fixtures';

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
  description: '',
  purchaseLinks: [],
  ...NO_OWN_DETAILS,
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
        description: 'Lotus petals in brass',
        purchaseLinks: [
          {
            platform: 'AMAZON' as const,
            label: null,
            url: 'https://amazon.in/lotus',
          },
        ],
        stock: 2,
        availability: 'IN_STOCK' as const,
        isActive: true,
        sortOrder: 0,
        whatsappUrl: null,
        ...NO_VARIANT_DETAILS,
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
          description: 'Lotus petals in brass',
          purchaseLinks: [
            { platform: 'AMAZON', label: null, url: 'https://amazon.in/lotus' },
          ],
          // None of its own details — each one the product's
          highlights: [],
          material: null,
          colors: [],
          careInstructions: null,
          specifications: [],
          videoUrl: null,
          deliveryCharge: null,
          deliveryFee: null,
          leadTimeDays: null,
          leadTimeMaxDays: null,
          lowStockThreshold: null,
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
    expect(variant.description).toBeNull();
    expect(variant.purchaseLinks).toEqual([]);
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

describe('copySizeToSiblings', () => {
  it('gives the variants sharing a value the same size and weight', () => {
    const state = designBySize();
    const large = {
      ...EMPTY_MEASUREMENTS,
      shape: 'RECTANGULAR' as const,
      length: 200,
      width: 70,
    };
    // Peacock / Large is the second row; Lotus / Large the fourth
    state.rows[1] = { ...state.rows[1], measurements: large, weight: '450 g' };

    const copied = copySizeToSiblings(state, 1, 1);
    expect(copied.rows[3]).toMatchObject({
      measurements: large,
      weight: '450 g',
    });
    // A copy, not the same object — editing one leaves the other alone
    expect(copied.rows[3].measurements).not.toBe(large);
    // The smalls keep theirs
    expect(copied.rows[0].weight).toBe('');
    expect(copied.rows[2].weight).toBe('');
  });
});

describe('variantComboUsage', () => {
  const item = (variantId: string | null, title = 'Peacock') => ({
    productId: 'p1',
    variantId,
    quantity: 1,
    product: {} as never,
    variant: variantId ? ({ title } as never) : null,
  });

  it('names the combos selling each of a product’s variants', () => {
    const usage = variantComboUsage(
      [
        {
          name: 'Diwali set',
          slug: 'diwali-set',
          items: [item('v1'), { ...item('x'), productId: 'other' }],
        },
        {
          name: 'Karwa Chauth set',
          slug: 'karwa-chauth-set',
          items: [item('v1'), item('v2', 'Lotus')],
        },
      ] as never,
      'p1',
    );

    expect([...usage.keys()]).toEqual(['v1', 'v2']);
    expect(usage.get('v1')).toEqual({
      title: 'Peacock',
      combos: [
        { name: 'Diwali set', slug: 'diwali-set' },
        { name: 'Karwa Chauth set', slug: 'karwa-chauth-set' },
      ],
    });
    expect(usage.get('v2')?.title).toBe('Lotus');
  });
});

describe('a variant’s own details', () => {
  it('names the ones it has, for its row’s summary', () => {
    expect(ownDetails(row({}))).toEqual([]);
    expect(
      ownDetails(
        row({
          highlights: ['Hand-painted'],
          material: 'Brass',
          specifications: [
            { label: 'Finish', value: 'Glossy' },
            { label: 'Base', value: 'Steel' },
          ],
          deliveryCharge: 'EXTRA',
          leadTimeDays: 7,
        }),
      ),
    ).toEqual([
      '1 highlight',
      'Material',
      '2 specifications',
      'Delivery',
      'Making time',
    ]);
  });

  it('copies them to every variant with the same value of an option', () => {
    const state = designBySize();
    state.rows[0] = {
      ...state.rows[0],
      material: 'Brass',
      colors: [{ name: 'Gold', hex: '#ffd700' }],
      lowStockThreshold: 2,
    };

    const copied = copyDetailsToSiblings(state, 0, 0);
    const peacocks = copied.rows.filter((r) => r.values[0] === 'Peacock');
    const lotuses = copied.rows.filter((r) => r.values[0] === 'Lotus');

    expect(peacocks.every((r) => r.material === 'Brass')).toBe(true);
    expect(peacocks.every((r) => r.lowStockThreshold === 2)).toBe(true);
    expect(lotuses.every((r) => r.material === '')).toBe(true);
    // A copy, not the same list — editing one leaves the other alone
    expect(peacocks[1].colors).not.toBe(peacocks[0].colors);
  });

  it('sends its own details, and a fee only while delivery is charged extra', () => {
    const state = designBySize();
    state.rows[0] = {
      ...state.rows[0],
      price: 499,
      material: '  Brass ',
      deliveryCharge: 'INCLUDED',
      deliveryFee: 80,
      leadTimeDays: 10,
      leadTimeMaxDays: 15,
    };

    const [variant] = toVariantsPayload(state).variants;
    expect(variant).toMatchObject({
      material: 'Brass',
      deliveryCharge: 'INCLUDED',
      deliveryFee: null,
      leadTimeDays: 10,
      leadTimeMaxDays: 15,
      lowStockThreshold: null,
    });
    expect(NO_OWN_DETAILS.highlights).toEqual([]);
  });
});

describe('bulk price and stock changes', () => {
  it('sets a price, or moves it by a percentage or an amount', () => {
    expect(changePrice(499, 'set', 549, false)).toBe(549);
    expect(changePrice(499, 'raise_percent', 10, false)).toBe(548.9);
    expect(changePrice(499, 'raise_percent', 10, true)).toBe(549);
    expect(changePrice(500, 'lower_percent', 15, false)).toBe(425);
    expect(changePrice(499, 'raise_amount', 50, false)).toBe(549);
    expect(changePrice(499, 'lower_amount', 0.5, false)).toBe(498.5);
  });

  it('adds a delivery to the stock, or replaces it', () => {
    expect(changeStock(3, 'add', 5)).toBe(8);
    expect(changeStock(3, 'set', 5)).toBe(5);
    expect(changeStock(Number.NaN, 'add', 5)).toBe(5);
  });
});
