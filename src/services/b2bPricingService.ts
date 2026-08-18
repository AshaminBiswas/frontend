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
  prices: Record<string, B2BProductPrice>; // keyed by productId, slug, sku, and name
}

const STORAGE_KEY_PREFIX = "prc_b2b_matrix_";

// In-memory cache for instant synchronous access
let _memCache: B2BPricingCache | null = null;
let _inflightFetch: Promise<B2BPricingCache | null> | null = null;

/**
 * Synchronously reads the last-known B2B custom pricing cache from localStorage.
 * Enables zero-flicker first-paint display on page loads and refreshes.
 */
export function readStoredB2BPricing(userId?: string | null): B2BPricingCache | null {
  if (!userId) return null;
  if (_memCache && _memCache.userId === userId) {
    return _memCache;
  }
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (raw) {
      const parsed: B2BPricingCache = JSON.parse(raw);
      if (parsed && parsed.userId === userId && parsed.prices) {
        _memCache = parsed;
        return parsed;
      }
    }
  } catch {}
  return null;
}

/**
 * Persists the B2B pricing cache to localStorage and in-memory cache.
 */
function saveStoredB2BPricing(cache: B2BPricingCache) {
  _memCache = cache;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${cache.userId}`, JSON.stringify(cache));
  } catch {}
}

/**
 * Clears the B2B pricing cache (e.g. on logout or user change).
 */
export function invalidateB2BPricingCache(userId?: string) {
  if (userId) {
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
    } catch {}
    if (_memCache?.userId === userId) {
      _memCache = null;
    }
  } else {
    _memCache = null;
  }
  _inflightFetch = null;
}

/**
 * Fetches the full B2B custom pricing matrix for the logged-in user.
 * - Deduplicates concurrent calls via a shared in-flight promise.
 * - Saves result to localStorage for instant subsequent first paints.
 */
export async function fetchB2BPricingMatrix(userId: string): Promise<B2BPricingCache | null> {
  if (!userId) return null;

  // Deduplicate concurrent callers — they all get the same in-flight promise
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

      if (!payload) {
        // Fallback to previously stored cache if offline/temporary network error
        return readStoredB2BPricing(userId);
      }

      const items: any[] = Array.isArray(payload.items) ? payload.items : [];

      // Build fast productId → price lookup map (keyed by ID, slug, sku, and name for universal exact matching)
      const priceMap: Record<string, B2BProductPrice> = {};
      for (const item of items) {
        const pid = item.productId || item.id;
        if (!pid) continue;
        const entry: B2BProductPrice = {
          productId: String(pid),
          customPrice: item.hasCustomPrice ? Number(item.customPrice) : Number(item.standardPrice),
          minQuantity: Number(item.minQuantity) || 1,
          discountPercent: Number(item.discountPercent) || 0,
          hasCustomPrice: !!item.hasCustomPrice,
          standardPrice: Number(item.standardPrice) || 0,
        };
        priceMap[String(pid)] = entry;
        if (item.slug) priceMap[String(item.slug)] = entry;
        if (item.sku) priceMap[String(item.sku).toLowerCase()] = entry;
        if (item.name) priceMap[String(item.name).toLowerCase().trim()] = entry;
      }

      const cache: B2BPricingCache = {
        userId,
        fetchedAt: Date.now(),
        prices: priceMap,
      };

      saveStoredB2BPricing(cache);
      return cache;
    } catch {
      return readStoredB2BPricing(userId);
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
