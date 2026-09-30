import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

import { authService } from '@/api/services/auth';
import { ROUTES } from '@/constants/routes';
import { useAuthStore } from '@/store/authStore';

/** Revokes every token for the account server-side, then drops this one. */
export const useSignOutAll = () => {
  const logout = useAuthStore((state) => state.logout);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  return useMutation({
    mutationFn: () => authService.signOutAll(),
    onSuccess: (response) => {
      logout();
      queryClient.clear();
      toast.success(response.message);
      navigate(ROUTES.PUBLIC.AUTH.SIGN_IN, { replace: true });
    },
  });
};
