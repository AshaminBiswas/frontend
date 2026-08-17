import { fetchApi } from "./api";

export interface B2BProductPrice {
  productId: string;
  customPrice: number;
  minQuantity: number;
  discountPercent: number;
  hasCustomPrice: boolean;
  standardPrice: number;
}

export interface B2BPricingCache {
  userId: string;
  fetchedAt: number;
  prices: Record<string, B2BProductPrice>; // keyed by productId
}

// In-memory cache — no TTL. The hook calls invalidateB2BPricingCache()
// before every poll/focus-fetch to ensure fresh data every time.
let _memCache: B2BPricingCache | null = null;
let _inflightFetch: Promise<B2BPricingCache | null> | null = null;

function readMemCache(userId: string): B2BPricingCache | null {
  if (!_memCache || _memCache.userId !== userId) return null;
  return _memCache; // Valid until invalidated
}

/**
 * Call this to force an immediate re-fetch on next getCustomerPricing call.
 * Called on logout, user change, or visibilitychange (tab focus).
 */
export function invalidateB2BPricingCache() {
  _memCache = null;
  _inflightFetch = null;
}

/**
 * Fetches the full B2B custom pricing matrix for the logged-in user.
 * - Uses a short 30s in-memory cache to prevent redundant calls.
 * - Deduplicates concurrent calls via a shared in-flight promise.
 * - Call invalidateB2BPricingCache() to force an immediate re-fetch.
 */
export async function fetchB2BPricingMatrix(userId: string): Promise<B2BPricingCache | null> {
  // Return fresh memory cache if still valid
  const cached = readMemCache(userId);
  if (cached) return cached;

  // Deduplicate concurrent callers — they all get the same promise
  if (_inflightFetch) return _inflightFetch;

  _inflightFetch = (async () => {
    try {
      const res = await fetchApi<any>(`/b2b-pricing/customer/${userId}`);

      // Normalise response shape — data may live at res.data or at top-level
      const payload =
        res.data && typeof res.data === "object" && "items" in res.data
          ? res.data
          : (res as any).items !== undefined
          ? res
          : null;

      if (!payload) return null;

      const items: any[] = Array.isArray(payload.items) ? payload.items : [];

      // Build fast productId → price lookup map
      const priceMap: Record<string, B2BProductPrice> = {};
      for (const item of items) {
        const pid = item.productId || item.id;
        if (!pid) continue;
        priceMap[String(pid)] = {
          productId: String(pid),
          customPrice: item.hasCustomPrice ? Number(item.customPrice) : Number(item.standardPrice),
          minQuantity: Number(item.minQuantity) || 1,
          discountPercent: Number(item.discountPercent) || 0,
          hasCustomPrice: !!item.hasCustomPrice,
          standardPrice: Number(item.standardPrice) || 0,
        };
      }

      const cache: B2BPricingCache = {
        userId,
        fetchedAt: Date.now(),
        prices: priceMap,
      };

      _memCache = cache;
      return cache;
    } catch {
      return null;
    } finally {
      _inflightFetch = null;
    }
  })();

  return _inflightFetch;
}

/**
 * Returns the B2B custom price entry for a specific product, or null if not set.
 */
export function getB2BPrice(
  cache: B2BPricingCache | null,
  productId: string | number
): B2BProductPrice | null {
  if (!cache) return null;
  return cache.prices[String(productId)] ?? null;
}
