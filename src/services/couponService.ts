import { fetchApi } from './api';

export interface Coupon {
  id: string;
  code: string;
  description?: string | null;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usedCount?: number;
  perUserLimit?: number | null;
  applicableProductIds?: string[];
  applicableCategoryIds?: string[];
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
  isExpired?: boolean;
}

export const couponService = {
  getPublicCoupons: async () => {
    try {
      const res = await fetchApi<Coupon[]>('/coupons/public');
      if (res && res.success && Array.isArray(res.data)) {
        return res;
      }
      return { success: true, data: [] as Coupon[] };
    } catch {
      return { success: true, data: [] as Coupon[] };
    }
  },
  validateCoupon: (
    code: string,
    orderAmount?: number,
    items?: Array<{ productId: string; categoryId?: string | null; price: number; quantity: number }>
  ) => {
    return fetchApi<{ valid: boolean; coupon: Coupon; discountAmount: number; finalAmount: number }>(
      '/coupons/validate',
      {
        method: 'POST',
        body: JSON.stringify({ code, orderAmount, items }),
      }
    );
  },
};
