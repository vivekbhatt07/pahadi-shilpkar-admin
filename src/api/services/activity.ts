import api from '@/api';
import type {
  ActivityListParams,
  AdminActivity,
  ApiResponse,
  Paginated,
} from '@/types/api';

export const activityService = {
  /** Every change admins made, newest first. */
  list: async (params: ActivityListParams = {}) => {
    const { data } = await api.get<ApiResponse<Paginated<AdminActivity>>>(
      '/activity',
      { params },
    );
    return data;
  },
};
