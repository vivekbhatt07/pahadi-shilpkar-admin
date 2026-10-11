import type { z } from 'zod';
import type { securityFormSchema } from '../schemas';

export type TSecurityFormData = z.infer<typeof securityFormSchema>;
