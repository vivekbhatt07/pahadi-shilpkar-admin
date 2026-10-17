import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { beforeAll, describe, expect, it } from 'vitest';

import { TooltipProvider } from '@/components/ui/tooltip';

import { EMPTY_MEASUREMENTS } from '../helpers';
import type { TProductFormData, TVariantFormValue } from '../types';
import { variantRowTitle } from '../variants';
import VariantsField from './VariantsField';

const variant = (values: string[], price = 499): TVariantFormValue => ({
  id: null,
  values,
  price,
  compareAtPrice: null,
  sku: '',
  stock: 1,
  availability: 'IN_STOCK',
  images: [],
  measurements: EMPTY_MEASUREMENTS,
  weight: '',
  isActive: true,
});

/** Design: Peacock, Lotus × Size: Small, Large — but no Lotus / Small. */
const THALI: Partial<TProductFormData> = {
  name: 'Karwa Chauth Thali',
  sku: 'THALI',
  variantOptions: [
    { name: 'Design', values: ['Peacock', 'Lotus'], swatches: null },
    { name: 'Size', values: ['Small', 'Large'], swatches: null },
  ],
  variants: [
    variant(['Peacock', 'Small']),
    variant(['Peacock', 'Large'], 799),
    variant(['Lotus', 'Large'], 799),
  ],
};

const renderField = () => {
  let form!: UseFormReturn<TProductFormData>;
  const Harness = () => {
    form = useForm<TProductFormData>({
      defaultValues: THALI as TProductFormData,
    });
    return (
      <FormProvider {...form}>
        <form>
          <VariantsField />
        </form>
      </FormProvider>
    );
  };
  render(
    <TooltipProvider>
      <Harness />
    </TooltipProvider>,
  );
  return {
    user: userEvent.setup(),
    rows: () => form.getValues('variants'),
    options: () => form.getValues('variantOptions'),
  };
};

// jsdom lacks what Radix menus and selects call while opening
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

describe('VariantsField', () => {
  it('adds back a combination that was removed', async () => {
    const { user, rows } = renderField();

    await user.click(screen.getByRole('button', { name: /1 not offered/ }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Lotus / Small' }),
    );

    expect(rows().map(variantRowTitle)).toEqual([
      'Peacock / Small',
      'Peacock / Large',
      'Lotus / Small',
      'Lotus / Large',
    ]);
    // Priced like the first variant, to be adjusted
    expect(rows()[2]).toMatchObject({ id: null, price: 499, stock: 0 });
  });

  it('sets a price on only the variants in scope', async () => {
    const { user, rows } = renderField();

    await user.click(screen.getByRole('button', { name: /Edit all/ }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Set price…' }),
    );
    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('combobox', { name: 'Which variants' }),
    );
    await user.click(
      await screen.findByRole('option', { name: 'Every Size: Small (1)' }),
    );
    await user.type(within(dialog).getByRole('spinbutton'), '550');
    await user.click(
      within(dialog).getByRole('button', { name: 'Apply to 1 variant' }),
    );

    expect(rows().map((row) => row.price)).toEqual([550, 799, 799]);
  });

  it('generates SKUs from the product’s own', async () => {
    const { user, rows } = renderField();

    await user.click(screen.getByRole('button', { name: /Edit all/ }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Generate SKUs…' }),
    );
    await user.click(await screen.findByRole('button', { name: 'Set 3 SKUs' }));

    expect(rows().map((row) => row.sku)).toEqual([
      'THALI-PEACOCK-SMALL',
      'THALI-PEACOCK-LARGE',
      'THALI-LOTUS-LARGE',
    ]);
  });

  it('moves an option, and turns on swatches for one', async () => {
    const { user, options, rows } = renderField();

    await user.click(screen.getByRole('button', { name: 'Move Design down' }));
    expect(options().map((option) => option.name)).toEqual(['Size', 'Design']);
    expect(variantRowTitle(rows()[0])).toBe('Small / Peacock');

    expect(screen.queryByLabelText('Colour of Peacock')).toBeNull();
    await user.click(
      screen.getByRole('switch', { name: 'Show Design as colour swatches' }),
    );
    expect(options()[1].swatches).toEqual({});
    expect(screen.getByLabelText('Colour of Peacock')).toBeInTheDocument();
  });
});
