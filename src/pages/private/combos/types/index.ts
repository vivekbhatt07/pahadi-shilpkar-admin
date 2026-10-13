import type { z } from 'zod';

import type { ComboProduct, ComboVariant } from '@/types/api';
import type { comboFormSchema } from '../schemas';

export type TComboFormData = z.infer<typeof comboFormSchema>;

export type TComboFormItem = TComboFormData['items'][number];

export type TComboFormMode = 'create' | 'edit';

/**
 * A product page can pass `{ product }` as router state to start from it —
 * with `variant` for a product that comes in variants.
 */
export type TCreateComboState = {
  product?: ComboProduct;
  variant?: ComboVariant;
} | null;
