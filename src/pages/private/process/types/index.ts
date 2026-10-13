import type { z } from 'zod';
import type { processPageFormSchema, processStepFormSchema } from '../schemas';

export type TProcessPageFormData = z.infer<typeof processPageFormSchema>;

export type TProcessStepFormData = z.infer<typeof processStepFormSchema>;
