import type { z } from 'zod';
import type { profileFormSchema } from '../schemas';

export type TProfileFormData = z.infer<typeof profileFormSchema>;
