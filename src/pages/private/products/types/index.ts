import type { z } from 'zod';
import type { productFormSchema } from '../schemas';

export type TProductFormData = z.infer<typeof productFormSchema>;

/** The measurements inputs; `shape: null` = not measured. */
export type TMeasurementsFormValue = TProductFormData['measurements'];

/** A row of the variants table. */
export type TVariantFormValue = TProductFormData['variants'][number];

/** An option the variants differ by — "Design" and its values. */
export type TVariantOptionFormValue =
  TProductFormData['variantOptions'][number];

export type TProductFormMode = 'create' | 'edit';
