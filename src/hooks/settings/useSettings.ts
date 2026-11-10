import { useQuery } from '@tanstack/react-query';

import { settingsService } from '@/api/services/settings';
import { QUERY_KEYS } from '@/constants/query-key';
import type { StoreSettings } from '@/types/api';

const EMPTY_SETTINGS: StoreSettings = {
  whatsappNumber: null,
  whatsappMessageTemplate: null,
  deliveryCharge: null,
  deliveryFee: null,
  contactEmail: null,
  contactPhone: null,
  instagramUrl: null,
  facebookUrl: null,
  youtubeUrl: null,
  lowStockThreshold: 5,
  showStockLeft: true,
  headerLogoLight: null,
  headerLogoDark: null,
  footerLogoLight: null,
  footerLogoDark: null,
  favicon: null,
  heroImage: null,
  authLogo: null,
  authImage: null,
  authHeadline: null,
  authDescription: null,
  footerTagline: null,
  footerAbout: null,
  footerCopyright: null,
  footerNote: null,
  updatedAt: null,
};

export const useSettings = () =>
  useQuery({
    queryKey: QUERY_KEYS.SETTINGS.GET,
    queryFn: async () => (await settingsService.get()).data ?? EMPTY_SETTINGS,
    staleTime: 5 * 60 * 1000,
  });
