import api from '@/api';
import type {
  ApiResponse,
  StoreSettings,
  UpdateSettingsPayload,
} from '@/types/api';

export const settingsService = {
  /** All fields null + updatedAt null until first saved. Public. */
  get: async () => {
    const { data } = await api.get<ApiResponse<StoreSettings>>('/settings');
    return data;
  },

  update: async (payload: UpdateSettingsPayload) => {
    const { data } = await api.patch<ApiResponse<StoreSettings>>(
      '/settings',
      payload,
    );
    return data;
  },
};
