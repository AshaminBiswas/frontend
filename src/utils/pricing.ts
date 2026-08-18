import { Product, User } from "../types";

export interface EffectivePriceResult {
  unitPrice: number;
  originalPrice: number;
  totalPrice: number;
  isB2B: boolean;
  b2bDiscountPercent: number;
  savings: number;
  tierName?: string;
  isCustomB2BPrice?: boolean;
  minQuantity?: number;
  currency?: "INR" | "AED" | string;
}

export function isB2BUser(user: User | null): boolean {
  if (!user) return false;
  const roleSlug = typeof user.role === "object" && user.role !== null
    ? ((user.role as any).slug || (user.role as any).name || "")
    : String(user.role || "");
  return (
    !!user.companyName ||
    !!user.gstin ||
    roleSlug.toLowerCase().includes("b2b") ||
    roleSlug === "B2B" ||
    roleSlug === "b2b-customer" ||
    roleSlug === "b2b_customer"
  );
}

/**
 * Calculates the effective price for a product based on user account type (B2C vs B2B).
 *
 * Rules:
 *  - B2C customers: see `offerPrice` when an offer is active, otherwise `salePrice` / regular `price`.
 *  - B2B customers:
 *      1. If a custom admin-set price exists in `b2bCache`, use it on the very first paint.
 *      2. If direct `b2bPrice` exists on the product, use that.
 *      3. Otherwise fall back to automated volume-tiered discounts off the base price.
 *
 * @param product   - The product to price
 * @param user      - The currently logged-in user (or null)
 * @param qty       - Quantity being purchased (used for volume tiers)
 * @param b2bCache  - Optional B2B pricing cache from fetchB2BPricingMatrix() or readStoredB2BPricing()
 */
export function getEffectivePrice(
  product: Product,
  user: User | null,
  qty: number = 1,
  b2bCache?: { prices: Record<string, any> } | null
): EffectivePriceResult {
  const isB2B = isB2BUser(user);

  const activeOfferPrice =
    product.offerPrice !== undefined && product.offerPrice !== null && Number(product.offerPrice) > 0
      ? Number(product.offerPrice)
      : null;

  const activeSalePrice =
    product.salePrice !== undefined && product.salePrice !== null && Number(product.salePrice) > 0
      ? Number(product.salePrice)
      : null;

  const standardPrice = Number(product.price || 0);

  // B2C price logic: offerPrice if active, otherwise salePrice or price
  const basePrice = activeOfferPrice ?? activeSalePrice ?? standardPrice;

  const originalPrice = Number(
    product.originalPrice ||
    (product as any).mrp ||
    product.regularPrice ||
    (product as any).compareAtPrice ||
    (product as any).listPrice ||
    (standardPrice > basePrice ? standardPrice : (activeSalePrice && activeOfferPrice && activeSalePrice > activeOfferPrice ? activeSalePrice : basePrice))
  );

  let unitPrice = basePrice;
  let tierName: string | undefined = undefined;
  let isCustomB2BPrice = false;
  let minQuantity: number | undefined = undefined;

  if (isB2B) {
    // ── 1. Try admin-set custom B2B price from the pricing matrix ──
    const idKeys = [
      String((product as any).apiId || ""),
      String(product.id || ""),
      String((product as any)._id || ""),
      String((product as any).slug || ""),
      product.sku ? String(product.sku).toLowerCase() : "",
      product.name ? String(product.name).toLowerCase().trim() : "",
    ].filter(Boolean);

    let customEntry: any = null;
    if (b2bCache?.prices) {
      for (const k of idKeys) {
        if (b2bCache.prices[k]) {
          customEntry = b2bCache.prices[k];
          break;
        }
      }
    }

    const directB2BRate = Number(
      (product as any).b2bPrice ||
      (product as any).b2bRate ||
      (product as any).b2b_rate ||
      (product as any).b2b_price ||
      0
    );

    if (customEntry && customEntry.hasCustomPrice && Number(customEntry.customPrice) > 0) {
      unitPrice = Number(customEntry.customPrice);
      isCustomB2BPrice = true;
      minQuantity = customEntry.minQuantity ?? 1;
      tierName = `Custom B2B Contract Rate${customEntry.discountPercent > 0 ? ` (${customEntry.discountPercent}% off)` : ""}`;
    } else if (directB2BRate > 0) {
      unitPrice = directB2BRate;
      isCustomB2BPrice = true;
      tierName = "B2B Contract Rate";
    } else {
      // ── 2. Fallback: volume-tiered discount off base price ──
      const b2bRate = Math.round(basePrice * 0.8); // Standard 20% off

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
  }

  const totalPrice = unitPrice * Math.max(1, qty);
  const savings = Math.max(0, originalPrice - unitPrice) * Math.max(1, qty);
  const b2bDiscountPercent =
    isB2B && originalPrice > 0
      ? Math.round(((originalPrice - unitPrice) / originalPrice) * 100)
      : 0;

  return {
    unitPrice,
    originalPrice,
    totalPrice,
    isB2B,
    b2bDiscountPercent,
    savings,
    tierName,
    isCustomB2BPrice,
    minQuantity,
    currency: "INR",
  };
}
