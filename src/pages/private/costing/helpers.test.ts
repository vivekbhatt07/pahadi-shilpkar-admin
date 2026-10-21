import { describe, expect, it } from 'vitest';

import type { CostingSettings } from '@/types/api';

import {
  channelProfit,
  deliveryChargedFor,
  formatPercent,
  formatQuantity,
  formatUnitCost,
  lineCost,
  marginTone,
  priceForMargin,
  roundMoney,
  sheetTotals,
} from './helpers';

const SETTINGS: CostingSettings = {
  channelFees: [{ channel: 'AMAZON', percent: 15, fixed: 20 }],
  targetMarginPercent: 40,
  taxPercent: 18,
  updatedAt: null,
};

describe('costing maths, as the backend does it', () => {
  it('costs lines and divides a batch into pieces', () => {
    const paint = {
      type: 'MATERIAL' as const,
      quantity: 500,
      wastagePercent: 10,
      amount: null,
    };
    expect(roundMoney(lineCost(paint, 0.4))).toBe(220);
    expect(
      lineCost(
        { type: 'LABOUR', quantity: null, wastagePercent: null, amount: 600 },
        null,
      ),
    ).toBe(600);

    const { batch, unit } = sheetTotals(
      [
        { type: 'MATERIAL', cost: 1120 },
        { type: 'LABOUR', cost: 600 },
        { type: 'PACKAGING', cost: 200 },
      ],
      20,
    );
    expect(batch.total).toBe(1920);
    expect(unit.total).toBe(96);
    expect(unit.MATERIAL).toBe(56);
  });

  it('takes out the tax and the channel’s cut', () => {
    const amazon = channelProfit({
      price: 1180,
      deliveryCharged: 0,
      cost: 400,
      settings: SETTINGS,
      channel: 'AMAZON',
    });
    expect(amazon).toMatchObject({
      tax: 180,
      channelFee: 197,
      profit: 403,
      marginPercent: 40.3,
    });
  });

  it('suggests the price for a margin, and the break-even one', () => {
    const pricing = { cost: 400, deliveryCharged: 0, settings: SETTINGS };
    expect(
      priceForMargin({ ...pricing, channel: 'AMAZON', marginPercent: 40 }),
    ).toBe(1172);
    expect(
      priceForMargin({ ...pricing, channel: 'WHATSAPP', marginPercent: 0 }),
    ).toBe(472);
  });

  it('counts the delivery a buyer pays on top', () => {
    expect(deliveryChargedFor({ charge: 'EXTRA', fee: 80 }, 60)).toBe(80);
    expect(deliveryChargedFor({ charge: 'EXTRA', fee: null }, 60)).toBe(60);
    expect(deliveryChargedFor({ charge: 'INCLUDED', fee: null }, 60)).toBe(0);
  });
});

describe('costing formats', () => {
  it('words percentages, unit costs and quantities', () => {
    expect(formatPercent(32.456)).toBe('32.5%');
    expect(formatPercent(null)).toBe('—');
    expect(formatUnitCost(0.4523, 'MILLILITRE')).toBe('₹0.4523 / ml');
    expect(formatQuantity(2.5, 'METRE')).toBe('2.5 m');
  });

  it('reads a margin against the target', () => {
    expect(marginTone(-3, 30)).toBe('loss');
    expect(marginTone(20, 30)).toBe('low');
    expect(marginTone(35, 30)).toBe('good');
    expect(marginTone(null, 30)).toBe('none');
  });
});
