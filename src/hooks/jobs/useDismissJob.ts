import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { jobsService } from '@/api/services/jobs';

/** The list and the dashboard count refresh with STATS, as after any write. */
export const useDismissJob = () =>
  useMutation({
    mutationFn: (id: string) => jobsService.dismiss(id),
    onSuccess: (response) => toast.success(response.message),
  });
