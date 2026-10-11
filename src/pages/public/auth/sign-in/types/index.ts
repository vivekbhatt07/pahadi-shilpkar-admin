import type { z } from 'zod';
import type { signInFormDataSchema } from '../schemas';

export type TSignInFormData = z.infer<typeof signInFormDataSchema>;
