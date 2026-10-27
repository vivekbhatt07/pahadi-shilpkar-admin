import { useQuery } from '@tanstack/react-query';

import { storageService } from '@/api/services/storage';
import { QUERY_KEYS } from '@/constants/query-key';

/**
 * Uploaded photos nothing uses. Listing them walks the whole Cloudinary
 * account, so it's asked for when the page opens and after a delete.
 */
export const useUnusedImages = () =>
  useQuery({
    queryKey: QUERY_KEYS.STORAGE.UNUSED_IMAGES,
    queryFn: async () => {
      const response = await storageService.unusedImages();
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
    meta: { silent: true },
  });
