import type z from 'zod';
import type { bannerFormSchema } from '../schemas';

export type TBannerFormData = z.infer<typeof bannerFormSchema>;

/** Where a banner stands right now, from its switch and its schedule. */
export type TBannerStatus = 'live' | 'scheduled' | 'ended' | 'hidden';
