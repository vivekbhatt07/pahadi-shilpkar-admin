import api from '@/api';
import type {
  ApiResponse,
  BuyClickStats,
  DashboardStats,
  ProductDemand,
  StockAlertStats,
} from '@/types/api';

export const statsService = {
  /** Every dashboard count in one request. */
  get: async () => {
    const { data } = await api.get<ApiResponse<DashboardStats>>('/stats');
    return data;
  },

  /** Storefront buy-button clicks over the last `days` days (1–365). */
  getBuyClicks: async (days: number) => {
    const { data } = await api.get<ApiResponse<BuyClickStats>>(
      '/stats/buy-clicks',
      { params: { days } },
    );
    return data;
  },

  /** Products shoppers asked to be emailed about, most wanted first. */
  getStockAlerts: async () => {
    const { data } = await api.get<ApiResponse<StockAlertStats>>(
      '/stats/stock-alerts',
    );
    return data;
  },

  /** One product's buy clicks (last `days` days) and waiting shoppers, per variant. */
  getProductDemand: async (productId: string, days: number) => {
    const { data } = await api.get<ApiResponse<ProductDemand>>(
      `/stats/products/${productId}`,
      { params: { days } },
    );
    return data;
  },
};
