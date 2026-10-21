import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm } from 'react-hook-form';
import { MemoryRouter } from 'react-router';
import { beforeAll, describe, expect, it } from 'vitest';

import { QUERY_KEYS } from '@/constants/query-key';
import type { DeliveryCharge, StoreSettings } from '@/types/api';

import DeliveryChargeField from './DeliveryChargeField';

type TValues = {
  deliveryCharge: DeliveryCharge | null;
  deliveryFee: number | null;
};

const STORE: StoreSettings = {
  whatsappNumber: null,
  whatsappMessageTemplate: null,
  deliveryCharge: 'EXTRA',
  deliveryFee: 120,
  contactEmail: null,
  contactPhone: null,
  instagramUrl: null,
  facebookUrl: null,
  youtubeUrl: null,
  lowStockThreshold: 5,
  showStockLeft: true,
  updatedAt: null,
};

const Harness = ({
  scope,
  values,
}: {
  scope: 'listing' | 'store';
  values: TValues;
}) => {
  const form = useForm<TValues>({ defaultValues: values });
  return (
    <FormProvider {...form}>
      <form>
        <DeliveryChargeField scope={scope} />
      </form>
    </FormProvider>
  );
};

const renderField = (scope: 'listing' | 'store', values: TValues) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  // Fresh in the cache, so the field never fetches
  queryClient.setQueryData(QUERY_KEYS.SETTINGS.GET, STORE);
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <Harness scope={scope} values={values} />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

// "Shoppers see …" — the preview line under the field
const preview = () => screen.getByText('Shoppers see');

const pick = async (option: string) => {
  const user = userEvent.setup();
  await user.click(screen.getByRole('combobox'));
  await user.click(await screen.findByRole('option', { name: option }));
};

// jsdom lacks what Radix Select calls while opening
beforeAll(() => {
  Element.prototype.hasPointerCapture ??= () => false;
  Element.prototype.releasePointerCapture ??= () => {};
  Element.prototype.scrollIntoView ??= () => {};
});

describe('DeliveryChargeField', () => {
  it('follows the store default until the listing sets its own', async () => {
    renderField('listing', { deliveryCharge: null, deliveryFee: null });
    expect(screen.getByRole('combobox')).toHaveTextContent(
      'Store default+ ₹120 delivery',
    );
    expect(preview()).toHaveTextContent('+ ₹120 delivery');

    await pick('Free delivery');
    expect(preview()).toHaveTextContent('Free delivery');
  });

  it('asks for a fee only while delivery is charged extra, and drops it on switching away', async () => {
    renderField('listing', { deliveryCharge: 'EXTRA', deliveryFee: 80 });
    expect(screen.getByRole('spinbutton')).toHaveValue(80);
    expect(preview()).toHaveTextContent('+ ₹80 delivery');

    await pick('Free delivery');
    expect(screen.queryByRole('spinbutton')).not.toBeInTheDocument();

    // Back to extra: the old fee is gone, so the price excludes delivery
    await pick('Charged extra');
    expect(screen.getByRole('spinbutton')).toHaveValue(null);
    expect(preview()).toHaveTextContent('Excluding delivery charges');
  });

  it('offers "not mentioned" as the store default, with nothing to show', () => {
    renderField('store', { deliveryCharge: null, deliveryFee: null });
    expect(screen.getByRole('combobox')).toHaveTextContent(
      "Don't mention delivery",
    );
    expect(preview()).toHaveTextContent('nothing about delivery');
  });
});
