import axios, { type AxiosError } from 'axios';
import { toast } from 'sonner';

import { useAuthStore } from '@/store/authStore';
import { useRateLimitStore } from '@/store/rateLimitStore';
import { AUTH_MESSAGES } from '@/constants/messages/auth';
import type { ApiResponse } from '@/types/api';
import { ApiError, parseFieldErrors } from './error';

const baseURL = `${import.meta.env.VITE_API_BASE_URL}/api`;

// No default Content-Type header: axios sets `application/json` itself for
// plain-object bodies. Leaving it unset lets FormData bodies (image uploads)
// fall through untouched so the browser can add the multipart boundary —
// with a default JSON header present, axios would instead JSON.stringify
// the FormData, which breaks file uploads.
export const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiResponse>) => {
    const status = error.response?.status;
    const body = error.response?.data;
    const { token, logout } = useAuthStore.getState();

    const message =
      body?.message ??
      (error.code === 'ERR_NETWORK'
        ? 'Unable to reach the server. Please check your connection.'
        : 'Something went wrong. Please try again later');

    let handled = false;

    // Session invalid / expired / unverified → drop token, ProtectedRoute
    // sends the admin back to sign-in. Sign-in itself also answers 401 for
    // bad credentials; there is no token then, so nothing to clear.
    if (status === 401 && token) {
      logout();
      toast.error(message);
      handled = true;
    }

    // Verified but not an admin → sign out with an explicit "admin only".
    if (status === 403) {
      if (token) logout();
      toast.error(AUTH_MESSAGES.ADMIN_ONLY);
      handled = true;
    }

    if (status === 429) {
      // Both are seconds. They are only readable cross-origin if the backend
      // exposes them; the store falls back to the 15-minute window otherwise.
      const headers = error.response?.headers ?? {};
      const retryAfter = Number(
        headers['retry-after'] ?? headers['ratelimit-reset'],
      );
      useRateLimitStore
        .getState()
        .trigger(
          message,
          Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : null,
        );
      handled = true;
    }

    const fieldErrors = status === 400 ? parseFieldErrors(body) : undefined;

    return Promise.reject(
      new ApiError(message, { status, fieldErrors, handled }),
    );
  },
);

export default api;
