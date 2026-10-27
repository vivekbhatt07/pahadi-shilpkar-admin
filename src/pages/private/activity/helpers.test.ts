import { describe, expect, it } from 'vitest';

import { activityLink, describeActivity, fieldLabel } from './helpers';

describe('describeActivity', () => {
  it('words a change by its method and what the route is about', () => {
    expect(
      describeActivity({ method: 'PATCH', route: '/api/products/:id' }),
    ).toBe('Edited product');
    expect(describeActivity({ method: 'POST', route: '/api/combos' })).toBe(
      'Added combo',
    );
    expect(
      describeActivity({
        method: 'DELETE',
        route: '/api/costing/materials/:id',
      }),
    ).toBe('Deleted raw material');
  });

  it('has its own words where those would read badly', () => {
    expect(
      describeActivity({
        method: 'PATCH',
        route: '/api/products/:id/variants/:variantId',
      }),
    ).toBe('Edited a variant of');
    expect(describeActivity({ method: 'PATCH', route: '/api/settings' })).toBe(
      'Edited the store settings',
    );
  });

  it('falls back to the route itself', () => {
    expect(describeActivity({ method: 'POST', route: '/api/new-thing' })).toBe(
      'POST /api/new-thing',
    );
  });
});

describe('activityLink', () => {
  const target = { name: 'Peacock Pooja Thali', slug: 'peacock-pooja-thali' };

  it('opens what was changed', () => {
    expect(
      activityLink({ route: '/api/products/:id', targetId: 'p1', target }),
    ).toBe('/products/peacock-pooja-thali');
    expect(
      activityLink({
        route: '/api/costing/materials/:id',
        targetId: 'm1',
        target: { name: 'Brass plate', slug: null },
      }),
    ).toBe('/costing/materials/m1');
  });

  it('has nothing to open once it was deleted', () => {
    expect(
      activityLink({
        route: '/api/products/:id',
        targetId: 'p1',
        target: null,
      }),
    ).toBeNull();
  });
});

it('reads field names as words', () => {
  expect(fieldLabel('compareAtPrice')).toBe('compare at price');
  expect(fieldLabel('stock')).toBe('stock');
});
