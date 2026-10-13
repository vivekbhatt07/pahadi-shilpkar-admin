import api from '@/api';
import type {
  ApiResponse,
  CreateProcessStepPayload,
  Process,
  ProcessPage,
  ProcessParams,
  ProcessStep,
  ReorderProcessStepsPayload,
  UpdateProcessPagePayload,
  UpdateProcessStepPayload,
} from '@/types/api';

/** The storefront's "How we make it" page. */
export const processService = {
  /** The page's words and its steps, by sortOrder. */
  get: async (params: ProcessParams = {}) => {
    const { data } = await api.get<ApiResponse<Process>>('/process', {
      params: params.includeInactive ? { includeInactive: 'true' } : {},
    });
    return data;
  },

  updatePage: async (payload: UpdateProcessPagePayload) => {
    const { data } = await api.patch<ApiResponse<ProcessPage>>(
      '/process/page',
      payload,
    );
    return data;
  },

  createStep: async (payload: CreateProcessStepPayload) => {
    const { data } = await api.post<ApiResponse<ProcessStep>>(
      '/process/steps',
      payload,
    );
    return data;
  },

  updateStep: async (id: string, payload: UpdateProcessStepPayload) => {
    const { data } = await api.patch<ApiResponse<ProcessStep>>(
      `/process/steps/${id}`,
      payload,
    );
    return data;
  },

  /** Applied in one transaction. 1–50 items; an unknown id fails them all. */
  reorderSteps: async (payload: ReorderProcessStepsPayload) => {
    const { data } = await api.patch<ApiResponse>(
      '/process/steps/reorder',
      payload,
    );
    return data;
  },

  removeStep: async (id: string) => {
    const { data } = await api.delete<ApiResponse>(`/process/steps/${id}`);
    return data;
  },
};
