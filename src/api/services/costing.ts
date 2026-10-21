import api from '@/api';
import type {
  ApiResponse,
  ComboCosting,
  CostedListingParams,
  CostedListingsPage,
  CostingSettings,
  CostSheet,
  CreateMaterialPayload,
  CreateSalePayload,
  MaterialListParams,
  MaterialsPage,
  ProductCosting,
  ProfitReport,
  ProfitReportParams,
  RawMaterial,
  RawMaterialDetail,
  RecordPurchasePayload,
  Sale,
  SaleListParams,
  SalesPage,
  SaveCostSheetPayload,
  UpdateCostingSettingsPayload,
  UpdateMaterialPayload,
  UpdateSalePayload,
} from '@/types/api';

/** Only the params that are set, as strings. */
const toQuery = (params: object) =>
  Object.fromEntries(
    Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== '')
      .map(([key, value]) => [key, String(value)]),
  );

/** Admin only — what things cost to make, and what the store earned. */
export const costingService = {
  listMaterials: async (params: MaterialListParams = {}) => {
    const { data } = await api.get<ApiResponse<MaterialsPage>>(
      '/costing/materials',
      { params: toQuery(params) },
    );
    return data;
  },

  /** With its purchases (newest first) and the cost sheets using it. */
  getMaterial: async (id: string) => {
    const { data } = await api.get<ApiResponse<RawMaterialDetail>>(
      `/costing/materials/${id}`,
    );
    return data;
  },

  /** 409 when the name is taken, ignoring case. */
  createMaterial: async (payload: CreateMaterialPayload) => {
    const { data } = await api.post<ApiResponse<RawMaterial>>(
      '/costing/materials',
      payload,
    );
    return data;
  },

  /** A new unitCost reaches every cost sheet using it at once. */
  updateMaterial: async (id: string, payload: UpdateMaterialPayload) => {
    const { data } = await api.patch<ApiResponse<RawMaterial>>(
      `/costing/materials/${id}`,
      payload,
    );
    return data;
  },

  /** 409 while a cost sheet uses it — switch it off instead. */
  removeMaterial: async (id: string) => {
    const { data } = await api.delete<ApiResponse>(`/costing/materials/${id}`);
    return data;
  },

  /** Its unit price becomes the material's cost unless updateUnitCost is false. */
  recordPurchase: async (id: string, payload: RecordPurchasePayload) => {
    const { data } = await api.post<ApiResponse<RawMaterialDetail>>(
      `/costing/materials/${id}/purchases`,
      payload,
    );
    return data;
  },

  /** Leaves the material's cost as it is. */
  removePurchase: async (materialId: string, purchaseId: string) => {
    const { data } = await api.delete<ApiResponse<RawMaterialDetail>>(
      `/costing/materials/${materialId}/purchases/${purchaseId}`,
    );
    return data;
  },

  /** Every product (or variant) and combo against its cost, lowest margin first. */
  listCostedListings: async (params: CostedListingParams = {}) => {
    const { data } = await api.get<ApiResponse<CostedListingsPage>>(
      '/costing/listings',
      { params: toQuery(params) },
    );
    return data;
  },

  getProductCosting: async (productId: string) => {
    const { data } = await api.get<ApiResponse<ProductCosting>>(
      `/costing/products/${productId}`,
    );
    return data;
  },

  getComboCosting: async (comboId: string) => {
    const { data } = await api.get<ApiResponse<ComboCosting>>(
      `/costing/combos/${comboId}`,
    );
    return data;
  },

  /** Created on first save, replaced as a whole after. */
  saveSheet: async (payload: SaveCostSheetPayload) => {
    const { data } = await api.put<ApiResponse<CostSheet>>(
      '/costing/sheets',
      payload,
    );
    return data;
  },

  removeSheet: async (id: string) => {
    const { data } = await api.delete<ApiResponse>(`/costing/sheets/${id}`);
    return data;
  },

  getSettings: async () => {
    const { data } =
      await api.get<ApiResponse<CostingSettings>>('/costing/settings');
    return data;
  },

  updateSettings: async (payload: UpdateCostingSettingsPayload) => {
    const { data } = await api.patch<ApiResponse<CostingSettings>>(
      '/costing/settings',
      payload,
    );
    return data;
  },

  /** Newest first, with a summary of every sale the filters match. */
  listSales: async (params: SaleListParams = {}) => {
    const { data } = await api.get<ApiResponse<SalesPage>>('/costing/sales', {
      params: toQuery(params),
    });
    return data;
  },

  /** The ledger as CSV — the whole response, for its file name. */
  exportSales: (params: Omit<SaleListParams, 'page' | 'limit'> = {}) =>
    api.get<Blob>('/costing/sales/export', {
      params: toQuery(params),
      responseType: 'blob',
    }),

  /** With deductStock, all of it comes out of stock or nothing is saved. */
  createSale: async (payload: CreateSalePayload) => {
    const { data } = await api.post<ApiResponse<Sale>>(
      '/costing/sales',
      payload,
    );
    return data;
  },

  updateSale: async (id: string, payload: UpdateSalePayload) => {
    const { data } = await api.patch<ApiResponse<Sale>>(
      `/costing/sales/${id}`,
      payload,
    );
    return data;
  },

  /** With restock, what the sale took out of stock goes back. */
  removeSale: async (id: string, restock: boolean) => {
    const { data } = await api.delete<ApiResponse>(`/costing/sales/${id}`, {
      params: restock ? { restock: 'true' } : {},
    });
    return data;
  },

  getReport: async (params: ProfitReportParams = {}) => {
    const { data } = await api.get<ApiResponse<ProfitReport>>(
      '/costing/report',
      { params: toQuery(params) },
    );
    return data;
  },
};
