import { describe, expect, it } from 'vitest';

import { isChunkLoadError } from '@/helpers/chunk-error';

describe('isChunkLoadError', () => {
  it.each([
    // Chrome, Edge
    'Failed to fetch dynamically imported module: https://admin.example/assets/products-1a2b.js',
    // Firefox
    'error loading dynamically imported module: https://admin.example/assets/products-1a2b.js',
    // Safari
    'Importing a module script failed.',
  ])('recognises %j', (message) => {
    expect(isChunkLoadError(new TypeError(message))).toBe(true);
  });

  it('ignores ordinary errors and non-errors', () => {
    expect(isChunkLoadError(new Error('x is undefined'))).toBe(false);
    expect(isChunkLoadError(undefined)).toBe(false);
  });
});
