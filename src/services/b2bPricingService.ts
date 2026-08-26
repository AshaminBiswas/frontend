import { fetchApi, getStoredToken } from "./api";

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
let _memoryCache: Record<string, B2BPricingCache> = {};

// In-flight promise to deduplicate concurrent network calls across the whole page
let _inflightFetch: Promise<B2BPricingCache | null> | null = null;

export function getCachedB2BPricing(userId: string): B2BPricingCache | null {
  if (!userId) return null;
  return _memoryCache[userId] || readStoredB2BPricing(userId);
}

export function readStoredB2BPricing(userId: string): B2BPricingCache | null {
  if (!userId) return null;
  try {
    const raw = localStorage.getItem(`${STORAGE_KEY_PREFIX}${userId}`);
    if (!raw) return null;
    const parsed: B2BPricingCache = JSON.parse(raw);
    _memoryCache[userId] = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function writeStoredB2BPricing(userId: string, cache: B2BPricingCache): void {
  if (!userId) return;
  _memoryCache[userId] = cache;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}${userId}`, JSON.stringify(cache));
  } catch {
    // quota exceeded or private browsing — fail gracefully
  }
}

export function invalidateB2BPricingCache(userId?: string): void {
  if (userId) {
    delete _memoryCache[userId];
    try {
      localStorage.removeItem(`${STORAGE_KEY_PREFIX}${userId}`);
    } catch {}
  } else {
    _memoryCache = {};
    try {
      Object.keys(localStorage)
        .filter((k) => k.startsWith(STORAGE_KEY_PREFIX))
        .forEach((k) => localStorage.removeItem(k));
    } catch {}
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

  // Unauthenticated user — do not send request to protected endpoint
  const token = getStoredToken();
  if (!token) {
    return readStoredB2BPricing(userId);
  }

  // Deduplicate concurrent callers — they all get the same in-flight promise
  if (_inflightFetch) return _inflightFetch;

  _inflightFetch = (async () => {
    try {
      const res = await fetchApi<any>(`/b2b-pricing/customer/${userId}`);

      if (!res.success) {
        return readStoredB2BPricing(userId);
      }

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

      writeStoredB2BPricing(userId, cache);
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
