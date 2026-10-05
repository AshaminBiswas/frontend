import { fetchApi } from './api';
import {
  B2BOrder,
  B2BOrderListResponse,
  B2BBranch,
  SubmitB2BOrderPayload,
} from '../types/b2bOrder';
import { ApiResponse } from '../types';

export const b2bOrderService = {
  /**
   * Submit a new customer B2B Order (creates order in 'pending_approval' with stock reserved)
   */
  async submitB2BOrder(payload: SubmitB2BOrderPayload): Promise<ApiResponse<B2BOrder>> {
    return fetchApi<B2BOrder>('/b2b-orders/submit', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  /**
   * Fetch authenticated B2B customer's orders
   */
  async getMyB2BOrders(params: {
    page?: number;
    limit?: number;
    status?: string;
  } = {}): Promise<ApiResponse<B2BOrderListResponse>> {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.status && params.status !== 'ALL') query.set('status', params.status);

    const qs = query.toString();
    return fetchApi<B2BOrderListResponse>(`/b2b-orders/my-orders${qs ? `?${qs}` : ''}`);
  },

  /**
   * Get single B2B Order dossier by ID
   */
  async getMyB2BOrder(id: string): Promise<ApiResponse<B2BOrder>> {
    return fetchApi<B2BOrder>(`/b2b-orders/my-orders/${id}`);
  },

  /**
   * Customer self-cancellation (permitted only while order is pending_approval)
   */
  async cancelMyB2BOrder(id: string, reason?: string): Promise<ApiResponse<B2BOrder>> {
    return fetchApi<B2BOrder>(`/b2b-orders/my-orders/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  /**
   * Check real-time available stock (physical - reserved) across items
   */
  async checkStock(
    branchId: string,
    productIds: string[]
  ): Promise<
    ApiResponse<
      {
        productId: string;
        physicalStock: number;
        reservedStock: number;
        availableStock: number;
      }[]
    >
  > {
    const query = new URLSearchParams();
    query.set('branchId', branchId);
    query.set('productIds', productIds.join(','));
    return fetchApi(`/b2b-orders/check-stock?${query.toString()}`);
  },

  /**
   * Fetch active fulfillment facilities
   */
  async getActiveBranches(): Promise<ApiResponse<B2BBranch[]>> {
    return fetchApi<B2BBranch[]>('/branches?isActive=true');
  },
};
