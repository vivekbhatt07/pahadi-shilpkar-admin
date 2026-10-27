import api from '@/api';
import type { ApiResponse, StorageUsage, UnusedImages } from '@/types/api';

export const storageService = {
  /** This month's Cloudinary usage — the backend asks at most hourly. */
  usage: async () => {
    const { data } = await api.get<ApiResponse<StorageUsage>>('/storage/usage');
    return data;
  },

  /** Uploaded photos nothing uses, oldest first. */
  unusedImages: async () => {
    const { data } = await api.get<ApiResponse<UnusedImages>>(
      '/storage/unused-images',
    );
    return data;
  },

  /** Deletes those still unused — at most 100 a call. */
  deleteUnusedImages: async (publicIds: string[]) => {
    const { data } = await api.post<ApiResponse<{ deleted: number }>>(
      '/storage/unused-images/delete',
      { publicIds },
    );
    return data;
  },
};
