import { Product, User } from "../types";

export interface EffectivePriceResult {
  unitPrice: number;
  originalPrice: number;
  totalPrice: number;
  isB2B: boolean;
  b2bDiscountPercent: number;
  savings: number;
  tierName?: string;
}

export function isB2BUser(user: User | null): boolean {
  return !!(user && (user.companyName || user.gstin || user.role === "B2B"));
}

/**
 * Calculates the effective price for a product based on user account type (B2C vs B2B)
 * and purchase quantity.
 */
export function getEffectivePrice(
  product: Product,
  user: User | null,
  qty: number = 1
): EffectivePriceResult {
  const isB2B = isB2BUser(user);
  const basePrice = Number(product.price || (product as any).salePrice || (product as any).unitPrice || 0);
  const originalPrice = Number(product.originalPrice || (product as any).mrp || (product as any).compareAtPrice || (product as any).regularPrice || (product as any).listPrice || basePrice);

  let unitPrice = basePrice;
  let tierName: string | undefined = undefined;

  if (isB2B) {
    // Standard B2B base discount (20% off retail base price)
    let b2bRate = Math.round(basePrice * 0.8);

    // Apply volume quantity tiers for B2B customers
    if (qty >= 100) {
      unitPrice = Math.round(b2bRate * 0.85); // Additional 15% off for 100+ units
      tierName = "Bulk 100+ Tier";
    } else if (qty >= 50) {
      unitPrice = Math.round(b2bRate * 0.9); // Additional 10% off for 50+ units
      tierName = "Wholesale 50+ Tier";
    } else if (qty >= 10) {
      unitPrice = Math.round(b2bRate * 0.95); // Additional 5% off for 10+ units
      tierName = "Volume 10+ Tier";
    } else {
      unitPrice = b2bRate;
      tierName = "B2B Standard Rate";
    }
  }

  const totalPrice = unitPrice * qty;
  const savings = Math.max(0, originalPrice - unitPrice) * qty;
  const b2bDiscountPercent = isB2B && originalPrice > 0 ? Math.round(((originalPrice - unitPrice) / originalPrice) * 100) : 0;

  return {
    unitPrice,
    originalPrice,
    totalPrice,
    isB2B,
    b2bDiscountPercent,
    savings,
    tierName,
  };
}

