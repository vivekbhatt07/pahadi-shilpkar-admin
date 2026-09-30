import { useQuery } from '@tanstack/react-query';

import { bannersService } from '@/api/services/banners';
import { QUERY_KEYS } from '@/constants/query-key';
import type { BannerListParams } from '@/types/api';

/** In storefront order. `isLive` is worked out when the list is fetched. */
export const useBanners = (params: BannerListParams = {}) =>
  useQuery({
    queryKey: QUERY_KEYS.BANNERS.LIST(params),
    queryFn: async () => (await bannersService.list(params)).data ?? [],
  });
