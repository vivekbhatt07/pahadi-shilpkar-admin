import { describe, expect, it } from 'vitest';

import { describeMeter, usageTone } from './helpers';

describe('usageTone', () => {
  it('warns from 80%, and alarms from 95%', () => {
    expect(usageTone(null)).toBe('normal');
    expect(usageTone(79.9)).toBe('normal');
    expect(usageTone(80)).toBe('warning');
    expect(usageTone(95)).toBe('danger');
  });
});

describe('describeMeter', () => {
  it('gives what a meter cost, on a plan of credits', () => {
    expect(
      describeMeter(
        { used: 4200, credits: 4.2, limit: null, usedPercent: null },
        'count',
      ),
    ).toBe('4,200 · 4.2 credits');
    expect(
      describeMeter(
        { used: 1_000_000_000, credits: 1, limit: null, usedPercent: null },
        'bytes',
      ),
    ).toBe('1 GB · 1 credit');
  });

  it('gives its share of its own cap, on a plan that sets one', () => {
    expect(
      describeMeter(
        {
          used: 2_500_000_000,
          credits: null,
          limit: 10_000_000_000,
          usedPercent: 25,
        },
        'bytes',
      ),
    ).toBe('2.5 GB of 10 GB');
  });
});
