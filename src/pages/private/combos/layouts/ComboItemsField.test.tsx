import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { MemoryRouter } from 'react-router';
import { beforeAll, describe, expect, it, vi } from 'vitest';

import { productsService } from '@/api/services/products';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QUERY_KEYS } from '@/constants/query-key';
import type { ProductDetail, ProductVariant } from '@/types/api';

import { toComboProduct, toComboVariant } from '../helpers';
import type { TComboFormData } from '../types';
import ComboItemsField from './ComboItemsField';

const variant = (
  id: string,
  design: string,
  images: string[],
): ProductVariant => ({
  id,
  title: design,
  options: { Design: design },
  sku: `THALI-${design.toUpperCase()}`,
  price: design === 'Lotus' ? 799 : 499,
  compareAtPrice: null,
  discountPercentage: null,
  images,
  measurements: null,
  dimensions: null,
  weight: null,
  description: null,
  purchaseLinks: [],
  stock: 4,
  availability: 'IN_STOCK',
  isActive: true,
  sortOrder: 0,
  whatsappUrl: null,
});

const PEACOCK = variant('v1', 'Peacock', ['https://example.com/peacock.jpg']);
const LOTUS = variant('v2', 'Lotus', ['https://example.com/lotus.jpg']);

const THALI = {
  id: 'p1',
  name: 'Karwa Chauth Thali',
  slug: 'karwa-chauth-thali',
  sku: 'THALI',
  price: 499,
  compareAtPrice: null,
  images: ['https://example.com/thali.jpg'],
  availability: 'IN_STOCK',
  stock: 8,
  isActive: true,
  variantOptions: [{ name: 'Design', values: ['Peacock', 'Lotus'] }],
  variants: [PEACOCK, LOTUS],
} as unknown as ProductDetail;

const renderField = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, staleTime: Infinity } },
  });
  // The preview reads the whole product — already in the cache here
  queryClient.setQueryData(QUERY_KEYS.PRODUCTS.DETAIL(THALI.slug), THALI);
  vi.spyOn(productsService, 'getBySlug').mockResolvedValue({
    success: true,
    message: '',
    data: THALI,
  });

  let form!: UseFormReturn<TComboFormData>;
  const Harness = () => {
    form = useForm<TComboFormData>({
      defaultValues: {
        items: [
          {
            productId: THALI.id,
            variantId: PEACOCK.id,
            quantity: 2,
            product: toComboProduct(THALI),
            variant: toComboVariant(PEACOCK),
          },
        ],
      } as TComboFormData,
    });
    return (
      <FormProvider {...form}>
        <form>
          <ComboItemsField />
        </form>
      </FormProvider>
    );
  };
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <TooltipProvider>
          <Harness />
        </TooltipProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { user: userEvent.setup(), items: () => form.getValues('items') };
};

// jsdom lacks what Radix dialogs and tooltips call
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

describe('ComboItemsField previews', () => {
  it('shows an item as shoppers see it, and swaps its design in place', async () => {
    const { user, items } = renderField();

    await user.click(
      screen.getByRole('button', {
        name: 'Preview Karwa Chauth Thali — Peacock',
      }),
    );
    const dialog = await screen.findByRole('dialog');
    // The variant's own photo, large — not the product's cover shot
    expect(
      within(dialog).getByRole('img', {
        name: 'Karwa Chauth Thali — Peacock',
      }),
    ).toHaveAttribute('src', expect.stringContaining('peacock.jpg'));
    expect(within(dialog).getByText('THALI-PEACOCK')).toBeInTheDocument();
    expect(within(dialog).getByText(/2 in this combo/)).toBeInTheDocument();

    // Compare the other design, then swap to it
    await user.click(
      within(dialog).getByRole('button', { name: 'Preview Lotus' }),
    );
    expect(
      within(dialog).getByRole('img', { name: 'Karwa Chauth Thali — Lotus' }),
    ).toHaveAttribute('src', expect.stringContaining('lotus.jpg'));
    await user.click(
      within(dialog).getByRole('button', { name: /Use Lotus instead/ }),
    );

    expect(items()).toEqual([
      expect.objectContaining({
        variantId: LOTUS.id,
        quantity: 2,
        variant: expect.objectContaining({ title: 'Lotus', price: 799 }),
      }),
    ]);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});
