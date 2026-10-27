import { useQuery } from '@tanstack/react-query';

import { storageService } from '@/api/services/storage';
import { QUERY_KEYS } from '@/constants/query-key';

/**
 * This month's Cloudinary usage. Cloudinary counts about once a day, so it's
 * kept for an hour. `silent`: the dashboard asks too, and a server without
 * Cloudinary answers 503 — the page shows that itself.
 */
export const useStorageUsage = ({ enabled = true } = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.STORAGE.USAGE,
    queryFn: async () => {
      const response = await storageService.usage();
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
    staleTime: 60 * 60 * 1000,
    enabled,
    meta: { silent: true },
  });
