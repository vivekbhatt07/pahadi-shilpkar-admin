import { describe, expect, it } from 'vitest';

import {
  formatPrice,
  getDisplayName,
  getInitials,
  isValidUrl,
} from '@/helpers/format';

describe('formatPrice', () => {
  it('shows exact rupees and paise with Indian digit grouping', () => {
    expect(formatPrice(125000)).toBe('₹1,25,000.00');
    expect(formatPrice(1299.5)).toBe('₹1,299.50');
  });
});

describe('getDisplayName / getInitials', () => {
  it('prefers the name, then the email', () => {
    expect(getDisplayName({ firstName: 'Asha', lastName: 'Negi' })).toBe(
      'Asha Negi',
    );
    expect(
      getDisplayName({ firstName: null, lastName: null, email: 'a@b.in' }),
    ).toBe('a@b.in');
    expect(getDisplayName(null)).toBe('User');
  });

  it('takes up to two initials', () => {
    expect(getInitials({ firstName: 'asha', lastName: 'negi' })).toBe('AN');
    expect(
      getInitials({ firstName: null, lastName: null, email: 'kiran@x.in' }),
    ).toBe('K');
    expect(getInitials(undefined)).toBe('?');
  });
});

describe('isValidUrl', () => {
  it('accepts only http(s) URLs', () => {
    expect(isValidUrl('https://example.com/a.jpg')).toBe(true);
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
  });
});
