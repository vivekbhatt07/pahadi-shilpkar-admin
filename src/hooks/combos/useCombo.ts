import { useQuery } from '@tanstack/react-query';

import { combosService } from '@/api/services/combos';
import { QUERY_KEYS } from '@/constants/query-key';

/** Always includes hidden combos (inactive, or with an inactive product). */
export const useCombo = (slug: string | undefined) =>
  useQuery({
    queryKey: QUERY_KEYS.COMBOS.DETAIL(slug ?? ''),
    queryFn: async () => {
      const response = await combosService.getBySlug(slug!, true);
      if (!response.data) throw new Error(response.message);
      return response.data;
    },
    enabled: Boolean(slug),
    // The page renders its own not-found state.
    meta: { silent: true },
  });
