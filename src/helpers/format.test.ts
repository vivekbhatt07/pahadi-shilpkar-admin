import { describe, expect, it } from 'vitest';

import {
  formatBytes,
  formatDelivery,
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

describe('formatDelivery', () => {
  it('words delivery the way the storefront shows it', () => {
    expect(formatDelivery({ charge: 'INCLUDED', fee: null })).toBe(
      'Free delivery',
    );
    expect(formatDelivery({ charge: 'EXTRA', fee: null })).toBe(
      'Excluding delivery charges',
    );
  });

  it('drops the paise from a whole-rupee fee, as shoppers see it', () => {
    expect(formatDelivery({ charge: 'EXTRA', fee: 80 })).toBe('+ ₹80 delivery');
    expect(formatDelivery({ charge: 'EXTRA', fee: 1250 })).toBe(
      '+ ₹1,250 delivery',
    );
    expect(formatDelivery({ charge: 'EXTRA', fee: 79.5 })).toBe(
      '+ ₹79.50 delivery',
    );
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

describe('formatBytes', () => {
  it('picks the unit, in 1000s as Cloudinary counts', () => {
    expect(formatBytes(0)).toBe('0 bytes');
    expect(formatBytes(950)).toBe('950 bytes');
    expect(formatBytes(15_300)).toBe('15.3 KB');
    expect(formatBytes(2_000_000)).toBe('2 MB');
    expect(formatBytes(2_456_000_000)).toBe('2.5 GB');
    expect(formatBytes(312_000_000)).toBe('312 MB');
  });
});
