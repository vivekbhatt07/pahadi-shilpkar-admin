import api from '@/api';
import type { ApiResponse, DashboardStats } from '@/types/api';

export const statsService = {
  /** Every dashboard count in one request. */
  get: async () => {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/stats');
    return data;
  },
};
