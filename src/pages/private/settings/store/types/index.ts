import type { z } from 'zod';
import type { storeSettingsFormSchema } from '../schemas';

export type TStoreSettingsFormData = z.infer<typeof storeSettingsFormSchema>;
