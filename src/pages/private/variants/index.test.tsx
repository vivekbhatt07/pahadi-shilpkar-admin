import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { productsService } from '@/api/services/products';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { InventoryPage, InventoryVariant } from '@/types/api';

import VariantsPage from '.';

const row = (
  id: string,
  title: string,
  overrides: Partial<InventoryVariant> = {},
): InventoryVariant => ({
  id,
  title,
  options: { Design: title },
  sku: null,
  price: 499,
  compareAtPrice: null,
  discountPercentage: null,
  images: [],
  measurements: null,
  dimensions: null,
  weight: null,
  description: null,
  purchaseLinks: [],
  stock: 10,
  availability: 'IN_STOCK',
  isActive: true,
  sortOrder: 0,
  whatsappUrl: null,
  product: {
    id: 'p1',
    name: 'Karwa Chauth Thali',
    slug: 'karwa-chauth-thali',
    images: [],
    isActive: true,
  },
  waiting: 0,
  comboCount: 0,
  ...overrides,
});

const PAGE: InventoryPage = {
  items: [
    row('v1', 'Kalash', { stock: 0, availability: 'OUT_OF_STOCK', waiting: 3 }),
    row('v2', 'Peacock', { stock: 2, comboCount: 1 }),
  ],
  total: 2,
  page: 1,
  limit: 25,
  hasMore: false,
  counts: { all: 6, lowStock: 1, outOfStock: 1, hidden: 0 },
};

// jsdom lacks what Radix selects and menus call
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

describe('VariantsPage', () => {
  it('lists every variant with its stock, and filters by the chips', async () => {
    const list = vi
      .spyOn(productsService, 'listVariants')
      .mockResolvedValue({ success: true, message: '', data: PAGE });
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <MemoryRouter initialEntries={['/variants']}>
          <TooltipProvider>
            <VariantsPage />
          </TooltipProvider>
        </MemoryRouter>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole('link', { name: 'Kalash' })).toHaveAttribute(
      'href',
      '/products/karwa-chauth-thali',
    );
    // Peacock is in stock with only 2 left
    const peacock = screen
      .getByRole('link', { name: 'Peacock' })
      .closest('tr')!;
    expect(within(peacock).getByText('2')).toBeInTheDocument();
    expect(list).toHaveBeenLastCalledWith(
      expect.objectContaining({ sort: 'stock_asc', page: 1 }),
    );

    const lowStock = screen.getByRole('tab', { name: /Low stock/ });
    expect(lowStock).toHaveTextContent('1');
    await userEvent.click(lowStock);
    expect(lowStock).toHaveAttribute('aria-selected', 'true');
    await vi.waitFor(() =>
      expect(list).toHaveBeenLastCalledWith(
        expect.objectContaining({ lowStock: true }),
      ),
    );
  });
});
