import type z from 'zod';
import type { productFormSchema } from '../schemas';

export type TProductFormData = z.infer<typeof productFormSchema>;

/** The measurements inputs; `shape: null` = not measured. */
export type TMeasurementsFormValue = TProductFormData['measurements'];

export type TProductFormMode = 'create' | 'edit';
