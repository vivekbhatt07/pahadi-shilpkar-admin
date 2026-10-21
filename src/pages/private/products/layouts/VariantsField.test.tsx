import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { FormProvider, useForm, type UseFormReturn } from 'react-hook-form';
import { MemoryRouter } from 'react-router';
import { beforeAll, describe, expect, it } from 'vitest';

import { TooltipProvider } from '@/components/ui/tooltip';

import { EMPTY_MEASUREMENTS } from '../helpers';
import type { TProductFormData, TVariantFormValue } from '../types';
import { NO_OWN_DETAILS, variantRowTitle, type TComboUsage } from '../variants';
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
  description: '',
  purchaseLinks: [],
  ...NO_OWN_DETAILS,
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

const renderField = ({
  values = THALI,
  comboUsage,
}: { values?: Partial<TProductFormData>; comboUsage?: TComboUsage } = {}) => {
  let form!: UseFormReturn<TProductFormData>;
  const Harness = () => {
    form = useForm<TProductFormData>({
      defaultValues: values as TProductFormData,
    });
    return (
      <FormProvider {...form}>
        <form>
          <VariantsField comboUsage={comboUsage} />
        </form>
      </FormProvider>
    );
  };
  render(
    <MemoryRouter>
      <TooltipProvider>
        <Harness />
      </TooltipProvider>
    </MemoryRouter>,
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
      await screen.findByRole('menuitem', { name: 'Change prices…' }),
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

  it('raises every price by a percentage, rounded to the rupee', async () => {
    const { user, rows } = renderField();

    await user.click(screen.getByRole('button', { name: /Edit all/ }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Change prices…' }),
    );
    const dialog = await screen.findByRole('dialog');
    await user.click(
      within(dialog).getByRole('combobox', { name: 'How to change it' }),
    );
    await user.click(await screen.findByRole('option', { name: 'Raise by %' }));
    await user.type(within(dialog).getByRole('spinbutton'), '10');

    expect(
      within(dialog).getByText(/Peacock \/ Small: ₹499(\.00)? → ₹549/),
    ).toBeInTheDocument();
    await user.click(
      within(dialog).getByRole('button', { name: 'Apply to 3 variants' }),
    );

    expect(rows().map((row) => row.price)).toEqual([549, 879, 879]);
  });

  it('adds a delivery to each variant’s stock', async () => {
    const { user, rows } = renderField();

    await user.click(screen.getByRole('button', { name: /Edit all/ }));
    await user.click(
      await screen.findByRole('menuitem', { name: 'Change stock…' }),
    );
    const dialog = await screen.findByRole('dialog');
    await user.type(within(dialog).getByRole('spinbutton'), '5');
    await user.click(
      within(dialog).getByRole('button', { name: 'Apply to 3 variants' }),
    );

    expect(rows().map((row) => row.stock)).toEqual([6, 6, 6]);
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

describe('VariantsField with combos and sizes', () => {
  // Peacock / Large is saved, and the Diwali set sells it
  const SAVED: Partial<TProductFormData> = {
    ...THALI,
    variants: [
      variant(['Peacock', 'Small']),
      { ...variant(['Peacock', 'Large'], 799), id: 'v-pl' },
      variant(['Lotus', 'Large'], 799),
    ],
  };
  const USAGE: TComboUsage = new Map([
    [
      'v-pl',
      {
        title: 'Peacock / Large',
        combos: [{ name: 'Diwali set', slug: 'diwali-set' }],
      },
    ],
  ]);

  it('marks a variant a combo sells, and warns once it is removed', async () => {
    const { user, rows } = renderField({ values: SAVED, comboUsage: USAGE });

    expect(screen.getByLabelText('In 1 combo')).toBeInTheDocument();
    expect(screen.queryByText(/Saving will be refused/)).toBeNull();

    await user.click(
      screen.getByRole('button', { name: 'More about Peacock / Large' }),
    );
    await user.click(screen.getByRole('button', { name: 'Remove variant' }));

    expect(rows().map(variantRowTitle)).not.toContain('Peacock / Large');
    expect(screen.getByText(/Saving will be refused/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Diwali set' })).toHaveAttribute(
      'href',
      '/combos/diwali-set',
    );
  });

  it('copies a size to the other variants sharing its value', async () => {
    const { user, rows } = renderField();

    await user.click(
      screen.getByRole('button', { name: 'More about Peacock / Large' }),
    );
    await user.click(
      screen.getByRole('combobox', { name: 'Size of Peacock / Large' }),
    );
    await user.click(await screen.findByRole('option', { name: 'Round' }));
    await user.type(screen.getByRole('spinbutton', { name: /Diameter/ }), '30');
    await user.type(screen.getByRole('textbox', { name: 'Weight' }), '450 g');
    await user.click(
      screen.getByRole('button', {
        name: 'Use for every Large variant (1 more)',
      }),
    );

    const lotusLarge = rows()[2];
    expect(variantRowTitle(lotusLarge)).toBe('Lotus / Large');
    expect(lotusLarge.measurements).toMatchObject({
      shape: 'ROUND',
      diameter: 30,
    });
    expect(lotusLarge.weight).toBe('450 g');
    // The smalls measure as the product does
    expect(rows()[0].measurements.shape).toBeNull();
  });
});
