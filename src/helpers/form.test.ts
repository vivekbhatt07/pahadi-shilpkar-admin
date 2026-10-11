import type { UseFormReturn } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';

import { ApiError } from '@/api/error';
import { applyApiFieldErrors, pickChangedFields } from '@/helpers/form';

describe('pickChangedFields', () => {
  it('returns only what changed, so PATCH never re-sends an unchanged name', () => {
    expect(
      pickChangedFields(
        { name: 'Diya', price: 299, isActive: true },
        { name: 'Diya', price: 349, isActive: true },
      ),
    ).toEqual({ price: 349 });
  });

  it('compares arrays and objects by value — a form submit copies them', () => {
    const current = {
      tags: ['diwali', 'brass'],
      specifications: [{ label: 'Finish', value: 'Matte' }],
      measurements: { shape: 'ROUND', unit: 'CM', diameter: 12 },
    };
    expect(pickChangedFields(current, structuredClone(current))).toEqual({});
  });

  it('notices a reordered list or an edited nested value', () => {
    const current = {
      tags: ['diwali', 'brass'],
      specifications: [{ label: 'Finish', value: 'Matte' }],
    };
    expect(
      pickChangedFields(current, {
        tags: ['brass', 'diwali'],
        specifications: [{ label: 'Finish', value: 'Gloss' }],
      }),
    ).toEqual({
      tags: ['brass', 'diwali'],
      specifications: [{ label: 'Finish', value: 'Gloss' }],
    });
  });

  it('treats clearing a value as a change', () => {
    expect(
      pickChangedFields({ sku: 'DIY-01' }, { sku: '' as string | null }),
    ).toEqual({ sku: '' });
    expect(pickChangedFields({ hex: '#fff' }, { hex: null })).toEqual({
      hex: null,
    });
  });
});

describe('applyApiFieldErrors', () => {
  const makeForm = () => {
    const setError = vi.fn();
    return { form: { setError } as unknown as UseFormReturn, setError };
  };

  it("maps the backend's array paths onto react-hook-form's", () => {
    const { form, setError } = makeForm();
    const error = new ApiError('Validation failed', {
      status: 400,
      fieldErrors: [
        { field: 'images[2]', message: 'Image URL is invalid' },
        { field: 'colors[0].hex', message: 'Use a #rrggbb colour' },
      ],
    });

    expect(applyApiFieldErrors(form, error)).toBe(true);
    expect(setError).toHaveBeenCalledWith('images.2', {
      type: 'server',
      message: 'Image URL is invalid',
    });
    expect(setError).toHaveBeenCalledWith('colors.0.hex', {
      type: 'server',
      message: 'Use a #rrggbb colour',
    });
  });

  it('leaves errors without field details to the caller', () => {
    const { form, setError } = makeForm();
    expect(
      applyApiFieldErrors(form, new ApiError('Conflict', { status: 409 })),
    ).toBe(false);
    expect(applyApiFieldErrors(form, new Error('Network Error'))).toBe(false);
    expect(setError).not.toHaveBeenCalled();
  });
});
