import { fetchApi } from './api';

export interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderAmount?: number | null;
  maxDiscountAmount?: number | null;
  usageLimit?: number | null;
  usedCount?: number;
  perUserLimit?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  isActive: boolean;
}

export const couponService = {
  getPublicCoupons: () => {
    return fetchApi<Coupon[]>('/coupons/public');
  },
  validateCoupon: (code: string, orderAmount?: number) => {
    return fetchApi<{ valid: boolean; coupon: Coupon; discountAmount: number; finalAmount: number }>(
      '/coupons/validate',
      {
        method: 'POST',
        body: JSON.stringify({ code, orderAmount }),
      }
    );
  },
};
