import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { productsService } from '@/api/services/products';
import type { ProductVariant } from '@/types/api';

import { NO_VARIANT_DETAILS } from '@/test/fixtures';

import VariantQuickEditDialog from './VariantQuickEditDialog';

const KALASH: ProductVariant = {
  id: 'v3',
  title: 'Kalash',
  options: { Design: 'Kalash' },
  sku: null,
  price: 649,
  compareAtPrice: null,
  discountPercentage: null,
  images: [],
  measurements: null,
  dimensions: null,
  weight: null,
  description: null,
  purchaseLinks: [],
  stock: 0,
  availability: 'OUT_OF_STOCK',
  isActive: true,
  sortOrder: 2,
  whatsappUrl: null,
  ...NO_VARIANT_DETAILS,
};

const renderDialog = (waiting: number) => {
  const onClose = vi.fn();
  render(
    <QueryClientProvider client={new QueryClient()}>
      <VariantQuickEditDialog
        productId="p1"
        variant={KALASH}
        waiting={waiting}
        onClose={onClose}
      />
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), onClose };
};

// jsdom lacks what Radix selects and switches call
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
  globalThis.ResizeObserver ??= class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

describe('VariantQuickEditDialog', () => {
  it('saves only what changed, and says who will be emailed', async () => {
    const update = vi
      .spyOn(productsService, 'updateVariant')
      .mockResolvedValue({ success: true, message: 'Variant updated' });
    const { user, onClose } = renderDialog(3);

    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    const stock = screen.getByRole('spinbutton', { name: 'Stock' });
    await user.clear(stock);
    await user.type(stock, '6');
    await user.click(screen.getByRole('combobox', { name: 'Availability' }));
    await user.click(await screen.findByRole('option', { name: 'In stock' }));

    expect(
      screen.getByText(/3 shoppers are waiting — saving emails them/),
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(update).toHaveBeenCalledWith('p1', 'v3', {
      stock: 6,
      availability: 'IN_STOCK',
    });
    await vi.waitFor(() => expect(onClose).toHaveBeenCalled());
  });

  it('keeps a compare-at price above the price', async () => {
    const { user } = renderDialog(0);

    // The ₹ in front is part of its label
    await user.type(
      screen.getByRole('spinbutton', { name: /Compare-at price/ }),
      '500',
    );

    expect(
      screen.getByText(/compare-at price must be above the price/),
    ).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
  });

  it('adds what arrived to the stock instead of replacing it', async () => {
    const update = vi
      .spyOn(productsService, 'updateVariant')
      .mockResolvedValue({ success: true, message: 'Variant updated' });
    update.mockClear();
    const { user } = renderDialog(0);

    await user.type(screen.getByRole('spinbutton', { name: /Arrived/ }), '5');

    expect(screen.getByText(/Stock goes from 0 to 5/)).toBeInTheDocument();
    expect(screen.getByRole('spinbutton', { name: 'Stock' })).toBeDisabled();
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(update).toHaveBeenCalledWith('p1', 'v3', { addStock: 5 });
  });

  it('sets its own low-stock level, or goes back to the store’s', async () => {
    const update = vi
      .spyOn(productsService, 'updateVariant')
      .mockResolvedValue({ success: true, message: 'Variant updated' });
    update.mockClear();
    const { user } = renderDialog(0);

    await user.type(
      screen.getByRole('spinbutton', { name: 'Low stock at' }),
      '2',
    );
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(update).toHaveBeenCalledWith('p1', 'v3', { lowStockThreshold: 2 });
  });
});
