import type { z } from 'zod';
import type { categoryFormSchema } from '../schemas';

export type TCategoryFormData = z.infer<typeof categoryFormSchema>;
