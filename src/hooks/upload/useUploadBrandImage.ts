import { useMutation } from '@tanstack/react-query';

import { uploadService } from '@/api/services/upload';

/** Errors (incl. 503 "not configured") surface via the global toast. */
export const useUploadBrandImage = () =>
  useMutation({
    mutationFn: (file: File) => uploadService.brandImage(file),
  });
