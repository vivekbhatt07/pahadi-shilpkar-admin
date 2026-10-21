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
  updatedAt: null,
};

export const useSettings = () =>
  useQuery({
    queryKey: QUERY_KEYS.SETTINGS.GET,
    queryFn: async () => (await settingsService.get()).data ?? EMPTY_SETTINGS,
    staleTime: 5 * 60 * 1000,
  });
