import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { authService } from '@/api/services/auth';
import { useAuthStore } from '@/store/authStore';
import type { ChangePasswordPayload } from '@/types/api';

/**
 * The change revokes every older token, this session's included — keep this
 * session signed in with the fresh one the API returns.
 */
export const useChangePassword = () => {
  const setToken = useAuthStore((state) => state.setToken);

  return useMutation({
    mutationFn: (payload: ChangePasswordPayload) =>
      authService.changePassword(payload),
    onSuccess: (response) => {
      if (response.data?.token) setToken(response.data.token);
      toast.success(response.message, {
        description: 'Any other devices have been signed out.',
      });
    },
  });
};
