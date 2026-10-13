import { describe, expect, it } from 'vitest';

import type { TVariantFormValue } from './types';
import {
  addOption,
  addOptionValue,
  removeOption,
  removeOptionValue,
  renameOptionValue,
  summarizeVariantRows,
  toVariantsFormValue,
  toVariantsPayload,
  variantRowTitle,
  type TVariantsState,
} from './variants';

const EMPTY: TVariantsState = { options: [], rows: [] };

const titles = (state: TVariantsState) => state.rows.map(variantRowTitle);

/** Design: Peacock, Lotus × Size: Small, Large — built the way the editor does. */
const designBySize = () => {
  let state = addOption(EMPTY);
  state = { ...state, options: [{ name: 'Design', values: [] }] };
  state = addOptionValue(state, 0, 'Peacock');
  state = addOptionValue(state, 0, 'Lotus');
  state = addOption(state);
  state = {
    ...state,
    options: [state.options[0], { name: 'Size', values: [] }],
  };
  state = addOptionValue(state, 1, 'Small');
  state = addOptionValue(state, 1, 'Large');
  return state;
};

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
      { options: [{ name: 'Design', values: [] }], rows: [] },
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

  it('starts a new combination at an existing price, never with its stock or SKU', () => {
    let state = addOptionValue(
      { options: [{ name: 'Design', values: [] }], rows: [] },
      0,
      'Peacock',
    );
    state = {
      ...state,
      rows: [{ ...state.rows[0], price: 499, stock: 3, sku: 'TH-P' }],
    };
    state = addOptionValue(state, 0, 'Lotus');

    expect(state.rows[1]).toMatchObject({
      id: null,
      values: ['Lotus'],
      price: 499,
      stock: 0,
      sku: '',
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
    expect(state.rows[0]).toMatchObject({
      id: 'v1',
      values: ['Lotus', 'Large'],
      sku: '',
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
          isActive: true,
        },
      ],
    });
  });

  it('sends a new variant without an id', () => {
    const state = addOptionValue(
      { options: [{ name: ' Design ', values: [] }], rows: [] },
      0,
      'Peacock',
    );
    const [variant] = toVariantsPayload(state).variants;
    expect(variant).not.toHaveProperty('id');
    expect(variant.options).toEqual({ Design: 'Peacock' });
  });
});

describe('summarizeVariantRows', () => {
  const row = (overrides: Partial<TVariantFormValue>): TVariantFormValue => ({
    id: null,
    values: ['x'],
    price: 100,
    compareAtPrice: null,
    sku: '',
    stock: 1,
    availability: 'IN_STOCK',
    images: [],
    isActive: true,
    ...overrides,
  });

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
