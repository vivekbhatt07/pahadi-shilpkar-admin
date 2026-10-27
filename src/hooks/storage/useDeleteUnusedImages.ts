import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { storageService } from '@/api/services/storage';
import { QUERY_KEYS } from '@/constants/query-key';

/** The backend takes at most this many a call. */
const BATCH_SIZE = 100;

/**
 * Deletes these unused photos, 100 a call. Any saved, or uploaded again,
 * since the list was fetched stay — so fewer may go than were picked.
 */
export const useDeleteUnusedImages = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (publicIds: string[]) => {
      let deleted = 0;
      for (let start = 0; start < publicIds.length; start += BATCH_SIZE) {
        const response = await storageService.deleteUnusedImages(
          publicIds.slice(start, start + BATCH_SIZE),
        );
        deleted += response.data?.deleted ?? 0;
      }
      return { deleted, kept: publicIds.length - deleted };
    },
    onSuccess: ({ deleted, kept }) => {
      toast.success(
        `Deleted ${deleted} unused ${deleted === 1 ? 'photo' : 'photos'}`,
        kept > 0
          ? {
              description: `${kept} ${kept === 1 ? 'is' : 'are'} in use again, so ${kept === 1 ? 'it stays' : 'they stay'}.`,
            }
          : undefined,
      );
    },
    // A batch that failed may follow some that didn't
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.STORAGE.ALL }),
  });
};
