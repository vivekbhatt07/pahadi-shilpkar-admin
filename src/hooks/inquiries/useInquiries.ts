import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { inquiriesService } from '@/api/services/inquiries';
import { QUERY_KEYS } from '@/constants/query-key';
import type { InquiryListParams } from '@/types/api';

/** Newest first; switching tab or page keeps the old rows up until the new ones land. */
export const useInquiries = (params: InquiryListParams) =>
  useQuery({
    queryKey: QUERY_KEYS.INQUIRIES.LIST(params),
    queryFn: async () => {
      const response = await inquiriesService.list(params);
      return (
        response.data ?? {
          items: [],
          total: 0,
          page: params.page ?? 1,
          limit: params.limit ?? 20,
          hasMore: false,
        }
      );
    },
    placeholderData: keepPreviousData,
  });
