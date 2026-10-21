import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';

import { productsService } from '@/api/services/products';
import { saveDownload } from '@/helpers/download';
import type { VariantListParams } from '@/types/api';

/** The variants list, as filtered, saved as a CSV for a stock-take. */
export const useExportVariants = () =>
  useMutation({
    mutationFn: (params: Omit<VariantListParams, 'page' | 'limit'>) =>
      productsService.exportVariants(params),
    onSuccess: (response) => {
      saveDownload(response, 'variant-stock.csv');
      toast.success('Stock sheet downloaded');
    },
  });
