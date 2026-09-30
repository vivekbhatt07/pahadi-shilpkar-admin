import api from '@/api';
import type {
  ApiResponse,
  AuthPayload,
  ChangePasswordPayload,
  SignInPayload,
  UpdateProfilePayload,
  User,
} from '@/types/api';

export const authService = {
  signIn: async (payload: SignInPayload) => {
    const { data } = await api.post<ApiResponse<AuthPayload>>(
      '/auth/sign-in',
      payload,
    );
    return data;
  },

  me: async () => {
    const { data } = await api.get<ApiResponse<User>>('/auth/me');
    return data;
  },

  updateProfile: async (payload: UpdateProfilePayload) => {
    const { data } = await api.patch<ApiResponse<User>>('/auth/me', payload);
    return data;
  },

  /**
   * Revokes every older token, this session's included — the response
   * carries the fresh token to keep this session signed in.
   */
  changePassword: async (payload: ChangePasswordPayload) => {
    const { data } = await api.patch<ApiResponse<{ token: string }>>(
      '/auth/change-password',
      payload,
    );
    return data;
  },

  /** Revokes every token for the account, this session's included. */
  signOutAll: async () => {
    const { data } = await api.post<ApiResponse>('/auth/sign-out-all');
    return data;
  },

  forgotPassword: async (email: string) => {
    const { data } = await api.post<ApiResponse>('/auth/forgot-password', {
      email,
    });
    return data;
  },
};
