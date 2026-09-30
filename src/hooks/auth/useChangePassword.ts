import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { authService } from '@/api/services/auth';
import { useAuthStore } from '@/store/authStore';
import type { ChangePasswordPayload } from '@/types/api';

/**
 * The change revokes every older token, this session's included — keep this
 * session signed in with the fresh one the API returns. It is stored inside
 * mutationFn, ahead of every onSuccess: the mutation cache's global onSuccess
 * runs first and refetches the stats, and a request still carrying the
 * revoked token would sign the admin out.
 */
export const useChangePassword = () => {
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: async (payload: ChangePasswordPayload) => {
      const response = await authService.changePassword(payload);
      if (response.data?.token) setToken(response.data.token);
      return response;
    },
    onSuccess: (response) => {
      toast.success(response.message, {
        description: 'Any other devices have been signed out.',
      });
    },
  });
};
