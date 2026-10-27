import api from '@/api';
import type { ApiResponse, FailedJobs } from '@/types/api';

export const jobsService = {
  /** Background jobs that gave up, newest first. */
  failed: async () => {
    const { data } = await api.get<ApiResponse<FailedJobs>>('/jobs/failed');
    return data;
  },

  /** Runs a failed job again now, with all its tries back. */
  retry: async (id: string) => {
    const { data } = await api.post<ApiResponse>(`/jobs/${id}/retry`);
    return data;
  },

  /** Gives up on a failed job for good. */
  dismiss: async (id: string) => {
    const { data } = await api.delete<ApiResponse>(`/jobs/${id}`);
    return data;
  },
};
