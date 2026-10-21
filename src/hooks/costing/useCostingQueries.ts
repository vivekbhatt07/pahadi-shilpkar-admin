import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

import { costingService } from '@/api/services/costing';
import { QUERY_KEYS } from '@/constants/query-key';
import { saveDownload } from '@/helpers/download';
import type {
  CostedListingParams,
  CostingSettings,
  ProfitReportParams,
  SaleListParams,
} from '@/types/api';

const EMPTY_SETTINGS: CostingSettings = {
  channelFees: [],
  targetMarginPercent: null,
  taxPercent: null,
  updatedAt: null,
};

export const useCostingSettings = () =>
  useQuery({
    queryKey: QUERY_KEYS.COSTING.SETTINGS,
    queryFn: async () =>
      (await costingService.getSettings()).data ?? EMPTY_SETTINGS,
    staleTime: 5 * 60 * 1000,
  });

export const useCostedListings = (params: CostedListingParams) =>
  useQuery({
    queryKey: QUERY_KEYS.COSTING.LISTINGS(params),
    queryFn: async () => (await costingService.listCostedListings(params)).data,
    placeholderData: keepPreviousData,
  });

export const useProductCosting = (productId: string | undefined) =>
  useQuery({
    queryKey: QUERY_KEYS.COSTING.PRODUCT(productId ?? ''),
    queryFn: async () =>
      (await costingService.getProductCosting(productId!)).data ?? null,
    enabled: Boolean(productId),
  });

export const useComboCosting = (comboId: string | undefined) =>
  useQuery({
    queryKey: QUERY_KEYS.COSTING.COMBO(comboId ?? ''),
    queryFn: async () =>
      (await costingService.getComboCosting(comboId!)).data ?? null,
    enabled: Boolean(comboId),
  });

export const useSales = (params: SaleListParams) =>
  useQuery({
    queryKey: QUERY_KEYS.COSTING.SALES(params),
    queryFn: async () => (await costingService.listSales(params)).data,
    placeholderData: keepPreviousData,
  });

export const useProfitReport = (params: ProfitReportParams) =>
  useQuery({
    queryKey: QUERY_KEYS.COSTING.REPORT(params),
    queryFn: async () => (await costingService.getReport(params)).data,
    placeholderData: keepPreviousData,
  });

/** The ledger, as filtered, saved as a CSV for the accounts. */
export const useExportSales = () =>
  useMutation({
    mutationFn: (params: Omit<SaleListParams, 'page' | 'limit'>) =>
      costingService.exportSales(params),
    onSuccess: (response) => {
      saveDownload(response, 'sales.csv');
      toast.success('Sales ledger downloaded');
    },
  });
