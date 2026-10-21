import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

import { costingService } from '@/api/services/costing';
import { QUERY_KEYS } from '@/constants/query-key';
import type {
  CreateMaterialPayload,
  CreateSalePayload,
  RecordPurchasePayload,
  SaveCostSheetPayload,
  UpdateCostingSettingsPayload,
  UpdateMaterialPayload,
  UpdateSalePayload,
} from '@/types/api';

/**
 * Every costing write refreshes all of costing: a material's price moves the
 * sheets using it, a sheet moves the listings, a sale moves the reports.
 * `stock` also refreshes the catalog, for a sale that moved stock.
 */
const useCostingMutation = <TVariables, TResponse extends { message: string }>(
  mutationFn: (variables: TVariables) => Promise<TResponse>,
  { stock = false, quiet = false } = {},
) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COSTING.ALL });
      if (stock) {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.PRODUCTS.ALL });
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.COMBOS.ALL });
      }
      if (!quiet) toast.success(response.message);
    },
  });
};

export const useCreateMaterial = () =>
  useCostingMutation((payload: CreateMaterialPayload) =>
    costingService.createMaterial(payload),
  );

export const useUpdateMaterial = () =>
  useCostingMutation(
    ({ id, payload }: { id: string; payload: UpdateMaterialPayload }) =>
      costingService.updateMaterial(id, payload),
  );

export const useDeleteMaterial = () =>
  useCostingMutation((id: string) => costingService.removeMaterial(id));

export const useRecordPurchase = () =>
  useCostingMutation(
    ({ id, payload }: { id: string; payload: RecordPurchasePayload }) =>
      costingService.recordPurchase(id, payload),
  );

export const useDeletePurchase = () =>
  useCostingMutation(
    ({ materialId, purchaseId }: { materialId: string; purchaseId: string }) =>
      costingService.removePurchase(materialId, purchaseId),
  );

export const useSaveCostSheet = () =>
  useCostingMutation((payload: SaveCostSheetPayload) =>
    costingService.saveSheet(payload),
  );

export const useDeleteCostSheet = () =>
  useCostingMutation((id: string) => costingService.removeSheet(id));

export const useUpdateCostingSettings = () =>
  useCostingMutation((payload: UpdateCostingSettingsPayload) =>
    costingService.updateSettings(payload),
  );

export const useCreateSale = () =>
  useCostingMutation(
    (payload: CreateSalePayload) => costingService.createSale(payload),
    { stock: true },
  );

export const useUpdateSale = () =>
  useCostingMutation(
    ({ id, payload }: { id: string; payload: UpdateSalePayload }) =>
      costingService.updateSale(id, payload),
    { stock: true },
  );

export const useDeleteSale = () =>
  useCostingMutation(
    ({ id, restock }: { id: string; restock: boolean }) =>
      costingService.removeSale(id, restock),
    { stock: true },
  );
