import type { z } from 'zod';
import type { brandingFormSchema } from '../schemas';

export type TBrandingFormData = z.infer<typeof brandingFormSchema>;
